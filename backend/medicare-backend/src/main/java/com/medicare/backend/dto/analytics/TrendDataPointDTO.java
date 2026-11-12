package com.medicare.backend.dto.analytics;

public class TrendDataPointDTO {

    private String date;
    private String label;
    private long total;
    private long completed;
    private long cancelled;

    public TrendDataPointDTO() {
    }

    public TrendDataPointDTO(String date, String label, long total, long completed, long cancelled) {
        this.date = date;
        this.label = label;
        this.total = total;
        this.completed = completed;
        this.cancelled = cancelled;
    }

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public long getTotal() {
        return total;
    }

    public void setTotal(long total) {
        this.total = total;
    }

    public long getCompleted() {
        return completed;
    }

    public void setCompleted(long completed) {
        this.completed = completed;
    }

    public long getCancelled() {
        return cancelled;
    }

    public void setCancelled(long cancelled) {
        this.cancelled = cancelled;
    }
}
