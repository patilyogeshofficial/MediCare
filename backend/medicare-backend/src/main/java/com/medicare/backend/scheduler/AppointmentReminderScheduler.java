package com.medicare.backend.scheduler;

import java.time.LocalDate;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

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

@Component
public class AppointmentReminderScheduler {

    private static final Logger logger = LoggerFactory.getLogger(AppointmentReminderScheduler.class);
    private static final String REMINDER_TYPE = "APPOINTMENT_REMINDER";

    private final AppointmentRepository appointmentRepository;
    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final NotificationService notificationService;

    public AppointmentReminderScheduler(
            AppointmentRepository appointmentRepository,
            DoctorRepository doctorRepository,
            PatientRepository patientRepository,
            UserRepository userRepository,
            NotificationRepository notificationRepository,
            NotificationService notificationService) {

        this.appointmentRepository = appointmentRepository;
        this.doctorRepository = doctorRepository;
        this.patientRepository = patientRepository;
        this.userRepository = userRepository;
        this.notificationRepository = notificationRepository;
        this.notificationService = notificationService;
    }

    /**
     * Runs periodically to send appointment reminders for upcoming CONFIRMED appointments.
     * Evaluates appointments scheduled for tomorrow and today.
     * Cancels/rejects/completed appointments are strictly skipped.
     * Deduplication ensures each reminder is created exactly once per user per appointment.
     */
    @Scheduled(cron = "0 0 * * * *") // Every hour on the hour
    @Transactional
    public void processUpcomingAppointmentReminders() {
        LocalDate today = LocalDate.now();
        LocalDate tomorrow = today.plusDays(1);

        logger.debug("Checking upcoming confirmed appointment reminders for {} and {}", today, tomorrow);

        sendRemindersForDate(tomorrow, "tomorrow");
        sendRemindersForDate(today, "today");
    }

    private void sendRemindersForDate(LocalDate date, String label) {
        List<Appointment> confirmedAppointments =
                appointmentRepository.findByAppointmentDateAndStatus(date, "CONFIRMED");

        for (Appointment appointment : confirmedAppointments) {
            // Strict defense: skip if appointment is not CONFIRMED
            if (!"CONFIRMED".equalsIgnoreCase(appointment.getStatus())) {
                continue;
            }

            Long appointmentId = appointment.getAppointmentId();

            // 1. Process Patient Reminder
            Patient patient = patientRepository.findById(appointment.getPatientId()).orElse(null);
            Doctor doctor = doctorRepository.findById(appointment.getDoctorId()).orElse(null);

            String doctorName = "your doctor";
            if (doctor != null) {
                User doctorUser = userRepository.findById(doctor.getUserId()).orElse(null);
                if (doctorUser != null && doctorUser.getFullName() != null) {
                    doctorName = "Dr. " + doctorUser.getFullName();
                }
            }

            String patientName = "the patient";
            if (patient != null) {
                User patientUser = userRepository.findById(patient.getUserId()).orElse(null);
                if (patientUser != null && patientUser.getFullName() != null) {
                    patientName = patientUser.getFullName();
                }

                // Database-enforced idempotency key (includes date and time so rescheduled appointments receive fresh reminders)
                String patientDedupKey = "REMINDER:APPT:" + appointmentId + ":DATE:" + appointment.getAppointmentDate() + ":TIME:" + appointment.getAppointmentTime() + ":USER:" + patient.getUserId();

                String queueInfo = appointment.getQueueNumber() != null ? " (Queue #" + appointment.getQueueNumber() + ")" : "";
                String message = "Reminder: You have a confirmed consultation with " + doctorName + " " + label +
                        " (" + appointment.getAppointmentDate() + ") at " + appointment.getAppointmentTime() + queueInfo + ".";

                notificationService.createNotificationSafely(
                        patient.getUserId(),
                        "Upcoming Appointment Reminder",
                        message,
                        REMINDER_TYPE,
                        appointmentId,
                        null,
                        "APPOINTMENT",
                        "IMPORTANT",
                        "/patient/dashboard",
                        patientDedupKey
                );
            }

            // 2. Process Doctor Reminder
            if (doctor != null) {
                // Database-enforced idempotency key (includes date and time so rescheduled appointments receive fresh reminders)
                String doctorDedupKey = "REMINDER:APPT:" + appointmentId + ":DATE:" + appointment.getAppointmentDate() + ":TIME:" + appointment.getAppointmentTime() + ":USER:" + doctor.getUserId();

                String queueInfo = appointment.getQueueNumber() != null ? " (Queue #" + appointment.getQueueNumber() + ")" : "";
                String message = "Reminder: You have a scheduled consultation with " + patientName + " " + label +
                        " (" + appointment.getAppointmentDate() + ") at " + appointment.getAppointmentTime() + queueInfo + ".";

                notificationService.createNotificationSafely(
                        doctor.getUserId(),
                        "Upcoming Consultation Reminder",
                        message,
                        REMINDER_TYPE,
                        appointmentId,
                        null,
                        "APPOINTMENT",
                        "IMPORTANT",
                        "/doctor/appointments",
                        doctorDedupKey
                );
            }
        }
    }
}
