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
    private String status;
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

        this.appointmentId = appointmentId;
        this.patientId = patientId;
        this.doctorId = doctorId;
        this.appointmentDate = appointmentDate;
        this.appointmentTime = appointmentTime;
        this.reason = reason;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public Long getAppointmentId() {
        return appointmentId;
    }

    public Long getPatientId() {
        return patientId;
    }

    public Long getDoctorId() {
        return doctorId;
    }

    public LocalDate getAppointmentDate() {
        return appointmentDate;
    }

    public LocalTime getAppointmentTime() {
        return appointmentTime;
    }

    public String getReason() {
        return reason;
    }

    public String getStatus() {
        return status;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }
}