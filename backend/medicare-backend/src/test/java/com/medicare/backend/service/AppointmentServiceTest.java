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

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import com.medicare.backend.dto.AppointmentRequestDTO;
import com.medicare.backend.dto.AppointmentResponseDTO;
import com.medicare.backend.entity.Appointment;
import com.medicare.backend.entity.Doctor;
import com.medicare.backend.entity.DoctorAvailability;
import com.medicare.backend.entity.Patient;
import com.medicare.backend.entity.User;
import com.medicare.backend.repository.AppointmentRepository;
import com.medicare.backend.repository.DoctorAvailabilityRepository;
import com.medicare.backend.repository.DoctorRepository;
import com.medicare.backend.repository.PatientRepository;
import com.medicare.backend.repository.PrescriptionRepository;
import com.medicare.backend.repository.UserRepository;

class AppointmentServiceTest {

    private AppointmentRepository appointmentRepository;
    private PatientRepository patientRepository;
    private DoctorRepository doctorRepository;
    private UserRepository userRepository;
    private NotificationService notificationService;
    private PrescriptionRepository prescriptionRepository;
    private AuditLogService auditLogService;
    private DoctorAvailabilityRepository doctorAvailabilityRepository;

    private AppointmentService appointmentService;

    @BeforeEach
    void setUp() {
        appointmentRepository = mock(AppointmentRepository.class);
        patientRepository = mock(PatientRepository.class);
        doctorRepository = mock(DoctorRepository.class);
        userRepository = mock(UserRepository.class);
        notificationService = mock(NotificationService.class);
        prescriptionRepository = mock(PrescriptionRepository.class);
        auditLogService = mock(AuditLogService.class);
        doctorAvailabilityRepository = mock(DoctorAvailabilityRepository.class);

        appointmentService = new AppointmentService(
                appointmentRepository,
                patientRepository,
                doctorRepository,
                userRepository,
                notificationService,
                prescriptionRepository,
                auditLogService,
                doctorAvailabilityRepository
        );
    }

    @Test
    @DisplayName("Create appointment: Success creates PENDING appointment with 15-minute hold")
    void testCreateAppointment_Success() {
        String email = "patient@test.com";
        LocalDate date = LocalDate.now().plusDays(2);
        LocalTime time = LocalTime.of(10, 0);

        User patientUser = new User();
        patientUser.setUserId(1L);
        patientUser.setEmail(email);
        patientUser.setIsActive(true);

        Patient patient = new Patient();
        patient.setPatientId(10L);
        patient.setUserId(1L);

        User doctorUser = new User();
        doctorUser.setUserId(2L);
        doctorUser.setFullName("Dr. Smith");
        doctorUser.setIsActive(true);

        Doctor doctor = new Doctor();
        doctor.setDoctorId(20L);
        doctor.setUserId(2L);

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(patientUser));
        when(patientRepository.findByUserId(1L)).thenReturn(Optional.of(patient));
        when(doctorRepository.findById(20L)).thenReturn(Optional.of(doctor));
        when(userRepository.findById(2L)).thenReturn(Optional.of(doctorUser));

        // No conflicting appointments
        when(appointmentRepository.findActiveByDoctorIdAndDate(eq(20L), eq(date), any(OffsetDateTime.class)))
                .thenReturn(List.of());
        when(appointmentRepository.findActiveByPatientIdAndDate(eq(10L), eq(date), any(OffsetDateTime.class)))
                .thenReturn(List.of());

        // Availability check
        DoctorAvailability avail = new DoctorAvailability();
        avail.setDayOfWeek(date.getDayOfWeek().name());
        avail.setStartTime(LocalTime.of(9, 0));
        avail.setEndTime(LocalTime.of(17, 0));
        avail.setConsultationDuration(30);
        avail.setAvailable(true);
        when(doctorAvailabilityRepository.findByDoctorId(20L)).thenReturn(List.of(avail));

        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(invocation -> {
            Appointment a = invocation.getArgument(0);
            a.setAppointmentId(100L);
            return a;
        });

        AppointmentRequestDTO dto = new AppointmentRequestDTO();
        dto.setDoctorId(20L);
        dto.setAppointmentDate(date);
        dto.setAppointmentTime(time);
        dto.setReason("General Checkup");

        AppointmentResponseDTO result = appointmentService.createAppointment(dto, email);

