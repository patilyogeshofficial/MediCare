
package com.medicare.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.medicare.backend.service.NotificationService;

@RestController
@RequestMapping("/api/admin/notifications")
@PreAuthorize("hasRole('ADMIN')")
public class AdminNotificationController {

    private final NotificationService notificationService;

    public AdminNotificationController(
            NotificationService notificationService) {

        this.notificationService = notificationService;
    }

    // Get all notifications for logged-in admin
    @GetMapping
    public ResponseEntity<?> getAdminNotifications(
            Authentication authentication) {

        return ResponseEntity.ok(
                notificationService.getAdminNotifications(
                        authentication.getName()
                )
        );
    }

    // Get unread notification count
    @GetMapping("/unread-count")
    public ResponseEntity<?> getAdminUnreadCount(
            Authentication authentication) {

        return ResponseEntity.ok(
                notificationService.getAdminUnreadCount(
                        authentication.getName()
                )
        );
    }

    // Mark admin notification as read
    @PatchMapping("/{notificationId}/read")
    public ResponseEntity<?> markAsRead(
            @PathVariable Long notificationId,
            Authentication authentication) {

        return ResponseEntity.ok(
                notificationService.markAdminNotificationAsRead(
                        notificationId,
                        authentication.getName()
                )
        );
    }
}
