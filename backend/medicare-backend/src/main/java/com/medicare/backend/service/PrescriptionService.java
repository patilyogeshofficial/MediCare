
package com.medicare.backend.service;

import java.time.LocalDate;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import com.medicare.backend.dto.PrescriptionRequestDTO;
import com.medicare.backend.dto.PrescriptionResponseDTO;
import com.medicare.backend.dto.PublicPrescriptionVerificationDTO;
import com.medicare.backend.entity.Appointment;
import com.medicare.backend.entity.Doctor;
import com.medicare.backend.entity.Patient;
import com.medicare.backend.entity.Prescription;
import com.medicare.backend.entity.Specialization;
import com.medicare.backend.entity.User;
import com.medicare.backend.repository.AppointmentRepository;
import com.medicare.backend.repository.DoctorRepository;
import com.medicare.backend.repository.PatientRepository;
import com.medicare.backend.repository.PrescriptionRepository;
import com.medicare.backend.repository.SpecializationRepository;
import com.medicare.backend.repository.UserRepository;
import com.medicare.backend.security.RateLimiterService;
import com.medicare.backend.security.VerificationCodeGenerator;

@Service
public class PrescriptionService {

    private final NotificationService notificationService;
    private final PatientRepository patientRepository;
    private final UserRepository userRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final AppointmentRepository appointmentRepository;
    private final JsonMapper jsonMapper;
    private final DoctorRepository doctorRepository;
    private final AuditLogService auditLogService;
    private final VerificationCodeGenerator verificationCodeGenerator;
    private final RateLimiterService rateLimiterService;
    private final SpecializationRepository specializationRepository;

    public PrescriptionService(
            PrescriptionRepository prescriptionRepository,
            AppointmentRepository appointmentRepository,
            PatientRepository patientRepository,
            UserRepository userRepository,
            JsonMapper jsonMapper,
            NotificationService notificationService,
            DoctorRepository doctorRepository,
            AuditLogService auditLogService,
            VerificationCodeGenerator verificationCodeGenerator,
            RateLimiterService rateLimiterService,
            SpecializationRepository specializationRepository) {

        this.prescriptionRepository = prescriptionRepository;
        this.appointmentRepository = appointmentRepository;
        this.patientRepository = patientRepository;
        this.userRepository = userRepository;
        this.jsonMapper = jsonMapper;
        this.notificationService = notificationService;
        this.doctorRepository = doctorRepository;
        this.auditLogService = auditLogService;
        this.verificationCodeGenerator = verificationCodeGenerator;
        this.rateLimiterService = rateLimiterService;
        this.specializationRepository = specializationRepository;
    }

    // Get all prescriptions - ADMIN
    public List<PrescriptionResponseDTO> getAllPrescriptions() {

        return prescriptionRepository.findAll()
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

    // Get prescriptions belonging to the logged-in patient
    public List<PrescriptionResponseDTO> getMyPrescriptions(
            String authenticatedEmail) {

        User user = userRepository.findByEmail(
                authenticatedEmail.trim().toLowerCase())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "User not found"));

