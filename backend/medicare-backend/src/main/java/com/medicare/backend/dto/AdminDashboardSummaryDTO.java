
package com.medicare.backend.dto;

public class AdminDashboardSummaryDTO {

    private long totalPatients;
    private long totalDoctors;
    private long totalAppointments;

    private long pendingAppointments;
    private long confirmedAppointments;
    private long completedAppointments;
    private long cancelledAppointments;
    private long rejectedAppointments;

    public AdminDashboardSummaryDTO(
            long totalPatients,
            long totalDoctors,
            long totalAppointments,
            long pendingAppointments,
            long confirmedAppointments,
            long completedAppointments,
            long cancelledAppointments,
            long rejectedAppointments) {

        this.totalPatients = totalPatients;
        this.totalDoctors = totalDoctors;
        this.totalAppointments = totalAppointments;
        this.pendingAppointments = pendingAppointments;
        this.confirmedAppointments = confirmedAppointments;
        this.completedAppointments = completedAppointments;
        this.cancelledAppointments = cancelledAppointments;
        this.rejectedAppointments = rejectedAppointments;
    }

    public long getTotalPatients() {
        return totalPatients;
    }

    public long getTotalDoctors() {
        return totalDoctors;
    }

    public long getTotalAppointments() {
        return totalAppointments;
    }

    public long getPendingAppointments() {
        return pendingAppointments;
    }

    public long getConfirmedAppointments() {
        return confirmedAppointments;
    }

    public long getCompletedAppointments() {
        return completedAppointments;
    }

    public long getCancelledAppointments() {
        return cancelledAppointments;
    }

    public long getRejectedAppointments() {
        return rejectedAppointments;
    }
}
