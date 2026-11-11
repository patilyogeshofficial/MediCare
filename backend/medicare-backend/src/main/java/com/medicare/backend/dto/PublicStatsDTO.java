package com.medicare.backend.dto;

public class PublicStatsDTO {

    private long activeDoctorsCount;
    private long activeSpecializationsCount;
    private long completedAppointmentsCount;
    private long registeredPatientsCount;

    public PublicStatsDTO() {
    }

    public PublicStatsDTO(
            long activeDoctorsCount,
            long activeSpecializationsCount,
            long completedAppointmentsCount,
            long registeredPatientsCount) {

        this.activeDoctorsCount = activeDoctorsCount;
        this.activeSpecializationsCount = activeSpecializationsCount;
        this.completedAppointmentsCount = completedAppointmentsCount;
        this.registeredPatientsCount = registeredPatientsCount;
    }

    public long getActiveDoctorsCount() {
        return activeDoctorsCount;
    }

    public void setActiveDoctorsCount(long activeDoctorsCount) {
        this.activeDoctorsCount = activeDoctorsCount;
    }

    public long getActiveSpecializationsCount() {
        return activeSpecializationsCount;
    }

    public void setActiveSpecializationsCount(long activeSpecializationsCount) {
        this.activeSpecializationsCount = activeSpecializationsCount;
    }

    public long getCompletedAppointmentsCount() {
        return completedAppointmentsCount;
    }

    public void setCompletedAppointmentsCount(long completedAppointmentsCount) {
        this.completedAppointmentsCount = completedAppointmentsCount;
    }

    public long getRegisteredPatientsCount() {
        return registeredPatientsCount;
    }

    public void setRegisteredPatientsCount(long registeredPatientsCount) {
        this.registeredPatientsCount = registeredPatientsCount;
    }
}
