package com.medicare.backend.service;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.medicare.backend.dto.NotificationResponseDTO;

@Service
public class SseNotificationService {

    private static final Logger logger = LoggerFactory.getLogger(SseNotificationService.class);
    private static final Long SSE_TIMEOUT_MS = 600_000L; // 10 minutes

    // Map of userId -> List of active SseEmitters
    private final Map<Long, List<SseEmitter>> userEmitters = new ConcurrentHashMap<>();

    /**
     * Subscribe a user to the real-time Server-Sent Events stream.
     */
    public SseEmitter subscribe(Long userId) {
        SseEmitter emitter = new SseEmitter(SSE_TIMEOUT_MS);

        userEmitters.computeIfAbsent(userId, k -> new CopyOnWriteArrayList<>()).add(emitter);

        emitter.onCompletion(() -> removeEmitter(userId, emitter));
        emitter.onTimeout(() -> {
            logger.debug("SSE connection timed out for user: {}", userId);
            removeEmitter(userId, emitter);
        });
        emitter.onError(e -> {
            logger.debug("SSE connection error for user {}: {}", userId, e.getMessage());
            removeEmitter(userId, emitter);
        });

        // Send initial connection event
        try {
            emitter.send(SseEmitter.event()
                    .name("CONNECT")
                    .data("SSE connection established for user " + userId));
        } catch (IOException e) {
            logger.warn("Failed to send initial SSE connection event to user {}: {}", userId, e.getMessage());
            removeEmitter(userId, emitter);
        }

        return emitter;
    }

    /**
     * Send a real-time notification to all active client connections of a user.
     */
    public void sendNotification(Long userId, NotificationResponseDTO notification) {
        List<SseEmitter> emitters = userEmitters.get(userId);
        if (emitters == null || emitters.isEmpty()) {
            return;
        }

        List<SseEmitter> deadEmitters = new CopyOnWriteArrayList<>();

        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event()
                        .name("NOTIFICATION")
                        .data(notification));
            } catch (Exception e) {
                logger.debug("Failed to dispatch SSE notification to user {}: {}", userId, e.getMessage());
                deadEmitters.add(emitter);
            }
        }

        if (!deadEmitters.isEmpty()) {
            emitters.removeAll(deadEmitters);
            if (emitters.isEmpty()) {
                userEmitters.remove(userId);
            }
        }
    }

    /**
     * Send a heartbeat ping every 25 seconds to keep Render/reverse-proxy connections open.
     */
    @Scheduled(fixedRate = 25000)
    public void sendHeartbeat() {
        if (userEmitters.isEmpty()) {
            return;
        }

        userEmitters.forEach((userId, emitters) -> {
            List<SseEmitter> deadEmitters = new CopyOnWriteArrayList<>();

            for (SseEmitter emitter : emitters) {
                try {
                    emitter.send(SseEmitter.event()
                            .name("HEARTBEAT")
                            .data("ping"));
                } catch (Exception e) {
                    deadEmitters.add(emitter);
                }
            }

            if (!deadEmitters.isEmpty()) {
                emitters.removeAll(deadEmitters);
            }
        });

        // Prune empty entries
        userEmitters.entrySet().removeIf(entry -> entry.getValue().isEmpty());
    }

    private void removeEmitter(Long userId, SseEmitter emitter) {
        List<SseEmitter> emitters = userEmitters.get(userId);
        if (emitters != null) {
            emitters.remove(emitter);
            if (emitters.isEmpty()) {
                userEmitters.remove(userId);
            }
        }
    }
}
