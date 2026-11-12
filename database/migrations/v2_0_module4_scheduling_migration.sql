-- ============================================================================
-- MediCare V2.0 - Module 4: Advanced Appointment Scheduling Migration
-- Non-destructive, additive migration
-- ============================================================================

-- 1. Add scheduling columns to appointments table
ALTER TABLE public.appointments
    ADD COLUMN IF NOT EXISTS hold_expires_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.appointments
    ADD COLUMN IF NOT EXISTS queue_number INT;

ALTER TABLE public.appointments
    ADD COLUMN IF NOT EXISTS reschedule_requested_date DATE;

ALTER TABLE public.appointments
    ADD COLUMN IF NOT EXISTS reschedule_requested_time TIME;

ALTER TABLE public.appointments
    ADD COLUMN IF NOT EXISTS reschedule_reason TEXT;

ALTER TABLE public.appointments
    ADD COLUMN IF NOT EXISTS reschedule_status VARCHAR(20);

-- 2. Add consultation_duration to doctor_availability if not present
ALTER TABLE public.doctor_availability
    ADD COLUMN IF NOT EXISTS consultation_duration INT DEFAULT 30;

-- 3. Indexes for scheduling lookups, conflict detection, and queue management
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date_time 
    ON public.appointments(doctor_id, appointment_date, appointment_time);

CREATE INDEX IF NOT EXISTS idx_appointments_hold_expires 
    ON public.appointments(status, hold_expires_at);

CREATE INDEX IF NOT EXISTS idx_appointments_queue 
    ON public.appointments(doctor_id, appointment_date, queue_number);

CREATE INDEX IF NOT EXISTS idx_appointments_reschedule_status 
    ON public.appointments(reschedule_status);

-- 4. Safe sequential backfill & deduplication of queue_number for existing CONFIRMED appointments
WITH ranked_appointments AS (
    SELECT appointment_id,
           ROW_NUMBER() OVER (
               PARTITION BY doctor_id, appointment_date
               ORDER BY appointment_time, appointment_id
           ) AS seq_num
    FROM public.appointments
    WHERE status = 'CONFIRMED'
)
UPDATE public.appointments a
SET queue_number = ranked_appointments.seq_num
FROM ranked_appointments
WHERE a.appointment_id = ranked_appointments.appointment_id;

-- 5. Database-level UNIQUE constraint to strictly guarantee queue numbers are unique per doctor per date
CREATE UNIQUE INDEX IF NOT EXISTS uq_appointments_doctor_date_queue 
    ON public.appointments(doctor_id, appointment_date, queue_number) 
    WHERE status = 'CONFIRMED' AND queue_number IS NOT NULL;

-- 6. Database-level UNIQUE constraint preventing identical confirmed booking start times for the same doctor
CREATE UNIQUE INDEX IF NOT EXISTS uq_appointments_doctor_date_time_confirmed 
    ON public.appointments(doctor_id, appointment_date, appointment_time) 
    WHERE status = 'CONFIRMED';
