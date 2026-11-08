
package com.medicare.backend.dto;

import java.time.OffsetDateTime;

public class ContactMessageResponseDTO {

    private Long messageId;
    private String name;
    private String email;
    private String phone;
    private String subject;
    private String message;
    private boolean isRead;
    private OffsetDateTime createdAt;

    public ContactMessageResponseDTO(
            Long messageId,
            String name,
            String email,
            String phone,
            String subject,
            String message,
            boolean isRead,
            OffsetDateTime createdAt) {

        this.messageId = messageId;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.subject = subject;
        this.message = message;
        this.isRead = isRead;
        this.createdAt = createdAt;
    }

    public Long getMessageId() {
        return messageId;
    }

    public String getName() {
        return name;
    }

    public String getEmail() {
        return email;
    }

    public String getPhone() {
        return phone;
    }

    public String getSubject() {
        return subject;
    }

    public String getMessage() {
        return message;
    }

    public boolean getIsRead() {
        return isRead;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }
}
