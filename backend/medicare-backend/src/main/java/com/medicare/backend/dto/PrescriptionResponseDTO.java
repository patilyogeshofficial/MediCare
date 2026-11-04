package com.medicare.backend.dto;

import java.time.OffsetDateTime;

public class PrescriptionResponseDTO {

    private Long prescriptionId;
    private Long appointmentId;
    private String diagnosis;
    private String medications;
    private String instructions;
    private OffsetDateTime prescribedAt;

    public PrescriptionResponseDTO(
            Long prescriptionId,
            Long appointmentId,
            String diagnosis,
            String medications,
            String instructions,
            OffsetDateTime prescribedAt) {

        this.prescriptionId = prescriptionId;
        this.appointmentId = appointmentId;
        this.diagnosis = diagnosis;
        this.medications = medications;
        this.instructions = instructions;
        this.prescribedAt = prescribedAt;
    }

    // Getters

    public Long getPrescriptionId() {
        return prescriptionId;
    }

    public Long getAppointmentId() {
        return appointmentId;
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