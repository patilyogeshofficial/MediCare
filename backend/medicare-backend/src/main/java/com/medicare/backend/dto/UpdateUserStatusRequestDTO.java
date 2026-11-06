package com.medicare.backend.dto;

import jakarta.validation.constraints.NotNull;

public class UpdateUserStatusRequestDTO {

    @NotNull(message = "Account status is required")
    private Boolean isActive;

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }
}