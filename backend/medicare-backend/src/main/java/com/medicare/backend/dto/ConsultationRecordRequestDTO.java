package com.medicare.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class ConsultationRecordRequestDTO {

    @NotNull(message = "Appointment ID is required")
    private Long appointmentId;

    @NotNull(message = "Patient ID is required")
    private Long patientId;

    private String symptoms;
    private String clinicalObservations;

    @NotBlank(message = "Clinical diagnosis is required")
    private String diagnosis;

    private String treatmentPlan;
    private String followUpRecommendation;
    private String consultationNotes;

    public ConsultationRecordRequestDTO() {
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

    public String getSymptoms() {
        return symptoms;
    }

    public void setSymptoms(String symptoms) {
        this.symptoms = symptoms;
    }

    public String getClinicalObservations() {
        return clinicalObservations;
    }

    public void setClinicalObservations(String clinicalObservations) {
        this.clinicalObservations = clinicalObservations;
    }

    public String getDiagnosis() {
        return diagnosis;
    }

    public void setDiagnosis(String diagnosis) {
        this.diagnosis = diagnosis;
    }

    public String getTreatmentPlan() {
        return treatmentPlan;
    }

    public void setTreatmentPlan(String treatmentPlan) {
        this.treatmentPlan = treatmentPlan;
    }

    public String getFollowUpRecommendation() {
        return followUpRecommendation;
    }

    public void setFollowUpRecommendation(String followUpRecommendation) {
        this.followUpRecommendation = followUpRecommendation;
    }

    public String getConsultationNotes() {
        return consultationNotes;
    }

    public void setConsultationNotes(String consultationNotes) {
        this.consultationNotes = consultationNotes;
    }
}
