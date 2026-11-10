
package com.medicare.backend.dto;

import java.math.BigDecimal;

public class PublicDoctorResponseDTO {

    private Long doctorId;
    private String fullName;
    private String specializationName;
    private String qualification;
    private Integer experienceYears;
    private BigDecimal consultationFee;

    public PublicDoctorResponseDTO(
            Long doctorId,
            String fullName,
            String specializationName,
            String qualification,
            Integer experienceYears,
            BigDecimal consultationFee) {

        this.doctorId = doctorId;
        this.fullName = fullName;
        this.specializationName = specializationName;
        this.qualification = qualification;
        this.experienceYears = experienceYears;
        this.consultationFee = consultationFee;
    }

    public Long getDoctorId() {
        return doctorId;
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
