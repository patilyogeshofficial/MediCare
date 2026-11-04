package com.medicare.backend.dto;

import java.time.LocalDate;

public class PatientResponseDTO {

    private Long patientId;
    private Long userId;
    private LocalDate dateOfBirth;
    private String gender;
    private String phone;
    private String address;
    private String bloodGroup;

    public PatientResponseDTO() {
    }

    public PatientResponseDTO(Long patientId, Long userId,
            LocalDate dateOfBirth, String gender,
            String phone, String address, String bloodGroup) {

        this.patientId = patientId;
        this.userId = userId;
        this.dateOfBirth = dateOfBirth;
        this.gender = gender;
        this.phone = phone;
        this.address = address;
        this.bloodGroup = bloodGroup;
    }

    public Long getPatientId() {
        return patientId;
    }

    public Long getUserId() {
        return userId;
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
}