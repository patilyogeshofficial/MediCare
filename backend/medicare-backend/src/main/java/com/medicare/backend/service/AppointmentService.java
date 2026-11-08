
package com.medicare.backend.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.medicare.backend.dto.AppointmentRequestDTO;
import com.medicare.backend.dto.AppointmentResponseDTO;
import com.medicare.backend.entity.Appointment;
import com.medicare.backend.entity.Patient;
import com.medicare.backend.entity.User;
import com.medicare.backend.repository.AppointmentRepository;
import com.medicare.backend.repository.DoctorRepository;
import com.medicare.backend.repository.PatientRepository;
import com.medicare.backend.repository.UserRepository;

@Service
public class AppointmentService {

    private final UserRepository userRepository;
    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final NotificationService notificationService;

    private static final List<String> ACTIVE_STATUSES =
            List.of("PENDING", "CONFIRMED");

    private static final List<String> VALID_STATUSES =
            List.of("PENDING", "CONFIRMED", "REJECTED",
                    "CANCELLED", "COMPLETED");

    public AppointmentService(
            AppointmentRepository appointmentRepository,
            PatientRepository patientRepository,
            DoctorRepository doctorRepository,
            UserRepository userRepository,
            NotificationService notificationService) {

        this.appointmentRepository = appointmentRepository;
        this.patientRepository = patientRepository;
        this.doctorRepository = doctorRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    // Get appointments of the currently logged-in doctor
    public List<AppointmentResponseDTO> getMyAppointments(String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User not found"));

        var doctor = doctorRepository.findByUserId(user.getUserId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Doctor profile not found"));

        return appointmentRepository.findByDoctorId(doctor.getDoctorId())
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

    // Get appointments of the currently logged-in patient
    public List<AppointmentResponseDTO> getMyPatientAppointments(
            String email) {

        User user = userRepository.findByEmail(
                email.trim().toLowerCase())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User not found"));

        Patient patient = patientRepository.findByUserId(user.getUserId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Patient profile not found"));

        return appointmentRepository.findByPatientId(patient.getPatientId())
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

    // Get all appointments
    public List<AppointmentResponseDTO> getAllAppointments() {

        return appointmentRepository.findAll()
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

    // Get appointment by ID
    public AppointmentResponseDTO getAppointmentById(Long appointmentId) {

        Appointment appointment = findAppointment(appointmentId);

        return convertToDTO(appointment);
    }

    // Get appointments by patient ID
    public List<AppointmentResponseDTO> getAppointmentsByPatientId(
            Long patientId) {

        if (!patientRepository.existsById(patientId)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Patient not found");
        }

        return appointmentRepository.findByPatientId(patientId)
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

    // Get appointments by doctor ID
    public List<AppointmentResponseDTO> getAppointmentsByDoctorId(
            Long doctorId) {

        if (!doctorRepository.existsById(doctorId)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Doctor not found");
        }

        return appointmentRepository.findByDoctorId(doctorId)
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

    // Book a new appointment
    @Transactional
    public AppointmentResponseDTO createAppointment(
            AppointmentRequestDTO dto,
            String authenticatedEmail) {

        User user = userRepository.findByEmail(
                authenticatedEmail.trim().toLowerCase())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User not found"));

        Patient patient = patientRepository.findByUserId(user.getUserId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Patient profile not found"));

        Long patientId = patient.getPatientId();

        if (!doctorRepository.existsById(dto.getDoctorId())) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Doctor not found");
        }

        validateAppointmentDateTime(
                dto.getAppointmentDate(),
                dto.getAppointmentTime());

        validateScheduleConflict(
                patientId,
                dto.getDoctorId(),
                dto.getAppointmentDate(),
                dto.getAppointmentTime(),
                null);

        Appointment appointment = new Appointment();

        appointment.setPatientId(patientId);
        appointment.setDoctorId(dto.getDoctorId());
        appointment.setAppointmentDate(dto.getAppointmentDate());
        appointment.setAppointmentTime(dto.getAppointmentTime());
        appointment.setReason(dto.getReason());
        appointment.setStatus("PENDING");

        Appointment savedAppointment =
                appointmentRepository.save(appointment);

        // Existing patient notification
        notificationService.createNotification(
                user.getUserId(),
                "Appointment Booked",
                "Your appointment has been successfully booked and is awaiting confirmation.",
                "APPOINTMENT_BOOKED",
                savedAppointment.getAppointmentId(),
                null
        );

        // Admin activity notification
        notificationService.createAdminActivityNotification(
                "New Appointment Booked",
                "A new appointment has been booked and is awaiting confirmation.",
                "NEW_APPOINTMENT",
                savedAppointment.getAppointmentId(),
                null
        );

        return convertToDTO(savedAppointment);
    }

    // Update appointment details
    public AppointmentResponseDTO updateAppointment(
            Long appointmentId,
            AppointmentRequestDTO dto) {

        Appointment appointment = findAppointment(appointmentId);

        validatePatientAndDoctor(dto);

        validateAppointmentDateTime(
                dto.getAppointmentDate(),
                dto.getAppointmentTime());

        if (ACTIVE_STATUSES.contains(appointment.getStatus())) {

            validateScheduleConflict(
                    dto.getPatientId(),
                    dto.getDoctorId(),
                    dto.getAppointmentDate(),
                    dto.getAppointmentTime(),
                    appointmentId);
        }

        appointment.setPatientId(dto.getPatientId());
        appointment.setDoctorId(dto.getDoctorId());
        appointment.setAppointmentDate(dto.getAppointmentDate());
        appointment.setAppointmentTime(dto.getAppointmentTime());
        appointment.setReason(dto.getReason());

        Appointment updatedAppointment =
                appointmentRepository.save(appointment);

        return convertToDTO(updatedAppointment);
    }

    // Update appointment status
    @Transactional
    public AppointmentResponseDTO updateAppointmentStatus(
            Long appointmentId,
            String status) {

        Appointment appointment = findAppointment(appointmentId);

        if (status == null || !VALID_STATUSES.contains(status)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid appointment status");
        }

        if (ACTIVE_STATUSES.contains(status)
                && !ACTIVE_STATUSES.contains(appointment.getStatus())) {

            validateScheduleConflict(
                    appointment.getPatientId(),
                    appointment.getDoctorId(),
                    appointment.getAppointmentDate(),
                    appointment.getAppointmentTime(),
                    appointmentId);
        }

        String previousStatus = appointment.getStatus();

        appointment.setStatus(status);

        Appointment updatedAppointment =
                appointmentRepository.save(appointment);

        // Notify patient only when appointment status changes
        if (!status.equals(previousStatus)) {

            Patient patient = patientRepository
                    .findById(appointment.getPatientId())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND, "Patient not found"));

            String title;
            String message;
            String notificationType = null;

            switch (status) {

                case "CONFIRMED":
                    title = "Appointment Confirmed";
                    message = "Your appointment has been confirmed.";
                    notificationType = "APPOINTMENT_CONFIRMED";
                    break;

                case "REJECTED":
                    title = "Appointment Rejected";
                    message = "Your appointment request has been rejected.";
                    notificationType = "APPOINTMENT_REJECTED";
                    break;

                case "CANCELLED":
                    title = "Appointment Cancelled";
                    message = "Your appointment has been cancelled.";
                    notificationType = "APPOINTMENT_CANCELLED";
                    break;

                case "COMPLETED":
                    title = "Appointment Completed";
                    message = "Your appointment has been marked as completed.";
                    break;

                default:
                    title = "Appointment Updated";
                    message = "Your appointment status has been updated to "
                            + status + ".";
            }

            if (notificationType != null) {
                notificationService.createNotification(
                        patient.getUserId(),
                        title,
                        message,
                        notificationType,
                        updatedAppointment.getAppointmentId(),
                        null
                );
            }
        }

        return convertToDTO(updatedAppointment);
    }

    // Cancel appointment for the currently logged-in patient
    @Transactional
    public AppointmentResponseDTO cancelMyAppointment(
            Long appointmentId,
            String authenticatedEmail) {

        User user = userRepository.findByEmail(
                authenticatedEmail.trim().toLowerCase())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User not found"));

        Patient patient = patientRepository.findByUserId(user.getUserId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Patient profile not found"));

        Appointment appointment = findAppointment(appointmentId);

        if (!appointment.getPatientId().equals(patient.getPatientId())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You are not allowed to cancel this appointment");
        }

        if (!ACTIVE_STATUSES.contains(appointment.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Only pending or confirmed appointments can be cancelled");
        }

        appointment.setStatus("CANCELLED");

        Appointment updatedAppointment =
                appointmentRepository.save(appointment);

        // Notify patient about cancellation
        notificationService.createNotification(
                user.getUserId(),
                "Appointment Cancelled",
                "Your appointment has been successfully cancelled.",
                "APPOINTMENT_CANCELLED",
                updatedAppointment.getAppointmentId(),
                null
        );

        return convertToDTO(updatedAppointment);
    }

    // Delete appointment
    @Transactional
    public void deleteAppointment(Long appointmentId) {

        Appointment appointment = findAppointment(appointmentId);

        try {
            appointmentRepository.delete(appointment);
            appointmentRepository.flush();

        } catch (DataIntegrityViolationException exception) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Cannot delete appointment because it has associated records");
        }
    }

    // Find appointment or return 404
    private Appointment findAppointment(Long appointmentId) {

        return appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Appointment not found"));
    }

    // Validate patient and doctor
    private void validatePatientAndDoctor(
            AppointmentRequestDTO dto) {

        if (!patientRepository.existsById(dto.getPatientId())) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Patient not found");
        }

        if (!doctorRepository.existsById(dto.getDoctorId())) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Doctor not found");
        }
    }

    // Validate appointment date and time
    private void validateAppointmentDateTime(
            java.time.LocalDate date,
            java.time.LocalTime time) {

        LocalDateTime appointmentDateTime =
                LocalDateTime.of(date, time);

        if (appointmentDateTime.isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Appointment date and time cannot be in the past");
        }
    }

    // Check doctor and patient scheduling conflicts
    private void validateScheduleConflict(
            Long patientId,
            Long doctorId,
            java.time.LocalDate date,
            java.time.LocalTime time,
            Long appointmentId) {

        boolean doctorConflict;
        boolean patientConflict;

        if (appointmentId == null) {

            doctorConflict =
                    appointmentRepository
                    .existsByDoctorIdAndAppointmentDateAndAppointmentTimeAndStatusIn(
                            doctorId, date, time, ACTIVE_STATUSES);

            patientConflict =
                    appointmentRepository
                    .existsByPatientIdAndAppointmentDateAndAppointmentTimeAndStatusIn(
                            patientId, date, time, ACTIVE_STATUSES);

        } else {

            doctorConflict =
                    appointmentRepository
                    .existsByDoctorIdAndAppointmentDateAndAppointmentTimeAndStatusInAndAppointmentIdNot(
                            doctorId, date, time, ACTIVE_STATUSES, appointmentId);

            patientConflict =
                    appointmentRepository
                    .existsByPatientIdAndAppointmentDateAndAppointmentTimeAndStatusInAndAppointmentIdNot(
                            patientId, date, time, ACTIVE_STATUSES, appointmentId);
        }

        if (doctorConflict) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Doctor already has an appointment at this time");
        }

        if (patientConflict) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Patient already has an appointment at this time");
        }
    }

    // Convert Entity into Response DTO
    private AppointmentResponseDTO convertToDTO(
            Appointment appointment) {

        return new AppointmentResponseDTO(
                appointment.getAppointmentId(),
                appointment.getPatientId(),
                appointment.getDoctorId(),
                appointment.getAppointmentDate(),
                appointment.getAppointmentTime(),
                appointment.getReason(),
                appointment.getStatus(),
                appointment.getCreatedAt(),
                appointment.getUpdatedAt());
    }
}
