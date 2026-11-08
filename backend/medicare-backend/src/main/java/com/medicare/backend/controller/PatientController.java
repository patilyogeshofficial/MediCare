
package com.medicare.backend.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.medicare.backend.dto.PatientProfileResponseDTO;
import com.medicare.backend.dto.PatientProfileUpdateDTO;
import com.medicare.backend.dto.PatientRequestDTO;
import com.medicare.backend.dto.PatientResponseDTO;
import com.medicare.backend.service.PatientService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/patients")
public class PatientController {

    private final PatientService patientService;

    public PatientController(PatientService patientService) {
        this.patientService = patientService;
    }

    // ==========================================
    // GET ALL PATIENTS - ADMIN ONLY
    // ==========================================

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<PatientResponseDTO>> getAllPatients() {

        return ResponseEntity.ok(
                patientService.getAllPatients());
    }

    // ==========================================
    // GET PATIENT BY ID - ADMIN ONLY
    // ==========================================

    @GetMapping("/{patientId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PatientResponseDTO> getPatientById(
            @PathVariable Long patientId) {

        return ResponseEntity.ok(
                patientService.getPatientById(patientId));
    }

    // ==========================================
    // CREATE PATIENT - ADMIN ONLY
    // ==========================================

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PatientResponseDTO> createPatient(
            @Valid @RequestBody PatientRequestDTO request) {

        PatientResponseDTO response =
                patientService.createPatient(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    // ==========================================
    // UPDATE PATIENT - ADMIN ONLY
    // ==========================================

    @PutMapping("/{patientId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PatientResponseDTO> updatePatient(
            @PathVariable Long patientId,
            @Valid @RequestBody PatientRequestDTO request) {

        return ResponseEntity.ok(
                patientService.updatePatient(patientId, request));
    }

    // ==========================================
    // DELETE PATIENT - ADMIN ONLY
    // ==========================================

    @DeleteMapping("/{patientId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deletePatient(
            @PathVariable Long patientId) {

        patientService.deletePatient(patientId);

        return ResponseEntity.noContent().build();
    }

    // ==========================================
    // GET MY PROFILE - PATIENT ONLY
    // ==========================================

    @GetMapping("/my-profile")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<PatientProfileResponseDTO> getMyProfile(
            Authentication authentication) {

        return ResponseEntity.ok(
                patientService.getMyProfile(
                        authentication.getName()));
    }

    // ==========================================
    // UPDATE MY PROFILE - PATIENT ONLY
    // ==========================================

    @PutMapping("/my-profile")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<PatientProfileResponseDTO> updateMyProfile(
            @Valid @RequestBody PatientProfileUpdateDTO request,
            Authentication authentication) {

        return ResponseEntity.ok(
                patientService.updateMyProfile(
                        authentication.getName(),
                        request));
    }
}
