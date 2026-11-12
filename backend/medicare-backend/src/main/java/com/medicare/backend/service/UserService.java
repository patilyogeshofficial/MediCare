
package com.medicare.backend.service;

import java.util.List;
import java.util.Locale;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.medicare.backend.dto.CreateDoctorAccountRequestDTO;
import com.medicare.backend.dto.UpdateUserStatusRequestDTO;
import com.medicare.backend.dto.UserResponseDTO;
import com.medicare.backend.entity.User;
import com.medicare.backend.enums.Role;
import com.medicare.backend.repository.UserRepository;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final NotificationService notificationService;

    public UserService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            NotificationService notificationService) {

        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.notificationService = notificationService;
    }

    // Get all users (Admin Only)
    @Transactional(readOnly = true)
    public List<UserResponseDTO> getAllUsers() {

        return userRepository.findAll()
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

    // Convert User entity to response DTO
    private UserResponseDTO convertToDTO(User user) {

        return new UserResponseDTO(
                user.getUserId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole().name(),
                user.getIsActive(),
                user.getCreatedAt()
        );
    }

    // Create Doctor Account (Admin Only)
    @Transactional
    public UserResponseDTO createDoctorAccount(
            CreateDoctorAccountRequestDTO request) {

        // Normalize email
        String email = request.getEmail()
                .trim()
                .toLowerCase(Locale.ROOT);

        // Check duplicate email (case-insensitive)
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Email is already registered"
            );
        }

        // Create new user
        User user = new User();

        user.setFullName(request.getFullName().trim());
        user.setEmail(email);

        // Encrypt password
        user.setPasswordHash(
                passwordEncoder.encode(request.getPassword())
        );

        // Assign DOCTOR role
        user.setRole(Role.DOCTOR);

        // Activate account
        user.setIsActive(true);

        // Save user
        User savedUser = userRepository.save(user);

        return convertToDTO(savedUser);
    }

    // Activate or Deactivate User Account (Admin Only)
    @Transactional
    public UserResponseDTO updateUserStatus(
            Long userId,
            UpdateUserStatusRequestDTO request) {

        // Find user
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "User not found with ID: " + userId
                ));

        // Prevent changing ADMIN account status
        if (user.getRole() == Role.ADMIN) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Admin account status cannot be changed"
            );
        }

        // Update account status
        user.setIsActive(request.getIsActive());

        // Save updated user
        User updatedUser = userRepository.save(user);

        // Notify if doctor status changed
        if (user.getRole() == Role.DOCTOR) {
            String statusLabel = Boolean.TRUE.equals(request.getIsActive()) ? "Activated" : "Deactivated";

            // Notify admin
            notificationService.createAdminActivityNotification(
                    "Doctor Account " + statusLabel,
                    "Dr. " + updatedUser.getFullName() + "'s account has been " + statusLabel.toLowerCase() + ".",
                    "DOCTOR_STATUS_CHANGED",
                    null,
                    null,
                    "ACCOUNT",
                    "IMPORTANT",
                    "/admin/doctors"
            );

            // Notify doctor
            notificationService.createNotification(
                    updatedUser.getUserId(),
                    "Account Status Updated",
                    "Your doctor account status has been updated to: " + statusLabel + ".",
                    "DOCTOR_STATUS_CHANGED",
                    null,
                    null,
                    "ACCOUNT",
                    "IMPORTANT",
                    "/doctor/dashboard"
            );
        }

        return convertToDTO(updatedUser);
    }
}
