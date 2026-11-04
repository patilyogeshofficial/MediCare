package com.medicare.backend.dto;

import java.math.BigDecimal;

public class DoctorResponseDTO {

    private Long doctorId;
    private Long userId;
    private Long specializationId;
    private String licenseNumber;
    private String qualification;
    private Integer experienceYears;
    private BigDecimal consultationFee;

    public DoctorResponseDTO() {
    }

    public DoctorResponseDTO(
            Long doctorId,
            Long userId,
            Long specializationId,
            String licenseNumber,
            String qualification,
            Integer experienceYears,
            BigDecimal consultationFee) {

        this.doctorId = doctorId;
        this.userId = userId;
        this.specializationId = specializationId;
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

    public Long getSpecializationId() {
        return specializationId;
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