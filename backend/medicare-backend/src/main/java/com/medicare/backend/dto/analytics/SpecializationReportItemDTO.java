package com.medicare.backend.dto.analytics;

import java.math.BigDecimal;

public class SpecializationReportItemDTO {

    private Long specializationId;
    private String specializationName;
    private String description;
    private long doctorCount;
    private long activeDoctorCount;
    private long totalAppointments;
    private long completedAppointments;
    private double appointmentShare;
    private BigDecimal estimatedValue;

    public SpecializationReportItemDTO() {
    }

    public SpecializationReportItemDTO(
            Long specializationId,
            String specializationName,
            String description,
            long doctorCount,
            long activeDoctorCount,
            long totalAppointments,
            long completedAppointments,
            double appointmentShare,
            BigDecimal estimatedValue) {

        this.specializationId = specializationId;
        this.specializationName = specializationName;
        this.description = description;
        this.doctorCount = doctorCount;
        this.activeDoctorCount = activeDoctorCount;
        this.totalAppointments = totalAppointments;
        this.completedAppointments = completedAppointments;
        this.appointmentShare = appointmentShare;
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

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public long getDoctorCount() {
        return doctorCount;
    }

    public void setDoctorCount(long doctorCount) {
        this.doctorCount = doctorCount;
    }

    public long getActiveDoctorCount() {
        return activeDoctorCount;
    }

    public void setActiveDoctorCount(long activeDoctorCount) {
        this.activeDoctorCount = activeDoctorCount;
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

    public double getAppointmentShare() {
        return appointmentShare;
    }

    public void setAppointmentShare(double appointmentShare) {
        this.appointmentShare = appointmentShare;
    }

    public BigDecimal getEstimatedValue() {
        return estimatedValue;
    }

    public void setEstimatedValue(BigDecimal estimatedValue) {
        this.estimatedValue = estimatedValue;
    }
}
