package com.medicare.backend.dto.analytics;

public class DemographicDistributionDTO {

    private String category;
    private long count;
    private double percentage;

    public DemographicDistributionDTO() {
    }

    public DemographicDistributionDTO(String category, long count, double percentage) {
        this.category = category;
        this.count = count;
        this.percentage = percentage;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public long getCount() {
        return count;
    }

    public void setCount(long count) {
        this.count = count;
    }

    public double getPercentage() {
        return percentage;
    }

    public void setPercentage(double percentage) {
        this.percentage = percentage;
    }
}
