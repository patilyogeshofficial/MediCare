package com.medicare.backend.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.OffsetDateTime;
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
import com.medicare.backend.dto.AvailableSlotDTO;
import com.medicare.backend.dto.DoctorPatientResponseDTO;
import com.medicare.backend.dto.RescheduleRequestDTO;
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

@Service
public class AppointmentService {

    private final UserRepository userRepository;
    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final NotificationService notificationService;
    private final PrescriptionRepository prescriptionRepository;
    private final AuditLogService auditLogService;
    private final DoctorAvailabilityRepository doctorAvailabilityRepository;

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
            PrescriptionRepository prescriptionRepository,
            AuditLogService auditLogService,
            DoctorAvailabilityRepository doctorAvailabilityRepository) {

        this.appointmentRepository = appointmentRepository;
        this.patientRepository = patientRepository;
        this.doctorRepository = doctorRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.prescriptionRepository = prescriptionRepository;
        this.auditLogService = auditLogService;
        this.doctorAvailabilityRepository = doctorAvailabilityRepository;
    }

    // =========================================================================
    // POSTGRESQL TRANSACTION-LEVEL ADVISORY LOCKING & INTERVAL LOGIC
    // =========================================================================

    private void lockDoctorAndDate(Long doctorId, LocalDate date) {
        if (doctorId != null && date != null) {
            String lockKey = "doc_" + doctorId + "_" + date.toString();
            appointmentRepository.acquireAdvisoryLock(lockKey);
        }
    }

    private void lockPatientAndDate(Long patientId, LocalDate date) {
        if (patientId != null && date != null) {
            String lockKey = "pat_" + patientId + "_" + date.toString();
            appointmentRepository.acquireAdvisoryLock(lockKey);
        }
    }

    private int getDoctorConsultationDuration(Long doctorId, LocalDate date) {
        if (doctorAvailabilityRepository == null || doctorId == null || date == null) return 30;
        String dayOfWeek = date.getDayOfWeek().name();
        return doctorAvailabilityRepository.findByDoctorId(doctorId).stream()
                .filter(a -> dayOfWeek.equalsIgnoreCase(a.getDayOfWeek()))
                .findFirst()
                .map(DoctorAvailability::getConsultationDuration)
                .filter(d -> d != null && d > 0)
                .orElse(30);
    }

    private boolean intervalsOverlap(LocalTime start1, LocalTime end1, LocalTime start2, LocalTime end2) {
        return start1.isBefore(end2) && end1.isAfter(start2);
    }

    // Strict Interval Conflict Validator for both Doctor and Patient
    private void validateIntervalConflict(
            Long patientId,
            Long doctorId,
            LocalDate date,
            LocalTime requestedTime,
            Long excludeAppointmentId) {

        int duration = getDoctorConsultationDuration(doctorId, date);
        LocalTime requestedEnd = requestedTime.plusMinutes(duration);
        OffsetDateTime now = OffsetDateTime.now();

        // 1. Doctor interval overlap verification
        List<Appointment> doctorAppts = appointmentRepository.findActiveByDoctorIdAndDate(doctorId, date, now);
        for (Appointment appt : doctorAppts) {
            if (excludeAppointmentId != null && appt.getAppointmentId().equals(excludeAppointmentId)) {
                continue;
            }
            int existingDuration = getDoctorConsultationDuration(doctorId, date);
            LocalTime existingStart = appt.getAppointmentTime();
            LocalTime existingEnd = existingStart.plusMinutes(existingDuration);

            if (intervalsOverlap(requestedTime, requestedEnd, existingStart, existingEnd)) {
                String apptType = "CONFIRMED".equalsIgnoreCase(appt.getStatus()) ? "confirmed appointment" : "active pending hold";
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Doctor already has a " + apptType + " during this time interval (" +
                                existingStart + " - " + existingEnd + "). Overlapping bookings are strictly prohibited."
                );
            }
        }

        // 2. Patient interval overlap verification (across any doctor on the same date)
        if (patientId != null) {
            List<Appointment> patientAppts = appointmentRepository.findActiveByPatientIdAndDate(patientId, date, now);
            for (Appointment appt : patientAppts) {
                if (excludeAppointmentId != null && appt.getAppointmentId().equals(excludeAppointmentId)) {
                    continue;
                }
                int existingDuration = getDoctorConsultationDuration(appt.getDoctorId(), date);
                LocalTime existingStart = appt.getAppointmentTime();
                LocalTime existingEnd = existingStart.plusMinutes(existingDuration);

                if (intervalsOverlap(requestedTime, requestedEnd, existingStart, existingEnd)) {
                    String apptType = "CONFIRMED".equalsIgnoreCase(appt.getStatus()) ? "confirmed appointment" : "active pending hold";
                    throw new ResponseStatusException(
                            HttpStatus.CONFLICT,
                            "You already have a " + apptType + " during this time interval (" +
                                    existingStart + " - " + existingEnd + "). Overlapping bookings are strictly prohibited."
                    );
                }
            }
        }
    }

    // =========================================================================
    // HOLD EXPIRATION CLEANUP
    // =========================================================================

    @Transactional
    public void cleanupExpiredHolds() {
        OffsetDateTime now = OffsetDateTime.now();
        List<Appointment> expired = appointmentRepository.findExpiredPendingHolds(now);
        for (Appointment appt : expired) {
            appt.setStatus("CANCELLED");
            appt.setCancellationReason("Pending slot reservation expired after 15 minutes");
            appointmentRepository.save(appt);
            auditLogService.log(
                    "APPOINTMENT",
                    appt.getAppointmentId(),
                    "HOLD_EXPIRED",
                    "SYSTEM",
                    "SYSTEM",
                    "15-minute pending hold expired. Slot automatically released.",
                    "127.0.0.1"
            );
        }
    }

    // =========================================================================
    // DYNAMIC APPOINTMENT SLOTS
    // =========================================================================

    public List<AvailableSlotDTO> getAvailableSlots(Long doctorId, LocalDate date) {
        cleanupExpiredHolds();

        if (doctorId == null || date == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Doctor ID and date are required");
        }

        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Doctor not found"));

        User doctorUser = userRepository.findById(doctor.getUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Doctor account not found"));

        if (!Boolean.TRUE.equals(doctorUser.getIsActive())) {
            return List.of();
        }

        String dayOfWeek = date.getDayOfWeek().name();
        List<DoctorAvailability> availList = doctorAvailabilityRepository != null
                ? doctorAvailabilityRepository.findByDoctorId(doctorId)
                : List.of();

        DoctorAvailability availability = availList.stream()
                .filter(a -> dayOfWeek.equalsIgnoreCase(a.getDayOfWeek()))
                .findFirst()
                .orElse(null);

        // Fallback default schedule (09:00 - 17:00, Mon-Sat) if no custom availability entered yet
        LocalTime start;
        LocalTime end;
        LocalTime breakStart;
        LocalTime breakEnd;
        int duration = 30;

        if (availability == null) {
            if ("SUNDAY".equalsIgnoreCase(dayOfWeek)) {
                return List.of();
            }
            start = LocalTime.of(9, 0);
            end = LocalTime.of(17, 0);
            breakStart = LocalTime.of(13, 0);
            breakEnd = LocalTime.of(14, 0);
        } else {
            if (!Boolean.TRUE.equals(availability.getAvailable())
                    || availability.getStartTime() == null
                    || availability.getEndTime() == null) {
                return List.of();
            }
            start = availability.getStartTime();
            end = availability.getEndTime();
            breakStart = availability.getBreakStart();
            breakEnd = availability.getBreakEnd();
            duration = availability.getConsultationDuration();
        }

        if (duration <= 0) duration = 30;

        OffsetDateTime now = OffsetDateTime.now();
        List<Appointment> activeAppts = appointmentRepository.findActiveByDoctorIdAndDate(doctorId, date, now);

        LocalDate today = LocalDate.now();
        LocalTime currentTime = LocalTime.now();

        List<AvailableSlotDTO> slots = new ArrayList<>();
        LocalTime slotTime = start;

        while (!slotTime.plusMinutes(duration).isAfter(end)) {
            LocalTime slotEnd = slotTime.plusMinutes(duration);
            boolean isAvailable = true;
            String reason = "AVAILABLE";

            // Check past time
            if (date.isBefore(today) || (date.isEqual(today) && slotTime.isBefore(currentTime))) {
                isAvailable = false;
                reason = "PAST_TIME";
            }
            // Check break hours
            else if (breakStart != null && breakEnd != null && slotTime.isBefore(breakEnd) && slotEnd.isAfter(breakStart)) {
                isAvailable = false;
                reason = "DOCTOR_BREAK";
            }
            // Check existing appointments / holds with interval overlap logic
            else {
                for (Appointment appt : activeAppts) {
                    int apptDuration = getDoctorConsultationDuration(doctorId, date);
                    LocalTime apptStart = appt.getAppointmentTime();
                    LocalTime apptEnd = apptStart.plusMinutes(apptDuration);

                    if (intervalsOverlap(slotTime, slotEnd, apptStart, apptEnd)) {
                        if ("CONFIRMED".equalsIgnoreCase(appt.getStatus())) {
                            isAvailable = false;
                            reason = "BOOKED";
                            break;
                        } else if ("PENDING".equalsIgnoreCase(appt.getStatus())) {
                            if (appt.getHoldExpiresAt() != null && now.isAfter(appt.getHoldExpiresAt())) {
                                // Hold has expired
                            } else {
                                isAvailable = false;
                                reason = "RESERVED_HOLD";
                                break;
                            }
                        }
                    }
                }
            }

            slots.add(new AvailableSlotDTO(slotTime, slotEnd, isAvailable, reason));
            slotTime = slotTime.plusMinutes(duration);
        }

        return slots;
    }

    // =========================================================================
    // APPOINTMENT QUERIES
    // =========================================================================

    public List<AppointmentResponseDTO> getMyAppointments(String email) {
        cleanupExpiredHolds();

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
                    .computeIfAbsent(appointment.getPatientId(), k -> new ArrayList<>())
                    .add(appointment);
        }

        List<DoctorPatientResponseDTO> result = new ArrayList<>();

        for (Map.Entry<Long, List<Appointment>> entry : patientAppointments.entrySet()) {
            Long patientId = entry.getKey();
            List<Appointment> pAppts = entry.getValue();

            Patient patient = patientRepository.findById(patientId).orElse(null);
            if (patient == null) continue;

            User patientUser = userRepository.findById(patient.getUserId()).orElse(null);
            String patientName = patientUser != null ? patientUser.getFullName() : "Patient #" + patientId;
            String emailStr = patientUser != null ? patientUser.getEmail() : "";

            Appointment lastAppt = pAppts.stream()
                    .max(Comparator.comparing(Appointment::getAppointmentDate)
                            .thenComparing(Appointment::getAppointmentTime))
                    .orElse(null);

            DoctorPatientResponseDTO dto = new DoctorPatientResponseDTO(
                    patient.getPatientId(),
                    patientName,
                    emailStr,
                    patient.getDateOfBirth(),
                    patient.getGender(),
                    patient.getPhone(),
                    patient.getAddress(),
                    patient.getBloodGroup(),
                    lastAppt != null ? lastAppt.getAppointmentDate() : null,
                    (long) pAppts.size(),
                    ""
            );
            result.add(dto);
        }

        return result;
    }

    public List<AppointmentResponseDTO> getMyPatientAppointments(String email) {
        cleanupExpiredHolds();

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

    public List<AppointmentResponseDTO> getAllAppointments() {
        cleanupExpiredHolds();

        return appointmentRepository.findAll()
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

    public AppointmentResponseDTO getAppointmentById(Long appointmentId) {
        Appointment appointment = findAppointment(appointmentId);
        return convertToDTO(appointment);
    }

    public List<AppointmentResponseDTO> getAppointmentsByPatientId(Long patientId) {
        if (!patientRepository.existsById(patientId)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Patient not found");
        }

        return appointmentRepository.findByPatientId(patientId)
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

    public List<AppointmentResponseDTO> getAppointmentsByDoctorId(Long doctorId) {
        if (!doctorRepository.existsById(doctorId)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Doctor not found");
        }

        return appointmentRepository.findByDoctorId(doctorId)
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

    // =========================================================================
    // CREATE APPOINTMENT (WITH TRANSACTION-LEVEL ADVISORY LOCKING & INTERVAL OVERLAP)
    // =========================================================================

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

        Long patientId = patient.getPatientId();

        // 1. Acquire PostgreSQL transaction-scoped advisory locks on doctor+date and patient+date
        lockDoctorAndDate(dto.getDoctorId(), dto.getAppointmentDate());
        lockPatientAndDate(patientId, dto.getAppointmentDate());

        cleanupExpiredHolds();

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

        // 2. Validate strict interval conflict against doctor and patient active appointments
        validateIntervalConflict(
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
        // 15-minute temporary reservation hold
        appointment.setHoldExpiresAt(OffsetDateTime.now().plusMinutes(15));

        Appointment savedAppointment = appointmentRepository.save(appointment);

        // Audit Logging for hold creation
        auditLogService.log(
                "APPOINTMENT",
                savedAppointment.getAppointmentId(),
                "APPOINTMENT_HOLD_CREATED",
                authenticatedEmail,
                "PATIENT",
                "15-minute temporary hold placed on " + savedAppointment.getAppointmentDate() +
                        " at " + savedAppointment.getAppointmentTime(),
                "127.0.0.1"
        );

        // Notifications
        notificationService.createNotification(
                user.getUserId(),
                "Appointment Hold Created",
                "Your appointment slot is held under PENDING status for 15 minutes awaiting confirmation.",
                "APPOINTMENT_BOOKED",
                savedAppointment.getAppointmentId(),
                null
        );

        notificationService.createNotification(
                selectedDoctor.getUserId(),
                "New Appointment Request",
                "You have received a new appointment request for " + savedAppointment.getAppointmentDate() +
                        " at " + savedAppointment.getAppointmentTime() + ".",
                "NEW_APPOINTMENT",
                savedAppointment.getAppointmentId(),
                null
        );

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

        lockDoctorAndDate(dto.getDoctorId(), dto.getAppointmentDate());
        lockPatientAndDate(dto.getPatientId(), dto.getAppointmentDate());

        cleanupExpiredHolds();

        Appointment appointment = findAppointment(appointmentId);

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
            validateIntervalConflict(
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

        Appointment updatedAppointment = appointmentRepository.save(appointment);

        return convertToDTO(updatedAppointment);
    }

    // Strict State Machine Validator
    private void validateStrictStateTransition(String currentStatus, String targetStatus, boolean isAdmin, boolean isDoctor) {
        if (currentStatus == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid current appointment status");
        }

        if ("COMPLETED".equalsIgnoreCase(currentStatus)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Appointment is COMPLETED and permanently finalized. Its status cannot be changed."
            );
        }
        if ("CANCELLED".equalsIgnoreCase(currentStatus)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Appointment is CANCELLED and permanently closed. Its status cannot be reopened."
            );
        }
        if ("REJECTED".equalsIgnoreCase(currentStatus)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Appointment is REJECTED and permanently closed. Its status cannot be reopened."
            );
        }

        if ("PENDING".equalsIgnoreCase(currentStatus)) {
            if ("CONFIRMED".equalsIgnoreCase(targetStatus)
                    || "REJECTED".equalsIgnoreCase(targetStatus)
                    || "CANCELLED".equalsIgnoreCase(targetStatus)) {
                return;
            }
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Pending appointments can only transition to CONFIRMED, REJECTED, or CANCELLED."
            );
        }

        if ("CONFIRMED".equalsIgnoreCase(currentStatus)) {
            if ("COMPLETED".equalsIgnoreCase(targetStatus)) {
                if (!isDoctor && !isAdmin) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the assigned doctor can complete appointments.");
                }
                return;
            }
            if ("CANCELLED".equalsIgnoreCase(targetStatus)) {
                return;
            }
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Confirmed appointments can only transition to COMPLETED or CANCELLED."
            );
        }

        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid state transition from " + currentStatus + " to " + targetStatus);
    }

    @Transactional
    public AppointmentResponseDTO updateAppointmentStatus(
            Long appointmentId,
            String status) {
        return updateAppointmentStatus(appointmentId, status, null, "admin@medicare.com", "ADMIN", "127.0.0.1");
    }

    @Transactional
    public AppointmentResponseDTO updateAppointmentStatus(
            Long appointmentId,
            String status,
            String cancellationReason,
            String authenticatedEmail,
            String actorRole,
            String clientIp) {

        Appointment appointment = findAppointment(appointmentId);

        // Lock doctor & date to serialize queue number generation and confirmation
        lockDoctorAndDate(appointment.getDoctorId(), appointment.getAppointmentDate());
        lockPatientAndDate(appointment.getPatientId(), appointment.getAppointmentDate());

        cleanupExpiredHolds();

        status = normalizeAndValidateStatus(status);
        String previousStatus = appointment.getStatus();

        if (status.equalsIgnoreCase(previousStatus)) {
            return convertToDTO(appointment);
        }

        boolean isAdmin = "ADMIN".equalsIgnoreCase(actorRole);
        boolean isDoctor = "DOCTOR".equalsIgnoreCase(actorRole);
        validateStrictStateTransition(previousStatus, status, isAdmin, isDoctor);

        boolean hasPrescription =
                prescriptionRepository.existsByAppointmentId(appointmentId);

        if ("COMPLETED".equalsIgnoreCase(previousStatus)
                && hasPrescription
                && !previousStatus.equalsIgnoreCase(status)) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This appointment is finalized because a prescription has been issued. Its status cannot be changed.");
        }

        // Validate pending hold expiration and assign unique queue number when confirming
        if ("CONFIRMED".equalsIgnoreCase(status)) {
            if ("PENDING".equalsIgnoreCase(previousStatus)
                    && appointment.getHoldExpiresAt() != null
                    && OffsetDateTime.now().isAfter(appointment.getHoldExpiresAt())) {

                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "This pending slot reservation has expired and cannot be confirmed. The patient must re-book."
                );
            }

            // Verify interval conflict before confirming
            validateIntervalConflict(
                    appointment.getPatientId(),
                    appointment.getDoctorId(),
                    appointment.getAppointmentDate(),
                    appointment.getAppointmentTime(),
                    appointmentId);

            // Concurrency-safe sequential queue number generation per doctor per date
            Integer maxQueue = appointmentRepository.findMaxQueueNumber(
                    appointment.getDoctorId(),
                    appointment.getAppointmentDate()
            );
            int nextQueue = (maxQueue != null ? maxQueue : 0) + 1;
            appointment.setQueueNumber(nextQueue);
            appointment.setHoldExpiresAt(null);
        }

        // Validate interval conflicts when reactivating
        if (ACTIVE_STATUSES.contains(status)
                && !ACTIVE_STATUSES.contains(previousStatus)) {

            validateIntervalConflict(
                    appointment.getPatientId(),
                    appointment.getDoctorId(),
                    appointment.getAppointmentDate(),
                    appointment.getAppointmentTime(),
                    appointmentId);
        }

        appointment.setStatus(status);
        if (cancellationReason != null && !cancellationReason.trim().isEmpty()) {
            appointment.setCancellationReason(cancellationReason.trim());
        }

        Appointment updatedAppointment = appointmentRepository.save(appointment);

        // Audit Logging
        String auditAction = "CANCELLED".equalsIgnoreCase(status) ? "APPOINTMENT_CANCELLED" :
                "REJECTED".equalsIgnoreCase(status) ? "APPOINTMENT_REJECTED" :
                "CONFIRMED".equalsIgnoreCase(status) ? "APPOINTMENT_CONFIRMED" : "STATUS_TRANSITION";

        String auditDetails = "Transitioned status from " + previousStatus + " to " + status +
                (updatedAppointment.getQueueNumber() != null ? ". Assigned Queue #" + updatedAppointment.getQueueNumber() : "") +
                (appointment.getCancellationReason() != null ? ". Reason: " + appointment.getCancellationReason() : "");

        auditLogService.log(
                "APPOINTMENT",
                appointmentId,
                auditAction,
                authenticatedEmail,
                actorRole,
                auditDetails,
                clientIp
        );

        // Notify patient
        Patient patient = patientRepository.findById(appointment.getPatientId()).orElse(null);
        if (patient != null) {
            String title;
            String message;
            String notificationType = null;

            switch (status) {
                case "CONFIRMED":
                    title = "Appointment Confirmed";
                    message = "Your appointment has been confirmed. Your daily queue number is #" +
                            (updatedAppointment.getQueueNumber() != null ? updatedAppointment.getQueueNumber() : "1") + ".";
                    notificationType = "APPOINTMENT_CONFIRMED";
                    break;

                case "REJECTED":
                    title = "Appointment Rejected";
                    message = "Your appointment request has been rejected." +
                            (appointment.getCancellationReason() != null ? " Reason: " + appointment.getCancellationReason() : "");
                    notificationType = "APPOINTMENT_REJECTED";
                    break;

                case "CANCELLED":
                    title = "Appointment Cancelled";
                    message = "Your appointment has been cancelled." +
                            (appointment.getCancellationReason() != null ? " Reason: " + appointment.getCancellationReason() : "");
                    notificationType = "APPOINTMENT_CANCELLED";
                    break;

                case "COMPLETED":
                    title = "Appointment Completed";
                    message = "Your appointment has been marked as completed.";
                    break;

                default:
                    title = "Appointment Updated";
                    message = "Your appointment status has been updated to " + status + ".";
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

    @Transactional
    public AppointmentResponseDTO updateAppointmentStatusByDoctor(
            Long appointmentId,
            String status,
            String authenticatedEmail) {
        return updateAppointmentStatusByDoctor(appointmentId, status, null, authenticatedEmail, "127.0.0.1");
    }

    @Transactional
    public AppointmentResponseDTO updateAppointmentStatusByDoctor(
            Long appointmentId,
            String status,
            String cancellationReason,
            String authenticatedEmail,
            String clientIp) {

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

        if (!appointment.getDoctorId().equals(doctor.getDoctorId())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You are not allowed to update this appointment");
        }

        return updateAppointmentStatus(appointmentId, status, cancellationReason, authenticatedEmail, "DOCTOR", clientIp);
    }

    @Transactional
    public AppointmentResponseDTO cancelMyAppointment(
            Long appointmentId,
            String authenticatedEmail) {
        return cancelMyAppointment(appointmentId, authenticatedEmail, null, "127.0.0.1");
    }

    @Transactional
    public AppointmentResponseDTO cancelMyAppointment(
            Long appointmentId,
            String authenticatedEmail,
            String cancellationReason,
            String clientIp) {

        User user = userRepository.findByEmail(
                authenticatedEmail.trim().toLowerCase(Locale.ROOT))
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

        String previousStatus = appointment.getStatus();
        if (!ACTIVE_STATUSES.contains(previousStatus)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Only pending or confirmed appointments can be cancelled");
        }

        appointment.setStatus("CANCELLED");
        appointment.setHoldExpiresAt(null);
        if (cancellationReason != null && !cancellationReason.trim().isEmpty()) {
            appointment.setCancellationReason(cancellationReason.trim());
        }

        Appointment updatedAppointment = appointmentRepository.save(appointment);

        // Audit Logging
        auditLogService.log(
                "APPOINTMENT",
                appointmentId,
                "APPOINTMENT_CANCELLED",
                authenticatedEmail,
                "PATIENT",
                "Patient cancelled appointment from " + previousStatus +
                        (appointment.getCancellationReason() != null ? ". Reason: " + appointment.getCancellationReason() : ""),
                clientIp
        );

        // Notify patient
        notificationService.createNotification(
                patient.getUserId(),
                "Appointment Cancelled",
                "Your appointment has been cancelled." +
                        (appointment.getCancellationReason() != null ? " Reason: " + appointment.getCancellationReason() : ""),
                "APPOINTMENT_CANCELLED",
                updatedAppointment.getAppointmentId(),
                null,
                "APPOINTMENT",
                "URGENT",
                "/patient/dashboard"
        );

        // Notify doctor
        Doctor doctor = doctorRepository.findById(appointment.getDoctorId()).orElse(null);
        if (doctor != null) {
            notificationService.createNotification(
                    doctor.getUserId(),
                    "Appointment Cancelled by Patient",
                    "Appointment #" + updatedAppointment.getAppointmentId() + " on " +
                            updatedAppointment.getAppointmentDate() + " at " + updatedAppointment.getAppointmentTime() +
                            " was cancelled by the patient." +
                            (appointment.getCancellationReason() != null ? " Reason: " + appointment.getCancellationReason() : ""),
                    "APPOINTMENT_CANCELLED",
                    updatedAppointment.getAppointmentId(),
                    null,
                    "APPOINTMENT",
                    "URGENT",
                    "/doctor/appointments"
            );
        }

        // Notify admin
        notificationService.createAdminActivityNotification(
                "Appointment Cancelled by Patient",
                "Appointment #" + updatedAppointment.getAppointmentId() + " on " +
                        updatedAppointment.getAppointmentDate() + " was cancelled by the patient.",
                "APPOINTMENT_CANCELLED",
                updatedAppointment.getAppointmentId(),
                null,
                "APPOINTMENT",
                "URGENT",
                "/admin/appointments"
        );

        return convertToDTO(updatedAppointment);
    }

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

    // =========================================================================
    // RESCHEDULING METHODS (WITH TRANSACTION LOCKING & APPROVAL REVALIDATION)
    // =========================================================================

    @Transactional
    public AppointmentResponseDTO requestReschedule(
            Long appointmentId,
            RescheduleRequestDTO dto,
            String authenticatedEmail,
            String clientIp) {

        User user = userRepository.findByEmail(
                authenticatedEmail.trim().toLowerCase(Locale.ROOT))
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User not found"));

        Patient patient = patientRepository.findByUserId(user.getUserId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Patient profile not found"));

        Appointment appointment = findAppointment(appointmentId);

        if (!appointment.getPatientId().equals(patient.getPatientId())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You are not authorized to reschedule this appointment");
        }

        if ("COMPLETED".equalsIgnoreCase(appointment.getStatus())
                || "CANCELLED".equalsIgnoreCase(appointment.getStatus())
                || "REJECTED".equalsIgnoreCase(appointment.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Cannot reschedule a " + appointment.getStatus() + " appointment");
        }

        if (dto.getRequestedDate() == null || dto.getRequestedTime() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Requested date and time are required");
        }

        validateAppointmentDateTime(dto.getRequestedDate(), dto.getRequestedTime());

        // Lock doctor & patient on requested target date
        lockDoctorAndDate(appointment.getDoctorId(), dto.getRequestedDate());
        lockPatientAndDate(patient.getPatientId(), dto.getRequestedDate());

        cleanupExpiredHolds();

        validateIntervalConflict(
                patient.getPatientId(),
                appointment.getDoctorId(),
                dto.getRequestedDate(),
                dto.getRequestedTime(),
                appointmentId
        );

        appointment.setRescheduleRequestedDate(dto.getRequestedDate());
        appointment.setRescheduleRequestedTime(dto.getRequestedTime());
        appointment.setRescheduleReason(dto.getReason() != null ? dto.getReason().trim() : null);
        appointment.setRescheduleStatus("PENDING_APPROVAL");

        Appointment saved = appointmentRepository.save(appointment);

        // Audit Logging
        auditLogService.log(
                "APPOINTMENT",
                appointmentId,
                "RESCHEDULE_REQUESTED",
                authenticatedEmail,
                "PATIENT",
                "Patient requested reschedule from " + appointment.getAppointmentDate() + " " + appointment.getAppointmentTime() +
                        " to " + dto.getRequestedDate() + " " + dto.getRequestedTime() +
                        (dto.getReason() != null ? ". Reason: " + dto.getReason().trim() : ""),
                clientIp
        );

        // Notify Doctor
        Doctor doctor = doctorRepository.findById(appointment.getDoctorId()).orElse(null);
        if (doctor != null) {
            notificationService.createNotification(
                    doctor.getUserId(),
                    "Reschedule Requested",
                    "Patient has requested to reschedule Appointment #" + appointmentId + " to " +
                            dto.getRequestedDate() + " at " + dto.getRequestedTime() + ".",
                    "RESCHEDULE_REQUESTED",
                    appointmentId,
                    null
            );
        }

        // Admin notification
        notificationService.createAdminActivityNotification(
                "Appointment Reschedule Requested",
                "Patient requested to reschedule Appointment #" + appointmentId + " to " +
                        dto.getRequestedDate() + " at " + dto.getRequestedTime() + ".",
                "RESCHEDULE_REQUESTED",
                appointmentId,
                null
        );

        return convertToDTO(saved);
    }

    @Transactional
    public AppointmentResponseDTO approveReschedule(
            Long appointmentId,
            String authenticatedEmail,
            String actorRole,
            String clientIp) {

        Appointment appointment = findAppointment(appointmentId);

        if (!"PENDING_APPROVAL".equalsIgnoreCase(appointment.getRescheduleStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "No pending reschedule request exists for this appointment");
        }

        if ("DOCTOR".equalsIgnoreCase(actorRole)) {
            User user = userRepository.findByEmail(authenticatedEmail.trim().toLowerCase(Locale.ROOT))
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
            Doctor doctor = doctorRepository.findByUserId(user.getUserId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Doctor profile not found"));
            if (!appointment.getDoctorId().equals(doctor.getDoctorId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not authorized to approve this reschedule");
            }
        }

        LocalDate targetDate = appointment.getRescheduleRequestedDate();
        LocalTime targetTime = appointment.getRescheduleRequestedTime();

        if (targetDate == null || targetTime == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid reschedule target date or time");
        }

        validateAppointmentDateTime(targetDate, targetTime);

        // 1. Concurrency Lock: Lock doctor and patient on target date before revalidation and update
        lockDoctorAndDate(appointment.getDoctorId(), targetDate);
        lockPatientAndDate(appointment.getPatientId(), targetDate);

        cleanupExpiredHolds();

        // 2. Strict Revalidation: Ensure no concurrent booking or hold has taken the slot
        try {
            validateIntervalConflict(
                    appointment.getPatientId(),
                    appointment.getDoctorId(),
                    targetDate,
                    targetTime,
                    appointmentId
            );
        } catch (ResponseStatusException ex) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Cannot approve reschedule: The requested slot is no longer available as another appointment is now booked or held during this interval (" +
                            targetDate + " at " + targetTime + ")."
            );
        }

        LocalDate oldDate = appointment.getAppointmentDate();
        LocalTime oldTime = appointment.getAppointmentTime();
        Integer oldQueue = appointment.getQueueNumber();

        // 3. Update appointment to target slot and mark APPROVED
        appointment.setAppointmentDate(targetDate);
        appointment.setAppointmentTime(targetTime);
        appointment.setRescheduleStatus("APPROVED");

        // 4. Concurrency-safe queue number assignment on target date
        if ("CONFIRMED".equalsIgnoreCase(appointment.getStatus())) {
            Integer maxQueue = appointmentRepository.findMaxQueueNumber(appointment.getDoctorId(), targetDate);
            int nextQueue = (maxQueue != null ? maxQueue : 0) + 1;
            appointment.setQueueNumber(nextQueue);
        }

        Appointment saved = appointmentRepository.save(appointment);

        // 5. Preserving historical details in audit logging
        String auditDetails = "Reschedule approved. Previous slot: " + oldDate + " " + oldTime +
                (oldQueue != null ? " (Queue #" + oldQueue + ")" : "") +
                " -> New slot: " + targetDate + " " + targetTime +
                (saved.getQueueNumber() != null ? " (Queue #" + saved.getQueueNumber() + ")" : "") +
                (appointment.getRescheduleReason() != null ? ". Reason: " + appointment.getRescheduleReason() : "");

        auditLogService.log(
                "APPOINTMENT",
                appointmentId,
                "RESCHEDULE_APPROVED",
                authenticatedEmail,
                actorRole,
                auditDetails,
                clientIp
        );

        // 6. Notify Patient with previous and updated slot information
        Patient patient = patientRepository.findById(appointment.getPatientId()).orElse(null);
        if (patient != null) {
            notificationService.createNotification(
                    patient.getUserId(),
                    "Reschedule Approved",
                    "Your appointment has been successfully rescheduled from " + oldDate + " " + oldTime +
                            " to " + targetDate + " at " + targetTime +
                            (saved.getQueueNumber() != null ? ". Your queue number is #" + saved.getQueueNumber() : "") + ".",
                    "RESCHEDULE_APPROVED",
                    appointmentId,
                    null
            );
        }

        return convertToDTO(saved);
    }

    @Transactional
    public AppointmentResponseDTO rejectReschedule(
            Long appointmentId,
            String rejectionReason,
            String authenticatedEmail,
            String actorRole,
            String clientIp) {

        Appointment appointment = findAppointment(appointmentId);

        if (!"PENDING_APPROVAL".equalsIgnoreCase(appointment.getRescheduleStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "No pending reschedule request exists for this appointment");
        }

        if ("DOCTOR".equalsIgnoreCase(actorRole)) {
            User user = userRepository.findByEmail(authenticatedEmail.trim().toLowerCase(Locale.ROOT))
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
            Doctor doctor = doctorRepository.findByUserId(user.getUserId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Doctor profile not found"));
            if (!appointment.getDoctorId().equals(doctor.getDoctorId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not authorized to reject this reschedule");
            }
        }

        appointment.setRescheduleStatus("REJECTED");
        Appointment saved = appointmentRepository.save(appointment);

        String reasonText = rejectionReason != null && !rejectionReason.trim().isEmpty()
                ? rejectionReason.trim() : "Request rejected by " + actorRole;

        auditLogService.log(
                "APPOINTMENT",
                appointmentId,
                "RESCHEDULE_REJECTED",
                authenticatedEmail,
                actorRole,
                "Reschedule request rejected. Original slot retained: " + appointment.getAppointmentDate() +
                        " " + appointment.getAppointmentTime() + ". Reason: " + reasonText,
                clientIp
        );

        Patient patient = patientRepository.findById(appointment.getPatientId()).orElse(null);
        if (patient != null) {
            notificationService.createNotification(
                    patient.getUserId(),
                    "Reschedule Request Declined",
                    "Your request to reschedule Appointment #" + appointmentId + " was declined. Your consultation remains on " +
                            appointment.getAppointmentDate() + " at " + appointment.getAppointmentTime() + ". Reason: " + reasonText,
                    "RESCHEDULE_REJECTED",
                    appointmentId,
                    null
            );
        }

        return convertToDTO(saved);
    }

    // =========================================================================
    // HELPER & VALIDATION METHODS
    // =========================================================================

    private Appointment findAppointment(Long appointmentId) {
        return appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Appointment not found"));
    }

    private String normalizeAndValidateStatus(String status) {
        if (status == null || status.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Appointment status is required");
        }

        String normalizedStatus = status.trim().toUpperCase(Locale.ROOT);

        if (!VALID_STATUSES.contains(normalizedStatus)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid appointment status");
        }

        return normalizedStatus;
    }

    private void validatePatientAndDoctor(AppointmentRequestDTO dto) {
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

    private void validateAppointmentDateTime(LocalDate date, LocalTime time) {
        if (date == null || time == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Appointment date and time are required");
        }

        LocalDateTime appointmentDateTime = LocalDateTime.of(date, time);

        if (appointmentDateTime.isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Appointment date and time cannot be in the past");
        }
    }

    private AppointmentResponseDTO convertToDTO(Appointment appointment) {
        return new AppointmentResponseDTO(
                appointment.getAppointmentId(),
                appointment.getPatientId(),
                appointment.getDoctorId(),
                appointment.getAppointmentDate(),
                appointment.getAppointmentTime(),
                appointment.getReason(),
                appointment.getCancellationReason(),
                appointment.getStatus(),
                appointment.getHoldExpiresAt(),
                appointment.getQueueNumber(),
                appointment.getRescheduleRequestedDate(),
                appointment.getRescheduleRequestedTime(),
                appointment.getRescheduleReason(),
                appointment.getRescheduleStatus(),
                appointment.getCreatedAt(),
                appointment.getUpdatedAt()
        );
    }
}
