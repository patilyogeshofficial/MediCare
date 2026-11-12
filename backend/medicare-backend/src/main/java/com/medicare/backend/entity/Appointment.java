package com.medicare.backend.entity;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "appointments")
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "appointment_id")
    private Long appointmentId;

    @Column(name = "patient_id", nullable = false)
    private Long patientId;

    @Column(name = "doctor_id", nullable = false)
    private Long doctorId;

    @Column(name = "appointment_date", nullable = false)
    private LocalDate appointmentDate;

    @Column(name = "appointment_time", nullable = false)
    private LocalTime appointmentTime;

    @Column(name = "reason")
    private String reason;

    @Column(name = "cancellation_reason")
    private String cancellationReason;

    @Column(name = "status", nullable = false)
    private String status;

    @Column(name = "hold_expires_at")
    private OffsetDateTime holdExpiresAt;

    @Column(name = "queue_number")
    private Integer queueNumber;

    @Column(name = "reschedule_requested_date")
    private LocalDate rescheduleRequestedDate;

    @Column(name = "reschedule_requested_time")
    private LocalTime rescheduleRequestedTime;

    @Column(name = "reschedule_reason")
    private String rescheduleReason;

    @Column(name = "reschedule_status")
    private String rescheduleStatus;

    @Column(name = "created_at", insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private OffsetDateTime updatedAt;

    public Appointment() {
    }

    // Getters and Setters

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

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
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
}