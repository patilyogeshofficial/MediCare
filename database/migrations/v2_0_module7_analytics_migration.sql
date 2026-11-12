-- ============================================================================
-- MediCare V2.0 - Module 7: Admin Analytics & Reports Migration
-- Non-destructive, additive migration (Performance indexes for aggregate analytics)
-- ============================================================================

-- 1. Index on users (role, created_at) to accelerate patient registration trend queries
CREATE INDEX IF NOT EXISTS idx_users_role_created_at
    ON public.users (role, created_at);

-- 2. Composite index on appointments (appointment_date, status) to accelerate date-range analytics
CREATE INDEX IF NOT EXISTS idx_appointments_date_status
    ON public.appointments (appointment_date, status);

-- 3. Composite index on appointments (doctor_id, appointment_date, status) for doctor workload aggregation
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date_status
    ON public.appointments (doctor_id, appointment_date, status);

-- 4. Index on prescriptions (prescribed_at) for prescription volume analytics
CREATE INDEX IF NOT EXISTS idx_prescriptions_prescribed_at
    ON public.prescriptions (prescribed_at);
