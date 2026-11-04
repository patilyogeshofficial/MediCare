package com.medicare.backend.dto;

import java.time.OffsetDateTime;

public class ContactMessageResponseDTO {

    private Long messageId;
    private String name;
    private String email;
    private String subject;
    private String message;
    private OffsetDateTime createdAt;

    public ContactMessageResponseDTO(
            Long messageId,
            String name,
            String email,
            String subject,
            String message,
            OffsetDateTime createdAt) {

        this.messageId = messageId;
        this.name = name;
        this.email = email;
        this.subject = subject;
        this.message = message;
        this.createdAt = createdAt;
    }

    // Getters

    public Long getMessageId() {
        return messageId;
    }

    public String getName() {
        return name;
    }

    public String getEmail() {
        return email;
    }

    public String getSubject() {
        return subject;
    }

    public String getMessage() {
        return message;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }
}