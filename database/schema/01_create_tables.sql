-- ==========================================
-- MediCare - The Healthcare Administration Console
-- Database: medicare_db
-- PostgreSQL 18
-- ==========================================

-- 1. USERS TABLE

CREATE TABLE users (

    user_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    full_name VARCHAR(100) NOT NULL,

    email VARCHAR(150) NOT NULL UNIQUE,

    password_hash VARCHAR(255) NOT NULL,

    role VARCHAR(20) NOT NULL
        CHECK (role IN ('ADMIN', 'DOCTOR', 'PATIENT')),

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP

);


-- 2. SPECIALIZATIONS TABLE

CREATE TABLE specializations (

    specialization_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    specialization_name VARCHAR(100) NOT NULL UNIQUE,

    description TEXT

);


-- 3. PATIENTS TABLE

CREATE TABLE patients (

    patient_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    user_id BIGINT NOT NULL UNIQUE,

    date_of_birth DATE,

    gender VARCHAR(20),

    phone VARCHAR(15),

    address TEXT,

    blood_group VARCHAR(5),

    CONSTRAINT fk_patient_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_patient_gender
        CHECK (gender IS NULL OR gender IN
        ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'))

);


-- 4. DOCTORS TABLE

CREATE TABLE doctors (

    doctor_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    user_id BIGINT NOT NULL UNIQUE,

    specialization_id BIGINT NOT NULL,

    license_number VARCHAR(100) NOT NULL UNIQUE,

    qualification VARCHAR(150),

    experience_years INTEGER DEFAULT 0,

    consultation_fee NUMERIC(10,2) NOT NULL DEFAULT 0,

    CONSTRAINT fk_doctor_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_doctor_specialization
        FOREIGN KEY (specialization_id)
        REFERENCES specializations(specialization_id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_doctor_experience
        CHECK (experience_years >= 0),

    CONSTRAINT chk_consultation_fee
        CHECK (consultation_fee >= 0)

);


-- 5. APPOINTMENTS TABLE

CREATE TABLE appointments (

    appointment_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    patient_id BIGINT NOT NULL,

    doctor_id BIGINT NOT NULL,

    appointment_date DATE NOT NULL,

    appointment_time TIME NOT NULL,

    reason TEXT,

    status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN (
            'PENDING',
            'CONFIRMED',
            'REJECTED',
            'CANCELLED',
            'COMPLETED'
        )),

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_appointment_patient
        FOREIGN KEY (patient_id)
        REFERENCES patients(patient_id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_appointment_doctor
        FOREIGN KEY (doctor_id)
        REFERENCES doctors(doctor_id)
        ON DELETE RESTRICT

);


-- 6. PRESCRIPTIONS TABLE

CREATE TABLE prescriptions (

    prescription_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    appointment_id BIGINT NOT NULL UNIQUE,

    diagnosis TEXT NOT NULL,

    medications JSONB NOT NULL DEFAULT '[]'::JSONB,

    instructions TEXT,

    prescribed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_prescription_appointment
        FOREIGN KEY (appointment_id)
        REFERENCES appointments(appointment_id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_medications_array
        CHECK (jsonb_typeof(medications) = 'array')

);


-- 7. CONTACT MESSAGES TABLE

CREATE TABLE contact_messages (

    message_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    name VARCHAR(100) NOT NULL,

    email VARCHAR(150) NOT NULL,

    subject VARCHAR(200),

    message TEXT NOT NULL,

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP

);


-- ==========================================
-- INDEXES
-- ==========================================

CREATE INDEX idx_appointments_patient
ON appointments(patient_id);

CREATE INDEX idx_appointments_doctor
ON appointments(doctor_id);

CREATE INDEX idx_appointments_date
ON appointments(appointment_date);

CREATE INDEX idx_appointments_status
ON appointments(status);

CREATE INDEX idx_doctors_specialization
ON doctors(specialization_id);


-- ==========================================
-- END OF MEDICARE DATABASE SCHEMA
-- ==========================================