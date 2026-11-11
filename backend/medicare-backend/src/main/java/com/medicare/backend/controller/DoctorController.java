
package com.medicare.backend.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.medicare.backend.dto.PublicDoctorResponseDTO;
import com.medicare.backend.dto.DoctorRequestDTO;
import com.medicare.backend.dto.DoctorResponseDTO;
import com.medicare.backend.service.DoctorService;
import com.medicare.backend.dto.AdminDoctorUpdateDTO;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.Authentication;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/doctors")
public class DoctorController {

    private final DoctorService doctorService;

    public DoctorController(DoctorService doctorService) {
        this.doctorService = doctorService;
    }

    // Get all doctors (Public access, inactive doctors hidden unless requested by Admin)
    @GetMapping
    public ResponseEntity<List<PublicDoctorResponseDTO>> getAllDoctors(
            @RequestParam(value = "includeInactive", required = false) Boolean includeInactive,
            Authentication authentication) {

        boolean isAdmin = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_ADMIN"));

        boolean shouldIncludeInactive = isAdmin && (includeInactive == null || includeInactive);

        return ResponseEntity.ok(
                doctorService.getAllDoctors(shouldIncludeInactive));
    }
    // Get doctor by ID (Admin, Doctor, Patient)
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'PATIENT')")
    @GetMapping("/{doctorId}")
    public ResponseEntity<?> getDoctorById(
            @PathVariable Long doctorId,
            Authentication authentication) {

        boolean isPatient = authentication.getAuthorities()
                .stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_PATIENT"));

        if (isPatient) {
            return ResponseEntity.ok(
                    doctorService.getPublicDoctorById(doctorId));
        }

        return ResponseEntity.ok(
                doctorService.getDoctorById(doctorId));
    }

    // Get currently logged-in doctor's own profile
    @PreAuthorize("hasRole('DOCTOR')")
    @GetMapping("/me")
    public ResponseEntity<DoctorResponseDTO> getMyDoctorProfile(
            Authentication authentication) {

        return ResponseEntity.ok(
                doctorService.getMyDoctorProfile(
                        authentication.getName()));
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

    // Admin updates complete doctor account and profile
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{doctorId}/admin")
    public ResponseEntity<DoctorResponseDTO> updateDoctorByAdmin(
            @PathVariable Long doctorId,
            @Valid @RequestBody AdminDoctorUpdateDTO dto) {

        return ResponseEntity.ok(
                doctorService.updateDoctorByAdmin(doctorId, dto));
    }

}
