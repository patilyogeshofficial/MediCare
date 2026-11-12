package com.medicare.backend.dto.analytics;

import java.math.BigDecimal;

public class DoctorReportItemDTO {

    private Long doctorId;
    private Long userId;
    private String fullName;
    private String email;
    private String specialization;
    private String licenseNumber;
    private String qualification;
    private Integer experienceYears;
    private BigDecimal consultationFee;
    private boolean isActive;
    private long totalAppointments;
    private long completedAppointments;
    private long cancelledAppointments;
    private double completionRate;
    private BigDecimal estimatedValue;

    public DoctorReportItemDTO() {
    }

    public DoctorReportItemDTO(
            Long doctorId,
            Long userId,
            String fullName,
            String email,
            String specialization,
            String licenseNumber,
            String qualification,
            Integer experienceYears,
            BigDecimal consultationFee,
            boolean isActive,
            long totalAppointments,
            long completedAppointments,
            long cancelledAppointments,
            double completionRate,
            BigDecimal estimatedValue) {

        this.doctorId = doctorId;
        this.userId = userId;
        this.fullName = fullName;
        this.email = email;
        this.specialization = specialization;
        this.licenseNumber = licenseNumber;
        this.qualification = qualification;
        this.experienceYears = experienceYears;
        this.consultationFee = consultationFee;
        this.isActive = isActive;
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

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getSpecialization() {
        return specialization;
    }

    public void setSpecialization(String specialization) {
        this.specialization = specialization;
    }

    public String getLicenseNumber() {
        return licenseNumber;
    }

    public void setLicenseNumber(String licenseNumber) {
        this.licenseNumber = licenseNumber;
    }

    public String getQualification() {
        return qualification;
    }

    public void setQualification(String qualification) {
        this.qualification = qualification;
    }

    public Integer getExperienceYears() {
        return experienceYears;
    }

    public void setExperienceYears(Integer experienceYears) {
        this.experienceYears = experienceYears;
    }

    public BigDecimal getConsultationFee() {
        return consultationFee;
    }

    public void setConsultationFee(BigDecimal consultationFee) {
        this.consultationFee = consultationFee;
    }

    public boolean isActive() {
        return isActive;
    }

    public void setActive(boolean active) {
        isActive = active;
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
