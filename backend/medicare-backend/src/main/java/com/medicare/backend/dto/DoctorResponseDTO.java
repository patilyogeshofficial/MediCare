package com.medicare.backend.dto;

import java.math.BigDecimal;

public class DoctorResponseDTO {

    private Long doctorId;
    private Long userId;
    private String fullName;
    private String email;
    private Long specializationId;
    private String specializationName;
    private String licenseNumber;
    private String qualification;
    private Integer experienceYears;
    private BigDecimal consultationFee;

    public DoctorResponseDTO() {
    }

    public DoctorResponseDTO(
            Long doctorId,
            Long userId,
            String fullName,
            String email,
            Long specializationId,
            String specializationName,
            String licenseNumber,
            String qualification,
            Integer experienceYears,
            BigDecimal consultationFee) {

        this.doctorId = doctorId;
        this.userId = userId;
        this.fullName = fullName;
        this.email = email;
        this.specializationId = specializationId;
        this.specializationName = specializationName;
        this.licenseNumber = licenseNumber;
        this.qualification = qualification;
        this.experienceYears = experienceYears;
        this.consultationFee = consultationFee;
    }

    public Long getDoctorId() {
        return doctorId;
    }

    public Long getUserId() {
        return userId;
    }

    public String getFullName() {
        return fullName;
    }

    public String getEmail() {
        return email;
    }

    public Long getSpecializationId() {
        return specializationId;
    }

    public String getSpecializationName() {
        return specializationName;
    }

    public String getLicenseNumber() {
        return licenseNumber;
    }

    public String getQualification() {
        return qualification;
    }

    public Integer getExperienceYears() {
        return experienceYears;
    }

    public BigDecimal getConsultationFee() {
        return consultationFee;
    }
}