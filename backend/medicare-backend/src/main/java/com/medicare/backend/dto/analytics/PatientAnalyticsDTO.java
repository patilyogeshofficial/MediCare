package com.medicare.backend.dto.analytics;

import java.util.List;

public class PatientAnalyticsDTO {

    private long totalPatients;
    private List<TrendDataPointDTO> registrationTrends;
    private List<DemographicDistributionDTO> genderDistribution;
    private List<DemographicDistributionDTO> bloodGroupDistribution;
    private List<DemographicDistributionDTO> ageDistribution;

    public PatientAnalyticsDTO() {
    }

    public PatientAnalyticsDTO(
            long totalPatients,
            List<TrendDataPointDTO> registrationTrends,
            List<DemographicDistributionDTO> genderDistribution,
            List<DemographicDistributionDTO> bloodGroupDistribution,
            List<DemographicDistributionDTO> ageDistribution) {

        this.totalPatients = totalPatients;
        this.registrationTrends = registrationTrends;
        this.genderDistribution = genderDistribution;
        this.bloodGroupDistribution = bloodGroupDistribution;
        this.ageDistribution = ageDistribution;
    }

    public long getTotalPatients() {
        return totalPatients;
    }

    public void setTotalPatients(long totalPatients) {
        this.totalPatients = totalPatients;
    }

    public List<TrendDataPointDTO> getRegistrationTrends() {
        return registrationTrends;
    }

    public void setRegistrationTrends(List<TrendDataPointDTO> registrationTrends) {
        this.registrationTrends = registrationTrends;
    }

    public List<DemographicDistributionDTO> getGenderDistribution() {
        return genderDistribution;
    }

    public void setGenderDistribution(List<DemographicDistributionDTO> genderDistribution) {
        this.genderDistribution = genderDistribution;
    }

    public List<DemographicDistributionDTO> getBloodGroupDistribution() {
        return bloodGroupDistribution;
    }

    public void setBloodGroupDistribution(List<DemographicDistributionDTO> bloodGroupDistribution) {
        this.bloodGroupDistribution = bloodGroupDistribution;
    }

    public List<DemographicDistributionDTO> getAgeDistribution() {
        return ageDistribution;
    }

    public void setAgeDistribution(List<DemographicDistributionDTO> ageDistribution) {
        this.ageDistribution = ageDistribution;
    }
}
