
package com.medicare.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.medicare.backend.entity.Notification;

@Repository
public interface NotificationRepository
                extends JpaRepository<Notification, Long> {

        // Get all active (non-archived) notifications for a user
        List<Notification> findByUserIdAndIsArchivedFalseOrderByCreatedAtDesc(
                        Long userId);

        // Get all active notifications filtered by category
        List<Notification> findByUserIdAndCategoryAndIsArchivedFalseOrderByCreatedAtDesc(
                        Long userId,
                        String category);

        // Get unread active notifications for a user
        List<Notification> findByUserIdAndIsReadFalseAndIsArchivedFalseOrderByCreatedAtDesc(
                        Long userId);

        // Get unread active notifications filtered by category
        List<Notification> findByUserIdAndCategoryAndIsReadFalseAndIsArchivedFalseOrderByCreatedAtDesc(
                        Long userId,
                        String category);

        // Count unread active notifications for a user
        long countByUserIdAndIsReadFalseAndIsArchivedFalse(
                        Long userId);

        // Find an active notification belonging to a specific user
        Optional<Notification> findByNotificationIdAndUserIdAndIsArchivedFalse(
                        Long notificationId,
                        Long userId);

        // Check whether a specific reminder notification has already been issued (deduplication)
        boolean existsByUserIdAndAppointmentIdAndType(
                        Long userId,
                        Long appointmentId,
                        String type);

        // Check whether a notification with this dedupKey already exists (database-enforced idempotency)
        boolean existsByDedupKey(String dedupKey);

        Optional<Notification> findByDedupKey(String dedupKey);

        // Soft-delete / archive all notifications for a user
        @Modifying
        @Query("UPDATE Notification n SET n.isArchived = true, n.deletedAt = CURRENT_TIMESTAMP WHERE n.userId = :userId AND n.isArchived = false")
        int archiveAllByUserId(@Param("userId") Long userId);

        // Legacy compatibility methods
        List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);

        List<Notification> findByUserIdAndIsReadFalseOrderByCreatedAtDesc(Long userId);

        long countByUserIdAndIsReadFalse(Long userId);

        Optional<Notification> findByNotificationIdAndUserId(Long notificationId, Long userId);

        @Modifying
        @Query("UPDATE Notification n SET n.isRead = true WHERE n.userId = :userId AND n.isArchived = false")
        int markAllAsReadByUserId(@Param("userId") Long userId);

        void deleteByUserId(Long userId);
}