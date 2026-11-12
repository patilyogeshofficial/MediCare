package com.medicare.backend.service;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Locale;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.medicare.backend.dto.NotificationResponseDTO;
import com.medicare.backend.entity.AdminNotificationPreference;
import com.medicare.backend.entity.Appointment;
import com.medicare.backend.entity.Notification;
import com.medicare.backend.entity.User;
import com.medicare.backend.enums.Role;
import com.medicare.backend.repository.AdminNotificationPreferenceRepository;
import com.medicare.backend.repository.AppointmentRepository;
import com.medicare.backend.repository.NotificationRepository;
import com.medicare.backend.repository.UserRepository;

@Service
public class NotificationService {

    private static final Logger logger = LoggerFactory.getLogger(NotificationService.class);

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final AdminNotificationPreferenceRepository preferenceRepository;
    private final SseNotificationService sseNotificationService;
    private final AppointmentRepository appointmentRepository;

    public NotificationService(
            NotificationRepository notificationRepository,
            UserRepository userRepository,
            AdminNotificationPreferenceRepository preferenceRepository,
            SseNotificationService sseNotificationService,
            AppointmentRepository appointmentRepository) {

        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.preferenceRepository = preferenceRepository;
        this.sseNotificationService = sseNotificationService;
        this.appointmentRepository = appointmentRepository;
    }

    // Get notifications for authenticated user with category & unread filters
    @Transactional(readOnly = true)
    public List<NotificationResponseDTO> getMyNotifications(
            String authenticatedEmail,
            String category,
            Boolean unreadOnly) {

        User user = getAuthenticatedUser(authenticatedEmail);
        Long userId = user.getUserId();

        List<Notification> records;

        boolean filterCategory = category != null && !category.isBlank() && !"ALL".equalsIgnoreCase(category);
        boolean filterUnread = Boolean.TRUE.equals(unreadOnly);

        if (filterCategory && filterUnread) {
            records = notificationRepository
                    .findByUserIdAndCategoryAndIsReadFalseAndIsArchivedFalseOrderByCreatedAtDesc(userId, category.toUpperCase());
        } else if (filterCategory) {
            records = notificationRepository
                    .findByUserIdAndCategoryAndIsArchivedFalseOrderByCreatedAtDesc(userId, category.toUpperCase());
        } else if (filterUnread) {
            records = notificationRepository
                    .findByUserIdAndIsReadFalseAndIsArchivedFalseOrderByCreatedAtDesc(userId);
        } else {
            records = notificationRepository
                    .findByUserIdAndIsArchivedFalseOrderByCreatedAtDesc(userId);
        }

        return records.stream()
                .map(this::convertToDTO)
                .toList();
    }

    // Overload for backward compatibility
    @Transactional(readOnly = true)
    public List<NotificationResponseDTO> getMyNotifications(String authenticatedEmail) {
        return getMyNotifications(authenticatedEmail, null, false);
    }

    // Get unread notification count
    @Transactional(readOnly = true)
    public long getUnreadCount(String authenticatedEmail) {
        User user = getAuthenticatedUser(authenticatedEmail);
        return notificationRepository.countByUserIdAndIsReadFalseAndIsArchivedFalse(user.getUserId());
    }

