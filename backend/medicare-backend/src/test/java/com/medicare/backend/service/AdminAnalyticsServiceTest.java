package com.medicare.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.medicare.backend.entity.Appointment;
import com.medicare.backend.entity.Doctor;
import com.medicare.backend.entity.Patient;
import com.medicare.backend.entity.User;
import com.medicare.backend.repository.AppointmentRepository;
import com.medicare.backend.repository.DoctorRepository;
import com.medicare.backend.repository.PatientRepository;
import com.medicare.backend.repository.PrescriptionRepository;
import com.medicare.backend.repository.SpecializationRepository;
import com.medicare.backend.repository.UserRepository;

class AdminAnalyticsServiceTest {

    private AppointmentRepository appointmentRepository;
    private DoctorRepository doctorRepository;
    private PatientRepository patientRepository;
    private UserRepository userRepository;
    private SpecializationRepository specializationRepository;
    private PrescriptionRepository prescriptionRepository;

    private AdminAnalyticsService analyticsService;

    @BeforeEach
    void setUp() {
        appointmentRepository = mock(AppointmentRepository.class);
        doctorRepository = mock(DoctorRepository.class);
        patientRepository = mock(PatientRepository.class);
        userRepository = mock(UserRepository.class);
        specializationRepository = mock(SpecializationRepository.class);
        prescriptionRepository = mock(PrescriptionRepository.class);

        analyticsService = new AdminAnalyticsService(
                appointmentRepository,
                doctorRepository,
                patientRepository,
                userRepository,
                specializationRepository,
                prescriptionRepository
        );
    }

    @Test
    @DisplayName("resolveDateRange: TODAY returns current date for start and end")
    void testResolveDateRange_Today() {
        LocalDate today = LocalDate.now();
        LocalDate[] range = analyticsService.resolveDateRange("TODAY", null, null);

        assertEquals(2, range.length);
        assertEquals(today, range[0]);
        assertEquals(today, range[1]);
    }

    @Test
    @DisplayName("resolveDateRange: LAST_7_DAYS returns 6 days ago through today")
    void testResolveDateRange_Last7Days() {
        LocalDate today = LocalDate.now();
        LocalDate[] range = analyticsService.resolveDateRange("LAST_7_DAYS", null, null);

        assertEquals(2, range.length);
        assertEquals(today.minusDays(6), range[0]);
        assertEquals(today, range[1]);
    }

    @Test
    @DisplayName("resolveDateRange: ALL_TIME defaults to comprehensive date bounds")
    void testResolveDateRange_AllTime() {
        LocalDate today = LocalDate.now();
        LocalDate[] range = analyticsService.resolveDateRange("ALL_TIME", null, null);

        assertEquals(2, range.length);
        assertEquals(LocalDate.of(2020, 1, 1), range[0]);
        assertEquals(today.plusYears(1), range[1]);
    }

    @Test
    @DisplayName("resolveDateRange: null filter defaults to ALL_TIME")
    void testResolveDateRange_NullDefaultsToAllTime() {
        LocalDate today = LocalDate.now();
        LocalDate[] range = analyticsService.resolveDateRange(null, null, null);

        assertEquals(2, range.length);
        assertEquals(LocalDate.of(2020, 1, 1), range[0]);
        assertEquals(today.plusYears(1), range[1]);
    }

    @Test
    @DisplayName("resolveDateRange: CUSTOM with valid dates uses provided bounds")
    void testResolveDateRange_CustomValid() {
        LocalDate start = LocalDate.of(2026, 1, 1);
        LocalDate end = LocalDate.of(2026, 1, 31);
        LocalDate[] range = analyticsService.resolveDateRange("CUSTOM", start, end);

        assertEquals(2, range.length);
        assertEquals(start, range[0]);
        assertEquals(end, range[1]);
    }

    @Test
    @DisplayName("resolveDateRange: CUSTOM with inverted dates throws 400 BAD_REQUEST")
    void testResolveDateRange_CustomInvertedThrowsBadRequest() {
        LocalDate start = LocalDate.of(2026, 5, 1);
        LocalDate end = LocalDate.of(2026, 4, 1); // start after end

        org.springframework.web.server.ResponseStatusException ex =
                org.junit.jupiter.api.Assertions.assertThrows(
                        org.springframework.web.server.ResponseStatusException.class,
                        () -> analyticsService.resolveDateRange("CUSTOM", start, end)
                );

        assertEquals(org.springframework.http.HttpStatus.BAD_REQUEST, ex.getStatusCode());
        assertTrue(ex.getReason().contains("startDate cannot be after endDate"));
    }

    @Test
    @DisplayName("exportAppointmentsCsv: Generates RFC-compliant CSV with proper headers")
    void testExportAppointmentsCsv() {
        Appointment appt = new Appointment();
        appt.setAppointmentId(101L);
        appt.setDoctorId(1L);
        appt.setPatientId(2L);
        appt.setAppointmentDate(LocalDate.of(2026, 3, 15));
        appt.setStatus("COMPLETED");

        Doctor doc = new Doctor();
        doc.setDoctorId(1L);
        doc.setUserId(10L);

        User docUser = new User();
        docUser.setFullName("Dr. Robert Smith");

        Patient pat = new Patient();
        pat.setPatientId(2L);
        pat.setUserId(20L);

        User patUser = new User();
        patUser.setFullName("Alice Johnson");
        patUser.setEmail("alice@test.com");

        when(appointmentRepository.findAppointmentsByDateRange(any(), any())).thenReturn(List.of(appt));
        when(doctorRepository.findAll()).thenReturn(List.of(doc));
        when(userRepository.findById(10L)).thenReturn(java.util.Optional.of(docUser));
        when(userRepository.findById(20L)).thenReturn(java.util.Optional.of(patUser));
        when(patientRepository.findAll()).thenReturn(List.of(pat));
        when(specializationRepository.findAll()).thenReturn(List.of());

        String csv = analyticsService.exportAppointmentsCsv("TODAY", null, null);

        assertNotNull(csv);
        assertTrue(csv.contains("Appointment ID,Date,Time,Patient Name,Doctor Name,Specialization,Status,Queue Number,Created At"));
        assertTrue(csv.contains("Alice Johnson"));
        assertTrue(csv.contains("Dr. Robert Smith"));
    }
}
