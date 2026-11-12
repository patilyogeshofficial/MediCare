-- ============================================================================
-- MediCare V2.0 - Module 6: Notification Improvements Migration
-- Non-destructive, additive migration (Preserves all historical records)
-- ============================================================================

-- 1. Drop obsolete check constraint on notification type to allow standard V2 notification types
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS chk_notification_type;

-- 2. Add category column with default 'GENERAL'
ALTER TABLE public.notifications
    ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'GENERAL' NOT NULL;

-- 3. Add priority column with default 'NORMAL' (NORMAL, IMPORTANT, URGENT)
ALTER TABLE public.notifications
    ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'NORMAL' NOT NULL;

-- 4. Add action_url column for in-app navigation
ALTER TABLE public.notifications
    ADD COLUMN IF NOT EXISTS action_url VARCHAR(255);

-- 5. Add soft-delete and archive tracking columns
ALTER TABLE public.notifications
    ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE NOT NULL;

ALTER TABLE public.notifications
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- 6. Add dedup_key column for database-level idempotency (supports schedule versioning)
ALTER TABLE public.notifications
    ADD COLUMN IF NOT EXISTS dedup_key VARCHAR(150);

-- 7. Backfill existing notifications with accurate categories based on type
UPDATE public.notifications
SET category = CASE
    WHEN type LIKE '%APPOINTMENT%' OR type LIKE '%RESCHEDULE%' THEN 'APPOINTMENT'
    WHEN type LIKE '%PRESCRIPTION%' THEN 'PRESCRIPTION'
    WHEN type LIKE '%CONTACT%' THEN 'CONTACT'
    WHEN type LIKE '%EHR%' OR type LIKE '%DOCUMENT%' OR type LIKE '%RECORD%' OR type LIKE '%CLINICAL%' THEN 'MEDICAL_RECORD'
    WHEN type LIKE '%USER%' OR type LIKE '%DOCTOR%' OR type LIKE '%ACCOUNT%' THEN 'ACCOUNT'
    ELSE 'GENERAL'
END
WHERE category = 'GENERAL' OR category IS NULL;

-- 8. Backfill existing notifications with appropriate priorities
UPDATE public.notifications
SET priority = CASE
    WHEN type IN ('APPOINTMENT_CANCELLED', 'APPOINTMENT_REJECTED', 'RESCHEDULE_REJECTED') THEN 'URGENT'
    WHEN type IN ('APPOINTMENT_CONFIRMED', 'APPOINTMENT_BOOKED', 'NEW_APPOINTMENT', 'PRESCRIPTION_CREATED', 'NEW_PRESCRIPTION', 'RESCHEDULE_REQUESTED', 'RESCHEDULE_APPROVED', 'APPOINTMENT_REMINDER') THEN 'IMPORTANT'
    ELSE 'NORMAL'
END;

-- 9. Backfill action URLs for existing notifications
UPDATE public.notifications
SET action_url = CASE
    WHEN type LIKE '%PRESCRIPTION%' THEN '/patient/dashboard'
    WHEN type LIKE '%APPOINTMENT%' OR type LIKE '%RESCHEDULE%' THEN '/patient/dashboard'
    WHEN type LIKE '%CONTACT%' THEN '/admin/dashboard'
    ELSE '/patient/dashboard'
END
WHERE action_url IS NULL;

-- 10. NON-DESTRUCTIVE ARCHIVAL FOR LEGACY DUPLICATES (ZERO DATA LOSS)
-- Any legacy duplicate reminder is preserved and safely archived rather than permanently deleted.
-- Ensures full audit trail and historical record retention.
WITH duplicates AS (
    SELECT notification_id,
           ROW_NUMBER() OVER (
               PARTITION BY user_id, appointment_id, type 
               ORDER BY created_at ASC, notification_id ASC
           ) as rn
    FROM public.notifications
    WHERE type = 'APPOINTMENT_REMINDER' AND appointment_id IS NOT NULL
)
UPDATE public.notifications n
SET is_archived = TRUE,
    deleted_at = COALESCE(n.deleted_at, CURRENT_TIMESTAMP),
    dedup_key = 'ARCHIVED_DUP:' || n.notification_id || ':APPT:' || n.appointment_id || ':USER:' || n.user_id
FROM duplicates d
WHERE n.notification_id = d.notification_id AND d.rn > 1;

-- 11. Backfill dedup_key for existing reminders
UPDATE public.notifications
SET dedup_key = 'REMINDER:APPT:' || appointment_id || ':USER:' || user_id || ':LEGACY:' || notification_id
WHERE type = 'APPOINTMENT_REMINDER' AND appointment_id IS NOT NULL AND dedup_key IS NULL;

-- 12. Add performance indexes for unread/archived filtering and categories
CREATE INDEX IF NOT EXISTS idx_notifications_user_archived_read
    ON public.notifications (user_id, is_archived, is_read);

CREATE INDEX IF NOT EXISTS idx_notifications_user_category
    ON public.notifications (user_id, category, is_archived);

-- 13. Drop legacy reminder unique index if previously created, so rescheduling is fully supported
DROP INDEX IF EXISTS public.uq_notifications_reminder_idempotency;

-- 14. DATABASE-ENFORCED IDEMPOTENCY INDEX
-- Protects schedule-versioned reminders with absolute database uniqueness.
-- Rescheduled appointments generate a new schedule-specific dedup_key and are eligible for reminders.
CREATE UNIQUE INDEX IF NOT EXISTS uq_notifications_dedup_key
    ON public.notifications (dedup_key)
    WHERE dedup_key IS NOT NULL;
