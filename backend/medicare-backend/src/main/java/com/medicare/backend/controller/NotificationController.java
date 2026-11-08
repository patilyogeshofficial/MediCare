package com.medicare.backend.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.medicare.backend.dto.NotificationResponseDTO;
import com.medicare.backend.service.NotificationService;

@RestController
@RequestMapping("/api/notifications")
@PreAuthorize("hasRole('PATIENT')")
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

        List<NotificationResponseDTO> notifications =
                notificationService.getMyNotifications(
                        authentication.getName());

        return ResponseEntity.ok(notifications);
    }

    // Get unread notification count
    @GetMapping("/unread-count")
    public ResponseEntity<Long> getUnreadCount(
            Authentication authentication) {

        long count = notificationService.getUnreadCount(
                authentication.getName());

        return ResponseEntity.ok(count);
    }

    // Mark notification as read
    @PatchMapping("/{notificationId}/read")
    public ResponseEntity<NotificationResponseDTO> markAsRead(
            @PathVariable Long notificationId,
            Authentication authentication) {

        NotificationResponseDTO response =
                notificationService.markAsRead(
                        notificationId,
                        authentication.getName());

        return ResponseEntity.ok(response);
    }
}