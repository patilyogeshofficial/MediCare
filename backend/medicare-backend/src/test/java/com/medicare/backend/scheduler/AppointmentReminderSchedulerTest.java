package com.medicare.backend.scheduler;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.medicare.backend.entity.Appointment;
import com.medicare.backend.entity.Doctor;
import com.medicare.backend.entity.Patient;
import com.medicare.backend.entity.User;
import com.medicare.backend.repository.AppointmentRepository;
import com.medicare.backend.repository.DoctorRepository;
import com.medicare.backend.repository.NotificationRepository;
import com.medicare.backend.repository.PatientRepository;
import com.medicare.backend.repository.UserRepository;
import com.medicare.backend.service.NotificationService;

class AppointmentReminderSchedulerTest {

    private AppointmentRepository appointmentRepository;
    private DoctorRepository doctorRepository;
    private PatientRepository patientRepository;
    private UserRepository userRepository;
    private NotificationRepository notificationRepository;
    private NotificationService notificationService;

    private AppointmentReminderScheduler scheduler;

    @BeforeEach
    void setUp() {
        appointmentRepository = mock(AppointmentRepository.class);
        doctorRepository = mock(DoctorRepository.class);
        patientRepository = mock(PatientRepository.class);
        userRepository = mock(UserRepository.class);
        notificationRepository = mock(NotificationRepository.class);
        notificationService = mock(NotificationService.class);

        scheduler = new AppointmentReminderScheduler(
                appointmentRepository,
                doctorRepository,
                patientRepository,
                userRepository,
                notificationRepository,
                notificationService
        );
    }

    @Test
    @DisplayName("Reminder scheduler: Sends reminders with schedule-versioned idempotency keys for CONFIRMED appointments")
    void testProcessUpcomingAppointmentReminders_ConfirmedAppointments() {
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        LocalTime time = LocalTime.of(14, 30);

        Appointment appt = new Appointment();
        appt.setAppointmentId(200L);
        appt.setPatientId(10L);
        appt.setDoctorId(20L);
        appt.setAppointmentDate(tomorrow);
        appt.setAppointmentTime(time);
        appt.setStatus("CONFIRMED");
        appt.setQueueNumber(3);

        Patient patient = new Patient();
        patient.setPatientId(10L);
        patient.setUserId(1L);

        Doctor doctor = new Doctor();
        doctor.setDoctorId(20L);
        doctor.setUserId(2L);

        User patientUser = new User();
        patientUser.setUserId(1L);
        patientUser.setFullName("Alice Johnson");

        User doctorUser = new User();
        doctorUser.setUserId(2L);
        doctorUser.setFullName("Gregory House");

        when(appointmentRepository.findByAppointmentDateAndStatus(tomorrow, "CONFIRMED"))
                .thenReturn(List.of(appt));
        when(appointmentRepository.findByAppointmentDateAndStatus(LocalDate.now(), "CONFIRMED"))
                .thenReturn(List.of());

        when(patientRepository.findById(10L)).thenReturn(Optional.of(patient));
        when(doctorRepository.findById(20L)).thenReturn(Optional.of(doctor));
        when(userRepository.findById(1L)).thenReturn(Optional.of(patientUser));
        when(userRepository.findById(2L)).thenReturn(Optional.of(doctorUser));

        scheduler.processUpcomingAppointmentReminders();

        // Verify patient reminder called with dedup_key containing appointmentId, date, time, and userId
        String expectedPatientDedup = "REMINDER:APPT:200:DATE:" + tomorrow + ":TIME:" + time + ":USER:1";
        verify(notificationService).createNotificationSafely(
                eq(1L),
                eq("Upcoming Appointment Reminder"),
                contains("Queue #3"),
                eq("APPOINTMENT_REMINDER"),
                eq(200L),
                any(),
                eq("APPOINTMENT"),
                eq("IMPORTANT"),
                eq("/patient/dashboard"),
                eq(expectedPatientDedup)
        );

        // Verify doctor reminder called with doctor dedup_key
        String expectedDoctorDedup = "REMINDER:APPT:200:DATE:" + tomorrow + ":TIME:" + time + ":USER:2";
        verify(notificationService).createNotificationSafely(
                eq(2L),
                eq("Upcoming Consultation Reminder"),
                contains("Alice Johnson"),
                eq("APPOINTMENT_REMINDER"),
                eq(200L),
                any(),
                eq("APPOINTMENT"),
                eq("IMPORTANT"),
                eq("/doctor/appointments"),
                eq(expectedDoctorDedup)
        );
    }

    @Test
    @DisplayName("Reminder scheduler: Non-confirmed (cancelled, pending, rejected) appointments are skipped")
    void testProcessUpcomingAppointmentReminders_SkipsNonConfirmed() {
        LocalDate tomorrow = LocalDate.now().plusDays(1);

        Appointment cancelled = new Appointment();
        cancelled.setAppointmentId(201L);
        cancelled.setStatus("CANCELLED");

        when(appointmentRepository.findByAppointmentDateAndStatus(tomorrow, "CONFIRMED"))
                .thenReturn(List.of(cancelled));

        scheduler.processUpcomingAppointmentReminders();

        verify(notificationService, never()).createNotificationSafely(
                any(), anyString(), anyString(), anyString(), any(), any(), anyString(), anyString(), anyString(), anyString()
        );
    }
}
