package com.medicare.backend.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.medicare.backend.dto.UpdateUserStatusRequestDTO;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import jakarta.validation.Valid;

import com.medicare.backend.dto.CreateDoctorAccountRequestDTO;
import com.medicare.backend.dto.UserResponseDTO;
import com.medicare.backend.service.UserService;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public List<UserResponseDTO> getAllUsers() {
        return userService.getAllUsers();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/doctors")
    public ResponseEntity<UserResponseDTO> createDoctorAccount(
            @Valid @RequestBody CreateDoctorAccountRequestDTO request) {

        UserResponseDTO response = userService.createDoctorAccount(request);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // Activate or Deactivate User Account (Admin Only)
    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{userId}/status")
    public ResponseEntity<UserResponseDTO> updateUserStatus(
            @PathVariable Long userId,
            @Valid @RequestBody UpdateUserStatusRequestDTO request) {

        UserResponseDTO response = userService.updateUserStatus(userId, request);

        return ResponseEntity.ok(response);
    }
}