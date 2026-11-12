package com.medicare.backend.dto.analytics;

import java.math.BigDecimal;

public class SpecializationAnalyticsDTO {

    private Long specializationId;
    private String specializationName;
    private long doctorCount;
    private long appointmentCount;
    private long completedCount;
    private double percentageOfTotal;
    private BigDecimal estimatedValue;

    public SpecializationAnalyticsDTO() {
    }

    public SpecializationAnalyticsDTO(
            Long specializationId,
            String specializationName,
            long doctorCount,
            long appointmentCount,
            long completedCount,
            double percentageOfTotal,
            BigDecimal estimatedValue) {

        this.specializationId = specializationId;
        this.specializationName = specializationName;
        this.doctorCount = doctorCount;
        this.appointmentCount = appointmentCount;
        this.completedCount = completedCount;
        this.percentageOfTotal = percentageOfTotal;
        this.estimatedValue = estimatedValue;
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

    public long getDoctorCount() {
        return doctorCount;
    }

    public void setDoctorCount(long doctorCount) {
        this.doctorCount = doctorCount;
    }

    public long getAppointmentCount() {
        return appointmentCount;
    }

    public void setAppointmentCount(long appointmentCount) {
        this.appointmentCount = appointmentCount;
    }

    public long getCompletedCount() {
        return completedCount;
    }

    public void setCompletedCount(long completedCount) {
        this.completedCount = completedCount;
    }

    public double getPercentageOfTotal() {
        return percentageOfTotal;
    }

    public void setPercentageOfTotal(double percentageOfTotal) {
        this.percentageOfTotal = percentageOfTotal;
    }

    public BigDecimal getEstimatedValue() {
        return estimatedValue;
    }

    public void setEstimatedValue(BigDecimal estimatedValue) {
        this.estimatedValue = estimatedValue;
    }
}
