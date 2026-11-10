package com.medicare.backend.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import com.medicare.backend.dto.DoctorAvailabilityRequestDTO;
import com.medicare.backend.dto.DoctorAvailabilityResponseDTO;
import com.medicare.backend.service.DoctorAvailabilityService;

@RestController
@RequestMapping("/api/doctor-availability")
@PreAuthorize("hasRole('DOCTOR')")
public class DoctorAvailabilityController {

    private final DoctorAvailabilityService availabilityService;

    public DoctorAvailabilityController(
            DoctorAvailabilityService availabilityService) {
        this.availabilityService = availabilityService;
    }

    // Get logged-in doctor's availability
    @GetMapping("/my")
    public ResponseEntity<List<DoctorAvailabilityResponseDTO>> getMyAvailability(
            @AuthenticationPrincipal UserDetails userDetails) {

        return ResponseEntity.ok(
                availabilityService.getMyAvailability(userDetails.getUsername())
        );
    }

    // Save or update logged-in doctor's availability
    @PutMapping("/my")
    public ResponseEntity<List<DoctorAvailabilityResponseDTO>> saveMyAvailability(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody List<DoctorAvailabilityRequestDTO> requests) {

        return ResponseEntity.ok(
                availabilityService.saveMyAvailability(
                        userDetails.getUsername(),
                        requests
                )
        );
    }
}