        assertNotNull(result);
        assertEquals(100L, result.getAppointmentId());
        assertEquals("PENDING", result.getStatus());
        assertNotNull(result.getHoldExpiresAt());
        verify(appointmentRepository).save(any(Appointment.class));
    }

    @Test
    @DisplayName("Create appointment: Fails with 409 CONFLICT if doctor already has overlapping appointment")
    void testCreateAppointment_DoctorIntervalConflict() {
        String email = "patient@test.com";
        LocalDate date = LocalDate.now().plusDays(2);
        LocalTime requestedTime = LocalTime.of(10, 0);

        User patientUser = new User();
        patientUser.setUserId(1L);
        patientUser.setEmail(email);

        Patient patient = new Patient();
        patient.setPatientId(10L);
        patient.setUserId(1L);

        User doctorUser = new User();
        doctorUser.setUserId(2L);
        doctorUser.setIsActive(true);

        Doctor doctor = new Doctor();
        doctor.setDoctorId(20L);
        doctor.setUserId(2L);

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(patientUser));
        when(patientRepository.findByUserId(1L)).thenReturn(Optional.of(patient));
        when(doctorRepository.findById(20L)).thenReturn(Optional.of(doctor));
        when(userRepository.findById(2L)).thenReturn(Optional.of(doctorUser));

        // Existing appointment at 10:15 (overlaps with 10:00 - 10:30)
        Appointment existing = new Appointment();
        existing.setAppointmentId(99L);
        existing.setDoctorId(20L);
        existing.setAppointmentDate(date);
        existing.setAppointmentTime(LocalTime.of(10, 15));
        existing.setStatus("CONFIRMED");

        when(appointmentRepository.findActiveByDoctorIdAndDate(eq(20L), eq(date), any(OffsetDateTime.class)))
                .thenReturn(List.of(existing));

        DoctorAvailability avail = new DoctorAvailability();
        avail.setDayOfWeek(date.getDayOfWeek().name());
        avail.setConsultationDuration(30);
        avail.setAvailable(true);
        when(doctorAvailabilityRepository.findByDoctorId(20L)).thenReturn(List.of(avail));

        AppointmentRequestDTO dto = new AppointmentRequestDTO();
        dto.setDoctorId(20L);
        dto.setAppointmentDate(date);
        dto.setAppointmentTime(requestedTime);
        dto.setReason("General Checkup");

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                appointmentService.createAppointment(dto, email)
        );

        assertEquals(HttpStatus.CONFLICT, ex.getStatusCode());
        assertTrue(ex.getReason().contains("Overlapping bookings are strictly prohibited"));
        verify(appointmentRepository, never()).save(any(Appointment.class));
    }

    @Test
    @DisplayName("Create appointment: Fails with 409 CONFLICT if patient already has overlapping appointment")
    void testCreateAppointment_PatientIntervalConflict() {
        String email = "patient@test.com";
        LocalDate date = LocalDate.now().plusDays(2);
        LocalTime requestedTime = LocalTime.of(10, 0);

        User patientUser = new User();
        patientUser.setUserId(1L);
        patientUser.setEmail(email);

        Patient patient = new Patient();
        patient.setPatientId(10L);
        patient.setUserId(1L);

        User doctorUser = new User();
        doctorUser.setUserId(2L);
        doctorUser.setIsActive(true);

        Doctor doctor = new Doctor();
        doctor.setDoctorId(20L);
        doctor.setUserId(2L);

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(patientUser));
        when(patientRepository.findByUserId(1L)).thenReturn(Optional.of(patient));
        when(doctorRepository.findById(20L)).thenReturn(Optional.of(doctor));
        when(userRepository.findById(2L)).thenReturn(Optional.of(doctorUser));

        when(appointmentRepository.findActiveByDoctorIdAndDate(eq(20L), eq(date), any(OffsetDateTime.class)))
                .thenReturn(List.of());

        // Patient already has another appointment with a different doctor at 10:00
        Appointment patientExisting = new Appointment();
        patientExisting.setAppointmentId(88L);
        patientExisting.setDoctorId(35L);
        patientExisting.setPatientId(10L);
        patientExisting.setAppointmentDate(date);
        patientExisting.setAppointmentTime(LocalTime.of(10, 0));
        patientExisting.setStatus("CONFIRMED");

        when(appointmentRepository.findActiveByPatientIdAndDate(eq(10L), eq(date), any(OffsetDateTime.class)))
                .thenReturn(List.of(patientExisting));

        DoctorAvailability avail = new DoctorAvailability();
        avail.setDayOfWeek(date.getDayOfWeek().name());
        avail.setConsultationDuration(30);
        avail.setAvailable(true);
        when(doctorAvailabilityRepository.findByDoctorId(20L)).thenReturn(List.of(avail));
        when(doctorAvailabilityRepository.findByDoctorId(35L)).thenReturn(List.of(avail));

        AppointmentRequestDTO dto = new AppointmentRequestDTO();
        dto.setDoctorId(20L);
        dto.setAppointmentDate(date);
        dto.setAppointmentTime(requestedTime);
        dto.setReason("Follow-up");

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                appointmentService.createAppointment(dto, email)
        );

        assertEquals(HttpStatus.CONFLICT, ex.getStatusCode());
        assertTrue(ex.getReason().contains("You already have a confirmed appointment"));
    }

    @Test
    @DisplayName("Hold cleanup: Expired holds are transitioned to CANCELLED and audit logged")
    void testCleanupExpiredHolds() {
        Appointment expiredAppt = new Appointment();
        expiredAppt.setAppointmentId(55L);
        expiredAppt.setStatus("PENDING");
        expiredAppt.setHoldExpiresAt(OffsetDateTime.now().minusMinutes(5));

        when(appointmentRepository.findExpiredPendingHolds(any(OffsetDateTime.class)))
                .thenReturn(List.of(expiredAppt));

        appointmentService.cleanupExpiredHolds();

        assertEquals("CANCELLED", expiredAppt.getStatus());
        assertTrue(expiredAppt.getCancellationReason().contains("expired after 15 minutes"));
        verify(appointmentRepository).save(expiredAppt);
        verify(auditLogService).log(eq("APPOINTMENT"), eq(55L), eq("HOLD_EXPIRED"), eq("SYSTEM"), anyString(), anyString(), anyString());
    }
}
