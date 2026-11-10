
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

        // Mark all notifications as read for a user
        @org.springframework.data.jpa.repository.Modifying
        @org.springframework.data.jpa.repository.Query("UPDATE Notification n SET n.isRead = true WHERE n.userId = :userId")
        int markAllAsReadByUserId(
                        @org.springframework.data.repository.query.Param("userId") Long userId);

        // Delete all notifications for a user
        void deleteByUserId(Long userId);

}