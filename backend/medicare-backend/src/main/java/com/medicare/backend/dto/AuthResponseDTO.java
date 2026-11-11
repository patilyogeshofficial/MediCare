package com.medicare.backend.dto;

public class AuthResponseDTO {

    private String token;
    private String tokenType;
    private Long userId;
    private String fullName;
    private String email;
    private String role;
    private Boolean isActive;

    public AuthResponseDTO() {
    }

    public AuthResponseDTO(
            String token,
            Long userId,
            String fullName,
            String email,
            String role) {

        this(token, userId, fullName, email, role, true);
    }

    public AuthResponseDTO(
            String token,
            Long userId,
            String fullName,
            String email,
            String role,
            Boolean isActive) {

        this.token = token;
        this.tokenType = "Bearer";
        this.userId = userId;
        this.fullName = fullName;
        this.email = email;
        this.role = role;
        this.isActive = isActive;
    }

    public String getToken() {
        return token;
    }

    public String getTokenType() {
        return tokenType;
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

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }
}