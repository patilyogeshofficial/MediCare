
package com.medicare.backend.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.medicare.backend.dto.DoctorRequestDTO;
import com.medicare.backend.dto.DoctorResponseDTO;
import com.medicare.backend.service.DoctorService;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/doctors")
public class DoctorController {

    private final DoctorService doctorService;

    public DoctorController(DoctorService doctorService) {
        this.doctorService = doctorService;
    }

    // Get all doctors (Admin, Doctor, Patient)
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'PATIENT')")
    @GetMapping
    public ResponseEntity<List<DoctorResponseDTO>> getAllDoctors() {

        return ResponseEntity.ok(doctorService.getAllDoctors());
    }

    // Get doctor by ID (Admin, Doctor, Patient)
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'PATIENT')")
    @GetMapping("/{doctorId}")
    public ResponseEntity<DoctorResponseDTO> getDoctorById(
            @PathVariable Long doctorId) {

        return ResponseEntity.ok(
                doctorService.getDoctorById(doctorId));
    }

    // Create doctor (Admin only)
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<DoctorResponseDTO> createDoctor(
            @Valid @RequestBody DoctorRequestDTO dto) {

        DoctorResponseDTO response = doctorService.createDoctor(dto);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // Update doctor (Admin or Doctor)
    @PreAuthorize("hasRole('ADMIN') or hasRole('DOCTOR')")
    @PutMapping("/{doctorId}")
    public ResponseEntity<DoctorResponseDTO> updateDoctor(
            @PathVariable Long doctorId,
            @Valid @RequestBody DoctorRequestDTO dto,
            @AuthenticationPrincipal UserDetails userDetails) {

        return ResponseEntity.ok(
                doctorService.updateDoctor(
                        doctorId,
                        dto,
                        userDetails.getUsername()));
    }

    // Delete doctor (Admin only)
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{doctorId}")
    public ResponseEntity<Void> deleteDoctor(
            @PathVariable Long doctorId) {

        doctorService.deleteDoctor(doctorId);

        return ResponseEntity.noContent().build();
    }
}
