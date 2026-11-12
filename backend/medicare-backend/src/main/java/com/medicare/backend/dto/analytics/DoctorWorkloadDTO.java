package com.medicare.backend.dto.analytics;

import java.math.BigDecimal;

public class DoctorWorkloadDTO {

    private Long doctorId;
    private String doctorName;
    private String specializationName;
    private String licenseNumber;
    private boolean isActive;
    private BigDecimal consultationFee;
    private long totalAppointments;
    private long completedAppointments;
    private long cancelledAppointments;
    private double completionRate;
    private BigDecimal estimatedValue;

    public DoctorWorkloadDTO() {
    }

    public DoctorWorkloadDTO(
            Long doctorId,
            String doctorName,
            String specializationName,
            String licenseNumber,
            boolean isActive,
            BigDecimal consultationFee,
            long totalAppointments,
            long completedAppointments,
            long cancelledAppointments,
            double completionRate,
            BigDecimal estimatedValue) {

        this.doctorId = doctorId;
        this.doctorName = doctorName;
        this.specializationName = specializationName;
        this.licenseNumber = licenseNumber;
        this.isActive = isActive;
        this.consultationFee = consultationFee;
        this.totalAppointments = totalAppointments;
        this.completedAppointments = completedAppointments;
        this.cancelledAppointments = cancelledAppointments;
        this.completionRate = completionRate;
        this.estimatedValue = estimatedValue;
    }

    public Long getDoctorId() {
        return doctorId;
    }

    public void setDoctorId(Long doctorId) {
        this.doctorId = doctorId;
    }

    public String getDoctorName() {
        return doctorName;
    }

    public void setDoctorName(String doctorName) {
        this.doctorName = doctorName;
    }

    public String getSpecializationName() {
        return specializationName;
    }

    public void setSpecializationName(String specializationName) {
        this.specializationName = specializationName;
    }

    public String getLicenseNumber() {
        return licenseNumber;
    }

    public void setLicenseNumber(String licenseNumber) {
        this.licenseNumber = licenseNumber;
    }

    public boolean isActive() {
        return isActive;
    }

    public void setActive(boolean active) {
        isActive = active;
    }

    public BigDecimal getConsultationFee() {
        return consultationFee;
    }

    public void setConsultationFee(BigDecimal consultationFee) {
        this.consultationFee = consultationFee;
    }

    public long getTotalAppointments() {
        return totalAppointments;
    }

    public void setTotalAppointments(long totalAppointments) {
        this.totalAppointments = totalAppointments;
    }

    public long getCompletedAppointments() {
        return completedAppointments;
    }

    public void setCompletedAppointments(long completedAppointments) {
        this.completedAppointments = completedAppointments;
    }

    public long getCancelledAppointments() {
        return cancelledAppointments;
    }

    public void setCancelledAppointments(long cancelledAppointments) {
        this.cancelledAppointments = cancelledAppointments;
    }

    public double getCompletionRate() {
        return completionRate;
    }

    public void setCompletionRate(double completionRate) {
        this.completionRate = completionRate;
    }

    public BigDecimal getEstimatedValue() {
        return estimatedValue;
    }

    public void setEstimatedValue(BigDecimal estimatedValue) {
        this.estimatedValue = estimatedValue;
    }
}
