package com.medicare.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AppointmentStatusUpdateDTO {

    @NotBlank(message = "Status is required")
    private String status;

    @Size(max = 500, message = "Cancellation reason cannot exceed 500 characters")
    private String cancellationReason;

    public AppointmentStatusUpdateDTO() {
    }

    public AppointmentStatusUpdateDTO(String status, String cancellationReason) {
        this.status = status;
        this.cancellationReason = cancellationReason;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getCancellationReason() {
        return cancellationReason;
    }

    public void setCancellationReason(String cancellationReason) {
        this.cancellationReason = cancellationReason;
    }
}
