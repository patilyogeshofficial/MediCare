package com.medicare.backend.dto.analytics;

/**
 * Privacy-safe appointment report item for administrative analytics.
 * Strictly excludes clinical notes, symptoms, and consultation reasons.
 */
public class AppointmentReportItemDTO {

    private Long appointmentId;
    private String appointmentDate;
    private String appointmentTime;
    private String patientName;
    private String doctorName;
    private String specialization;
    private String status;
    private Integer queueNumber;
    private String createdAt;

    public AppointmentReportItemDTO() {
    }

    public AppointmentReportItemDTO(
            Long appointmentId,
            String appointmentDate,
            String appointmentTime,
            String patientName,
            String doctorName,
            String specialization,
            String status,
            Integer queueNumber,
            String createdAt) {

        this.appointmentId = appointmentId;
        this.appointmentDate = appointmentDate;
        this.appointmentTime = appointmentTime;
        this.patientName = patientName;
        this.doctorName = doctorName;
        this.specialization = specialization;
        this.status = status;
        this.queueNumber = queueNumber;
        this.createdAt = createdAt;
    }

    public Long getAppointmentId() {
        return appointmentId;
    }

    public void setAppointmentId(Long appointmentId) {
        this.appointmentId = appointmentId;
    }

    public String getAppointmentDate() {
        return appointmentDate;
    }

    public void setAppointmentDate(String appointmentDate) {
        this.appointmentDate = appointmentDate;
    }

    public String getAppointmentTime() {
        return appointmentTime;
    }

    public void setAppointmentTime(String appointmentTime) {
        this.appointmentTime = appointmentTime;
    }

    public String getPatientName() {
        return patientName;
    }

    public void setPatientName(String patientName) {
        this.patientName = patientName;
    }

    public String getDoctorName() {
        return doctorName;
    }

    public void setDoctorName(String doctorName) {
        this.doctorName = doctorName;
    }

    public String getSpecialization() {
        return specialization;
    }

    public void setSpecialization(String specialization) {
        this.specialization = specialization;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Integer getQueueNumber() {
        return queueNumber;
    }

    public void setQueueNumber(Integer queueNumber) {
        this.queueNumber = queueNumber;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }
}
