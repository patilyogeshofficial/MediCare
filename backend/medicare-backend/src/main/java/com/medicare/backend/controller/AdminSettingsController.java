
package com.medicare.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.medicare.backend.dto.AdminProfileUpdateRequestDTO;
import com.medicare.backend.dto.UserResponseDTO;
import com.medicare.backend.service.AdminSettingsService;

import com.medicare.backend.dto.AdminChangePasswordRequestDTO;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/admin/settings")
@PreAuthorize("hasRole('ADMIN')")
public class AdminSettingsController {

    private final AdminSettingsService adminSettingsService;

    public AdminSettingsController(
            AdminSettingsService adminSettingsService) {

        this.adminSettingsService = adminSettingsService;
    }

    // Get admin profile
    @GetMapping("/profile")
    public ResponseEntity<UserResponseDTO> getAdminProfile(
            Authentication authentication) {

        return ResponseEntity.ok(
                adminSettingsService.getAdminProfile(
                        authentication.getName()));
    }

    // Update admin profile
    @PutMapping("/profile")
    public ResponseEntity<UserResponseDTO> updateAdminProfile(
            @Valid @RequestBody AdminProfileUpdateRequestDTO request,
            Authentication authentication) {

        return ResponseEntity.ok(
                adminSettingsService.updateAdminProfile(
                        authentication.getName(),
                        request));
    }
    @PutMapping("/change-password")
public ResponseEntity<String> changePassword(
        @Valid @RequestBody AdminChangePasswordRequestDTO request,
        Authentication authentication) {

    adminSettingsService.changeAdminPassword(
            authentication.getName(),
            request);

    return ResponseEntity.ok("Password changed successfully");
}
}