        Patient patient = patientRepository.findByUserId(user.getUserId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Patient profile not found"));

        List<Appointment> appointments =
                appointmentRepository.findByPatientId(
                        patient.getPatientId());

        if (appointments.isEmpty()) {
            return List.of();
        }

        List<Long> appointmentIds = appointments.stream()
                .map(Appointment::getAppointmentId)
                .toList();

        return prescriptionRepository.findByAppointmentIdIn(appointmentIds)
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

    // Get prescription by ID
    public PrescriptionResponseDTO getPrescriptionById(
            Long prescriptionId) {

        return convertToDTO(findPrescription(prescriptionId));
    }

    // Get prescription by ID with authorization check
    public PrescriptionResponseDTO getPrescriptionById(
            Long prescriptionId,
            String authenticatedEmail,
            boolean isAdmin) {

        Prescription prescription = findPrescription(prescriptionId);

        if (!isAdmin) {
            User user = userRepository.findByEmail(
                    authenticatedEmail.trim().toLowerCase())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND, "User not found"));

            Appointment appointment = validateAppointment(prescription.getAppointmentId());

            boolean isDoctor = doctorRepository.findByUserId(user.getUserId())
                    .map(doc -> doc.getDoctorId().equals(appointment.getDoctorId()))
                    .orElse(false);

            boolean isPatient = patientRepository.findByUserId(user.getUserId())
                    .map(pat -> pat.getPatientId().equals(appointment.getPatientId()))
                    .orElse(false);

            if (!isDoctor && !isPatient) {
                throw new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "You are not allowed to access this prescription");
            }
        }

        return convertToDTO(prescription);
    }

    // Get prescription by appointment ID
    public PrescriptionResponseDTO getPrescriptionByAppointmentId(
            Long appointmentId) {

        return prescriptionRepository.findByAppointmentId(appointmentId)
                .map(this::convertToDTO)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Prescription not found for appointment ID: "
                                + appointmentId));
    }

    // Get prescription by appointment ID with authorization check
    public PrescriptionResponseDTO getPrescriptionByAppointmentId(
            Long appointmentId,
            String authenticatedEmail,
            boolean isAdmin) {

        Appointment appointment = validateAppointment(appointmentId);

        if (!isAdmin) {
            User user = userRepository.findByEmail(
                    authenticatedEmail.trim().toLowerCase())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND, "User not found"));

            boolean isDoctor = doctorRepository.findByUserId(user.getUserId())
                    .map(doc -> doc.getDoctorId().equals(appointment.getDoctorId()))
                    .orElse(false);

            boolean isPatient = patientRepository.findByUserId(user.getUserId())
                    .map(pat -> pat.getPatientId().equals(appointment.getPatientId()))
                    .orElse(false);

            if (!isDoctor && !isPatient) {
                throw new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "You are not allowed to access this appointment's prescription");
            }
        }

        return prescriptionRepository.findByAppointmentId(appointmentId)
                .map(this::convertToDTO)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Prescription not found for appointment ID: "
                                + appointmentId));
    }

    // Get prescriptions by patient ID (Admin or Doctor assigned to patient)
    public List<PrescriptionResponseDTO> getPrescriptionsByPatientId(
            Long patientId,
            String authenticatedEmail,
            boolean isAdmin) {

        patientRepository.findById(patientId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Patient not found with ID: " + patientId));

        if (!isAdmin) {
            User user = userRepository.findByEmail(
                    authenticatedEmail.trim().toLowerCase())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND, "User not found"));

            Doctor doctor = doctorRepository.findByUserId(user.getUserId())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND, "Doctor profile not found"));

            boolean hasAppointment = appointmentRepository.findByDoctorId(doctor.getDoctorId())
                    .stream()
                    .anyMatch(a -> patientId.equals(a.getPatientId()));

            if (!hasAppointment) {
                throw new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "You are not authorized to view prescriptions for this patient");
            }
        }

        List<Appointment> appointments = appointmentRepository.findByPatientId(patientId);

        if (appointments.isEmpty()) {
            return List.of();
        }

        List<Long> appointmentIds = appointments.stream()
                .map(Appointment::getAppointmentId)
                .toList();

        return prescriptionRepository.findByAppointmentIdIn(appointmentIds)
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

    // Get all prescriptions created for appointments belonging to the logged-in doctor
    public List<PrescriptionResponseDTO> getMyDoctorPrescriptions(
            String authenticatedEmail) {

        User user = userRepository.findByEmail(
                authenticatedEmail.trim().toLowerCase())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User not found"));

        Doctor doctor = doctorRepository.findByUserId(user.getUserId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Doctor profile not found"));

        List<Appointment> appointments =
                appointmentRepository.findByDoctorId(doctor.getDoctorId());

        if (appointments.isEmpty()) {
            return List.of();
        }

        List<Long> appointmentIds = appointments.stream()
                .map(Appointment::getAppointmentId)
                .toList();

        return prescriptionRepository.findByAppointmentIdIn(appointmentIds)
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

    // Create prescription - DOCTOR only
    @Transactional
    public PrescriptionResponseDTO createPrescription(
            PrescriptionRequestDTO request,
            String authenticatedEmail) {

        // 1. Find authenticated doctor
        User user = userRepository.findByEmail(
                authenticatedEmail.trim().toLowerCase())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "User not found"));

        if (!Boolean.TRUE.equals(user.getIsActive())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Your doctor account is deactivated by the administrator.");
        }

        Doctor doctor = doctorRepository.findByUserId(user.getUserId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Doctor profile not found"));

        // 2. Find appointment
        Appointment appointment =
                validateAppointment(request.getAppointmentId());

        // 3. Verify that this appointment belongs to this doctor
        if (!doctor.getDoctorId().equals(appointment.getDoctorId())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You are not allowed to create a prescription for this appointment");
        }

        // 4. Prescription can only be created after completion
        if (!"COMPLETED".equals(appointment.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Prescription can only be created for completed appointments");
        }

        // 5. Prevent duplicate prescriptions
        if (prescriptionRepository.existsByAppointmentId(
                request.getAppointmentId())) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Prescription already exists for this appointment");
        }

        // 6. Validate medication JSON
        validateMedications(request.getMedications());

        // 7. Create prescription with secure verification code
        Prescription prescription = new Prescription();

        prescription.setAppointmentId(request.getAppointmentId());
        prescription.setDiagnosis(request.getDiagnosis());
        prescription.setMedications(request.getMedications());
        prescription.setInstructions(request.getInstructions());

        String verificationCode = verificationCodeGenerator.generateCode();
        while (prescriptionRepository.existsByVerificationCode(verificationCode)) {
            verificationCode = verificationCodeGenerator.generateCode();
        }
        prescription.setVerificationCode(verificationCode);

        Prescription savedPrescription =
                prescriptionRepository.saveAndFlush(prescription);

        // Audit Logging
        auditLogService.log(
                "PRESCRIPTION",
                savedPrescription.getPrescriptionId(),
                "PRESCRIPTION_ISSUED",
                user.getEmail(),
                "DOCTOR",
                "Issued prescription with Verification Code: " + verificationCode + " for Appointment #" + appointment.getAppointmentId(),
                "127.0.0.1"
        );

        // 8. Notify admins
        notificationService.createAdminActivityNotification(
                "New Prescription Created",
                "A new prescription has been created for appointment #"
                        + savedPrescription.getAppointmentId() + " (Verification Code: " + verificationCode + ").",
                "NEW_PRESCRIPTION",
                savedPrescription.getAppointmentId(),
                savedPrescription.getPrescriptionId()
        );

        // 9. Notify the patient
        Patient patient = patientRepository.findById(
                appointment.getPatientId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Patient profile not found"));

        notificationService.createNotification(
                patient.getUserId(),
                "New Prescription Available",
                "Your doctor has added a prescription for appointment #"
                        + savedPrescription.getAppointmentId() + ".",
                "NEW_PRESCRIPTION",
                savedPrescription.getAppointmentId(),
                savedPrescription.getPrescriptionId()
        );

        return convertToDTO(savedPrescription);
    }

    // Update prescription - ADMIN (Audited and Tamper Protected)
    @Transactional
    public PrescriptionResponseDTO updatePrescription(
            Long prescriptionId,
            PrescriptionRequestDTO request) {

        Prescription prescription = findPrescription(prescriptionId);

        if (!prescription.getAppointmentId().equals(
                request.getAppointmentId())) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Prescription cannot be moved to another appointment");
        }

        validateAppointment(request.getAppointmentId());
        validateMedications(request.getMedications());

        String previousDiagnosis = prescription.getDiagnosis();
        prescription.setDiagnosis(request.getDiagnosis());
        prescription.setMedications(request.getMedications());
        prescription.setInstructions(request.getInstructions());

        Prescription updated = prescriptionRepository.save(prescription);

        auditLogService.log(
                "PRESCRIPTION",
                prescriptionId,
                "PRESCRIPTION_MODIFIED",
                "admin@medicare.com",
                "ADMIN",
                "Prescription modified by Admin. Verification Code remains: " + updated.getVerificationCode() + ". Previous diagnosis: " + previousDiagnosis,
                "127.0.0.1"
        );

        return convertToDTO(updated);
    }

    // Delete prescription - ADMIN (Audited)
    @Transactional
    public void deletePrescription(Long prescriptionId) {

        Prescription prescription = findPrescription(prescriptionId);

        auditLogService.log(
                "PRESCRIPTION",
                prescriptionId,
                "PRESCRIPTION_DELETED",
                "admin@medicare.com",
                "ADMIN",
                "Prescription deleted by Admin. Was issued for Appointment #" + prescription.getAppointmentId() + " (Verification Code: " + prescription.getVerificationCode() + ")",
                "127.0.0.1"
        );

        prescriptionRepository.delete(prescription);
    }

    // Public Prescription Verification (Privacy-safe: Zero patient or clinical data returned)
    public PublicPrescriptionVerificationDTO verifyPrescriptionPublic(String verificationCode, String clientIp) {
        if (!rateLimiterService.tryAcquire(clientIp)) {
            throw new ResponseStatusException(
                    HttpStatus.TOO_MANY_REQUESTS,
                    "Verification rate limit exceeded (maximum 10 requests per minute). Please wait before trying again."
            );
        }

        if (verificationCode == null || verificationCode.trim().isEmpty()) {
            return PublicPrescriptionVerificationDTO.invalid("", "Please enter a valid verification code.");
        }

        String normalizedCode = verificationCode.trim().toUpperCase();

        Prescription prescription = prescriptionRepository.findByVerificationCode(normalizedCode).orElse(null);

        if (prescription == null) {
            auditLogService.log(
                    "PRESCRIPTION",
                    0L,
                    "PUBLIC_VERIFICATION_ATTEMPT",
                    "PUBLIC_PORTAL",
                    "ANONYMOUS",
                    "Verification failed: Code '" + normalizedCode + "' not found.",
                    clientIp
            );
            return PublicPrescriptionVerificationDTO.invalid(normalizedCode, "No authentic prescription record found matching verification code: " + normalizedCode);
        }

        // Fetch non-sensitive doctor and department information
        Appointment appointment = appointmentRepository.findById(prescription.getAppointmentId()).orElse(null);
        Doctor doctor = appointment != null ? doctorRepository.findById(appointment.getDoctorId()).orElse(null) : null;
        User doctorUser = doctor != null ? userRepository.findById(doctor.getUserId()).orElse(null) : null;
        Specialization spec = doctor != null ? specializationRepository.findById(doctor.getSpecializationId()).orElse(null) : null;

        String doctorName = doctorUser != null ? "Dr. " + doctorUser.getFullName() : "Authorized MediCare Specialist";
        String license = doctor != null ? doctor.getLicenseNumber() : "Verified";
        String specName = spec != null ? spec.getSpecializationName() : "General Medicine";
        LocalDate issueDate = prescription.getPrescribedAt() != null
                ? prescription.getPrescribedAt().toLocalDate()
                : (appointment != null ? appointment.getAppointmentDate() : LocalDate.now());

        auditLogService.log(
                "PRESCRIPTION",
                prescription.getPrescriptionId(),
                "PUBLIC_VERIFICATION_SUCCESS",
                "PUBLIC_PORTAL",
                "ANONYMOUS",
                "Prescription verified successfully for code " + normalizedCode,
                clientIp
        );

        return PublicPrescriptionVerificationDTO.valid(
                normalizedCode,
                issueDate,
                doctorName,
                license,
                specName
        );
    }

    // Find prescription
    private Prescription findPrescription(Long prescriptionId) {

        return prescriptionRepository.findById(prescriptionId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Prescription not found with ID: " + prescriptionId));
    }

    // Validate appointment
    private Appointment validateAppointment(Long appointmentId) {

        return appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Appointment not found with ID: " + appointmentId));
    }

    // Validate medications JSON
    private void validateMedications(String medications) {

        try {
            JsonNode jsonNode = jsonMapper.readTree(medications);

            if (jsonNode == null || !jsonNode.isArray()) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Medications must be a valid JSON array");
            }

        } catch (ResponseStatusException exception) {
            throw exception;

        } catch (Exception exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid medications JSON format");
        }
    }

    // Convert entity to response DTO
    private PrescriptionResponseDTO convertToDTO(
            Prescription prescription) {

        return new PrescriptionResponseDTO(
                prescription.getPrescriptionId(),
                prescription.getAppointmentId(),
                prescription.getDiagnosis(),
                prescription.getMedications(),
                prescription.getInstructions(),
                prescription.getVerificationCode(),
                prescription.getPrescribedAt());
    }
    // Check whether a prescription exists for the doctor's appointment
public boolean hasPrescription(
        Long appointmentId,
        String authenticatedEmail) {

    User user = userRepository.findByEmail(
            authenticatedEmail.trim().toLowerCase())
            .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "User not found"));

    Doctor doctor = doctorRepository.findByUserId(user.getUserId())
            .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Doctor profile not found"));

    Appointment appointment = validateAppointment(appointmentId);

    if (!doctor.getDoctorId().equals(appointment.getDoctorId())) {
        throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "You are not allowed to access this appointment");
    }

    return prescriptionRepository.existsByAppointmentId(appointmentId);
}
}
