package com.medicare.backend.dto;

import java.time.LocalTime;

public class AvailableSlotDTO {

    private LocalTime slotTime;
    private LocalTime endTime;
    private boolean available;
    private String reason; // "AVAILABLE", "BOOKED", "RESERVED_HOLD", "DOCTOR_BREAK", "PAST_TIME", "NOT_WORKING_DAY"

    public AvailableSlotDTO() {
    }

    public AvailableSlotDTO(LocalTime slotTime, LocalTime endTime, boolean available, String reason) {
        this.slotTime = slotTime;
        this.endTime = endTime;
        this.available = available;
        this.reason = reason;
    }

    public LocalTime getSlotTime() {
        return slotTime;
    }

    public void setSlotTime(LocalTime slotTime) {
        this.slotTime = slotTime;
    }

    public LocalTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalTime endTime) {
        this.endTime = endTime;
    }

    public boolean isAvailable() {
        return available;
    }

    public void setAvailable(boolean available) {
        this.available = available;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
