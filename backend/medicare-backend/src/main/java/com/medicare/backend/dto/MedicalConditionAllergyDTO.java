package com.medicare.backend.dto;

import java.time.LocalDate;
import java.time.OffsetDateTime;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class MedicalConditionAllergyDTO {

    private Long conditionId;

    @NotNull(message = "Patient ID is required")
    private Long patientId;

    @NotBlank(message = "Condition type is required")
    private String type; // ALLERGY, CHRONIC_CONDITION, PAST_PROCEDURE, MEDICAL_HISTORY

    @NotBlank(message = "Name is required")
    private String name;

    private String severity; // MILD, MODERATE, SEVERE, LIFE_THREATENING
    private String notes;
    private LocalDate diagnosedDate;
    private String recordedBy;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    public MedicalConditionAllergyDTO() {
    }

    public Long getConditionId() {
        return conditionId;
    }

    public void setConditionId(Long conditionId) {
        this.conditionId = conditionId;
    }

    public Long getPatientId() {
        return patientId;
    }

    public void setPatientId(Long patientId) {
        this.patientId = patientId;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getSeverity() {
        return severity;
    }

    public void setSeverity(String severity) {
        this.severity = severity;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public LocalDate getDiagnosedDate() {
        return diagnosedDate;
    }

    public void setDiagnosedDate(LocalDate diagnosedDate) {
        this.diagnosedDate = diagnosedDate;
    }

    public String getRecordedBy() {
        return recordedBy;
    }

    public void setRecordedBy(String recordedBy) {
        this.recordedBy = recordedBy;
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
