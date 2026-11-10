
package com.medicare.backend.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.medicare.backend.dto.NotificationResponseDTO;
import com.medicare.backend.service.NotificationService;

@RestController
@RequestMapping("/api/notifications")
@PreAuthorize("hasAnyRole('PATIENT', 'DOCTOR')")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(
            NotificationService notificationService) {

        this.notificationService = notificationService;
    }

    // Get all notifications
    @GetMapping("/my")
    public ResponseEntity<List<NotificationResponseDTO>> getMyNotifications(
            Authentication authentication) {

        return ResponseEntity.ok(
                notificationService.getMyNotifications(
                        authentication.getName()));
    }

    // Get unread notification count
    @GetMapping("/unread-count")
    public ResponseEntity<Long> getUnreadCount(
            Authentication authentication) {

        return ResponseEntity.ok(
                notificationService.getUnreadCount(
                        authentication.getName()));
    }

    // Mark individual notification as read
    @PatchMapping("/{notificationId}/read")
    public ResponseEntity<NotificationResponseDTO> markAsRead(
            @PathVariable Long notificationId,
            Authentication authentication) {

        return ResponseEntity.ok(
                notificationService.markAsRead(
                        notificationId,
                        authentication.getName()));
    }

    // Mark all notifications as read
    @PatchMapping("/mark-all-read")
    public ResponseEntity<Integer> markAllAsRead(
            Authentication authentication) {

        int updatedCount = notificationService.markAllAsRead(
                authentication.getName());

        return ResponseEntity.ok(updatedCount);
    }

    // Clear all notifications
    @DeleteMapping("/clear-all")
    public ResponseEntity<Void> clearAllNotifications(
            Authentication authentication) {

        notificationService.clearAllNotifications(
                authentication.getName());

        return ResponseEntity.noContent().build();
    }
}
