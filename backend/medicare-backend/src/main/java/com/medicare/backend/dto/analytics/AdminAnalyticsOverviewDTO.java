package com.medicare.backend.dto.analytics;

import java.math.BigDecimal;

public class AdminAnalyticsOverviewDTO {

    private long totalPatients;
    private long totalDoctors;
    private long activeDoctors;
    private long inactiveDoctors;

    private long totalAppointments;
    private long pendingAppointments;
    private long confirmedAppointments;
    private long completedAppointments;
    private long cancelledAppointments;
    private long rejectedAppointments;

    private long totalPrescriptions;

    private BigDecimal estimatedConsultationValue;
    private BigDecimal completedConsultationsValue;
    private BigDecimal averageDoctorFee;

    private boolean revenueTrackingAvailable;
    private String revenueTrackingNotice;

    public AdminAnalyticsOverviewDTO() {
    }

    public AdminAnalyticsOverviewDTO(
            long totalPatients,
            long totalDoctors,
            long activeDoctors,
            long inactiveDoctors,
            long totalAppointments,
            long pendingAppointments,
            long confirmedAppointments,
            long completedAppointments,
            long cancelledAppointments,
            long rejectedAppointments,
            long totalPrescriptions,
            BigDecimal estimatedConsultationValue,
            BigDecimal completedConsultationsValue,
            BigDecimal averageDoctorFee,
            boolean revenueTrackingAvailable,
            String revenueTrackingNotice) {

        this.totalPatients = totalPatients;
        this.totalDoctors = totalDoctors;
        this.activeDoctors = activeDoctors;
        this.inactiveDoctors = inactiveDoctors;
        this.totalAppointments = totalAppointments;
        this.pendingAppointments = pendingAppointments;
        this.confirmedAppointments = confirmedAppointments;
        this.completedAppointments = completedAppointments;
        this.cancelledAppointments = cancelledAppointments;
        this.rejectedAppointments = rejectedAppointments;
        this.totalPrescriptions = totalPrescriptions;
        this.estimatedConsultationValue = estimatedConsultationValue;
        this.completedConsultationsValue = completedConsultationsValue;
        this.averageDoctorFee = averageDoctorFee;
        this.revenueTrackingAvailable = revenueTrackingAvailable;
        this.revenueTrackingNotice = revenueTrackingNotice;
    }

    public long getTotalPatients() {
        return totalPatients;
    }

    public void setTotalPatients(long totalPatients) {
        this.totalPatients = totalPatients;
    }

    public long getTotalDoctors() {
        return totalDoctors;
    }

    public void setTotalDoctors(long totalDoctors) {
        this.totalDoctors = totalDoctors;
    }

    public long getActiveDoctors() {
        return activeDoctors;
    }

    public void setActiveDoctors(long activeDoctors) {
        this.activeDoctors = activeDoctors;
    }

    public long getInactiveDoctors() {
        return inactiveDoctors;
    }

    public void setInactiveDoctors(long inactiveDoctors) {
        this.inactiveDoctors = inactiveDoctors;
    }

    public long getTotalAppointments() {
        return totalAppointments;
    }

    public void setTotalAppointments(long totalAppointments) {
        this.totalAppointments = totalAppointments;
    }

    public long getPendingAppointments() {
        return pendingAppointments;
    }

    public void setPendingAppointments(long pendingAppointments) {
        this.pendingAppointments = pendingAppointments;
    }

    public long getConfirmedAppointments() {
        return confirmedAppointments;
    }

    public void setConfirmedAppointments(long confirmedAppointments) {
        this.confirmedAppointments = confirmedAppointments;
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

    public long getRejectedAppointments() {
        return rejectedAppointments;
    }

    public void setRejectedAppointments(long rejectedAppointments) {
        this.rejectedAppointments = rejectedAppointments;
    }

    public long getTotalPrescriptions() {
        return totalPrescriptions;
    }

    public void setTotalPrescriptions(long totalPrescriptions) {
        this.totalPrescriptions = totalPrescriptions;
    }

    public BigDecimal getEstimatedConsultationValue() {
        return estimatedConsultationValue;
    }

    public void setEstimatedConsultationValue(BigDecimal estimatedConsultationValue) {
        this.estimatedConsultationValue = estimatedConsultationValue;
    }

    public BigDecimal getCompletedConsultationsValue() {
        return completedConsultationsValue;
    }

    public void setCompletedConsultationsValue(BigDecimal completedConsultationsValue) {
        this.completedConsultationsValue = completedConsultationsValue;
    }

    public BigDecimal getAverageDoctorFee() {
        return averageDoctorFee;
    }

    public void setAverageDoctorFee(BigDecimal averageDoctorFee) {
        this.averageDoctorFee = averageDoctorFee;
    }

    public boolean isRevenueTrackingAvailable() {
        return revenueTrackingAvailable;
    }

    public void setRevenueTrackingAvailable(boolean revenueTrackingAvailable) {
        this.revenueTrackingAvailable = revenueTrackingAvailable;
    }

    public String getRevenueTrackingNotice() {
        return revenueTrackingNotice;
    }

    public void setRevenueTrackingNotice(String revenueTrackingNotice) {
        this.revenueTrackingNotice = revenueTrackingNotice;
    }
}
