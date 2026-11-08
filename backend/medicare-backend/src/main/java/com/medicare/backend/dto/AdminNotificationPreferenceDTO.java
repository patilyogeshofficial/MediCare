
package com.medicare.backend.dto;

public class AdminNotificationPreferenceDTO {

    private boolean allNotifications;
    private boolean appointmentNotifications;
    private boolean contactMessageNotifications;
    private boolean prescriptionNotifications;

    public AdminNotificationPreferenceDTO() {
    }

    public boolean isAllNotifications() {
        return allNotifications;
    }

    public void setAllNotifications(boolean allNotifications) {
        this.allNotifications = allNotifications;
    }

    public boolean isAppointmentNotifications() {
        return appointmentNotifications;
    }

    public void setAppointmentNotifications(boolean appointmentNotifications) {
        this.appointmentNotifications = appointmentNotifications;
    }

    public boolean isContactMessageNotifications() {
        return contactMessageNotifications;
    }

    public void setContactMessageNotifications(boolean contactMessageNotifications) {
        this.contactMessageNotifications = contactMessageNotifications;
    }

    public boolean isPrescriptionNotifications() {
        return prescriptionNotifications;
    }

    public void setPrescriptionNotifications(boolean prescriptionNotifications) {
        this.prescriptionNotifications = prescriptionNotifications;
    }
}
