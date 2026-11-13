-- ============================================================================
-- MediCare Plus V2.0 — Complete Master Database Initialization Script
-- Target: PostgreSQL 15 / 16 / 17 / 18 (Supabase / Render PostgreSQL)
-- Description: Complete schema initialization for MediCare Plus (V2)
-- Safe, additive, idempotent DDL
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. BASE SYSTEM TABLES
-- ----------------------------------------------------------------------------

-- Users Table
CREATE TABLE IF NOT EXISTS public.users (
    user_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'DOCTOR', 'PATIENT')),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Specializations Table
CREATE TABLE IF NOT EXISTS public.specializations (
    specialization_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    specialization_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

-- Patients Table
CREATE TABLE IF NOT EXISTS public.patients (
    patient_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    date_of_birth DATE,
    gender VARCHAR(20) CHECK (gender IS NULL OR gender IN ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY')),
    phone VARCHAR(15),
    address TEXT,
    blood_group VARCHAR(5),
    CONSTRAINT fk_patient_user FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE RESTRICT
);

-- Doctors Table
CREATE TABLE IF NOT EXISTS public.doctors (
    doctor_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    specialization_id BIGINT NOT NULL,
    license_number VARCHAR(100) NOT NULL UNIQUE,
    qualification VARCHAR(150),
    experience_years INTEGER DEFAULT 0 CHECK (experience_years >= 0),
    consultation_fee NUMERIC(10,2) DEFAULT 0 NOT NULL CHECK (consultation_fee >= 0),
    CONSTRAINT fk_doctor_user FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE RESTRICT,
    CONSTRAINT fk_doctor_specialization FOREIGN KEY (specialization_id) REFERENCES public.specializations(specialization_id) ON DELETE RESTRICT
);

-- Doctor Availability Table
CREATE TABLE IF NOT EXISTS public.doctor_availability (
    availability_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    doctor_id BIGINT NOT NULL,
    day_of_week VARCHAR(15) NOT NULL CHECK (day_of_week IN ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY')),
    is_available BOOLEAN DEFAULT TRUE NOT NULL,
    start_time TIME WITHOUT TIME ZONE,
    end_time TIME WITHOUT TIME ZONE,
    break_start TIME WITHOUT TIME ZONE,
    break_end TIME WITHOUT TIME ZONE,
    consultation_duration INT DEFAULT 30,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_availability_doctor FOREIGN KEY (doctor_id) REFERENCES public.doctors(doctor_id) ON DELETE CASCADE,
    CONSTRAINT unique_doctor_day UNIQUE (doctor_id, day_of_week)
);

-- Appointments Table
CREATE TABLE IF NOT EXISTS public.appointments (
    appointment_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    doctor_id BIGINT NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME WITHOUT TIME ZONE NOT NULL,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'PENDING' NOT NULL CHECK (status IN ('HOLD', 'PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED', 'COMPLETED')),
    hold_expires_at TIMESTAMPTZ,
    queue_number INT,
    cancellation_reason TEXT,
    reschedule_requested_date DATE,
    reschedule_requested_time TIME WITHOUT TIME ZONE,
    reschedule_reason TEXT,
    reschedule_status VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_appointment_patient FOREIGN KEY (patient_id) REFERENCES public.patients(patient_id) ON DELETE RESTRICT,
    CONSTRAINT fk_appointment_doctor FOREIGN KEY (doctor_id) REFERENCES public.doctors(doctor_id) ON DELETE RESTRICT
);

-- Prescriptions Table
CREATE TABLE IF NOT EXISTS public.prescriptions (
    prescription_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    appointment_id BIGINT NOT NULL UNIQUE,
    diagnosis TEXT NOT NULL,
    medications JSONB DEFAULT '[]'::JSONB NOT NULL,
    instructions TEXT,
    verification_code VARCHAR(64) UNIQUE,
    prescribed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_prescription_appointment FOREIGN KEY (appointment_id) REFERENCES public.appointments(appointment_id) ON DELETE RESTRICT,
    CONSTRAINT chk_medications_array CHECK (jsonb_typeof(medications) = 'array')
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    notification_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(60) NOT NULL,
    category VARCHAR(50) DEFAULT 'GENERAL' NOT NULL,
    priority VARCHAR(20) DEFAULT 'NORMAL' NOT NULL,
    action_url VARCHAR(255),
    appointment_id BIGINT,
    prescription_id BIGINT,
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    is_archived BOOLEAN DEFAULT FALSE NOT NULL,
    dedup_key VARCHAR(150),
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE
);

-- Contact Messages Table
CREATE TABLE IF NOT EXISTS public.contact_messages (
    message_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    phone VARCHAR(20),
    subject VARCHAR(200),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Admin Notification Preferences Table
CREATE TABLE IF NOT EXISTS public.admin_notification_preferences (
    preference_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL,
    all_notifications BOOLEAN DEFAULT TRUE NOT NULL,
    appointment_notifications BOOLEAN DEFAULT TRUE NOT NULL,
    contact_message_notifications BOOLEAN DEFAULT TRUE NOT NULL,
    prescription_notifications BOOLEAN DEFAULT TRUE NOT NULL,
    CONSTRAINT uk_admin_notification_user UNIQUE (user_id),
    CONSTRAINT fk_admin_pref_user FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE
);

-- Password Reset OTPs Table
CREATE TABLE IF NOT EXISTS public.password_reset_otps (
    otp_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL,
    otp_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    attempts INTEGER DEFAULT 0 NOT NULL CHECK (attempts >= 0),
    is_used BOOLEAN DEFAULT FALSE NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_otp_user FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE
);

-- Password Reset Tokens Table
CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
    token_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL,
    token_hash VARCHAR(64) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    is_used BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_token_user FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE
);

-- ----------------------------------------------------------------------------
-- 2. MEDICARE PLUS V2.0 EXTENSIONS & ADVANCED EHR
-- ----------------------------------------------------------------------------

-- Audit Logs Table (Module 3)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    log_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    entity_id BIGINT NOT NULL,
    action VARCHAR(50) NOT NULL,
    performed_by VARCHAR(150),
    user_role VARCHAR(50),
    details TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Patient Medical Conditions and Allergies Table (Module 5)
CREATE TABLE IF NOT EXISTS public.patient_allergies_conditions (
    condition_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    type VARCHAR(30) NOT NULL CHECK (type IN ('ALLERGY', 'CHRONIC_CONDITION', 'PAST_PROCEDURE', 'MEDICAL_HISTORY')),
    name VARCHAR(150) NOT NULL,
    severity VARCHAR(20) CHECK (severity IS NULL OR severity IN ('MILD', 'MODERATE', 'SEVERE', 'LIFE_THREATENING')),
    notes TEXT,
    diagnosed_date DATE,
    recorded_by VARCHAR(150),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    deleted_at TIMESTAMPTZ,
    deleted_by VARCHAR(150),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_condition_patient FOREIGN KEY (patient_id) REFERENCES public.patients(patient_id) ON DELETE RESTRICT
);

-- Clinical Consultation Records Table (Module 5)
CREATE TABLE IF NOT EXISTS public.consultation_records (
    record_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    appointment_id BIGINT NOT NULL UNIQUE,
    patient_id BIGINT NOT NULL,
    doctor_id BIGINT NOT NULL,
    symptoms TEXT,
    clinical_observations TEXT,
    diagnosis TEXT NOT NULL,
    treatment_plan TEXT,
    follow_up_recommendation TEXT,
    consultation_notes TEXT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_consultation_appointment FOREIGN KEY (appointment_id) REFERENCES public.appointments(appointment_id) ON DELETE RESTRICT,
    CONSTRAINT fk_consultation_patient FOREIGN KEY (patient_id) REFERENCES public.patients(patient_id) ON DELETE RESTRICT,
    CONSTRAINT fk_consultation_doctor FOREIGN KEY (doctor_id) REFERENCES public.doctors(doctor_id) ON DELETE RESTRICT
);

-- Patient Vitals Table (Module 5)
CREATE TABLE IF NOT EXISTS public.patient_vitals (
    vital_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    appointment_id BIGINT,
    recorded_by_doctor_id BIGINT,
    blood_pressure_systolic INT,
    blood_pressure_diastolic INT,
    pulse_rate INT,
    temperature NUMERIC(4,1),
    respiratory_rate INT,
    oxygen_saturation NUMERIC(4,1),
    height_cm NUMERIC(5,1),
    weight_kg NUMERIC(5,1),
    bmi NUMERIC(4,1),
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    deleted_at TIMESTAMPTZ,
    deleted_by VARCHAR(150),
    measured_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_vitals_patient FOREIGN KEY (patient_id) REFERENCES public.patients(patient_id) ON DELETE RESTRICT,
    CONSTRAINT fk_vitals_appointment FOREIGN KEY (appointment_id) REFERENCES public.appointments(appointment_id) ON DELETE RESTRICT,
    CONSTRAINT fk_vitals_doctor FOREIGN KEY (recorded_by_doctor_id) REFERENCES public.doctors(doctor_id) ON DELETE RESTRICT
);

-- Medical Documents Metadata Table (Module 5)
CREATE TABLE IF NOT EXISTS public.medical_documents (
    document_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    appointment_id BIGINT,
    uploaded_by_user_id BIGINT NOT NULL,
    document_name VARCHAR(200) NOT NULL,
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('LAB_REPORT', 'IMAGING_SCAN', 'DISCHARGE_SUMMARY', 'PRESCRIPTION_RECORD', 'CLINICAL_NOTE', 'OTHER')),
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    deleted_at TIMESTAMPTZ,
    deleted_by VARCHAR(150),
    uploaded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_documents_patient FOREIGN KEY (patient_id) REFERENCES public.patients(patient_id) ON DELETE RESTRICT,
    CONSTRAINT fk_documents_appointment FOREIGN KEY (appointment_id) REFERENCES public.appointments(appointment_id) ON DELETE RESTRICT,
    CONSTRAINT fk_documents_user FOREIGN KEY (uploaded_by_user_id) REFERENCES public.users(user_id) ON DELETE RESTRICT
);

-- Persistent Binary Document Content Storage Table (Module 5 - Zero-Cost Render-Persistent Storage)
CREATE TABLE IF NOT EXISTS public.medical_document_contents (
    document_id BIGINT PRIMARY KEY,
    document_data BYTEA NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_doc_content_document FOREIGN KEY (document_id) REFERENCES public.medical_documents(document_id) ON DELETE CASCADE
);

-- ----------------------------------------------------------------------------
-- 3. FUNCTIONS & TRIGGERS
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION update_appointment_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trg_update_appointment_timestamp'
    ) THEN
        CREATE TRIGGER trg_update_appointment_timestamp
        BEFORE UPDATE ON public.appointments
        FOR EACH ROW
        EXECUTE FUNCTION update_appointment_timestamp();
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 4. CONCURRENCY & DEDUPLICATION UNIQUE CONSTRAINTS
-- ----------------------------------------------------------------------------

-- Unique queue number per doctor per date for CONFIRMED consultations (Module 4)
CREATE UNIQUE INDEX IF NOT EXISTS uq_appointments_doctor_date_queue 
    ON public.appointments(doctor_id, appointment_date, queue_number) 
    WHERE status = 'CONFIRMED' AND queue_number IS NOT NULL;

-- Strict single booking per doctor per start time (Module 4)
CREATE UNIQUE INDEX IF NOT EXISTS uq_appointments_doctor_date_time_confirmed 
    ON public.appointments(doctor_id, appointment_date, appointment_time) 
    WHERE status = 'CONFIRMED';

-- Database-enforced notification reminder idempotency with schedule versioning (Module 6)
CREATE UNIQUE INDEX IF NOT EXISTS uq_notifications_dedup_key
    ON public.notifications (dedup_key)
    WHERE dedup_key IS NOT NULL;

-- ----------------------------------------------------------------------------
-- 5. PERFORMANCE INDEXES
-- ----------------------------------------------------------------------------

-- Core Lookups
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON public.appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_doctors_specialization ON public.doctors(specialization_id);
CREATE INDEX IF NOT EXISTS idx_appointments_hold_expires ON public.appointments(status, hold_expires_at);

-- Audit & Security (Module 3)
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- Clinical History & Vitals (Module 5)
CREATE INDEX IF NOT EXISTS idx_conditions_patient ON public.patient_allergies_conditions(patient_id);
CREATE INDEX IF NOT EXISTS idx_conditions_active ON public.patient_allergies_conditions(patient_id, is_active);
CREATE INDEX IF NOT EXISTS idx_consultations_patient ON public.consultation_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_consultations_doctor ON public.consultation_records(doctor_id);
CREATE INDEX IF NOT EXISTS idx_vitals_patient ON public.patient_vitals(patient_id);
CREATE INDEX IF NOT EXISTS idx_vitals_active ON public.patient_vitals(patient_id, is_active);
CREATE INDEX IF NOT EXISTS idx_documents_patient ON public.medical_documents(patient_id);
CREATE INDEX IF NOT EXISTS idx_documents_active ON public.medical_documents(patient_id, is_active);

-- Real-Time Notifications (Module 6)
CREATE INDEX IF NOT EXISTS idx_notifications_user_archived_read ON public.notifications (user_id, is_archived, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_user_category ON public.notifications (user_id, category, is_archived);

-- Admin Analytics Aggregation (Module 7)
CREATE INDEX IF NOT EXISTS idx_users_role_created_at ON public.users (role, created_at);
CREATE INDEX IF NOT EXISTS idx_appointments_date_status ON public.appointments (appointment_date, status);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date_status ON public.appointments (doctor_id, appointment_date, status);
CREATE INDEX IF NOT EXISTS idx_prescriptions_prescribed_at ON public.prescriptions (prescribed_at);

-- ----------------------------------------------------------------------------
-- 6. DEFAULT SPECIALIZATIONS SEED (MediCare Plus Medical Departments)
-- ----------------------------------------------------------------------------

INSERT INTO public.specializations (specialization_name, description)
VALUES 
    ('Cardiology', 'Heart, blood vessels, and cardiovascular health consultations.'),
    ('Dermatology', 'Skin, hair, nails, and dermatological condition treatments.'),
    ('Neurology', 'Brain, spinal cord, and central nervous system disorders.'),
    ('Orthopedics', 'Musculoskeletal system, bones, joints, ligaments, and tendons.'),
    ('Pediatrics', 'Comprehensive medical care for infants, children, and adolescents.'),
    ('General Medicine', 'Primary care, diagnostic evaluations, and routine preventive health.'),
    ('Gastroenterology', 'Digestive tract, liver, stomach, and gastrointestinal conditions.'),
    ('Oncology', 'Diagnosis, therapy, and compassionate management of oncological conditions.')
ON CONFLICT (specialization_name) DO NOTHING;

-- ============================================================================
-- END OF MEDICARE PLUS MASTER INITIALIZATION
-- ============================================================================
