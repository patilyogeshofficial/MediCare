
package com.medicare.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.medicare.backend.dto.AdminNotificationPreferenceDTO;
import com.medicare.backend.service.AdminNotificationPreferenceService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/admin/settings/preferences")
@PreAuthorize("hasRole('ADMIN')")
public class AdminNotificationPreferenceController {

    private final AdminNotificationPreferenceService preferenceService;

    public AdminNotificationPreferenceController(
            AdminNotificationPreferenceService preferenceService) {

        this.preferenceService = preferenceService;
    }

    @GetMapping
    public ResponseEntity<AdminNotificationPreferenceDTO> getPreferences(
            Authentication authentication) {

        return ResponseEntity.ok(
                preferenceService.getPreferences(authentication.getName()));
    }

    @PutMapping
    public ResponseEntity<AdminNotificationPreferenceDTO> updatePreferences(
            @RequestBody AdminNotificationPreferenceDTO request,
            Authentication authentication) {

        return ResponseEntity.ok(
                preferenceService.updatePreferences(
                        authentication.getName(), request));
    }
}
