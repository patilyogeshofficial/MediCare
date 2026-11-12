-- ============================================================================
-- MediCare V2.0 - Module 3: Appointment & Prescription Security Migration
-- Non-destructive, additive migration
-- ============================================================================

-- 1. Add verification_code to prescriptions
ALTER TABLE public.prescriptions
    ADD COLUMN IF NOT EXISTS verification_code VARCHAR(64);

-- Add unique constraint if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'prescriptions_verification_code_key'
    ) THEN
        ALTER TABLE public.prescriptions
            ADD CONSTRAINT prescriptions_verification_code_key UNIQUE (verification_code);
    END IF;
END $$;

-- 2. Add cancellation_reason to appointments
ALTER TABLE public.appointments
    ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

-- 3. Create append-only audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    log_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    entity_id bigint NOT NULL,
    action VARCHAR(50) NOT NULL,
    performed_by VARCHAR(150),
    user_role VARCHAR(50),
    details TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Index for efficient audit trail lookups
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- 4. Safe backfill for legacy prescriptions that do not have a verification_code
-- Generates deterministic, unique RX-2026 codes for existing legacy records
UPDATE public.prescriptions
SET verification_code = 'RX-2026-' || LPAD(TO_HEX(prescription_id * 7919 + 48271)::text, 8, '0')
WHERE verification_code IS NULL;
