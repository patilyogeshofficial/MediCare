package com.medicare.backend.dto;

import java.time.LocalDate;

public class DoctorPatientResponseDTO {

    private Long patientId;
    private String fullName;
    private String email;
    private LocalDate dateOfBirth;
    private String gender;
    private String phone;
    private String address;
    private String bloodGroup;
    private LocalDate lastVisit;
    private Long totalAppointments;
    private String condition;

    public DoctorPatientResponseDTO(
            Long patientId,
            String fullName,
            String email,
            LocalDate dateOfBirth,
            String gender,
            String phone,
            String address,
            String bloodGroup,
            LocalDate lastVisit,
            Long totalAppointments,
            String condition) {
        this.patientId = patientId;
        this.fullName = fullName;
        this.email = email;
        this.dateOfBirth = dateOfBirth;
        this.gender = gender;
        this.phone = phone;
        this.address = address;
        this.bloodGroup = bloodGroup;
        this.lastVisit = lastVisit;
        this.totalAppointments = totalAppointments;
        this.condition = condition;
    }

    public Long getPatientId() { return patientId; }
    public String getFullName() { return fullName; }
    public String getEmail() { return email; }
    public LocalDate getDateOfBirth() { return dateOfBirth; }
    public String getGender() { return gender; }
    public String getPhone() { return phone; }
    public String getAddress() { return address; }
    public String getBloodGroup() { return bloodGroup; }
    public LocalDate getLastVisit() { return lastVisit; }
    public Long getTotalAppointments() { return totalAppointments; }
    public String getCondition() { return condition; }
}