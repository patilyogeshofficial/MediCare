package com.medicare.backend.service;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.medicare.backend.dto.NotificationResponseDTO;

class SseNotificationServiceTest {

    private SseNotificationService sseNotificationService;

    @BeforeEach
    void setUp() {
        sseNotificationService = new SseNotificationService();
    }

    @Test
    @DisplayName("subscribe: Successfully creates SseEmitter for user")
    void testSubscribe_CreatesEmitter() {
        SseEmitter emitter = sseNotificationService.subscribe(100L);
        assertNotNull(emitter);
    }

    @Test
    @DisplayName("sendNotification: Dispatches to connected emitter without error")
    void testSendNotification_DeliversToSubscribedUser() {
        sseNotificationService.subscribe(200L);

        NotificationResponseDTO dto = new NotificationResponseDTO();
        dto.setNotificationId(1L);
        dto.setTitle("Test Appointment");
        dto.setMessage("Your consultation is scheduled");
        dto.setType("APPOINTMENT_CONFIRMED");
        dto.setCategory("APPOINTMENT");
        dto.setPriority("IMPORTANT");

        assertDoesNotThrow(() -> sseNotificationService.sendNotification(200L, dto));
    }

    @Test
    @DisplayName("sendHeartbeat: Scheduled heartbeat executes safely across empty and active clients")
    void testSendHeartbeat_SafeExecution() {
        sseNotificationService.subscribe(300L);
        assertDoesNotThrow(() -> sseNotificationService.sendHeartbeat());
    }
}
