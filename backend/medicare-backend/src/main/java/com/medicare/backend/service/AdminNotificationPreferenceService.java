
package com.medicare.backend.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.medicare.backend.dto.AdminNotificationPreferenceDTO;
import com.medicare.backend.entity.AdminNotificationPreference;
import com.medicare.backend.entity.User;
import com.medicare.backend.enums.Role;
import com.medicare.backend.repository.AdminNotificationPreferenceRepository;
import com.medicare.backend.repository.UserRepository;

@Service
public class AdminNotificationPreferenceService {

    private final AdminNotificationPreferenceRepository preferenceRepository;
    private final UserRepository userRepository;

    public AdminNotificationPreferenceService(
            AdminNotificationPreferenceRepository preferenceRepository,
            UserRepository userRepository) {

        this.preferenceRepository = preferenceRepository;
        this.userRepository = userRepository;
    }

    // Get preferences for the authenticated admin
    @Transactional
    public AdminNotificationPreferenceDTO getPreferences(String email) {

        User admin = getAdmin(email);

        AdminNotificationPreference preference =
                getOrCreatePreference(admin.getUserId());

        return convertToDTO(preference);
    }

    // Update preferences for the authenticated admin
    @Transactional
    public AdminNotificationPreferenceDTO updatePreferences(
            String email,
            AdminNotificationPreferenceDTO request) {

        User admin = getAdmin(email);

        AdminNotificationPreference preference =
                getOrCreatePreference(admin.getUserId());

        preference.setAllNotifications(request.isAllNotifications());
        preference.setAppointmentNotifications(
                request.isAppointmentNotifications());
        preference.setContactMessageNotifications(
                request.isContactMessageNotifications());
        preference.setPrescriptionNotifications(
                request.isPrescriptionNotifications());

        return convertToDTO(preferenceRepository.save(preference));
    }

    private User getAdmin(String email) {

        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Admin account not found"));

        if (user.getRole() != Role.ADMIN) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Only administrators can manage notification preferences");
        }

        return user;
    }

    private AdminNotificationPreference getOrCreatePreference(Long userId) {

        return preferenceRepository.findByUserId(userId)
                .orElseGet(() -> {
                    AdminNotificationPreference preference =
                            new AdminNotificationPreference();

                    preference.setUserId(userId);

                    return preferenceRepository.save(preference);
                });
    }

    private AdminNotificationPreferenceDTO convertToDTO(
            AdminNotificationPreference preference) {

        AdminNotificationPreferenceDTO dto =
                new AdminNotificationPreferenceDTO();

        dto.setAllNotifications(preference.isAllNotifications());
        dto.setAppointmentNotifications(
                preference.isAppointmentNotifications());
        dto.setContactMessageNotifications(
                preference.isContactMessageNotifications());
        dto.setPrescriptionNotifications(
                preference.isPrescriptionNotifications());

        return dto;
    }
}
