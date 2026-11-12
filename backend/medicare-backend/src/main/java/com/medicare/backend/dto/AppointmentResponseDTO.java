package com.medicare.backend.dto;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;

public class AppointmentResponseDTO {

    private Long appointmentId;
    private Long patientId;
    private Long doctorId;
    private LocalDate appointmentDate;
    private LocalTime appointmentTime;
    private String reason;
    private String cancellationReason;
    private String status;
    private OffsetDateTime holdExpiresAt;
    private Integer queueNumber;
    private LocalDate rescheduleRequestedDate;
    private LocalTime rescheduleRequestedTime;
    private String rescheduleReason;
    private String rescheduleStatus;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    public AppointmentResponseDTO() {
    }

    public AppointmentResponseDTO(
            Long appointmentId,
            Long patientId,
            Long doctorId,
            LocalDate appointmentDate,
            LocalTime appointmentTime,
            String reason,
            String status,
            OffsetDateTime createdAt,
            OffsetDateTime updatedAt) {

        this(appointmentId, patientId, doctorId, appointmentDate, appointmentTime, reason, null, status, createdAt, updatedAt);
    }

    public AppointmentResponseDTO(
            Long appointmentId,
            Long patientId,
            Long doctorId,
            LocalDate appointmentDate,
            LocalTime appointmentTime,
            String reason,
            String cancellationReason,
            String status,
            OffsetDateTime createdAt,
            OffsetDateTime updatedAt) {

        this(appointmentId, patientId, doctorId, appointmentDate, appointmentTime, reason, cancellationReason, status, null, null, null, null, null, null, createdAt, updatedAt);
    }

    public AppointmentResponseDTO(
            Long appointmentId,
            Long patientId,
            Long doctorId,
            LocalDate appointmentDate,
            LocalTime appointmentTime,
            String reason,
            String cancellationReason,
            String status,
            OffsetDateTime holdExpiresAt,
            Integer queueNumber,
            LocalDate rescheduleRequestedDate,
            LocalTime rescheduleRequestedTime,
            String rescheduleReason,
            String rescheduleStatus,
            OffsetDateTime createdAt,
            OffsetDateTime updatedAt) {

        this.appointmentId = appointmentId;
        this.patientId = patientId;
        this.doctorId = doctorId;
        this.appointmentDate = appointmentDate;
        this.appointmentTime = appointmentTime;
        this.reason = reason;
        this.cancellationReason = cancellationReason;
        this.status = status;
        this.holdExpiresAt = holdExpiresAt;
        this.queueNumber = queueNumber;
        this.rescheduleRequestedDate = rescheduleRequestedDate;
        this.rescheduleRequestedTime = rescheduleRequestedTime;
        this.rescheduleReason = rescheduleReason;
        this.rescheduleStatus = rescheduleStatus;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public Long getAppointmentId() {
        return appointmentId;
    }

    public void setAppointmentId(Long appointmentId) {
        this.appointmentId = appointmentId;
    }

    public Long getPatientId() {
        return patientId;
    }

    public void setPatientId(Long patientId) {
        this.patientId = patientId;
    }

    public Long getDoctorId() {
        return doctorId;
    }

    public void setDoctorId(Long doctorId) {
        this.doctorId = doctorId;
    }

    public LocalDate getAppointmentDate() {
        return appointmentDate;
    }

    public void setAppointmentDate(LocalDate appointmentDate) {
        this.appointmentDate = appointmentDate;
    }

    public LocalTime getAppointmentTime() {
        return appointmentTime;
    }

    public void setAppointmentTime(LocalTime appointmentTime) {
        this.appointmentTime = appointmentTime;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getCancellationReason() {
        return cancellationReason;
    }

    public void setCancellationReason(String cancellationReason) {
        this.cancellationReason = cancellationReason;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public OffsetDateTime getHoldExpiresAt() {
        return holdExpiresAt;
    }

    public void setHoldExpiresAt(OffsetDateTime holdExpiresAt) {
        this.holdExpiresAt = holdExpiresAt;
    }

    public Integer getQueueNumber() {
        return queueNumber;
    }

    public void setQueueNumber(Integer queueNumber) {
        this.queueNumber = queueNumber;
    }

    public LocalDate getRescheduleRequestedDate() {
        return rescheduleRequestedDate;
    }

    public void setRescheduleRequestedDate(LocalDate rescheduleRequestedDate) {
        this.rescheduleRequestedDate = rescheduleRequestedDate;
    }

    public LocalTime getRescheduleRequestedTime() {
        return rescheduleRequestedTime;
    }

    public void setRescheduleRequestedTime(LocalTime rescheduleRequestedTime) {
        this.rescheduleRequestedTime = rescheduleRequestedTime;
    }

    public String getRescheduleReason() {
        return rescheduleReason;
    }

    public void setRescheduleReason(String rescheduleReason) {
        this.rescheduleReason = rescheduleReason;
    }

    public String getRescheduleStatus() {
        return rescheduleStatus;
    }

    public void setRescheduleStatus(String rescheduleStatus) {
        this.rescheduleStatus = rescheduleStatus;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(OffsetDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
