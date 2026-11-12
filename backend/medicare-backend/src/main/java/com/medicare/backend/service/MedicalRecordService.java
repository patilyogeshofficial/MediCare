package com.medicare.backend.service;

import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.medicare.backend.dto.ConsultationRecordRequestDTO;
import com.medicare.backend.dto.ConsultationRecordResponseDTO;
import com.medicare.backend.dto.MedicalConditionAllergyDTO;
import com.medicare.backend.dto.MedicalDocumentDTO;
import com.medicare.backend.dto.MedicalRecordTimelineItemDTO;
import com.medicare.backend.dto.PatientEhrSummaryResponseDTO;
import com.medicare.backend.dto.PatientVitalDTO;
import com.medicare.backend.dto.PrescriptionResponseDTO;
import com.medicare.backend.entity.Appointment;
import com.medicare.backend.entity.ConsultationRecord;
import com.medicare.backend.entity.Doctor;
import com.medicare.backend.entity.MedicalConditionAllergy;
import com.medicare.backend.entity.MedicalDocument;
import com.medicare.backend.entity.MedicalDocumentContent;
import com.medicare.backend.entity.Patient;
import com.medicare.backend.entity.PatientVital;
import com.medicare.backend.entity.Prescription;
import com.medicare.backend.entity.Specialization;
import com.medicare.backend.entity.User;
import com.medicare.backend.repository.AppointmentRepository;
import com.medicare.backend.repository.ConsultationRecordRepository;
import com.medicare.backend.repository.DoctorRepository;
import com.medicare.backend.repository.MedicalConditionAllergyRepository;
import com.medicare.backend.repository.MedicalDocumentContentRepository;
import com.medicare.backend.repository.MedicalDocumentRepository;
import com.medicare.backend.repository.PatientRepository;
import com.medicare.backend.repository.PatientVitalRepository;
import com.medicare.backend.repository.PrescriptionRepository;
import com.medicare.backend.repository.SpecializationRepository;
import com.medicare.backend.repository.UserRepository;

@Service
public class MedicalRecordService {

    private final PatientRepository patientRepository;
    private final UserRepository userRepository;
    private final DoctorRepository doctorRepository;
    private final AppointmentRepository appointmentRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final SpecializationRepository specializationRepository;
    private final ConsultationRecordRepository consultationRepository;
    private final PatientVitalRepository vitalRepository;
    private final MedicalConditionAllergyRepository conditionRepository;
    private final MedicalDocumentRepository documentRepository;
    private final MedicalDocumentContentRepository medicalDocumentContentRepository;
    private final AuditLogService auditLogService;
    private final NotificationService notificationService;

