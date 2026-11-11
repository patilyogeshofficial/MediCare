
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
    private Boolean isActive;

    public PublicDoctorResponseDTO() {
    }

    public PublicDoctorResponseDTO(
            Long doctorId,
            String fullName,
            String specializationName,
            String qualification,
            Integer experienceYears,
            BigDecimal consultationFee) {

        this(doctorId, null, fullName, specializationName, qualification, experienceYears, consultationFee, true);
    }

    public PublicDoctorResponseDTO(
            Long doctorId,
            Long userId,
            String fullName,
            String specializationName,
            String qualification,
            Integer experienceYears,
            BigDecimal consultationFee) {

        this(doctorId, userId, fullName, specializationName, qualification, experienceYears, consultationFee, true);
    }

    public PublicDoctorResponseDTO(
            Long doctorId,
            Long userId,
            String fullName,
            String specializationName,
            String qualification,
            Integer experienceYears,
            BigDecimal consultationFee,
            Boolean isActive) {

        this.doctorId = doctorId;
        this.userId = userId;
        this.fullName = fullName;
        this.specializationName = specializationName;
        this.qualification = qualification;
        this.experienceYears = experienceYears;
        this.consultationFee = consultationFee;
        this.isActive = isActive;
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

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }
}
