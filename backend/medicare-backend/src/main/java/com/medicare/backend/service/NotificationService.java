package com.medicare.backend.service;

import java.util.List;
import java.util.Locale;
import com.medicare.backend.entity.AdminNotificationPreference;
import com.medicare.backend.repository.AdminNotificationPreferenceRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.medicare.backend.dto.NotificationResponseDTO;
import com.medicare.backend.entity.Notification;
import com.medicare.backend.entity.User;
import com.medicare.backend.repository.NotificationRepository;
import com.medicare.backend.repository.UserRepository;
import com.medicare.backend.enums.Role;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
private final UserRepository userRepository;
private final AdminNotificationPreferenceRepository preferenceRepository;

   public NotificationService(
        NotificationRepository notificationRepository,
        UserRepository userRepository,
        AdminNotificationPreferenceRepository preferenceRepository) {

    this.notificationRepository = notificationRepository;
    this.userRepository = userRepository;
    this.preferenceRepository = preferenceRepository;
}

    // Get all notifications for authenticated user
    @Transactional(readOnly = true)
    public List<NotificationResponseDTO> getMyNotifications(
            String authenticatedEmail) {

        User user = getAuthenticatedUser(authenticatedEmail);

        return notificationRepository
                .findByUserIdOrderByCreatedAtDesc(user.getUserId())
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

    // Get unread notification count
    @Transactional(readOnly = true)
    public long getUnreadCount(String authenticatedEmail) {

        User user = getAuthenticatedUser(authenticatedEmail);

        return notificationRepository
                .countByUserIdAndIsReadFalse(user.getUserId());
    }

    // Mark a notification as read
    @Transactional
    public NotificationResponseDTO markAsRead(
            Long notificationId,
            String authenticatedEmail) {

        User user = getAuthenticatedUser(authenticatedEmail);

        Notification notification = notificationRepository
                .findByNotificationIdAndUserId(
                        notificationId,
                        user.getUserId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Notification not found"));

        notification.setIsRead(true);

        Notification updatedNotification =
                notificationRepository.save(notification);

        return convertToDTO(updatedNotification);
    }

    // Get authenticated user
    private User getAuthenticatedUser(String authenticatedEmail) {

        String email = authenticatedEmail.trim().toLowerCase(Locale.ROOT);

        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "User not found"));
    }

    // Convert Notification entity to response DTO
    private NotificationResponseDTO convertToDTO(
            Notification notification) {

        return new NotificationResponseDTO(
                notification.getNotificationId(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getType(),
                notification.getAppointmentId(),
                notification.getPrescriptionId(),
                notification.getIsRead(),
                notification.getCreatedAt());
    }
    // Create notification for a user
// Create notification for a user
@Transactional
public void createNotification(
        Long userId,
        String title,
        String message,
        String type,
        Long appointmentId,
        Long prescriptionId) {

    User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "User not found"));

    Notification notification = new Notification();

    notification.setUserId(user.getUserId());
    notification.setTitle(title);
    notification.setMessage(message);
    notification.setType(type);
    notification.setAppointmentId(appointmentId);
    notification.setPrescriptionId(prescriptionId);
    notification.setIsRead(false);

    notificationRepository.save(notification);
}

// Get notifications for the authenticated admin
@Transactional(readOnly = true)
public List<NotificationResponseDTO> getAdminNotifications(
        String authenticatedEmail) {

    User admin = getAuthenticatedAdmin(authenticatedEmail);

    return notificationRepository
            .findByUserIdOrderByCreatedAtDesc(admin.getUserId())
            .stream()
            .map(this::convertToDTO)
            .toList();
}

// Get unread notification count for admin
@Transactional(readOnly = true)
public long getAdminUnreadCount(String authenticatedEmail) {

    User admin = getAuthenticatedAdmin(authenticatedEmail);

    return notificationRepository
            .countByUserIdAndIsReadFalse(admin.getUserId());
}

// Mark admin notification as read
@Transactional
public NotificationResponseDTO markAdminNotificationAsRead(
        Long notificationId,
        String authenticatedEmail) {

    User admin = getAuthenticatedAdmin(authenticatedEmail);

    Notification notification = notificationRepository
            .findByNotificationIdAndUserId(
                    notificationId,
                    admin.getUserId())
            .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Notification not found"));

    notification.setIsRead(true);

    return convertToDTO(notificationRepository.save(notification));
}

// Find authenticated admin
private User getAuthenticatedAdmin(String email) {

    User admin = getAuthenticatedUser(email);

    if (admin.getRole() != Role.ADMIN) {
        throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "Admin access required");
    }

    return admin;
}

// Create activity notification for every admin based on preferences
@Transactional
public void createAdminActivityNotification(
        String title,
        String message,
        String type,
        Long appointmentId,
        Long prescriptionId) {

    List<User> admins = userRepository.findByRole(Role.ADMIN);

    for (User admin : admins) {

        // Get this admin's notification preferences
        AdminNotificationPreference preference =
                preferenceRepository.findByUserId(admin.getUserId())
                        .orElse(null);

        // If all notifications are disabled, skip this admin
        if (preference != null && !preference.isAllNotifications()) {
            continue;
        }

        // Check notification category preference
        if (preference != null) {

            boolean categoryEnabled = switch (type) {

                case "NEW_APPOINTMENT" ->
                        preference.isAppointmentNotifications();

                case "NEW_CONTACT_MESSAGE" ->
                        preference.isContactMessageNotifications();

                case "NEW_PRESCRIPTION" ->
                        preference.isPrescriptionNotifications();

                default -> true;
            };

            if (!categoryEnabled) {
                continue;
            }
        }

        // Create notification for this admin
        Notification notification = new Notification();

        notification.setUserId(admin.getUserId());
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType(type);
        notification.setAppointmentId(appointmentId);
        notification.setPrescriptionId(prescriptionId);
        notification.setIsRead(false);

        notificationRepository.save(notification);
    }
}

}