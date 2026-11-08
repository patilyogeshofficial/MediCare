package com.medicare.backend.dto;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;

public class MedicalHistoryResponseDTO {

    private Long appointmentId;
    private LocalDate appointmentDate;
    private LocalTime appointmentTime;
    private String doctorName;
    private String specialization;
    private String reason;
    private String diagnosis;
    private String medications;
    private String instructions;
    private OffsetDateTime prescribedAt;

    public MedicalHistoryResponseDTO(
            Long appointmentId,
            LocalDate appointmentDate,
            LocalTime appointmentTime,
            String doctorName,
            String specialization,
            String reason,
            String diagnosis,
            String medications,
            String instructions,
            OffsetDateTime prescribedAt) {

        this.appointmentId = appointmentId;
        this.appointmentDate = appointmentDate;
        this.appointmentTime = appointmentTime;
        this.doctorName = doctorName;
        this.specialization = specialization;
        this.reason = reason;
        this.diagnosis = diagnosis;
        this.medications = medications;
        this.instructions = instructions;
        this.prescribedAt = prescribedAt;
    }

    public Long getAppointmentId() {
        return appointmentId;
    }

    public LocalDate getAppointmentDate() {
        return appointmentDate;
    }

    public LocalTime getAppointmentTime() {
        return appointmentTime;
    }

    public String getDoctorName() {
        return doctorName;
    }

    public String getSpecialization() {
        return specialization;
    }

    public String getReason() {
        return reason;
    }

    public String getDiagnosis() {
        return diagnosis;
    }

    public String getMedications() {
        return medications;
    }

    public String getInstructions() {
        return instructions;
    }

    public OffsetDateTime getPrescribedAt() {
        return prescribedAt;
    }
}