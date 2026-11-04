package com.medicare.backend.dto;

import java.time.OffsetDateTime;

public class UserResponseDTO {

    private Long userId;
    private String fullName;
    private String email;
    private String role;
    private Boolean isActive;
    private OffsetDateTime createdAt;

    public UserResponseDTO() {
    }

    public UserResponseDTO(Long userId, String fullName, String email,
                           String role, Boolean isActive, OffsetDateTime createdAt) {
        this.userId = userId;
        this.fullName = fullName;
        this.email = email;
        this.role = role;
        this.isActive = isActive;
        this.createdAt = createdAt;
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

    public String getRole() {
        return role;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }
}