package com.medicare.backend.dto;

import java.time.OffsetDateTime;

public class NotificationResponseDTO {

    private Long notificationId;
    private String title;
    private String message;
    private String type;
    private Long appointmentId;
    private Long prescriptionId;
    private Boolean isRead;
    private OffsetDateTime createdAt;

    public NotificationResponseDTO() {
    }

    public NotificationResponseDTO(
            Long notificationId,
            String title,
            String message,
            String type,
            Long appointmentId,
            Long prescriptionId,
            Boolean isRead,
            OffsetDateTime createdAt) {

        this.notificationId = notificationId;
        this.title = title;
        this.message = message;
        this.type = type;
        this.appointmentId = appointmentId;
        this.prescriptionId = prescriptionId;
        this.isRead = isRead;
        this.createdAt = createdAt;
    }

    public Long getNotificationId() {
        return notificationId;
    }

    public String getTitle() {
        return title;
    }

    public String getMessage() {
        return message;
    }

    public String getType() {
        return type;
    }

    public Long getAppointmentId() {
        return appointmentId;
    }

    public Long getPrescriptionId() {
        return prescriptionId;
    }

    public Boolean getIsRead() {
        return isRead;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }
}