
package com.medicare.backend.entity;

import jakarta.persistence.*;

@Entity
@Table(
    name = "admin_notification_preferences",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_admin_notification_user",
            columnNames = "user_id"
        )
    }
)
public class AdminNotificationPreference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long preferenceId;

    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;

    @Column(nullable = false)
    private boolean allNotifications = true;

    @Column(nullable = false)
    private boolean appointmentNotifications = true;

    @Column(nullable = false)
    private boolean contactMessageNotifications = true;

    @Column(nullable = false)
    private boolean prescriptionNotifications = true;

    public AdminNotificationPreference() {
    }

    public Long getPreferenceId() {
        return preferenceId;
    }

    public void setPreferenceId(Long preferenceId) {
        this.preferenceId = preferenceId;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
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
