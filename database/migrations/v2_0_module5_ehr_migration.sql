-- ============================================================================
-- MediCare V2.0 - Module 5: Advanced Medical Records (EHR) Migration
-- Non-destructive, additive migration with Persistent Storage and Soft Deletion
-- ============================================================================

-- 1. Patient Medical Conditions and Allergies Table
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
    CONSTRAINT fk_condition_patient
        FOREIGN KEY (patient_id)
        REFERENCES public.patients(patient_id)
        ON DELETE RESTRICT
);

ALTER TABLE public.patient_allergies_conditions ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE NOT NULL;
ALTER TABLE public.patient_allergies_conditions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.patient_allergies_conditions ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(150);

CREATE INDEX IF NOT EXISTS idx_conditions_patient ON public.patient_allergies_conditions(patient_id);
CREATE INDEX IF NOT EXISTS idx_conditions_type ON public.patient_allergies_conditions(type);
CREATE INDEX IF NOT EXISTS idx_conditions_active ON public.patient_allergies_conditions(patient_id, is_active);

-- 2. Clinical Consultation Records Table
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
    CONSTRAINT fk_consultation_appointment
        FOREIGN KEY (appointment_id)
        REFERENCES public.appointments(appointment_id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_consultation_patient
        FOREIGN KEY (patient_id)
        REFERENCES public.patients(patient_id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_consultation_doctor
        FOREIGN KEY (doctor_id)
        REFERENCES public.doctors(doctor_id)
        ON DELETE RESTRICT
);

ALTER TABLE public.consultation_records ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE NOT NULL;

CREATE INDEX IF NOT EXISTS idx_consultations_patient ON public.consultation_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_consultations_doctor ON public.consultation_records(doctor_id);
CREATE INDEX IF NOT EXISTS idx_consultations_created ON public.consultation_records(created_at DESC);

-- 3. Patient Vitals Table
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
    CONSTRAINT fk_vitals_patient
        FOREIGN KEY (patient_id)
        REFERENCES public.patients(patient_id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_vitals_appointment
        FOREIGN KEY (appointment_id)
        REFERENCES public.appointments(appointment_id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_vitals_doctor
        FOREIGN KEY (recorded_by_doctor_id)
        REFERENCES public.doctors(doctor_id)
        ON DELETE RESTRICT
);

ALTER TABLE public.patient_vitals ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE NOT NULL;
ALTER TABLE public.patient_vitals ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.patient_vitals ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(150);

CREATE INDEX IF NOT EXISTS idx_vitals_patient ON public.patient_vitals(patient_id);
CREATE INDEX IF NOT EXISTS idx_vitals_appointment ON public.patient_vitals(appointment_id);
CREATE INDEX IF NOT EXISTS idx_vitals_measured ON public.patient_vitals(measured_at DESC);
CREATE INDEX IF NOT EXISTS idx_vitals_active ON public.patient_vitals(patient_id, is_active);

-- 4. Medical Documents Table (Metadata)
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
    CONSTRAINT fk_documents_patient
        FOREIGN KEY (patient_id)
        REFERENCES public.patients(patient_id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_documents_appointment
        FOREIGN KEY (appointment_id)
        REFERENCES public.appointments(appointment_id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_documents_user
        FOREIGN KEY (uploaded_by_user_id)
        REFERENCES public.users(user_id)
        ON DELETE RESTRICT
);

ALTER TABLE public.medical_documents ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE NOT NULL;
ALTER TABLE public.medical_documents ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.medical_documents ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(150);

CREATE INDEX IF NOT EXISTS idx_documents_patient ON public.medical_documents(patient_id);
CREATE INDEX IF NOT EXISTS idx_documents_appointment ON public.medical_documents(appointment_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded ON public.medical_documents(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_active ON public.medical_documents(patient_id, is_active);

-- 5. Persistent Binary Document Storage Table (Zero-Cost Render-Persistent Storage)
-- Guarantees document availability across Render restarts, redeployments and instance changes
CREATE TABLE IF NOT EXISTS public.medical_document_contents (
    document_id BIGINT PRIMARY KEY,
    document_data BYTEA NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_doc_content_document
        FOREIGN KEY (document_id)
        REFERENCES public.medical_documents(document_id)
        ON DELETE CASCADE
);
