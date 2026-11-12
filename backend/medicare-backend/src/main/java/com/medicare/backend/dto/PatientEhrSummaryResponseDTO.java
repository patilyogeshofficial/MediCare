package com.medicare.backend.dto;

import java.time.LocalDate;
import java.util.List;

public class PatientEhrSummaryResponseDTO {

    private Long patientId;
    private String fullName;
    private String email;
    private String phone;
    private LocalDate dateOfBirth;
    private String gender;
    private String bloodGroup;

    private List<MedicalConditionAllergyDTO> allergiesAndConditions;
    private List<ConsultationRecordResponseDTO> consultationRecords;
    private List<PatientVitalDTO> vitalsHistory;
    private PatientVitalDTO latestVitals;
    private List<PrescriptionResponseDTO> prescriptions;
    private List<MedicalDocumentDTO> documents;
    private List<MedicalRecordTimelineItemDTO> timeline;

    public PatientEhrSummaryResponseDTO() {
    }

    public Long getPatientId() {
        return patientId;
    }

    public void setPatientId(Long patientId) {
        this.patientId = patientId;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public LocalDate getDateOfBirth() {
        return dateOfBirth;
    }

    public void setDateOfBirth(LocalDate dateOfBirth) {
        this.dateOfBirth = dateOfBirth;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public String getBloodGroup() {
        return bloodGroup;
    }

    public void setBloodGroup(String bloodGroup) {
        this.bloodGroup = bloodGroup;
    }

    public List<MedicalConditionAllergyDTO> getAllergiesAndConditions() {
        return allergiesAndConditions;
    }

    public void setAllergiesAndConditions(List<MedicalConditionAllergyDTO> allergiesAndConditions) {
        this.allergiesAndConditions = allergiesAndConditions;
    }

    public List<ConsultationRecordResponseDTO> getConsultationRecords() {
        return consultationRecords;
    }

    public void setConsultationRecords(List<ConsultationRecordResponseDTO> consultationRecords) {
        this.consultationRecords = consultationRecords;
    }

    public List<PatientVitalDTO> getVitalsHistory() {
        return vitalsHistory;
    }

    public void setVitalsHistory(List<PatientVitalDTO> vitalsHistory) {
        this.vitalsHistory = vitalsHistory;
    }

    public PatientVitalDTO getLatestVitals() {
        return latestVitals;
    }

    public void setLatestVitals(PatientVitalDTO latestVitals) {
        this.latestVitals = latestVitals;
    }

    public List<PrescriptionResponseDTO> getPrescriptions() {
        return prescriptions;
    }

    public void setPrescriptions(List<PrescriptionResponseDTO> prescriptions) {
        this.prescriptions = prescriptions;
    }

    public List<MedicalDocumentDTO> getDocuments() {
        return documents;
    }

    public void setDocuments(List<MedicalDocumentDTO> documents) {
        this.documents = documents;
    }

    public List<MedicalRecordTimelineItemDTO> getTimeline() {
        return timeline;
    }

    public void setTimeline(List<MedicalRecordTimelineItemDTO> timeline) {
        this.timeline = timeline;
    }
}
