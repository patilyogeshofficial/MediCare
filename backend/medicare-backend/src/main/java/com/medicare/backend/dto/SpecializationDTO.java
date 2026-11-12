package com.medicare.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class SpecializationDTO {

    private Long specializationId;

    @NotBlank(message = "Specialization name is required")
    @Size(min = 2, max = 100, message = "Specialization name must be between 2 and 100 characters")
    private String specializationName;

    @Size(max = 500, message = "Description cannot exceed 500 characters")
    private String description;

    private Long doctorCount;

    public SpecializationDTO() {
    }

    public SpecializationDTO(Long specializationId, String specializationName, String description) {
        this.specializationId = specializationId;
        this.specializationName = specializationName;
        this.description = description;
    }

    public SpecializationDTO(Long specializationId, String specializationName, String description, Long doctorCount) {
        this.specializationId = specializationId;
        this.specializationName = specializationName;
        this.description = description;
        this.doctorCount = doctorCount;
    }

    public Long getSpecializationId() {
        return specializationId;
    }

    public void setSpecializationId(Long specializationId) {
        this.specializationId = specializationId;
    }

    public String getSpecializationName() {
        return specializationName;
    }

    public void setSpecializationName(String specializationName) {
        this.specializationName = specializationName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Long getDoctorCount() {
        return doctorCount;
    }

    public void setDoctorCount(Long doctorCount) {
        this.doctorCount = doctorCount;
    }
}
