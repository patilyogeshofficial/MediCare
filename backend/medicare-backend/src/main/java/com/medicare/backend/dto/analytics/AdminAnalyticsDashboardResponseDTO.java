package com.medicare.backend.dto.analytics;

import java.util.List;

public class AdminAnalyticsDashboardResponseDTO {

    private AdminAnalyticsOverviewDTO overview;
    private List<StatusDistributionDTO> appointmentStatusBreakdown;
    private List<TrendDataPointDTO> appointmentTrends;
    private List<DoctorWorkloadDTO> doctorWorkloads;
    private List<SpecializationAnalyticsDTO> specializationAnalytics;
    private PatientAnalyticsDTO patientAnalytics;

    private String filterType;
    private String startDate;
    private String endDate;

    public AdminAnalyticsDashboardResponseDTO() {
    }

    public AdminAnalyticsDashboardResponseDTO(
            AdminAnalyticsOverviewDTO overview,
            List<StatusDistributionDTO> appointmentStatusBreakdown,
            List<TrendDataPointDTO> appointmentTrends,
            List<DoctorWorkloadDTO> doctorWorkloads,
            List<SpecializationAnalyticsDTO> specializationAnalytics,
            PatientAnalyticsDTO patientAnalytics,
            String filterType,
            String startDate,
            String endDate) {

        this.overview = overview;
        this.appointmentStatusBreakdown = appointmentStatusBreakdown;
        this.appointmentTrends = appointmentTrends;
        this.doctorWorkloads = doctorWorkloads;
        this.specializationAnalytics = specializationAnalytics;
        this.patientAnalytics = patientAnalytics;
        this.filterType = filterType;
        this.startDate = startDate;
        this.endDate = endDate;
    }

    public AdminAnalyticsOverviewDTO getOverview() {
        return overview;
    }

    public void setOverview(AdminAnalyticsOverviewDTO overview) {
        this.overview = overview;
    }

    public List<StatusDistributionDTO> getAppointmentStatusBreakdown() {
        return appointmentStatusBreakdown;
    }

    public void setAppointmentStatusBreakdown(List<StatusDistributionDTO> appointmentStatusBreakdown) {
        this.appointmentStatusBreakdown = appointmentStatusBreakdown;
    }

    public List<TrendDataPointDTO> getAppointmentTrends() {
        return appointmentTrends;
    }

    public void setAppointmentTrends(List<TrendDataPointDTO> appointmentTrends) {
        this.appointmentTrends = appointmentTrends;
    }

    public List<DoctorWorkloadDTO> getDoctorWorkloads() {
        return doctorWorkloads;
    }

    public void setDoctorWorkloads(List<DoctorWorkloadDTO> doctorWorkloads) {
        this.doctorWorkloads = doctorWorkloads;
    }

    public List<SpecializationAnalyticsDTO> getSpecializationAnalytics() {
        return specializationAnalytics;
    }

    public void setSpecializationAnalytics(List<SpecializationAnalyticsDTO> specializationAnalytics) {
        this.specializationAnalytics = specializationAnalytics;
    }

    public PatientAnalyticsDTO getPatientAnalytics() {
        return patientAnalytics;
    }

    public void setPatientAnalytics(PatientAnalyticsDTO patientAnalytics) {
        this.patientAnalytics = patientAnalytics;
    }

    public String getFilterType() {
        return filterType;
    }

    public void setFilterType(String filterType) {
        this.filterType = filterType;
    }

    public String getStartDate() {
        return startDate;
    }

    public void setStartDate(String startDate) {
        this.startDate = startDate;
    }

    public String getEndDate() {
        return endDate;
    }

    public void setEndDate(String endDate) {
        this.endDate = endDate;
    }
}
