MediCare – Database Design

Project: MediCare – The Healthcare Administration Console
Database: PostgreSQL 18
Database Name: medicare_db
ORM: Hibernate
Data Access: Spring Data JPA
Status: Initial Database Schema Completed

⸻

1. Database Overview

MediCare uses PostgreSQL as its relational database to store and manage healthcare administration data.

The database is designed to support three primary user roles:

* Admin
* Doctor
* Patient

The database follows a relational structure with primary keys, foreign keys, unique constraints, check constraints, and indexes to maintain data integrity and improve query performance.

2. Database Tables

The database currently contains seven main tables.

No.	Table Name	Description
1	users	Stores authentication and user information
2	patients	Stores patient profile information
3	doctors	Stores doctor profile information
4	specializations	Stores medical specializations
5	appointments	Stores patient appointment records
6	prescriptions	Stores medical prescription details
7	contact_messages	Stores contact messages and feedback

3. Table Structure

3.1 Users

Stores common authentication information for Admin, Doctor and Patient accounts.

Primary Key: user_id

Important columns:

* user_id
* full_name
* email
* password_hash
* role
* is_active
* created_at
* updated_at

Supported roles:

* ADMIN
* DOCTOR
* PATIENT

Email addresses must be unique.

Passwords will be stored as BCrypt hashes through the Spring Security authentication layer.

3.2 Patients

Stores additional information about registered patients.

Primary Key: patient_id
Foreign Key: user_id → users(user_id)

Important columns:

* patient_id
* user_id
* date_of_birth
* gender
* phone
* address
* blood_group

Each patient profile is associated with one user account.

3.3 Doctors

Stores professional information about registered doctors.

Primary Key: doctor_id

Foreign Keys:

* user_id → users(user_id)
* specialization_id → specializations(specialization_id)

Important columns:

* doctor_id
* user_id
* specialization_id
* license_number
* qualification
* experience_years
* consultation_fee

Each doctor account has one associated doctor profile.

3.4 Specializations

Stores medical specialization categories.

Primary Key: specialization_id

Important columns:

* specialization_id
* specialization_name
* description

Initial specialization records:

1. Cardiology
2. Neurology
3. Dermatology
4. Orthopedics
5. Pediatrics
6. General Medicine

3.5 Appointments

Stores appointment bookings between patients and doctors.

Primary Key: appointment_id

Foreign Keys:

* patient_id → patients(patient_id)
* doctor_id → doctors(doctor_id)

Important columns:

* appointment_id
* patient_id
* doctor_id
* appointment_date
* appointment_time
* reason
* status
* created_at
* updated_at

Supported appointment statuses:

Status	Description
PENDING	Waiting for approval
CONFIRMED	Appointment approved
REJECTED	Appointment rejected
CANCELLED	Appointment cancelled
COMPLETED	Consultation completed

3.6 Prescriptions

Stores prescriptions associated with appointments.

Primary Key: prescription_id

Foreign Key:

* appointment_id → appointments(appointment_id)

Important columns:

* prescription_id
* appointment_id
* diagnosis
* medications
* instructions
* prescribed_at

The medications column uses PostgreSQL JSONB to store structured medication information.

Each appointment can have at most one prescription in the current schema.

3.7 Contact Messages

Stores contact requests and feedback submitted through the application.

Primary Key: message_id

Important columns:

* message_id
* name
* email
* subject
* message
* created_at

⸻

4. Database Relationships

The database uses the following relationships:

Parent Table	Child Table	Relationship
users	patients	One-to-One
users	doctors	One-to-One
specializations	doctors	One-to-Many
patients	appointments	One-to-Many
doctors	appointments	One-to-Many
appointments	prescriptions	One-to-One

Relationship Overview

                  USERS
                    |
             --------------
             |            |
          PATIENTS      DOCTORS
                          |
                    SPECIALIZATIONS
PATIENTS ------------------|
                           |
                      APPOINTMENTS
                           |
DOCTORS -------------------|
                           |
                     PRESCRIPTIONS
                 CONTACT_MESSAGES

5. Constraints and Indexes

The database uses:

* PRIMARY KEY constraints
* FOREIGN KEY constraints
* UNIQUE constraints
* NOT NULL constraints
* CHECK constraints
* DEFAULT values
* IDENTITY columns
* PostgreSQL JSONB

Indexes are created on frequently queried appointment columns and doctor specialization.

6. Appointment Workflow

1. Patient registers and creates a profile.
2. Patient selects a doctor.
3. Patient books an appointment.
4. Appointment is initially created with PENDING status.
5. Doctor reviews the appointment.
6. Doctor confirms or rejects the appointment.
7. Consultation takes place.
8. Doctor creates a prescription.
9. Appointment is marked COMPLETED.

7. Database Testing

The following operations have been successfully tested:

Test Case	Result
Create seven database tables	PASS
Verify foreign keys	PASS
Insert specializations	PASS
Insert test users	PASS
Create patient profile	PASS
Create doctor profiles	PASS
Test doctor-specialization JOIN	PASS
Insert appointments	PASS
Test appointment JOIN	PASS
Insert prescription	PASS
Test prescription JOIN	PASS
Store medication details using JSONB	PASS

8. Database Configuration

Database details:

Database Name: medicare_db
Database: PostgreSQL
Version: 18
Schema: public

The Spring Boot application will connect to this database using Spring Data JPA and Hibernate.

Database credentials will be maintained outside version control using environment variables.

9. Future Improvements

Planned database enhancements:

* Appointment scheduling conflict prevention.
* Audit history for appointment status changes.
* Doctor availability and scheduling.
* Prescription history and validation.
* Database migration management using Flyway.
* Additional indexes based on query performance.
* Audit timestamps and record tracking.

⸻

MediCare – The Healthcare Administration Console

Developed by Yogesh Patil.

## Automatic Timestamp Management

The appointments table uses a PostgreSQL trigger to automatically
update the `updated_at` column whenever an appointment record changes.

- Function: `update_appointment_timestamp()`
- Trigger: `trg_update_appointment_timestamp`
- Event: BEFORE UPDATE
- Table: appointments

The `created_at` column remains unchanged during updates.

Prescription Module – Backend Implementation

Business Rules

1. A prescription can only be created for a COMPLETED appointment.
2. Each appointment can have only one prescription.
3. Medication details must be stored as a valid JSON array.
4. The appointment ID cannot be changed when updating a prescription.
5. Prescriptions are associated with appointments through a foreign key.
6. An appointment cannot be deleted while an associated prescription exists.

Prescription REST API Endpoints

HTTP Method	Endpoint	Description
GET	/api/prescriptions	Retrieve all prescriptions
GET	/api/prescriptions/{id}	Retrieve prescription by ID
GET	/api/prescriptions/appointment/{appointmentId}	Retrieve prescription by appointment
POST	/api/prescriptions	Create a prescription
PUT	/api/prescriptions/{id}	Update prescription details
DELETE	/api/prescriptions/{id}	Delete a prescription

Backend Technologies

* Java 21
* Spring Boot
* Spring Data JPA
* Hibernate ORM
* PostgreSQL JSONB
* Jakarta Bean Validation
* Jackson 3

API Testing Results

Test Case	Expected Status	Result
Retrieve all prescriptions	200 OK	PASS
Retrieve prescription by ID	200 OK	PASS
Retrieve by appointment ID	200 OK	PASS
Create prescription	201 Created	PASS
Update prescription	200 OK	PASS
Delete prescription	204 No Content	PASS
Retrieve deleted prescription	404 Not Found	PASS

Module Status: Completed and Tested