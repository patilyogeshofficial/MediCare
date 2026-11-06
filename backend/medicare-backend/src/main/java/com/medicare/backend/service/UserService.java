package com.medicare.backend.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.medicare.backend.dto.UserResponseDTO;
import com.medicare.backend.entity.User;
import com.medicare.backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import com.medicare.backend.dto.CreateDoctorAccountRequestDTO;
import com.medicare.backend.dto.UpdateUserStatusRequestDTO;
import com.medicare.backend.enums.Role;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {

        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<UserResponseDTO> getAllUsers() {

        return userRepository.findAll()
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

    private UserResponseDTO convertToDTO(User user) {

        return new UserResponseDTO(
                user.getUserId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole().name(),
                user.getIsActive(),
                user.getCreatedAt());

    }

    // Create Doctor Account (Admin Only)
    public UserResponseDTO createDoctorAccount(
            CreateDoctorAccountRequestDTO request) {

        // 1. Check duplicate email
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Email is already registered");
        }

        // 2. Create new User
        User user = new User();

        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());

        // 3. Encrypt password
        user.setPasswordHash(
                passwordEncoder.encode(request.getPassword()));

        // 4. Assign DOCTOR role
        user.setRole(Role.DOCTOR);

        // 5. Activate account
        user.setIsActive(true);

        // 6. Save user
        User savedUser = userRepository.save(user);

        // 7. Return response DTO
        return convertToDTO(savedUser);
    }

    // Activate or Deactivate User Account (Admin Only)
    public UserResponseDTO updateUserStatus(
            Long userId,
            UpdateUserStatusRequestDTO request) {

        // 1. Find user by ID
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "User not found with ID: " + userId));
        // Prevent changing ADMIN account status
        if (user.getRole() == Role.ADMIN) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Admin account status cannot be changed");
        }
        // 2. Update account status
        user.setIsActive(request.getIsActive());

        // 3. Save updated user
        User updatedUser = userRepository.save(user);

        // 4. Return updated user details
        return convertToDTO(updatedUser);
    }
}