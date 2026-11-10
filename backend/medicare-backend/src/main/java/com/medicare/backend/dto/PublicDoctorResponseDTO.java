
package com.medicare.backend.dto;

import java.math.BigDecimal;

public class PublicDoctorResponseDTO {

    private Long doctorId;
    private Long userId;
    private String fullName;
    private String specializationName;
    private String qualification;
    private Integer experienceYears;
    private BigDecimal consultationFee;

    public PublicDoctorResponseDTO() {
    }

    public PublicDoctorResponseDTO(
            Long doctorId,
            String fullName,
            String specializationName,
            String qualification,
            Integer experienceYears,
            BigDecimal consultationFee) {

        this(doctorId, null, fullName, specializationName, qualification, experienceYears, consultationFee);
    }

    public PublicDoctorResponseDTO(
            Long doctorId,
            Long userId,
            String fullName,
            String specializationName,
            String qualification,
            Integer experienceYears,
            BigDecimal consultationFee) {

        this.doctorId = doctorId;
        this.userId = userId;
        this.fullName = fullName;
        this.specializationName = specializationName;
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

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getFullName() {
        return fullName;
    }

    public String getSpecializationName() {
        return specializationName;
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
