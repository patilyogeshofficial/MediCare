package com.medicare.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import com.medicare.backend.dto.PrescriptionRequestDTO;
import com.medicare.backend.dto.PrescriptionResponseDTO;
import com.medicare.backend.entity.Appointment;
import com.medicare.backend.entity.Doctor;
import com.medicare.backend.entity.Patient;
import com.medicare.backend.entity.Prescription;
import com.medicare.backend.entity.User;
import com.medicare.backend.repository.AppointmentRepository;
import com.medicare.backend.repository.DoctorRepository;
import com.medicare.backend.repository.PatientRepository;
import com.medicare.backend.repository.PrescriptionRepository;
import com.medicare.backend.repository.UserRepository;
import com.medicare.backend.repository.SpecializationRepository;
import com.medicare.backend.security.RateLimiterService;
import com.medicare.backend.security.VerificationCodeGenerator;
import tools.jackson.databind.json.JsonMapper;

class PrescriptionSecurityTest {

    private PrescriptionRepository prescriptionRepository;
    private AppointmentRepository appointmentRepository;
    private DoctorRepository doctorRepository;
    private PatientRepository patientRepository;
    private UserRepository userRepository;
    private JsonMapper jsonMapper;
    private NotificationService notificationService;
    private AuditLogService auditLogService;
    private VerificationCodeGenerator verificationCodeGenerator;
    private RateLimiterService rateLimiterService;
    private SpecializationRepository specializationRepository;

    private PrescriptionService prescriptionService;

    @BeforeEach
    void setUp() {
        prescriptionRepository = mock(PrescriptionRepository.class);
        appointmentRepository = mock(AppointmentRepository.class);
        doctorRepository = mock(DoctorRepository.class);
        patientRepository = mock(PatientRepository.class);
        userRepository = mock(UserRepository.class);
        jsonMapper = JsonMapper.builder().build();
        notificationService = mock(NotificationService.class);
        auditLogService = mock(AuditLogService.class);
        verificationCodeGenerator = mock(VerificationCodeGenerator.class);
        rateLimiterService = mock(RateLimiterService.class);
        specializationRepository = mock(SpecializationRepository.class);

        prescriptionService = new PrescriptionService(
                prescriptionRepository,
                appointmentRepository,
                patientRepository,
                userRepository,
                jsonMapper,
                notificationService,
                doctorRepository,
                auditLogService,
                verificationCodeGenerator,
                rateLimiterService,
                specializationRepository
        );
    }

    @Test
    @DisplayName("Create prescription: Success for assigned doctor on COMPLETED appointment")
    void testCreatePrescription_Success() {
        String doctorEmail = "doctor@test.com";

        User doctorUser = new User();
        doctorUser.setUserId(2L);
        doctorUser.setEmail(doctorEmail);
        doctorUser.setIsActive(true);

        Doctor doctor = new Doctor();
        doctor.setDoctorId(20L);
        doctor.setUserId(2L);

        Appointment appointment = new Appointment();
        appointment.setAppointmentId(101L);
        appointment.setDoctorId(20L);
        appointment.setPatientId(50L);
        appointment.setStatus("COMPLETED");

        Patient patient = new Patient();
        patient.setPatientId(50L);
        patient.setUserId(5L);

        when(userRepository.findByEmail(doctorEmail)).thenReturn(Optional.of(doctorUser));
        when(doctorRepository.findByUserId(2L)).thenReturn(Optional.of(doctor));
        when(appointmentRepository.findById(101L)).thenReturn(Optional.of(appointment));
        when(prescriptionRepository.existsByAppointmentId(101L)).thenReturn(false);
        when(verificationCodeGenerator.generateCode()).thenReturn("RX-2026-TEST-CODE");
        when(prescriptionRepository.existsByVerificationCode("RX-2026-TEST-CODE")).thenReturn(false);
        when(patientRepository.findById(50L)).thenReturn(Optional.of(patient));

        when(prescriptionRepository.saveAndFlush(any(Prescription.class))).thenAnswer(inv -> {
            Prescription p = inv.getArgument(0);
            p.setPrescriptionId(500L);
            return p;
        });

        PrescriptionRequestDTO req = new PrescriptionRequestDTO();
        req.setAppointmentId(101L);
        req.setDiagnosis("Seasonal Allergies");
        req.setMedications("[{\"name\":\"Cetirizine\",\"dosage\":\"10mg\",\"frequency\":\"Once daily\",\"duration\":\"7 days\"}]");
        req.setInstructions("Take before sleep");

        PrescriptionResponseDTO result = prescriptionService.createPrescription(req, doctorEmail);

        assertNotNull(result);
        assertEquals(500L, result.getPrescriptionId());
        assertEquals("RX-2026-TEST-CODE", result.getVerificationCode());
        verify(auditLogService).log(eq("PRESCRIPTION"), eq(500L), eq("PRESCRIPTION_ISSUED"), eq(doctorEmail), eq("DOCTOR"), anyString(), anyString());
    }

