package com.medicare.backend.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class PatientRequestDTO {

    @NotNull(message = "User ID is required")
    private Long userId;

    @PastOrPresent(message = "Date of birth cannot be in the future")
    private LocalDate dateOfBirth;

    @Pattern(
        regexp = "MALE|FEMALE|OTHER|PREFER_NOT_TO_SAY",
        message = "Invalid gender value"
    )
    private String gender;

    @Pattern(
        regexp = "^[0-9]{10,15}$",
        message = "Phone number must contain 10 to 15 digits"
    )
    private String phone;

    @Size(max = 1000, message = "Address cannot exceed 1000 characters")
    private String address;

    @Pattern(
        regexp = "A\\+|A-|B\\+|B-|AB\\+|AB-|O\\+|O-|^$",
        message = "Invalid blood group"
    )
    private String bloodGroup;

    public Long getUserId() {
        return userId;
    }
    

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public LocalDate getDateOfBirth() {
        return dateOfBirth;
    }

    public void setDateOfBirth(LocalDate dateOfBirth) {
        this.dateOfBirth = dateOfBirth;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getBloodGroup() {
        return bloodGroup;
    }

    public void setBloodGroup(String bloodGroup) {
        this.bloodGroup = bloodGroup;
    }
}