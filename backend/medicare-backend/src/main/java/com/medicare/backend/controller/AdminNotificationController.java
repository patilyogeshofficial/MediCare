package com.medicare.backend.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.medicare.backend.dto.NotificationResponseDTO;
import com.medicare.backend.entity.User;
import com.medicare.backend.repository.UserRepository;
import com.medicare.backend.service.NotificationService;
import com.medicare.backend.service.SseNotificationService;

@RestController
@RequestMapping("/api/admin/notifications")
@PreAuthorize("hasRole('ADMIN')")
public class AdminNotificationController {

    private final NotificationService notificationService;
    private final SseNotificationService sseNotificationService;
    private final UserRepository userRepository;

    public AdminNotificationController(
            NotificationService notificationService,
            SseNotificationService sseNotificationService,
            UserRepository userRepository) {

        this.notificationService = notificationService;
        this.sseNotificationService = sseNotificationService;
        this.userRepository = userRepository;
    }

    // Get all notifications for logged-in admin with filtering
    @GetMapping
    public ResponseEntity<List<NotificationResponseDTO>> getAdminNotifications(
            @RequestParam(required = false) String category,
            @RequestParam(required = false, defaultValue = "false") Boolean unreadOnly,
            Authentication authentication) {

        return ResponseEntity.ok(
                notificationService.getAdminNotifications(
                        authentication.getName(),
                        category,
                        unreadOnly
                )
        );
    }

    // Get unread notification count
    @GetMapping("/unread-count")
    public ResponseEntity<Long> getAdminUnreadCount(
            Authentication authentication) {

        return ResponseEntity.ok(
                notificationService.getAdminUnreadCount(
                        authentication.getName()
                )
        );
    }

    // Mark admin notification as read
    @PatchMapping("/{notificationId}/read")
    public ResponseEntity<NotificationResponseDTO> markAsRead(
            @PathVariable Long notificationId,
            Authentication authentication) {

        return ResponseEntity.ok(
                notificationService.markAdminNotificationAsRead(
                        notificationId,
                        authentication.getName()
                )
        );
    }

    // Mark all admin notifications as read
    @PatchMapping("/mark-all-read")
    public ResponseEntity<Integer> markAllAsRead(
            Authentication authentication) {

        int updatedCount = notificationService.markAllAdminNotificationsAsRead(
                authentication.getName()
        );

        return ResponseEntity.ok(updatedCount);
    }

    // Archive / soft delete individual admin notification
    @DeleteMapping("/{notificationId}")
    public ResponseEntity<NotificationResponseDTO> archiveAdminNotification(
            @PathVariable Long notificationId,
            Authentication authentication) {

        return ResponseEntity.ok(
                notificationService.archiveAdminNotification(
                        notificationId,
                        authentication.getName()
                )
        );
    }

    // Clear (soft delete) all admin notifications
    @DeleteMapping("/clear-all")
    public ResponseEntity<Void> clearAllAdminNotifications(
            Authentication authentication) {

        notificationService.clearAllAdminNotifications(
                authentication.getName()
        );

        return ResponseEntity.noContent().build();
    }

    // Real-time Server-Sent Events stream for admin
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamAdminNotifications(Authentication authentication) {
        String email = authentication.getName().trim().toLowerCase();
        User admin = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Admin not found"));

        return sseNotificationService.subscribe(admin.getUserId());
    }
}