    @Test
    @DisplayName("Create prescription: Fails with 409 CONFLICT if appointment is NOT COMPLETED")
    void testCreatePrescription_AppointmentNotCompleted() {
        String doctorEmail = "doctor@test.com";

        User doctorUser = new User();
        doctorUser.setUserId(2L);
        doctorUser.setEmail(doctorEmail);
        doctorUser.setIsActive(true);

        Doctor doctor = new Doctor();
        doctor.setDoctorId(20L);
        doctor.setUserId(2L);

        Appointment appointment = new Appointment();
        appointment.setAppointmentId(102L);
        appointment.setDoctorId(20L);
        appointment.setStatus("CONFIRMED"); // Still ongoing

        when(userRepository.findByEmail(doctorEmail)).thenReturn(Optional.of(doctorUser));
        when(doctorRepository.findByUserId(2L)).thenReturn(Optional.of(doctor));
        when(appointmentRepository.findById(102L)).thenReturn(Optional.of(appointment));

        PrescriptionRequestDTO req = new PrescriptionRequestDTO();
        req.setAppointmentId(102L);
        req.setDiagnosis("Fever");
        req.setMedications("[{\"name\":\"Paracetamol\",\"dosage\":\"500mg\"}]");

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                prescriptionService.createPrescription(req, doctorEmail)
        );

