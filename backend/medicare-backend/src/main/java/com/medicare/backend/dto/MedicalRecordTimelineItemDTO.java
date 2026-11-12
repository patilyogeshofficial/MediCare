package com.medicare.backend.dto;

import java.time.OffsetDateTime;
import java.util.Map;

public class MedicalRecordTimelineItemDTO {

    private String id;
    private String eventType; // CONSULTATION, PRESCRIPTION, VITAL, DOCUMENT, CONDITION
    private OffsetDateTime eventDate;
    private String title;
    private String subtitle;
    private String doctorName;
    private String badge;
    private String summary;
    private Map<String, Object> details;

    public MedicalRecordTimelineItemDTO() {
    }

    public MedicalRecordTimelineItemDTO(
            String id,
            String eventType,
            OffsetDateTime eventDate,
            String title,
            String subtitle,
            String doctorName,
            String badge,
            String summary,
            Map<String, Object> details) {

        this.id = id;
        this.eventType = eventType;
        this.eventDate = eventDate;
        this.title = title;
        this.subtitle = subtitle;
        this.doctorName = doctorName;
        this.badge = badge;
        this.summary = summary;
        this.details = details;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getEventType() {
        return eventType;
    }

    public void setEventType(String eventType) {
        this.eventType = eventType;
    }

    public OffsetDateTime getEventDate() {
        return eventDate;
    }

    public void setEventDate(OffsetDateTime eventDate) {
        this.eventDate = eventDate;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getSubtitle() {
        return subtitle;
    }

    public void setSubtitle(String subtitle) {
        this.subtitle = subtitle;
    }

    public String getDoctorName() {
        return doctorName;
    }

    public void setDoctorName(String doctorName) {
        this.doctorName = doctorName;
    }

    public String getBadge() {
        return badge;
    }

    public void setBadge(String badge) {
        this.badge = badge;
    }

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }

    public Map<String, Object> getDetails() {
        return details;
    }

    public void setDetails(Map<String, Object> details) {
        this.details = details;
    }
}
