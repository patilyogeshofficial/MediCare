package com.medicare.backend.dto;

import java.time.OffsetDateTime;

public class NotificationResponseDTO {

    private Long notificationId;
    private String title;
    private String message;
    private String type;
    private String category;
    private String priority;
    private String actionUrl;
    private Long appointmentId;
    private Long prescriptionId;
    private Boolean isRead;
    private Boolean isArchived;
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

        this(notificationId, title, message, type, "GENERAL", "NORMAL", null, appointmentId, prescriptionId, isRead, false, createdAt);
    }

    public NotificationResponseDTO(
            Long notificationId,
            String title,
            String message,
            String type,
            String category,
            String priority,
            String actionUrl,
            Long appointmentId,
            Long prescriptionId,
            Boolean isRead,
            Boolean isArchived,
            OffsetDateTime createdAt) {

        this.notificationId = notificationId;
        this.title = title;
        this.message = message;
        this.type = type;
        this.category = category;
        this.priority = priority;
        this.actionUrl = actionUrl;
        this.appointmentId = appointmentId;
        this.prescriptionId = prescriptionId;
        this.isRead = isRead;
        this.isArchived = isArchived;
        this.createdAt = createdAt;
    }

    public Long getNotificationId() {
        return notificationId;
    }

    public void setNotificationId(Long notificationId) {
        this.notificationId = notificationId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }

    public String getActionUrl() {
        return actionUrl;
    }

    public void setActionUrl(String actionUrl) {
        this.actionUrl = actionUrl;
    }

    public Long getAppointmentId() {
        return appointmentId;
    }

    public void setAppointmentId(Long appointmentId) {
        this.appointmentId = appointmentId;
    }

    public Long getPrescriptionId() {
        return prescriptionId;
    }

    public void setPrescriptionId(Long prescriptionId) {
        this.prescriptionId = prescriptionId;
    }

    public Boolean getIsRead() {
        return isRead;
    }

    public void setIsRead(Boolean isRead) {
        this.isRead = isRead;
    }

    public Boolean getIsArchived() {
        return isArchived;
    }

    public void setIsArchived(Boolean isArchived) {
        this.isArchived = isArchived;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }
}