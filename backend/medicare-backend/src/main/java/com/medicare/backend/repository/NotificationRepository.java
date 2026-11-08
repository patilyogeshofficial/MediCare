
package com.medicare.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.medicare.backend.entity.Notification;

@Repository
public interface NotificationRepository
        extends JpaRepository<Notification, Long> {

    // Get all notifications for a user
    List<Notification> findByUserIdOrderByCreatedAtDesc(
            Long userId);

    // Get unread notifications for a user
    List<Notification> findByUserIdAndIsReadFalseOrderByCreatedAtDesc(
            Long userId);

    // Count unread notifications for a user
    long countByUserIdAndIsReadFalse(
            Long userId);

    // Find a notification belonging to a specific user
    Optional<Notification> findByNotificationIdAndUserId(
            Long notificationId,
            Long userId);

}
