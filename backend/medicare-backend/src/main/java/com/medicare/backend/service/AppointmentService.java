
package com.medicare.backend.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.medicare.backend.dto.AppointmentRequestDTO;
import com.medicare.backend.dto.AppointmentResponseDTO;
import com.medicare.backend.dto.DoctorPatientResponseDTO;
import com.medicare.backend.entity.Appointment;
import com.medicare.backend.entity.Doctor;
import com.medicare.backend.entity.Patient;
import com.medicare.backend.entity.User;
import com.medicare.backend.repository.AppointmentRepository;
import com.medicare.backend.repository.DoctorRepository;
import com.medicare.backend.repository.PatientRepository;
import com.medicare.backend.repository.PrescriptionRepository;
import com.medicare.backend.repository.UserRepository;

@Service
public class AppointmentService {

    private final UserRepository userRepository;
    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final NotificationService notificationService;
    private final PrescriptionRepository prescriptionRepository;

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
            NotificationService notificationService,
            PrescriptionRepository prescriptionRepository) {

        this.appointmentRepository = appointmentRepository;
        this.patientRepository = patientRepository;
        this.doctorRepository = doctorRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.prescriptionRepository = prescriptionRepository;
    }

    // Get appointments of the currently logged-in doctor
    public List<AppointmentResponseDTO> getMyAppointments(String email) {

        User user = userRepository.findByEmail(
                email.trim().toLowerCase(Locale.ROOT))
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User not found"));

        Doctor doctor = doctorRepository.findByUserId(user.getUserId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Doctor profile not found"));

        return appointmentRepository.findByDoctorId(doctor.getDoctorId())
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

    // Get unique patients assigned to the currently logged-in doctor
    public List<DoctorPatientResponseDTO> getMyPatients(String email) {

        User user = userRepository.findByEmail(
                email.trim().toLowerCase(Locale.ROOT))
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User not found"));

        Doctor doctor = doctorRepository.findByUserId(user.getUserId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Doctor profile not found"));

        List<Appointment> appointments =
                appointmentRepository.findByDoctorId(doctor.getDoctorId());

        Map<Long, List<Appointment>> patientAppointments =
                new LinkedHashMap<>();

        for (Appointment appointment : appointments) {
            patientAppointments
                    .computeIfAbsent(
                            appointment.getPatientId(),
                            key -> new ArrayList<>())
                    .add(appointment);
        }

        List<DoctorPatientResponseDTO> result = new ArrayList<>();

        for (Map.Entry<Long, List<Appointment>> entry
                : patientAppointments.entrySet()) {

            Patient patient = patientRepository.findById(entry.getKey())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND, "Patient not found"));

            User patientUser = userRepository.findById(patient.getUserId())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND, "Patient user not found"));

            Appointment latestAppointment = entry.getValue()
                    .stream()
                    .max(Comparator
                            .comparing(Appointment::getAppointmentDate)
                            .thenComparing(Appointment::getAppointmentTime))
                    .orElseThrow();

            result.add(new DoctorPatientResponseDTO(
                    patient.getPatientId(),
                    patientUser.getFullName(),
                    patientUser.getEmail(),
                    patient.getDateOfBirth(),
                    patient.getGender(),
                    patient.getPhone(),
                    patient.getAddress(),
                    patient.getBloodGroup(),
                    latestAppointment.getAppointmentDate(),
                    (long) entry.getValue().size(),
                    latestAppointment.getReason()
            ));
        }

        return result;
    }

    // Get appointments of the currently logged-in patient
    public List<AppointmentResponseDTO> getMyPatientAppointments(
            String email) {

        User user = userRepository.findByEmail(
                email.trim().toLowerCase(Locale.ROOT))
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
                authenticatedEmail.trim().toLowerCase(Locale.ROOT))
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User not found"));

        Patient patient = patientRepository.findByUserId(user.getUserId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Patient profile not found"));

        // Always derive patient ID from the authenticated account.
        Long patientId = patient.getPatientId();

        // Check that the doctor exists and their account is active.
        Doctor selectedDoctor = doctorRepository.findById(dto.getDoctorId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Doctor not found"));

        User doctorUser = userRepository.findById(selectedDoctor.getUserId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Doctor account not found"));

        if (!Boolean.TRUE.equals(doctorUser.getIsActive())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This doctor is currently unavailable for appointments");
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

        // Notify patient
        notificationService.createNotification(
                user.getUserId(),
                "Appointment Booked",
                "Your appointment has been successfully booked and is awaiting confirmation.",
                "APPOINTMENT_BOOKED",
                savedAppointment.getAppointmentId(),
                null
        );

        // Notify selected doctor
        notificationService.createNotification(
                selectedDoctor.getUserId(),
                "New Appointment Request",
                "You have received a new appointment request. Please review and respond.",
                "NEW_APPOINTMENT",
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

    // Update appointment details (Admin)
    @Transactional
    public AppointmentResponseDTO updateAppointment(
            Long appointmentId,
            AppointmentRequestDTO dto) {

        Appointment appointment = findAppointment(appointmentId);

        // Patient ID is mandatory for admin updates.
        if (dto.getPatientId() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Patient ID is required");
        }

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

    // Update appointment status (Admin)
    @Transactional
    public AppointmentResponseDTO updateAppointmentStatus(
            Long appointmentId,
            String status) {

        status = normalizeAndValidateStatus(status);

        Appointment appointment = findAppointment(appointmentId);

        String previousStatus = appointment.getStatus();

        // Protect completed appointments that have prescriptions.
        boolean hasPrescription =
                prescriptionRepository.existsByAppointmentId(appointmentId);

        if ("COMPLETED".equalsIgnoreCase(previousStatus)
                && hasPrescription
                && !previousStatus.equalsIgnoreCase(status)) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This appointment is finalized because a prescription has been issued. Its status cannot be changed.");
        }

        // Validate scheduling conflicts when reactivating an appointment.
        if (ACTIVE_STATUSES.contains(status)
                && !ACTIVE_STATUSES.contains(previousStatus)) {

            validateScheduleConflict(
                    appointment.getPatientId(),
                    appointment.getDoctorId(),
                    appointment.getAppointmentDate(),
                    appointment.getAppointmentTime(),
                    appointmentId);
        }

        appointment.setStatus(status);

        Appointment updatedAppointment =
                appointmentRepository.save(appointment);

        // Notify patient only when appointment status changes.
        if (!status.equals(previousStatus)) {

            Patient patient = patientRepository
                    .findById(appointment.getPatientId())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND,
                            "Patient not found"));

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
                    break;
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

    // Update appointment status by the assigned doctor only
    @Transactional
    public AppointmentResponseDTO updateAppointmentStatusByDoctor(
            Long appointmentId,
            String status,
            String authenticatedEmail) {

        status = normalizeAndValidateStatus(status);

        User user = userRepository.findByEmail(
                authenticatedEmail.trim().toLowerCase(Locale.ROOT))
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User not found"));

        if (!Boolean.TRUE.equals(user.getIsActive())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Your doctor account is deactivated by the administrator.");
        }

        Doctor doctor = doctorRepository.findByUserId(user.getUserId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Doctor profile not found"));

        Appointment appointment = findAppointment(appointmentId);

        // Verify appointment ownership.
        if (!appointment.getDoctorId().equals(doctor.getDoctorId())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You are not allowed to update this appointment");
        }

        String currentStatus = appointment.getStatus();

        if (currentStatus == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid current appointment status");
        }

        // Allow only valid doctor status transitions.
        switch (currentStatus) {

            case "PENDING":
                if (!status.equals("CONFIRMED")
                        && !status.equals("REJECTED")) {

                    throw new ResponseStatusException(
                            HttpStatus.BAD_REQUEST,
                            "Pending appointments can only be confirmed or rejected");
                }
                break;

            case "CONFIRMED":
                if (!status.equals("COMPLETED")) {

                    throw new ResponseStatusException(
                            HttpStatus.BAD_REQUEST,
                            "Confirmed appointments can only be completed");
                }
                break;

            case "COMPLETED":
            case "CANCELLED":
            case "REJECTED":
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "This appointment can no longer be updated by the doctor");

            default:
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Invalid current appointment status");
        }

        return updateAppointmentStatus(appointmentId, status);
    }

    // Cancel appointment for the currently logged-in patient
    @Transactional
    public AppointmentResponseDTO cancelMyAppointment(
            Long appointmentId,
            String authenticatedEmail) {

        User user = userRepository.findByEmail(
                authenticatedEmail.trim().toLowerCase(Locale.ROOT))
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User not found"));

        Patient patient = patientRepository.findByUserId(user.getUserId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Patient profile not found"));

        Appointment appointment = findAppointment(appointmentId);

        // Verify patient ownership.
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

        // Notify patient about cancellation.
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

    // Validate and normalize appointment status
    private String normalizeAndValidateStatus(String status) {

        if (status == null || status.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Appointment status is required");
        }

        String normalizedStatus =
                status.trim().toUpperCase(Locale.ROOT);

        if (!VALID_STATUSES.contains(normalizedStatus)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid appointment status");
        }

        return normalizedStatus;
    }

    // Validate patient and doctor
    private void validatePatientAndDoctor(
            AppointmentRequestDTO dto) {

        if (dto.getPatientId() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Patient ID is required");
        }

        if (!patientRepository.existsById(dto.getPatientId())) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Patient not found");
        }

        if (dto.getDoctorId() == null
                || !doctorRepository.existsById(dto.getDoctorId())) {

            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Doctor not found");
        }
    }

    // Validate appointment date and time
    private void validateAppointmentDateTime(
            java.time.LocalDate date,
            java.time.LocalTime time) {

        if (date == null || time == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Appointment date and time are required");
        }

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
