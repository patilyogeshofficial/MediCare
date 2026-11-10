
package com.medicare.backend.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public class AdminDoctorUpdateDTO {

    @NotBlank(message = "Full name is required")
    @Size(max = 100)
    private String fullName;

    @NotBlank(message = "Email is required")
    @Email(message = "Enter a valid email")
    @Size(max = 150)
    private String email;

    @NotNull(message = "Specialization ID is required")
    @Positive(message = "Invalid specialization ID")
    private Long specializationId;

    @NotBlank(message = "License number is required")
    @Size(max = 100)
    private String licenseNumber;

    @Size(max = 150)
    private String qualification;

    @PositiveOrZero(message = "Experience cannot be negative")
    private Integer experienceYears;

    @NotNull(message = "Consultation fee is required")
    @DecimalMin(value = "0.00")
    private BigDecimal consultationFee;

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public Long getSpecializationId() { return specializationId; }
    public void setSpecializationId(Long specializationId) {
        this.specializationId = specializationId;
    }

    public String getLicenseNumber() { return licenseNumber; }
    public void setLicenseNumber(String licenseNumber) {
        this.licenseNumber = licenseNumber;
    }

    public String getQualification() { return qualification; }
    public void setQualification(String qualification) {
        this.qualification = qualification;
    }

    public Integer getExperienceYears() { return experienceYears; }
    public void setExperienceYears(Integer experienceYears) {
        this.experienceYears = experienceYears;
    }

    public BigDecimal getConsultationFee() { return consultationFee; }
    public void setConsultationFee(BigDecimal consultationFee) {
        this.consultationFee = consultationFee;
    }
}
