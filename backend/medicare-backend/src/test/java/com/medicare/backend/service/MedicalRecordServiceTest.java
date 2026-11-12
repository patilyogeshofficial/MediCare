package com.medicare.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import com.medicare.backend.entity.Appointment;
import com.medicare.backend.entity.Doctor;
import com.medicare.backend.entity.Patient;
import com.medicare.backend.entity.User;
import com.medicare.backend.enums.Role;
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

class MedicalRecordServiceTest {

    private PatientRepository patientRepository;
    private UserRepository userRepository;
    private DoctorRepository doctorRepository;
    private AppointmentRepository appointmentRepository;
    private PrescriptionRepository prescriptionRepository;
    private SpecializationRepository specializationRepository;
    private ConsultationRecordRepository consultationRepository;
    private PatientVitalRepository vitalRepository;
    private MedicalConditionAllergyRepository conditionRepository;
    private MedicalDocumentRepository documentRepository;
    private MedicalDocumentContentRepository medicalDocumentContentRepository;
    private AuditLogService auditLogService;
    private NotificationService notificationService;

    private MedicalRecordService medicalRecordService;

    @BeforeEach
    void setUp() {
        patientRepository = mock(PatientRepository.class);
        userRepository = mock(UserRepository.class);
        doctorRepository = mock(DoctorRepository.class);
        appointmentRepository = mock(AppointmentRepository.class);
        prescriptionRepository = mock(PrescriptionRepository.class);
        specializationRepository = mock(SpecializationRepository.class);
        consultationRepository = mock(ConsultationRecordRepository.class);
        vitalRepository = mock(PatientVitalRepository.class);
        conditionRepository = mock(MedicalConditionAllergyRepository.class);
        documentRepository = mock(MedicalDocumentRepository.class);
        medicalDocumentContentRepository = mock(MedicalDocumentContentRepository.class);
        auditLogService = mock(AuditLogService.class);
        notificationService = mock(NotificationService.class);

        medicalRecordService = new MedicalRecordService(
                patientRepository,
                userRepository,
                doctorRepository,
                appointmentRepository,
                prescriptionRepository,
                specializationRepository,
                consultationRepository,
                vitalRepository,
                conditionRepository,
                documentRepository,
                medicalDocumentContentRepository,
                auditLogService,
                notificationService
        );
    }

    @Test
    @DisplayName("EHR Authorization: Patient can access their own medical records")
    void testValidatePatientAccess_PatientOwnRecord() {
        String email = "patient@test.com";

        User user = new User();
        user.setUserId(1L);
        user.setEmail(email);
        user.setRole(Role.PATIENT);

        Patient patient = new Patient();
        patient.setPatientId(10L);
        patient.setUserId(1L);

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));
        when(patientRepository.findById(10L)).thenReturn(Optional.of(patient));

        Patient result = medicalRecordService.validatePatientAccess(10L, email);
        assertNotNull(result);
        assertEquals(10L, result.getPatientId());
    }

    @Test
    @DisplayName("EHR Authorization: Patient receives 403 FORBIDDEN when attempting to access another patient's records")
    void testValidatePatientAccess_PatientForbiddenOtherRecord() {
        String email = "patient_a@test.com";

        User user = new User();
        user.setUserId(1L);
        user.setEmail(email);
        user.setRole(Role.PATIENT);

        Patient otherPatient = new Patient();
        otherPatient.setPatientId(20L);
        otherPatient.setUserId(2L); // Different user

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));
        when(patientRepository.findById(20L)).thenReturn(Optional.of(otherPatient));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                medicalRecordService.validatePatientAccess(20L, email)
        );

        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
        assertTrue(ex.getReason().contains("You are not authorized to view another patient's medical records"));
    }

    @Test
    @DisplayName("EHR Authorization: Doctor with CONFIRMED/COMPLETED appointment has valid access")
    void testValidatePatientAccess_DoctorValidClinicalRelationship() {
        String email = "doctor@test.com";

        User user = new User();
        user.setUserId(5L);
        user.setEmail(email);
        user.setRole(Role.DOCTOR);

        Doctor doctor = new Doctor();
        doctor.setDoctorId(50L);
        doctor.setUserId(5L);

        Patient patient = new Patient();
        patient.setPatientId(10L);
        patient.setUserId(1L);

        Appointment confirmedAppt = new Appointment();
        confirmedAppt.setAppointmentId(101L);
        confirmedAppt.setDoctorId(50L);
        confirmedAppt.setPatientId(10L);
        confirmedAppt.setStatus("CONFIRMED");

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));
        when(patientRepository.findById(10L)).thenReturn(Optional.of(patient));
        when(doctorRepository.findByUserId(5L)).thenReturn(Optional.of(doctor));
        when(appointmentRepository.findByDoctorId(50L)).thenReturn(List.of(confirmedAppt));

        Patient result = medicalRecordService.validatePatientAccess(10L, email);
        assertNotNull(result);
        assertEquals(10L, result.getPatientId());
    }

    @Test
    @DisplayName("EHR Authorization: Doctor with only CANCELLED/REJECTED appointment is denied with 403 FORBIDDEN")
    void testValidatePatientAccess_DoctorCancelledRelationshipDenied() {
        String email = "doctor@test.com";

        User user = new User();
        user.setUserId(5L);
        user.setEmail(email);
        user.setRole(Role.DOCTOR);

        Doctor doctor = new Doctor();
        doctor.setDoctorId(50L);
        doctor.setUserId(5L);

        Patient patient = new Patient();
        patient.setPatientId(10L);
        patient.setUserId(1L);

        // Cancelled appointment does NOT grant medical history access
        Appointment cancelledAppt = new Appointment();
        cancelledAppt.setAppointmentId(102L);
        cancelledAppt.setDoctorId(50L);
        cancelledAppt.setPatientId(10L);
        cancelledAppt.setStatus("CANCELLED");

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));
        when(patientRepository.findById(10L)).thenReturn(Optional.of(patient));
        when(doctorRepository.findByUserId(5L)).thenReturn(Optional.of(doctor));
        when(appointmentRepository.findByDoctorId(50L)).thenReturn(List.of(cancelledAppt));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                medicalRecordService.validatePatientAccess(10L, email)
        );

        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
        assertTrue(ex.getReason().contains("clinical consultation relationship"));
    }

    @Test
    @DisplayName("EHR Authorization: Admin has administrative oversight access")
    void testValidatePatientAccess_AdminAllowed() {
        String email = "admin@medicare.com";

        User user = new User();
        user.setUserId(99L);
        user.setEmail(email);
        user.setRole(Role.ADMIN);

        Patient patient = new Patient();
        patient.setPatientId(10L);

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));
        when(patientRepository.findById(10L)).thenReturn(Optional.of(patient));

        Patient result = medicalRecordService.validatePatientAccess(10L, email);
        assertNotNull(result);
        assertEquals(10L, result.getPatientId());
    }
}
