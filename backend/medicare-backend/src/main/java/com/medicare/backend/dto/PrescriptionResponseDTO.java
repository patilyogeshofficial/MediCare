package com.medicare.backend.dto;

import java.time.OffsetDateTime;

public class PrescriptionResponseDTO {

    private Long prescriptionId;
    private Long appointmentId;
    private String diagnosis;
    private String medications;
    private String instructions;
    private String verificationCode;
    private OffsetDateTime prescribedAt;
    private String doctorName;
    private String specialization;

    public PrescriptionResponseDTO() {
    }

    public PrescriptionResponseDTO(
            Long prescriptionId,
            Long appointmentId,
            String diagnosis,
            String medications,
            String instructions,
            OffsetDateTime prescribedAt) {

        this(prescriptionId, appointmentId, diagnosis, medications, instructions, null, prescribedAt);
    }

    public PrescriptionResponseDTO(
            Long prescriptionId,
            Long appointmentId,
            String diagnosis,
            String medications,
            String instructions,
            String verificationCode,
            OffsetDateTime prescribedAt) {

        this.prescriptionId = prescriptionId;
        this.appointmentId = appointmentId;
        this.diagnosis = diagnosis;
        this.medications = medications;
        this.instructions = instructions;
        this.verificationCode = verificationCode;
        this.prescribedAt = prescribedAt;
    }

    public PrescriptionResponseDTO(
            Long prescriptionId,
            Long appointmentId,
            String diagnosis,
            String medications,
            String instructions,
            OffsetDateTime prescribedAt,
            String doctorName,
            String specialization,
            String verificationCode) {

        this.prescriptionId = prescriptionId;
        this.appointmentId = appointmentId;
        this.diagnosis = diagnosis;
        this.medications = medications;
        this.instructions = instructions;
        this.prescribedAt = prescribedAt;
        this.doctorName = doctorName;
        this.specialization = specialization;
        this.verificationCode = verificationCode;
    }

    // Getters and Setters

    public Long getPrescriptionId() {
        return prescriptionId;
    }

    public void setPrescriptionId(Long prescriptionId) {
        this.prescriptionId = prescriptionId;
    }

    public Long getAppointmentId() {
        return appointmentId;
    }

    public void setAppointmentId(Long appointmentId) {
        this.appointmentId = appointmentId;
    }

    public String getDiagnosis() {
        return diagnosis;
    }

    public void setDiagnosis(String diagnosis) {
        this.diagnosis = diagnosis;
    }

    public String getMedications() {
        return medications;
    }

    public void setMedications(String medications) {
        this.medications = medications;
    }

    public String getInstructions() {
        return instructions;
    }

    public void setInstructions(String instructions) {
        this.instructions = instructions;
    }

    public String getVerificationCode() {
        return verificationCode;
    }

    public void setVerificationCode(String verificationCode) {
        this.verificationCode = verificationCode;
    }

    public OffsetDateTime getPrescribedAt() {
        return prescribedAt;
    }

    public void setPrescribedAt(OffsetDateTime prescribedAt) {
        this.prescribedAt = prescribedAt;
    }

    public String getDoctorName() {
        return doctorName;
    }

    public void setDoctorName(String doctorName) {
        this.doctorName = doctorName;
    }

    public String getSpecialization() {
        return specialization;
    }

    public void setSpecialization(String specialization) {
        this.specialization = specialization;
    }
}
