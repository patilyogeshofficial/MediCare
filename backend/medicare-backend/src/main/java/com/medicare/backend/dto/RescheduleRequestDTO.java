package com.medicare.backend.dto;

import java.time.LocalDate;
import java.time.LocalTime;

import jakarta.validation.constraints.NotNull;

public class RescheduleRequestDTO {

    @NotNull(message = "Requested date is required")
    private LocalDate requestedDate;

    @NotNull(message = "Requested time is required")
    private LocalTime requestedTime;

    private String reason;

    public RescheduleRequestDTO() {
    }

    public RescheduleRequestDTO(LocalDate requestedDate, LocalTime requestedTime, String reason) {
        this.requestedDate = requestedDate;
        this.requestedTime = requestedTime;
        this.reason = reason;
    }

    public LocalDate getRequestedDate() {
        return requestedDate;
    }

    public void setRequestedDate(LocalDate requestedDate) {
        this.requestedDate = requestedDate;
    }

    public LocalTime getRequestedTime() {
        return requestedTime;
    }

    public void setRequestedTime(LocalTime requestedTime) {
        this.requestedTime = requestedTime;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
