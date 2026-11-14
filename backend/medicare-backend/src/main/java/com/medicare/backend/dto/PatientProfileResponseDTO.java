package com.medicare.backend.dto;

import java.time.LocalDate;

public class PatientProfileResponseDTO {

    private Long patientId;
    private String fullName;
    private String email;
    private LocalDate dateOfBirth;
    private String gender;
    private String phone;
    private String address;
    private String bloodGroup;
    private Boolean isActive;

    public PatientProfileResponseDTO() {
    }

    public PatientProfileResponseDTO(
            Long patientId,
            String fullName,
            String email,
            LocalDate dateOfBirth,
            String gender,
            String phone,
            String address,
            String bloodGroup) {

        this(patientId, fullName, email, dateOfBirth, gender, phone, address, bloodGroup, true);
    }

    public PatientProfileResponseDTO(
            Long patientId,
            String fullName,
            String email,
            LocalDate dateOfBirth,
            String gender,
            String phone,
            String address,
            String bloodGroup,
            Boolean isActive) {

        this.patientId = patientId;
        this.fullName = fullName;
        this.email = email;
        this.dateOfBirth = dateOfBirth;
        this.gender = gender;
        this.phone = phone;
        this.address = address;
        this.bloodGroup = bloodGroup;
        this.isActive = isActive;
    }

    public Long getPatientId() {
        return patientId;
    }

    public String getFullName() {
        return fullName;
    }

    public String getEmail() {
        return email;
    }

    public LocalDate getDateOfBirth() {
        return dateOfBirth;
    }

    public String getGender() {
        return gender;
    }

    public String getPhone() {
        return phone;
    }

    public String getAddress() {
        return address;
    }

    public String getBloodGroup() {
        return bloodGroup;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }
}