        assertEquals(HttpStatus.CONFLICT, ex.getStatusCode());
        assertTrue(ex.getReason().contains("Prescription can only be created for completed appointments"));
        verify(prescriptionRepository, never()).saveAndFlush(any(Prescription.class));
    }

    @Test
    @DisplayName("Create prescription: Fails with 403 FORBIDDEN if doctor does not own the appointment")
    void testCreatePrescription_DoctorNotAssigned() {
        String doctorEmail = "intruder.doctor@test.com";

        User doctorUser = new User();
        doctorUser.setUserId(3L);
        doctorUser.setEmail(doctorEmail);
        doctorUser.setIsActive(true);

        Doctor doctor = new Doctor();
        doctor.setDoctorId(30L); // Different doctor
        doctor.setUserId(3L);

        Appointment appointment = new Appointment();
        appointment.setAppointmentId(103L);
        appointment.setDoctorId(20L); // Assigned to doctor #20
        appointment.setStatus("COMPLETED");

        when(userRepository.findByEmail(doctorEmail)).thenReturn(Optional.of(doctorUser));
        when(doctorRepository.findByUserId(3L)).thenReturn(Optional.of(doctor));
        when(appointmentRepository.findById(103L)).thenReturn(Optional.of(appointment));

        PrescriptionRequestDTO req = new PrescriptionRequestDTO();
        req.setAppointmentId(103L);
        req.setDiagnosis("Flu");
        req.setMedications("[{\"name\":\"Rest\"}]");

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                prescriptionService.createPrescription(req, doctorEmail)
        );

        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
        assertTrue(ex.getReason().contains("not allowed to create a prescription for this appointment"));
    }

    @Test
    @DisplayName("Create prescription: Fails with 409 CONFLICT if duplicate prescription exists")
    void testCreatePrescription_DuplicatePrevented() {
        String doctorEmail = "doctor@test.com";

        User doctorUser = new User();
        doctorUser.setUserId(2L);
        doctorUser.setEmail(doctorEmail);
        doctorUser.setIsActive(true);

        Doctor doctor = new Doctor();
        doctor.setDoctorId(20L);
        doctor.setUserId(2L);

        Appointment appointment = new Appointment();
        appointment.setAppointmentId(104L);
        appointment.setDoctorId(20L);
        appointment.setStatus("COMPLETED");

        when(userRepository.findByEmail(doctorEmail)).thenReturn(Optional.of(doctorUser));
        when(doctorRepository.findByUserId(2L)).thenReturn(Optional.of(doctor));
        when(appointmentRepository.findById(104L)).thenReturn(Optional.of(appointment));
        when(prescriptionRepository.existsByAppointmentId(104L)).thenReturn(true);

        PrescriptionRequestDTO req = new PrescriptionRequestDTO();
        req.setAppointmentId(104L);
        req.setDiagnosis("Flu");
        req.setMedications("[{\"name\":\"Rest\"}]");

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                prescriptionService.createPrescription(req, doctorEmail)
        );

        assertEquals(HttpStatus.CONFLICT, ex.getStatusCode());
        assertTrue(ex.getReason().contains("Prescription already exists for this appointment"));
    }

    @Test
    @DisplayName("Public Verification: Fails with 429 TOO_MANY_REQUESTS when rate limit exceeded")
    void testVerifyPrescriptionPublic_RateLimitExceeded() {
        when(rateLimiterService.tryAcquire("192.168.1.100")).thenReturn(false);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                prescriptionService.verifyPrescriptionPublic("RX-2026-TEST-CODE", "192.168.1.100")
        );

        assertEquals(HttpStatus.TOO_MANY_REQUESTS, ex.getStatusCode());
        assertTrue(ex.getReason().contains("rate limit exceeded"));
    }

    @Test
    @DisplayName("Public Verification: Returns invalid DTO for non-existent code")
    void testVerifyPrescriptionPublic_NotFound() {
        when(rateLimiterService.tryAcquire("192.168.1.100")).thenReturn(true);
        when(prescriptionRepository.findByVerificationCode("RX-2026-UNKNOWN-CODE")).thenReturn(Optional.empty());

        com.medicare.backend.dto.PublicPrescriptionVerificationDTO res =
                prescriptionService.verifyPrescriptionPublic("RX-2026-UNKNOWN-CODE", "192.168.1.100");

        assertNotNull(res);
        org.junit.jupiter.api.Assertions.assertFalse(res.isValid());
    }

    @Test
    @DisplayName("Public Verification: Success returns sanitized details without clinical data")
    void testVerifyPrescriptionPublic_Success() {
        when(rateLimiterService.tryAcquire("192.168.1.100")).thenReturn(true);

        Prescription prescription = new Prescription();
        prescription.setPrescriptionId(777L);
        prescription.setVerificationCode("RX-2026-VALID-CODE");
        prescription.setAppointmentId(999L);
        prescription.setPrescribedAt(java.time.OffsetDateTime.now());

        Appointment appointment = new Appointment();
        appointment.setAppointmentId(999L);
        appointment.setDoctorId(20L);
        appointment.setPatientId(50L);
        appointment.setAppointmentDate(java.time.LocalDate.now());

        Doctor doctor = new Doctor();
        doctor.setDoctorId(20L);
        doctor.setUserId(2L);
        doctor.setSpecializationId(1L);

        User doctorUser = new User();
        doctorUser.setFullName("Gregory House");

        when(prescriptionRepository.findByVerificationCode("RX-2026-VALID-CODE")).thenReturn(Optional.of(prescription));
        when(doctorRepository.findById(20L)).thenReturn(Optional.of(doctor));
        when(userRepository.findById(2L)).thenReturn(Optional.of(doctorUser));
        when(appointmentRepository.findById(999L)).thenReturn(Optional.of(appointment));

        com.medicare.backend.dto.PublicPrescriptionVerificationDTO res =
                prescriptionService.verifyPrescriptionPublic("RX-2026-VALID-CODE", "192.168.1.100");

        assertNotNull(res);
        assertTrue(res.isValid());
        assertEquals("RX-2026-VALID-CODE", res.getVerificationCode());
        assertEquals("Dr. Gregory House", res.getDoctorName());
    }
}
