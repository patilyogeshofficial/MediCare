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
@RequestMapping("/api/notifications")
@PreAuthorize("hasAnyRole('PATIENT', 'DOCTOR', 'ADMIN')")
public class NotificationController {

    private final NotificationService notificationService;
    private final SseNotificationService sseNotificationService;
    private final UserRepository userRepository;

    public NotificationController(
            NotificationService notificationService,
            SseNotificationService sseNotificationService,
            UserRepository userRepository) {

        this.notificationService = notificationService;
        this.sseNotificationService = sseNotificationService;
        this.userRepository = userRepository;
    }

    // Get notifications for current user with optional category & unread filters
    @GetMapping("/my")
    public ResponseEntity<List<NotificationResponseDTO>> getMyNotifications(
            @RequestParam(required = false) String category,
            @RequestParam(required = false, defaultValue = "false") Boolean unreadOnly,
            Authentication authentication) {

        return ResponseEntity.ok(
                notificationService.getMyNotifications(
                        authentication.getName(),
                        category,
                        unreadOnly));
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

    // Archive / soft-delete individual notification
    @DeleteMapping("/{notificationId}")
    public ResponseEntity<NotificationResponseDTO> archiveNotification(
            @PathVariable Long notificationId,
            Authentication authentication) {

        return ResponseEntity.ok(
                notificationService.archiveNotification(
                        notificationId,
                        authentication.getName()));
    }

    // Clear (soft-delete) all notifications
    @DeleteMapping("/clear-all")
    public ResponseEntity<Void> clearAllNotifications(
            Authentication authentication) {

        notificationService.clearAllNotifications(
                authentication.getName());

        return ResponseEntity.noContent().build();
    }

    // Real-time Server-Sent Events stream
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamNotifications(Authentication authentication) {
        String email = authentication.getName().trim().toLowerCase();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User not found"));

        return sseNotificationService.subscribe(user.getUserId());
    }
}