    // Mark a notification as read
    @Transactional
    public NotificationResponseDTO markAsRead(
            Long notificationId,
            String authenticatedEmail) {

        User user = getAuthenticatedUser(authenticatedEmail);

        Notification notification = notificationRepository
                .findByNotificationIdAndUserIdAndIsArchivedFalse(
                        notificationId,
                        user.getUserId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Notification not found"));

        notification.setIsRead(true);
        Notification updatedNotification = notificationRepository.save(notification);

        return convertToDTO(updatedNotification);
    }

    // Mark all notifications as read for authenticated user
    @Transactional
    public int markAllAsRead(String authenticatedEmail) {
        User user = getAuthenticatedUser(authenticatedEmail);
        return notificationRepository.markAllAsReadByUserId(user.getUserId());
    }

    // Soft delete / archive an individual notification
    @Transactional
    public NotificationResponseDTO archiveNotification(
            Long notificationId,
            String authenticatedEmail) {

        User user = getAuthenticatedUser(authenticatedEmail);

        Notification notification = notificationRepository
                .findByNotificationIdAndUserIdAndIsArchivedFalse(
                        notificationId,
                        user.getUserId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Notification not found"));

        notification.setIsArchived(true);
        notification.setDeletedAt(OffsetDateTime.now());

        Notification updated = notificationRepository.save(notification);
        return convertToDTO(updated);
    }

    // Clear (soft delete) all notifications for authenticated user
    @Transactional
    public void clearAllNotifications(String authenticatedEmail) {
        User user = getAuthenticatedUser(authenticatedEmail);
        notificationRepository.archiveAllByUserId(user.getUserId());
    }

    // Overload: Create notification (legacy signature)
    @Transactional
    public NotificationResponseDTO createNotification(
            Long userId,
            String title,
            String message,
            String type,
            Long appointmentId,
            Long prescriptionId) {

        return createNotification(userId, title, message, type, appointmentId, prescriptionId, null, null, null, null);
    }

    // Overload: Create notification without explicit dedupKey
    @Transactional
    public NotificationResponseDTO createNotification(
            Long userId,
            String title,
            String message,
            String type,
            Long appointmentId,
            Long prescriptionId,
            String category,
            String priority,
            String actionUrl) {

        return createNotification(userId, title, message, type, appointmentId, prescriptionId, category, priority, actionUrl, null);
    }

    // Full: Create notification with priority, category, actionUrl, dedupKey & real-time SSE push
    @Transactional
    public NotificationResponseDTO createNotification(
            Long userId,
            String title,
            String message,
            String type,
            Long appointmentId,
            Long prescriptionId,
            String category,
            String priority,
            String actionUrl,
            String dedupKey) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User not found"));

        // If dedupKey is not explicitly provided, auto-derive for appointment reminders
        String effectiveDedupKey = dedupKey;
        if (effectiveDedupKey == null && "APPOINTMENT_REMINDER".equals(type) && appointmentId != null) {
            effectiveDedupKey = buildAppointmentReminderKey(appointmentId, userId);
        }

        Notification notification = new Notification();
        notification.setUserId(user.getUserId());
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType(type);
        notification.setAppointmentId(appointmentId);
        notification.setPrescriptionId(prescriptionId);
        notification.setIsRead(false);
        notification.setIsArchived(false);
        notification.setDedupKey(effectiveDedupKey);

        // Derive category if not specified
        if (category == null || category.isBlank()) {
            notification.setCategory(inferCategory(type));
        } else {
            notification.setCategory(category.toUpperCase());
        }

        // Derive priority if not specified
        if (priority == null || priority.isBlank()) {
            notification.setPriority(inferPriority(type));
        } else {
            notification.setPriority(priority.toUpperCase());
        }

        // Derive action URL if not specified
        if (actionUrl == null || actionUrl.isBlank()) {
            notification.setActionUrl(inferActionUrl(notification.getCategory(), user.getRole()));
        } else {
            notification.setActionUrl(actionUrl);
        }

        Notification saved = notificationRepository.save(notification);
        NotificationResponseDTO dto = convertToDTO(saved);

        // Push real-time event to user's active SSE connections
        sseNotificationService.sendNotification(user.getUserId(), dto);

        return dto;
    }

    /**
     * Database-enforced idempotent notification creation.
     * Executes in an independent transaction (REQUIRES_NEW).
     * Catches database unique constraint violations during concurrent scheduler executions,
     * restarts, or retries without aborting outer transaction batches.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public NotificationResponseDTO createNotificationSafely(
            Long userId,
            String title,
            String message,
            String type,
            Long appointmentId,
            Long prescriptionId,
            String category,
            String priority,
            String actionUrl,
            String dedupKey) {

        String key = dedupKey;
        if (key == null && "APPOINTMENT_REMINDER".equals(type) && appointmentId != null) {
            key = buildAppointmentReminderKey(appointmentId, userId);
        }

        // 1. Fast-path check
        if (key != null && notificationRepository.existsByDedupKey(key)) {
            logger.debug("Idempotent check: Notification with dedupKey {} already exists in DB", key);
            return null;
        }

        try {
            // 2. Database insert protected by uq_notifications_dedup_key and uq_notifications_reminder_idempotency
            return createNotification(userId, title, message, type, appointmentId, prescriptionId, category, priority, actionUrl, key);
        } catch (DataIntegrityViolationException ex) {
            // 3. Concurrency guard: Caught unique constraint violation from parallel thread / worker
            logger.info("Database unique constraint prevented duplicate notification for dedupKey: {}", key);
            return null;
        }
    }

    // Get notifications for the authenticated admin with category & unread filters
    @Transactional(readOnly = true)
    public List<NotificationResponseDTO> getAdminNotifications(
            String authenticatedEmail,
            String category,
            Boolean unreadOnly) {

        User admin = getAuthenticatedAdmin(authenticatedEmail);
        Long adminId = admin.getUserId();

        List<Notification> records;

        boolean filterCategory = category != null && !category.isBlank() && !"ALL".equalsIgnoreCase(category);
        boolean filterUnread = Boolean.TRUE.equals(unreadOnly);

        if (filterCategory && filterUnread) {
            records = notificationRepository
                    .findByUserIdAndCategoryAndIsReadFalseAndIsArchivedFalseOrderByCreatedAtDesc(adminId, category.toUpperCase());
        } else if (filterCategory) {
            records = notificationRepository
                    .findByUserIdAndCategoryAndIsArchivedFalseOrderByCreatedAtDesc(adminId, category.toUpperCase());
        } else if (filterUnread) {
            records = notificationRepository
                    .findByUserIdAndIsReadFalseAndIsArchivedFalseOrderByCreatedAtDesc(adminId);
        } else {
            records = notificationRepository
                    .findByUserIdAndIsArchivedFalseOrderByCreatedAtDesc(adminId);
        }

        return records.stream()
                .map(this::convertToDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<NotificationResponseDTO> getAdminNotifications(String authenticatedEmail) {
        return getAdminNotifications(authenticatedEmail, null, false);
    }

    // Get unread notification count for admin
    @Transactional(readOnly = true)
    public long getAdminUnreadCount(String authenticatedEmail) {
        User admin = getAuthenticatedAdmin(authenticatedEmail);
        return notificationRepository.countByUserIdAndIsReadFalseAndIsArchivedFalse(admin.getUserId());
    }

    // Mark admin notification as read
    @Transactional
    public NotificationResponseDTO markAdminNotificationAsRead(
            Long notificationId,
            String authenticatedEmail) {

        User admin = getAuthenticatedAdmin(authenticatedEmail);

        Notification notification = notificationRepository
                .findByNotificationIdAndUserIdAndIsArchivedFalse(
                        notificationId,
                        admin.getUserId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Notification not found"));

        notification.setIsRead(true);
        Notification saved = notificationRepository.save(notification);
        return convertToDTO(saved);
    }

    // Mark all admin notifications as read
    @Transactional
    public int markAllAdminNotificationsAsRead(String authenticatedEmail) {
        User admin = getAuthenticatedAdmin(authenticatedEmail);
        return notificationRepository.markAllAsReadByUserId(admin.getUserId());
    }

    // Soft delete / archive an individual admin notification
    @Transactional
    public NotificationResponseDTO archiveAdminNotification(
            Long notificationId,
            String authenticatedEmail) {

        User admin = getAuthenticatedAdmin(authenticatedEmail);

        Notification notification = notificationRepository
                .findByNotificationIdAndUserIdAndIsArchivedFalse(
                        notificationId,
                        admin.getUserId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Notification not found"));

        notification.setIsArchived(true);
        notification.setDeletedAt(OffsetDateTime.now());

        Notification saved = notificationRepository.save(notification);
        return convertToDTO(saved);
    }

    // Clear (soft delete) all admin notifications
    @Transactional
    public void clearAllAdminNotifications(String authenticatedEmail) {
        User admin = getAuthenticatedAdmin(authenticatedEmail);
        notificationRepository.archiveAllByUserId(admin.getUserId());
    }

    // Overload: Create activity notification for all admins (legacy signature)
    @Transactional
    public void createAdminActivityNotification(
            String title,
            String message,
            String type,
            Long appointmentId,
            Long prescriptionId) {

        createAdminActivityNotification(title, message, type, appointmentId, prescriptionId, null, null, null);
    }

    // Full: Create activity notification for all admins with category, priority, actionUrl & SSE push
    @Transactional
    public void createAdminActivityNotification(
            String title,
            String message,
            String type,
            Long appointmentId,
            Long prescriptionId,
            String category,
            String priority,
            String actionUrl) {

        List<User> admins = userRepository.findByRole(Role.ADMIN);

        String effectiveCategory = (category != null && !category.isBlank()) ? category.toUpperCase() : inferCategory(type);
        String effectivePriority = (priority != null && !priority.isBlank()) ? priority.toUpperCase() : inferPriority(type);
        String effectiveActionUrl = (actionUrl != null && !actionUrl.isBlank()) ? actionUrl : inferActionUrl(effectiveCategory, Role.ADMIN);

        for (User admin : admins) {
            // Check admin preferences
            AdminNotificationPreference preference =
                    preferenceRepository.findByUserId(admin.getUserId()).orElse(null);

            if (preference != null && !preference.isAllNotifications()) {
                continue;
            }

            if (preference != null) {
                boolean categoryEnabled = switch (type) {
                    case "NEW_APPOINTMENT" -> preference.isAppointmentNotifications();
                    case "NEW_CONTACT_MESSAGE" -> preference.isContactMessageNotifications();
                    case "NEW_PRESCRIPTION" -> preference.isPrescriptionNotifications();
                    default -> true;
                };

                if (!categoryEnabled) {
                    continue;
                }
            }

            Notification notification = new Notification();
            notification.setUserId(admin.getUserId());
            notification.setTitle(title);
            notification.setMessage(message);
            notification.setType(type);
            notification.setAppointmentId(appointmentId);
            notification.setPrescriptionId(prescriptionId);
            notification.setIsRead(false);
            notification.setIsArchived(false);
            notification.setCategory(effectiveCategory);
            notification.setPriority(effectivePriority);
            notification.setActionUrl(effectiveActionUrl);

            Notification saved = notificationRepository.save(notification);
            NotificationResponseDTO dto = convertToDTO(saved);

            // Push SSE event to admin
            sseNotificationService.sendNotification(admin.getUserId(), dto);
        }
    }

    // Convert Notification entity to response DTO
    public NotificationResponseDTO convertToDTO(Notification notification) {
        return new NotificationResponseDTO(
                notification.getNotificationId(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getType(),
                notification.getCategory(),
                notification.getPriority(),
                notification.getActionUrl(),
                notification.getAppointmentId(),
                notification.getPrescriptionId(),
                notification.getIsRead(),
                notification.getIsArchived(),
                notification.getCreatedAt());
    }

    private User getAuthenticatedUser(String authenticatedEmail) {
        String email = authenticatedEmail.trim().toLowerCase(Locale.ROOT);
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "User not found"));
    }

    private User getAuthenticatedAdmin(String email) {
        User admin = getAuthenticatedUser(email);
        if (admin.getRole() != Role.ADMIN) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Admin access required");
        }
        return admin;
    }

    private String inferCategory(String type) {
        if (type == null) return "GENERAL";
        String upper = type.toUpperCase(Locale.ROOT);
        if (upper.contains("APPOINTMENT") || upper.contains("RESCHEDULE")) return "APPOINTMENT";
        if (upper.contains("PRESCRIPTION")) return "PRESCRIPTION";
        if (upper.contains("EHR") || upper.contains("RECORD") || upper.contains("CLINICAL") || upper.contains("DOCUMENT") || upper.contains("VITAL")) return "MEDICAL_RECORD";
        if (upper.contains("CONTACT")) return "CONTACT";
        if (upper.contains("USER") || upper.contains("DOCTOR") || upper.contains("ACCOUNT")) return "ACCOUNT";
        return "GENERAL";
    }

    private String inferPriority(String type) {
        if (type == null) return "NORMAL";
        String upper = type.toUpperCase(Locale.ROOT);
        if (upper.contains("CANCELLED") || upper.contains("REJECTED") || upper.contains("DECLINED")) return "URGENT";
        if (upper.contains("CONFIRMED") || upper.contains("BOOKED") || upper.contains("NEW_") || upper.contains("REMINDER") || upper.contains("APPROVED")) return "IMPORTANT";
        return "NORMAL";
    }

    private String inferActionUrl(String category, Role role) {
        if (role == Role.ADMIN) {
            return switch (category) {
                case "APPOINTMENT" -> "/admin/appointments";
                case "PRESCRIPTION" -> "/admin/prescriptions";
                case "CONTACT" -> "/admin/contact-messages";
                case "ACCOUNT" -> "/admin/doctors";
                default -> "/admin/dashboard";
            };
        } else if (role == Role.DOCTOR) {
            return switch (category) {
                case "APPOINTMENT" -> "/doctor/appointments";
                case "PRESCRIPTION" -> "/doctor/prescriptions";
                case "MEDICAL_RECORD" -> "/doctor/patients";
                default -> "/doctor/dashboard";
            };
        } else {
            return switch (category) {
                case "APPOINTMENT" -> "/patient/dashboard";
                case "PRESCRIPTION" -> "/patient/dashboard";
                case "MEDICAL_RECORD" -> "/patient/dashboard";
                default -> "/patient/dashboard";
            };
        }
    }

    /**
     * Builds a schedule-versioned deduplication key for appointment reminders.
     * Incorporates the appointment's date and time so that rescheduled appointments
     * are naturally eligible for reminders at their updated schedule slot.
     */
    private String buildAppointmentReminderKey(Long appointmentId, Long userId) {
        Appointment appt = appointmentRepository.findById(appointmentId).orElse(null);
        if (appt != null && appt.getAppointmentDate() != null && appt.getAppointmentTime() != null) {
            return "REMINDER:APPT:" + appointmentId + ":DATE:" + appt.getAppointmentDate() + ":TIME:" + appt.getAppointmentTime() + ":USER:" + userId;
        }
        return "REMINDER:APPT:" + appointmentId + ":USER:" + userId;
    }
}