    @Value("${medicare.storage.upload-dir:./uploads/medical-documents}")
    private String uploadBaseDir;

    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
            "application/pdf",
            "image/png",
            "image/jpeg",
            "image/jpg",
            "image/webp"
    );

    public MedicalRecordService(
            PatientRepository patientRepository,
            UserRepository userRepository,
            DoctorRepository doctorRepository,
            AppointmentRepository appointmentRepository,
            PrescriptionRepository prescriptionRepository,
            SpecializationRepository specializationRepository,
            ConsultationRecordRepository consultationRepository,
            PatientVitalRepository vitalRepository,
            MedicalConditionAllergyRepository conditionRepository,
            MedicalDocumentRepository documentRepository,
            MedicalDocumentContentRepository medicalDocumentContentRepository,
            AuditLogService auditLogService,
            NotificationService notificationService) {

        this.patientRepository = patientRepository;
        this.userRepository = userRepository;
        this.doctorRepository = doctorRepository;
        this.appointmentRepository = appointmentRepository;
        this.prescriptionRepository = prescriptionRepository;
        this.specializationRepository = specializationRepository;
        this.consultationRepository = consultationRepository;
        this.vitalRepository = vitalRepository;
        this.conditionRepository = conditionRepository;
        this.documentRepository = documentRepository;
        this.medicalDocumentContentRepository = medicalDocumentContentRepository;
        this.auditLogService = auditLogService;
        this.notificationService = notificationService;
    }

    // =========================================================================
    // AUTHORIZATION & PATIENT ACCESS VERIFICATION
    // =========================================================================

    public Patient validatePatientAccess(Long patientId, String authenticatedEmail) {
        User actor = userRepository.findByEmail(authenticatedEmail.trim().toLowerCase(Locale.ROOT))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Authenticated user not found"));

        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Patient record not found"));

        String role = actor.getRole().name();

        // 1. Admin has administrative oversight
        if ("ADMIN".equalsIgnoreCase(role)) {
            return patient;
        }

        // 2. Patient can only access their own records
        if ("PATIENT".equalsIgnoreCase(role)) {
            if (!patient.getUserId().equals(actor.getUserId())) {
                throw new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "Access denied: You are not authorized to view another patient's medical records."
                );
            }
            return patient;
        }

        // 3. Doctor can only access records of their assigned patients with CONFIRMED or COMPLETED appointments
        if ("DOCTOR".equalsIgnoreCase(role)) {
            Doctor doctor = doctorRepository.findByUserId(actor.getUserId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Doctor profile not found"));

            List<Appointment> docAppts = appointmentRepository.findByDoctorId(doctor.getDoctorId());
            boolean hasValidClinicalRelationship = docAppts.stream().anyMatch(a ->
                    a.getPatientId().equals(patientId) &&
                    ("CONFIRMED".equalsIgnoreCase(a.getStatus()) || "COMPLETED".equalsIgnoreCase(a.getStatus()))
            );

            if (!hasValidClinicalRelationship) {
                throw new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "Access denied: You do not have a confirmed or completed clinical consultation relationship with this patient."
                );
            }
            return patient;
        }

        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Unauthorized role");
    }

    // =========================================================================
    // CLINICAL CONSULTATION RECORDS
    // =========================================================================

    @Transactional
    public ConsultationRecordResponseDTO createConsultationRecord(
            ConsultationRecordRequestDTO dto,
            String doctorEmail,
            String clientIp) {

        User user = userRepository.findByEmail(doctorEmail.trim().toLowerCase(Locale.ROOT))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        Doctor doctor = doctorRepository.findByUserId(user.getUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Doctor profile not found"));

        if (!Boolean.TRUE.equals(user.getIsActive())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Your doctor account is deactivated");
        }

        Appointment appointment = appointmentRepository.findById(dto.getAppointmentId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Appointment not found"));

        // 1. Verify doctor is assigned to the appointment
        if (!appointment.getDoctorId().equals(doctor.getDoctorId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: You are not assigned to this appointment.");
        }

        // 2. Verify patient matches the appointment record
        if (dto.getPatientId() != null && !appointment.getPatientId().equals(dto.getPatientId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Patient ID does not match appointment record.");
        }

        // 3. Verify appointment status is CONFIRMED or COMPLETED
        String status = appointment.getStatus() != null ? appointment.getStatus().trim().toUpperCase(Locale.ROOT) : "";
        if (!"CONFIRMED".equals(status) && !"COMPLETED".equals(status)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Consultation notes can only be recorded for CONFIRMED or COMPLETED appointments (current status: " + status + ")"
            );
        }

        if (consultationRepository.existsByAppointmentId(appointment.getAppointmentId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A clinical consultation record already exists for this appointment");
        }

        ConsultationRecord record = new ConsultationRecord();
        record.setAppointmentId(appointment.getAppointmentId());
        record.setPatientId(appointment.getPatientId());
        record.setDoctorId(doctor.getDoctorId());
        record.setSymptoms(dto.getSymptoms());
        record.setClinicalObservations(dto.getClinicalObservations());
        record.setDiagnosis(dto.getDiagnosis().trim());
        record.setTreatmentPlan(dto.getTreatmentPlan());
        record.setFollowUpRecommendation(dto.getFollowUpRecommendation());
        record.setConsultationNotes(dto.getConsultationNotes());
        record.setIsActive(true);

        ConsultationRecord saved = consultationRepository.save(record);

        auditLogService.log(
                "CONSULTATION",
                saved.getRecordId(),
                "CONSULTATION_RECORDED",
                doctorEmail,
                "DOCTOR",
                "Clinical consultation recorded for Appointment #" + appointment.getAppointmentId() + ". Diagnosis: " + saved.getDiagnosis(),
                clientIp
        );

        // Notify patient that clinical consultation record is available
        Patient patient = patientRepository.findById(saved.getPatientId()).orElse(null);
        if (patient != null) {
            notificationService.createNotification(
                    patient.getUserId(),
                    "New Consultation Notes Available",
                    "Dr. " + user.getFullName() + " has added consultation records and diagnosis notes for your appointment on " + appointment.getAppointmentDate() + ".",
                    "EHR_RECORD_ADDED",
                    appointment.getAppointmentId(),
                    null,
                    "MEDICAL_RECORD",
                    "NORMAL",
                    "/patient/dashboard"
            );
        }

        return convertConsultationToDTO(saved);
    }

    @Transactional
    public ConsultationRecordResponseDTO updateConsultationRecord(
            Long recordId,
            ConsultationRecordRequestDTO dto,
            String doctorEmail,
            String clientIp) {

        User user = userRepository.findByEmail(doctorEmail.trim().toLowerCase(Locale.ROOT))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        Doctor doctor = doctorRepository.findByUserId(user.getUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Doctor profile not found"));

        ConsultationRecord record = consultationRepository.findById(recordId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Consultation record not found"));

        // Clinical integrity: Only the treating doctor who authored the record can modify it!
        if (!record.getDoctorId().equals(doctor.getDoctorId())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Access denied: You cannot alter a clinical consultation record authored by another physician."
            );
        }

        Appointment appointment = appointmentRepository.findById(record.getAppointmentId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Appointment not found"));

        String status = appointment.getStatus() != null ? appointment.getStatus().trim().toUpperCase(Locale.ROOT) : "";
        if (!"CONFIRMED".equals(status) && !"COMPLETED".equals(status)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Consultation notes can only be updated for CONFIRMED or COMPLETED appointments."
            );
        }

        record.setSymptoms(dto.getSymptoms());
        record.setClinicalObservations(dto.getClinicalObservations());
        record.setDiagnosis(dto.getDiagnosis().trim());
        record.setTreatmentPlan(dto.getTreatmentPlan());
        record.setFollowUpRecommendation(dto.getFollowUpRecommendation());
        record.setConsultationNotes(dto.getConsultationNotes());

        ConsultationRecord saved = consultationRepository.save(record);

        auditLogService.log(
                "CONSULTATION",
                saved.getRecordId(),
                "CONSULTATION_UPDATED",
                doctorEmail,
                "DOCTOR",
                "Clinical consultation updated for Record #" + recordId,
                clientIp
        );

        return convertConsultationToDTO(saved);
    }

    // =========================================================================
    // PATIENT VITALS
    // =========================================================================

    @Transactional
    public PatientVitalDTO recordVitals(
            PatientVitalDTO dto,
            String actorEmail,
            String clientIp) {

        User actor = userRepository.findByEmail(actorEmail.trim().toLowerCase(Locale.ROOT))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        validatePatientAccess(dto.getPatientId(), actorEmail);

        if (dto.getAppointmentId() != null) {
            Appointment appt = appointmentRepository.findById(dto.getAppointmentId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Associated appointment not found"));

            if (!appt.getPatientId().equals(dto.getPatientId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Appointment does not belong to the specified patient");
            }

            if ("DOCTOR".equalsIgnoreCase(actor.getRole().name())) {
                Doctor doctor = doctorRepository.findByUserId(actor.getUserId())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Doctor profile not found"));
                if (!appt.getDoctorId().equals(doctor.getDoctorId())) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: You are not assigned to this appointment");
                }
                String apptStatus = appt.getStatus() != null ? appt.getStatus().trim().toUpperCase(Locale.ROOT) : "";
                if (!"CONFIRMED".equals(apptStatus) && !"COMPLETED".equals(apptStatus)) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vitals can only be recorded for CONFIRMED or COMPLETED appointments");
                }
            }
        }

        PatientVital vital = new PatientVital();
        vital.setPatientId(dto.getPatientId());
        vital.setAppointmentId(dto.getAppointmentId());

        if ("DOCTOR".equalsIgnoreCase(actor.getRole().name())) {
            Doctor doctor = doctorRepository.findByUserId(actor.getUserId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Doctor profile not found"));
            vital.setRecordedByDoctorId(doctor.getDoctorId());
        } else {
            vital.setRecordedByDoctorId(null);
        }

        vital.setBloodPressureSystolic(dto.getBloodPressureSystolic());
        vital.setBloodPressureDiastolic(dto.getBloodPressureDiastolic());
        vital.setPulseRate(dto.getPulseRate());
        vital.setTemperature(dto.getTemperature());
        vital.setRespiratoryRate(dto.getRespiratoryRate());
        vital.setOxygenSaturation(dto.getOxygenSaturation());
        vital.setHeightCm(dto.getHeightCm());
        vital.setWeightKg(dto.getWeightKg());
        vital.setNotes(dto.getNotes());
        vital.setMeasuredAt(dto.getMeasuredAt() != null ? dto.getMeasuredAt() : OffsetDateTime.now());
        vital.setIsActive(true);

        // Auto-calculate BMI if height and weight are provided
        if (dto.getHeightCm() != null && dto.getWeightKg() != null && dto.getHeightCm().compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal heightInMeters = dto.getHeightCm().divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP);
            BigDecimal heightSquared = heightInMeters.multiply(heightInMeters);
            BigDecimal bmi = dto.getWeightKg().divide(heightSquared, 1, RoundingMode.HALF_UP);
            vital.setBmi(bmi);
        }

        PatientVital saved = vitalRepository.save(vital);

        auditLogService.log(
                "VITALS",
                saved.getVitalId(),
                "VITALS_RECORDED",
                actorEmail,
                actor.getRole().name(),
                "Recorded vitals for Patient #" + dto.getPatientId() + (vital.getRecordedByDoctorId() != null ? " by Doctor" : " self-reported"),
                clientIp
        );

        return convertVitalToDTO(saved);
    }

    @Transactional
    public void deleteVitals(Long vitalId, String actorEmail, String clientIp) {
        User actor = userRepository.findByEmail(actorEmail.trim().toLowerCase(Locale.ROOT))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        PatientVital vital = vitalRepository.findById(vitalId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vitals record not found"));

        // CRITICAL DATA INTEGRITY RULE:
        // Patients are strictly prohibited from deleting or modifying doctor-recorded clinical vitals!
        if ("PATIENT".equalsIgnoreCase(actor.getRole().name()) && vital.getRecordedByDoctorId() != null) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Access denied: Patients are strictly not permitted to delete or modify doctor-recorded clinical vitals."
            );
        }

        if ("DOCTOR".equalsIgnoreCase(actor.getRole().name())) {
            Doctor doctor = doctorRepository.findByUserId(actor.getUserId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Doctor profile not found"));
            if (vital.getRecordedByDoctorId() != null && !vital.getRecordedByDoctorId().equals(doctor.getDoctorId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: You cannot delete vitals recorded by another doctor.");
            }
        }

        // CLINICAL TRACEABILITY & RECORD RETENTION:
        // Perform soft deletion so historical clinical vitals are never physically destroyed!
        vital.setIsActive(false);
        vital.setDeletedAt(OffsetDateTime.now());
        vital.setDeletedBy(actorEmail);
        vitalRepository.save(vital);

        auditLogService.log(
                "VITALS",
                vitalId,
                "VITALS_ARCHIVED",
                actorEmail,
                actor.getRole().name(),
                "Archived vitals record #" + vitalId + " for Patient #" + vital.getPatientId(),
                clientIp
        );
    }

    // =========================================================================
    // ALLERGIES & CHRONIC CONDITIONS
    // =========================================================================

    @Transactional
    public MedicalConditionAllergyDTO addConditionAllergy(
            MedicalConditionAllergyDTO dto,
            String actorEmail,
            String clientIp) {

        User actor = userRepository.findByEmail(actorEmail.trim().toLowerCase(Locale.ROOT))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        validatePatientAccess(dto.getPatientId(), actorEmail);

        MedicalConditionAllergy item = new MedicalConditionAllergy();
        item.setPatientId(dto.getPatientId());
        item.setType(dto.getType().trim().toUpperCase(Locale.ROOT));
        item.setName(dto.getName().trim());
        item.setSeverity(dto.getSeverity() != null ? dto.getSeverity().trim().toUpperCase(Locale.ROOT) : null);
        item.setNotes(dto.getNotes());
        item.setDiagnosedDate(dto.getDiagnosedDate());
        item.setRecordedBy(actor.getFullName() != null ? actor.getFullName() : actorEmail);
        item.setIsActive(true);

        MedicalConditionAllergy saved = conditionRepository.save(item);

        auditLogService.log(
                "MEDICAL_HISTORY",
                saved.getConditionId(),
                "CONDITION_RECORDED",
                actorEmail,
                actor.getRole().name(),
                "Recorded " + saved.getType() + ": " + saved.getName() + " for Patient #" + dto.getPatientId(),
                clientIp
        );

        return convertConditionToDTO(saved);
    }

    @Transactional
    public void deleteConditionAllergy(Long conditionId, String actorEmail, String clientIp) {
        User actor = userRepository.findByEmail(actorEmail.trim().toLowerCase(Locale.ROOT))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        MedicalConditionAllergy item = conditionRepository.findById(conditionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Condition record not found"));

        validatePatientAccess(item.getPatientId(), actorEmail);

        // CLINICAL TRACEABILITY & RECORD RETENTION:
        // Perform soft deletion so diagnostic and allergy history is never physically destroyed!
        item.setIsActive(false);
        item.setDeletedAt(OffsetDateTime.now());
        item.setDeletedBy(actorEmail);
        conditionRepository.save(item);

        auditLogService.log(
                "MEDICAL_HISTORY",
                conditionId,
                "CONDITION_ARCHIVED",
                actorEmail,
                actor.getRole().name(),
                "Archived " + item.getType() + ": " + item.getName() + " for Patient #" + item.getPatientId(),
                clientIp
        );
    }

    // =========================================================================
    // MEDICAL DOCUMENTS & REPORTS (PERSISTENT HYBRID STORAGE)
    // =========================================================================

    @Transactional
    public MedicalDocumentDTO uploadDocument(
            Long patientId,
            Long appointmentId,
            String documentType,
            String documentName,
            String notes,
            MultipartFile file,
            String actorEmail,
            String clientIp) {

        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File is required and cannot be empty");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File size exceeds the 10MB limit");
        }

        String mimeType = file.getContentType();
        if (mimeType == null || !ALLOWED_MIME_TYPES.contains(mimeType.toLowerCase(Locale.ROOT))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid file format. Only PDF, PNG, JPG/JPEG, and WebP documents are supported.");
        }

        User actor = userRepository.findByEmail(actorEmail.trim().toLowerCase(Locale.ROOT))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        validatePatientAccess(patientId, actorEmail);

        if (appointmentId != null) {
            Appointment appt = appointmentRepository.findById(appointmentId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Associated appointment not found"));

            if (!appt.getPatientId().equals(patientId)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Appointment does not belong to the specified patient");
            }

            if ("DOCTOR".equalsIgnoreCase(actor.getRole().name())) {
                Doctor doctor = doctorRepository.findByUserId(actor.getUserId())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Doctor profile not found"));
                if (!appt.getDoctorId().equals(doctor.getDoctorId())) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: You are not assigned to this appointment");
                }
                String apptStatus = appt.getStatus() != null ? appt.getStatus().trim().toUpperCase(Locale.ROOT) : "";
                if (!"CONFIRMED".equals(apptStatus) && !"COMPLETED".equals(apptStatus)) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Documents can only be linked to CONFIRMED or COMPLETED appointments");
                }
            }
        }

        String origName = file.getOriginalFilename();
        String safeName = origName != null ? origName.replaceAll("[^a-zA-Z0-9.-]", "_") : "document";
        String storageFileName = UUID.randomUUID() + "_" + safeName;

        try {
            byte[] fileBytes = file.getBytes();

            // 1. Write to local filesystem cache
            Path targetDir = Paths.get(uploadBaseDir, String.valueOf(patientId)).normalize();
            if (!Files.exists(targetDir)) {
                Files.createDirectories(targetDir);
            }

            Path targetPath = targetDir.resolve(storageFileName).normalize();
            try (InputStream is = file.getInputStream()) {
                Files.copy(is, targetPath, StandardCopyOption.REPLACE_EXISTING);
            }

            // 2. Save document metadata
            MedicalDocument doc = new MedicalDocument();
            doc.setPatientId(patientId);
            doc.setAppointmentId(appointmentId);
            doc.setUploadedByUserId(actor.getUserId());
            doc.setDocumentName(documentName != null && !documentName.isBlank() ? documentName.trim() : safeName);
            doc.setDocumentType(documentType != null ? documentType.trim().toUpperCase(Locale.ROOT) : "OTHER");
            doc.setFilePath(targetPath.toString());
            doc.setFileType(mimeType);
            doc.setFileSizeBytes(file.getSize());
            doc.setNotes(notes);
            doc.setIsActive(true);

            MedicalDocument saved = documentRepository.save(doc);

            // 3. PERSISTENT STORAGE: Save binary data into PostgreSQL medical_document_contents table
            // Guarantees persistence across Render restarts, redeployments, and instance changes at ₹0 cost!
            MedicalDocumentContent content = new MedicalDocumentContent(saved.getDocumentId(), fileBytes);
            medicalDocumentContentRepository.save(content);

            auditLogService.log(
                    "DOCUMENT",
                    saved.getDocumentId(),
                    "DOCUMENT_UPLOADED",
                    actorEmail,
                    actor.getRole().name(),
                    "Uploaded " + saved.getDocumentType() + " (" + saved.getDocumentName() + ") for Patient #" + patientId,
                    clientIp
            );

            // Notify patient or doctor based on who uploaded
            Patient patientObj = patientRepository.findById(patientId).orElse(null);
            if (patientObj != null) {
                if ("DOCTOR".equalsIgnoreCase(actor.getRole().name())) {
                    // Doctor uploaded -> notify patient
                    notificationService.createNotification(
                            patientObj.getUserId(),
                            "New Medical Document Available",
                            "Dr. " + actor.getFullName() + " uploaded a new medical document (" + saved.getDocumentName() + ") to your health record.",
                            "EHR_RECORD_ADDED",
                            null,
                            null,
                            "MEDICAL_RECORD",
                            "NORMAL",
                            "/patient/dashboard"
                    );
                } else if ("PATIENT".equalsIgnoreCase(actor.getRole().name())) {
                    // Patient uploaded -> notify treating doctor if there is an appointment
                    List<Appointment> appts = appointmentRepository.findByPatientId(patientId);
                    if (!appts.isEmpty()) {
                        Appointment latest = appts.get(appts.size() - 1);
                        Doctor docObj = doctorRepository.findById(latest.getDoctorId()).orElse(null);
                        if (docObj != null) {
                            notificationService.createNotification(
                                    docObj.getUserId(),
                                    "Patient Uploaded Medical Document",
                                    "Patient " + actor.getFullName() + " uploaded a new document (" + saved.getDocumentName() + ") for review.",
                                    "PATIENT_CLINICAL_UPDATE",
                                    latest.getAppointmentId(),
                                    null,
                                    "MEDICAL_RECORD",
                                    "NORMAL",
                                    "/doctor/patients"
                            );
                        }
                    }
                }
            }

            return convertDocumentToDTO(saved);

        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to store uploaded medical document");
        }
    }

    public Resource downloadDocument(Long documentId, String actorEmail, String clientIp) {
        MedicalDocument doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Medical document not found"));

        if (!Boolean.TRUE.equals(doc.getIsActive())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Medical document has been archived");
        }

        validatePatientAccess(doc.getPatientId(), actorEmail);

        try {
            // Tier 1: Check if file exists in local filesystem cache
            if (doc.getFilePath() != null) {
                Path filePath = Paths.get(doc.getFilePath()).normalize();
                if (Files.exists(filePath) && Files.isReadable(filePath)) {
                    auditLogService.log(
                            "DOCUMENT",
                            documentId,
                            "DOCUMENT_DOWNLOADED",
                            actorEmail,
                            "USER",
                            "Downloaded document #" + documentId + " (" + doc.getDocumentName() + ") from local filesystem cache",
                            clientIp
                    );
                    return new UrlResource(filePath.toUri());
                }
            }

            // Tier 2: Retrieve from persistent PostgreSQL storage (BYTEA) across Render restarts/redeployments
            Optional<MedicalDocumentContent> contentOpt = medicalDocumentContentRepository.findByDocumentId(documentId);
            if (contentOpt.isPresent()) {
                byte[] data = contentOpt.get().getDocumentData();

                // Restore local cache file for subsequent accesses in current container instance
                try {
                    Path targetDir = Paths.get(uploadBaseDir, String.valueOf(doc.getPatientId())).normalize();
                    if (!Files.exists(targetDir)) {
                        Files.createDirectories(targetDir);
                    }
                    String cacheFileName = doc.getFilePath() != null
                            ? Paths.get(doc.getFilePath()).getFileName().toString()
                            : UUID.randomUUID() + "_" + doc.getDocumentName().replaceAll("[^a-zA-Z0-9.-]", "_");
                    Path cachePath = targetDir.resolve(cacheFileName).normalize();
                    Files.write(cachePath, data);
                    doc.setFilePath(cachePath.toString());
                    documentRepository.save(doc);
                } catch (Exception cacheEx) {
                    // Non-critical cache write failure, proceed with streaming database bytes
                }

                auditLogService.log(
                        "DOCUMENT",
                        documentId,
                        "DOCUMENT_DOWNLOADED",
                        actorEmail,
                        "USER",
                        "Downloaded document #" + documentId + " (" + doc.getDocumentName() + ") from persistent DB storage",
                        clientIp
                );

                return new ByteArrayResource(data) {
                    @Override
                    public String getFilename() {
                        return doc.getDocumentName();
                    }
                };
            }

            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Document file not found on server or database");
        } catch (ResponseStatusException rse) {
            throw rse;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not read document file: " + e.getMessage());
        }
    }

    public MedicalDocument getDocumentMetadata(Long documentId, String actorEmail) {
        MedicalDocument doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Medical document not found"));

        if (!Boolean.TRUE.equals(doc.getIsActive())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Medical document has been archived");
        }

        validatePatientAccess(doc.getPatientId(), actorEmail);
        return doc;
    }

    @Transactional
    public void deleteDocument(Long documentId, String actorEmail, String clientIp) {
        User actor = userRepository.findByEmail(actorEmail.trim().toLowerCase(Locale.ROOT))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        MedicalDocument doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Medical document not found"));

        validatePatientAccess(doc.getPatientId(), actorEmail);

        // Only uploader, doctor, or admin can delete
        if ("PATIENT".equalsIgnoreCase(actor.getRole().name()) && !doc.getUploadedByUserId().equals(actor.getUserId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: You can only remove documents you uploaded.");
        }

        // CLINICAL TRACEABILITY & RECORD RETENTION:
        // Perform soft deletion so diagnostic and medical records are never physically destroyed!
        doc.setIsActive(false);
        doc.setDeletedAt(OffsetDateTime.now());
        doc.setDeletedBy(actorEmail);
        documentRepository.save(doc);

        auditLogService.log(
                "DOCUMENT",
                documentId,
                "DOCUMENT_ARCHIVED",
                actorEmail,
                actor.getRole().name(),
                "Archived document #" + documentId + " (" + doc.getDocumentName() + ") for Patient #" + doc.getPatientId(),
                clientIp
        );
    }

    // =========================================================================
    // UNIFIED EHR SUMMARY & CHRONOLOGICAL TIMELINE
    // =========================================================================

    public PatientEhrSummaryResponseDTO getPatientEhr(Long patientId, String authenticatedEmail) {
        Patient patient = validatePatientAccess(patientId, authenticatedEmail);

        User patientUser = userRepository.findById(patient.getUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Patient user profile not found"));

        PatientEhrSummaryResponseDTO summary = new PatientEhrSummaryResponseDTO();
        summary.setPatientId(patient.getPatientId());
        summary.setFullName(patientUser.getFullName());
        summary.setEmail(patientUser.getEmail());
        summary.setPhone(patient.getPhone());
        summary.setDateOfBirth(patient.getDateOfBirth());
        summary.setGender(patient.getGender());
        summary.setBloodGroup(patient.getBloodGroup());

        // 1. Allergies & Conditions (Active records only)
        List<MedicalConditionAllergyDTO> conditions = conditionRepository.findByPatientIdAndIsActiveTrueOrderByCreatedAtDesc(patientId)
                .stream()
                .map(this::convertConditionToDTO)
                .toList();
        summary.setAllergiesAndConditions(conditions);

        // 2. Consultation Records (Active records only)
        List<ConsultationRecordResponseDTO> consultations = consultationRepository.findByPatientIdAndIsActiveTrueOrderByCreatedAtDesc(patientId)
                .stream()
                .map(this::convertConsultationToDTO)
                .toList();
        summary.setConsultationRecords(consultations);

        // 3. Vitals History & Latest (Active records only)
        List<PatientVitalDTO> vitals = vitalRepository.findByPatientIdAndIsActiveTrueOrderByMeasuredAtDesc(patientId)
                .stream()
                .map(this::convertVitalToDTO)
                .toList();
        summary.setVitalsHistory(vitals);
        summary.setLatestVitals(!vitals.isEmpty() ? vitals.get(0) : null);

        // 4. Prescriptions
        List<Appointment> appointments = appointmentRepository.findByPatientId(patientId);
        List<PrescriptionResponseDTO> prescriptions = new ArrayList<>();
        for (Appointment a : appointments) {
            prescriptionRepository.findByAppointmentId(a.getAppointmentId()).ifPresent(p -> {
                Doctor doc = doctorRepository.findById(a.getDoctorId()).orElse(null);
                String docName = doc != null ? userRepository.findById(doc.getUserId()).map(User::getFullName).orElse("Doctor") : "Doctor";
                String specName = doc != null ? specializationRepository.findById(doc.getSpecializationId()).map(Specialization::getSpecializationName).orElse("General") : "General";

                PrescriptionResponseDTO pDto = new PrescriptionResponseDTO(
                        p.getPrescriptionId(),
                        p.getAppointmentId(),
                        p.getDiagnosis(),
                        p.getMedications(),
                        p.getInstructions(),
                        p.getPrescribedAt(),
                        docName,
                        specName,
                        p.getVerificationCode()
                );
                prescriptions.add(pDto);
            });
        }
        prescriptions.sort(Comparator.comparing(PrescriptionResponseDTO::getPrescribedAt, Comparator.nullsLast(Comparator.reverseOrder())));
        summary.setPrescriptions(prescriptions);

        // 5. Medical Documents (Active records only)
        List<MedicalDocumentDTO> documents = documentRepository.findByPatientIdAndIsActiveTrueOrderByUploadedAtDesc(patientId)
                .stream()
                .map(this::convertDocumentToDTO)
                .toList();
        summary.setDocuments(documents);

        // 6. Unified Chronological Timeline
        List<MedicalRecordTimelineItemDTO> timeline = buildUnifiedTimeline(conditions, consultations, vitals, prescriptions, documents);
        summary.setTimeline(timeline);

        return summary;
    }

    public PatientEhrSummaryResponseDTO getMyEhr(String patientEmail) {
        User user = userRepository.findByEmail(patientEmail.trim().toLowerCase(Locale.ROOT))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        Patient patient = patientRepository.findByUserId(user.getUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Patient profile not found"));

        return getPatientEhr(patient.getPatientId(), patientEmail);
    }

    // =========================================================================
    // TIMELINE AGGREGATOR
    // =========================================================================

    private List<MedicalRecordTimelineItemDTO> buildUnifiedTimeline(
            List<MedicalConditionAllergyDTO> conditions,
            List<ConsultationRecordResponseDTO> consultations,
            List<PatientVitalDTO> vitals,
            List<PrescriptionResponseDTO> prescriptions,
            List<MedicalDocumentDTO> documents) {

        List<MedicalRecordTimelineItemDTO> items = new ArrayList<>();

        // Add Consultations
        for (ConsultationRecordResponseDTO c : consultations) {
            Map<String, Object> d = new HashMap<>();
            d.put("recordId", c.getRecordId());
            d.put("appointmentId", c.getAppointmentId());
            d.put("treatmentPlan", c.getTreatmentPlan());
            d.put("observations", c.getClinicalObservations());
            d.put("symptoms", c.getSymptoms());
            d.put("followUp", c.getFollowUpRecommendation());

            items.add(new MedicalRecordTimelineItemDTO(
                    "consultation-" + c.getRecordId(),
                    "CONSULTATION",
                    c.getCreatedAt() != null ? c.getCreatedAt() : OffsetDateTime.now(),
                    "Clinical Consultation: " + c.getDiagnosis(),
                    c.getSpecializationName() != null ? c.getSpecializationName() : "General Consultation",
                    c.getDoctorName(),
                    "Consultation",
                    c.getSymptoms() != null ? "Symptoms: " + c.getSymptoms() : "Consultation recorded",
                    d
            ));
        }

        // Add Prescriptions
        for (PrescriptionResponseDTO p : prescriptions) {
            Map<String, Object> d = new HashMap<>();
            d.put("prescriptionId", p.getPrescriptionId());
            d.put("appointmentId", p.getAppointmentId());
            d.put("verificationCode", p.getVerificationCode());
            d.put("medications", p.getMedications());

            items.add(new MedicalRecordTimelineItemDTO(
                    "prescription-" + p.getPrescriptionId(),
                    "PRESCRIPTION",
                    p.getPrescribedAt() != null ? p.getPrescribedAt() : OffsetDateTime.now(),
                    "Prescription Issued (" + (p.getVerificationCode() != null ? p.getVerificationCode() : "RX") + ")",
                    p.getSpecialization() != null ? p.getSpecialization() : "Prescription",
                    p.getDoctorName(),
                    "Prescription",
                    "Diagnosis: " + p.getDiagnosis(),
                    d
            ));
        }

        // Add Vitals
        for (PatientVitalDTO v : vitals) {
            Map<String, Object> d = new HashMap<>();
            d.put("vitalId", v.getVitalId());
            d.put("bp", v.getBloodPressureSystolic() != null ? v.getBloodPressureSystolic() + "/" + v.getBloodPressureDiastolic() : null);
            d.put("pulse", v.getPulseRate());
            d.put("temp", v.getTemperature());
            d.put("spo2", v.getOxygenSaturation());
            d.put("bmi", v.getBmi());

            String bpStr = v.getBloodPressureSystolic() != null ? "BP " + v.getBloodPressureSystolic() + "/" + v.getBloodPressureDiastolic() + " mmHg" : "";
            String pulseStr = v.getPulseRate() != null ? "Pulse " + v.getPulseRate() + " bpm" : "";
            String summaryText = String.join(", ", List.of(bpStr, pulseStr).stream().filter(s -> !s.isEmpty()).toList());

            items.add(new MedicalRecordTimelineItemDTO(
                    "vital-" + v.getVitalId(),
                    "VITAL",
                    v.getMeasuredAt() != null ? v.getMeasuredAt() : v.getCreatedAt(),
                    "Patient Vitals Reading",
                    v.getDoctorName() != null ? "Recorded by " + v.getDoctorName() : "Self / General Intake",
                    v.getDoctorName(),
                    "Vitals",
                    !summaryText.isEmpty() ? summaryText : "Vitals measured",
                    d
            ));
        }

        // Add Documents
        for (MedicalDocumentDTO doc : documents) {
            Map<String, Object> d = new HashMap<>();
            d.put("documentId", doc.getDocumentId());
            d.put("fileType", doc.getFileType());
            d.put("size", doc.getFileSizeFormatted());
            d.put("notes", doc.getNotes());

            items.add(new MedicalRecordTimelineItemDTO(
                    "document-" + doc.getDocumentId(),
                    "DOCUMENT",
                    doc.getUploadedAt() != null ? doc.getUploadedAt() : OffsetDateTime.now(),
                    "Medical Document: " + doc.getDocumentName(),
                    doc.getDocumentType(),
                    doc.getUploadedByName(),
                    "Document",
                    doc.getFileSizeFormatted() + " • " + doc.getFileType(),
                    d
            ));
        }

        // Add Conditions & Allergies
        for (MedicalConditionAllergyDTO a : conditions) {
            Map<String, Object> d = new HashMap<>();
            d.put("conditionId", a.getConditionId());
            d.put("severity", a.getSeverity());
            d.put("notes", a.getNotes());

            items.add(new MedicalRecordTimelineItemDTO(
                    "condition-" + a.getConditionId(),
                    "CONDITION",
                    a.getCreatedAt() != null ? a.getCreatedAt() : OffsetDateTime.now(),
                    a.getType() + ": " + a.getName(),
                    a.getSeverity() != null ? "Severity: " + a.getSeverity() : "Health Record",
                    a.getRecordedBy(),
                    "Condition",
                    a.getNotes() != null ? a.getNotes() : "Recorded condition",
                    d
            ));
        }

        items.sort(Comparator.comparing(MedicalRecordTimelineItemDTO::getEventDate, Comparator.nullsLast(Comparator.reverseOrder())));
        return items;
    }

    // =========================================================================
    // DTO CONVERTERS
    // =========================================================================

    private ConsultationRecordResponseDTO convertConsultationToDTO(ConsultationRecord record) {
        ConsultationRecordResponseDTO dto = new ConsultationRecordResponseDTO();
        dto.setRecordId(record.getRecordId());
        dto.setAppointmentId(record.getAppointmentId());
        dto.setPatientId(record.getPatientId());
        dto.setDoctorId(record.getDoctorId());
        dto.setSymptoms(record.getSymptoms());
        dto.setClinicalObservations(record.getClinicalObservations());
        dto.setDiagnosis(record.getDiagnosis());
        dto.setTreatmentPlan(record.getTreatmentPlan());
        dto.setFollowUpRecommendation(record.getFollowUpRecommendation());
        dto.setConsultationNotes(record.getConsultationNotes());
        dto.setCreatedAt(record.getCreatedAt());
        dto.setUpdatedAt(record.getUpdatedAt());

        Doctor doctor = doctorRepository.findById(record.getDoctorId()).orElse(null);
        if (doctor != null) {
            userRepository.findById(doctor.getUserId()).ifPresent(u -> dto.setDoctorName(u.getFullName()));
            specializationRepository.findById(doctor.getSpecializationId()).ifPresent(s -> dto.setSpecializationName(s.getSpecializationName()));
        }

        appointmentRepository.findById(record.getAppointmentId()).ifPresent(a -> {
            dto.setAppointmentDate(a.getAppointmentDate());
            dto.setAppointmentTime(a.getAppointmentTime());
        });

        return dto;
    }

    private PatientVitalDTO convertVitalToDTO(PatientVital vital) {
        PatientVitalDTO dto = new PatientVitalDTO();
        dto.setVitalId(vital.getVitalId());
        dto.setPatientId(vital.getPatientId());
        dto.setAppointmentId(vital.getAppointmentId());
        dto.setRecordedByDoctorId(vital.getRecordedByDoctorId());
        dto.setBloodPressureSystolic(vital.getBloodPressureSystolic());
        dto.setBloodPressureDiastolic(vital.getBloodPressureDiastolic());
        dto.setPulseRate(vital.getPulseRate());
        dto.setTemperature(vital.getTemperature());
        dto.setRespiratoryRate(vital.getRespiratoryRate());
        dto.setOxygenSaturation(vital.getOxygenSaturation());
        dto.setHeightCm(vital.getHeightCm());
        dto.setWeightKg(vital.getWeightKg());
        dto.setBmi(vital.getBmi());
        dto.setNotes(vital.getNotes());
        dto.setMeasuredAt(vital.getMeasuredAt());
        dto.setCreatedAt(vital.getCreatedAt());

        if (vital.getRecordedByDoctorId() != null) {
            doctorRepository.findById(vital.getRecordedByDoctorId()).ifPresent(d -> {
                userRepository.findById(d.getUserId()).ifPresent(u -> dto.setDoctorName(u.getFullName()));
            });
        }

        return dto;
    }

    private MedicalConditionAllergyDTO convertConditionToDTO(MedicalConditionAllergy item) {
        MedicalConditionAllergyDTO dto = new MedicalConditionAllergyDTO();
        dto.setConditionId(item.getConditionId());
        dto.setPatientId(item.getPatientId());
        dto.setType(item.getType());
        dto.setName(item.getName());
        dto.setSeverity(item.getSeverity());
        dto.setNotes(item.getNotes());
        dto.setDiagnosedDate(item.getDiagnosedDate());
        dto.setRecordedBy(item.getRecordedBy());
        dto.setCreatedAt(item.getCreatedAt());
        dto.setUpdatedAt(item.getUpdatedAt());
        return dto;
    }

    private MedicalDocumentDTO convertDocumentToDTO(MedicalDocument doc) {
        MedicalDocumentDTO dto = new MedicalDocumentDTO();
        dto.setDocumentId(doc.getDocumentId());
        dto.setPatientId(doc.getPatientId());
        dto.setAppointmentId(doc.getAppointmentId());
        dto.setUploadedByUserId(doc.getUploadedByUserId());
        dto.setDocumentName(doc.getDocumentName());
        dto.setDocumentType(doc.getDocumentType());
        dto.setFileType(doc.getFileType());
        dto.setFileSizeBytes(doc.getFileSizeBytes());
        dto.setNotes(doc.getNotes());
        dto.setUploadedAt(doc.getUploadedAt());

        long bytes = doc.getFileSizeBytes() != null ? doc.getFileSizeBytes() : 0;
        if (bytes < 1024) {
            dto.setFileSizeFormatted(bytes + " B");
        } else if (bytes < 1024 * 1024) {
            dto.setFileSizeFormatted(String.format("%.1f KB", bytes / 1024.0));
        } else {
            dto.setFileSizeFormatted(String.format("%.1f MB", bytes / (1024.0 * 1024.0)));
        }

        userRepository.findById(doc.getUploadedByUserId()).ifPresent(u -> dto.setUploadedByName(u.getFullName()));
        return dto;
    }
}
