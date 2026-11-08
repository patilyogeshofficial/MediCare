
package com.medicare.backend.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.medicare.backend.dto.AdminProfileUpdateRequestDTO;
import com.medicare.backend.dto.UserResponseDTO;
import com.medicare.backend.entity.User;
import com.medicare.backend.enums.Role;
import com.medicare.backend.repository.UserRepository;

import org.springframework.security.crypto.password.PasswordEncoder;
import com.medicare.backend.dto.AdminChangePasswordRequestDTO;
@Service
public class AdminSettingsService {

    private final UserRepository userRepository;
private final PasswordEncoder passwordEncoder;

   public AdminSettingsService(
        UserRepository userRepository,
        PasswordEncoder passwordEncoder) {

    this.userRepository = userRepository;
    this.passwordEncoder = passwordEncoder;
}

    // Get logged-in admin profile
    @Transactional(readOnly = true)
    public UserResponseDTO getAdminProfile(String email) {

        User admin = getAuthenticatedAdmin(email);

        return convertToDTO(admin);
    }

    // Update logged-in admin profile
    @Transactional
    public UserResponseDTO updateAdminProfile(
            String email,
            AdminProfileUpdateRequestDTO request) {

        User admin = getAuthenticatedAdmin(email);

        String fullName = request.getFullName().trim();
        String newEmail = request.getEmail().trim().toLowerCase();

        // Check whether another account already uses this email
        if (!admin.getEmail().equalsIgnoreCase(newEmail)
                && userRepository.existsByEmailIgnoreCaseAndUserIdNot(
                        newEmail, admin.getUserId())) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Email is already registered");
        }

        admin.setFullName(fullName);
        admin.setEmail(newEmail);

        User updatedAdmin = userRepository.save(admin);

        return convertToDTO(updatedAdmin);
    }

    // Verify authenticated user is an admin
    private User getAuthenticatedAdmin(String email) {

        User admin = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Admin account not found"));

        if (admin.getRole() != Role.ADMIN) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Only administrators can access these settings");
        }

        return admin;
    }

    // Convert entity to safe response DTO
    private UserResponseDTO convertToDTO(User user) {

        return new UserResponseDTO(
                user.getUserId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole().name(),
                user.getIsActive(),
                user.getCreatedAt());
    }

@Transactional
public void changeAdminPassword(
        String email,
        AdminChangePasswordRequestDTO request) {

    User admin = getAuthenticatedAdmin(email);

    // Verify current password
    if (!passwordEncoder.matches(
            request.getCurrentPassword(),
            admin.getPasswordHash())) {

        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Current password is incorrect");
    }

    // Check new password confirmation
    if (!request.getNewPassword().equals(
            request.getConfirmPassword())) {

        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "New password and confirm password do not match");
    }

    // Prevent reusing the current password
    if (passwordEncoder.matches(
            request.getNewPassword(),
            admin.getPasswordHash())) {

        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "New password must be different from current password");
    }

    // Save securely hashed password
    admin.setPasswordHash(
            passwordEncoder.encode(request.getNewPassword()));

    userRepository.save(admin);
}

}
