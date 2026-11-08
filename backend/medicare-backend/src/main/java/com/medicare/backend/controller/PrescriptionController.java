package com.medicare.backend.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.medicare.backend.dto.PrescriptionRequestDTO;
import com.medicare.backend.dto.PrescriptionResponseDTO;
import com.medicare.backend.service.PrescriptionService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/prescriptions")
public class PrescriptionController {

    private final PrescriptionService prescriptionService;

    public PrescriptionController(PrescriptionService prescriptionService) {
        this.prescriptionService = prescriptionService;
    }

    // Get prescriptions belonging to the logged-in patient
    @GetMapping("/my")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<List<PrescriptionResponseDTO>> getMyPrescriptions(
            Authentication authentication) {

        return ResponseEntity.ok(
                prescriptionService.getMyPrescriptions(authentication.getName())
        );
    }

    // Get all prescriptions - Admin only
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<PrescriptionResponseDTO>> getAllPrescriptions() {
        return ResponseEntity.ok(prescriptionService.getAllPrescriptions());
    }

    // Get prescription by ID - Admin only
    @GetMapping("/{prescriptionId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PrescriptionResponseDTO> getPrescriptionById(
            @PathVariable Long prescriptionId) {

        return ResponseEntity.ok(
                prescriptionService.getPrescriptionById(prescriptionId)
        );
    }

    // Get prescription by appointment ID - Admin only
    @GetMapping("/appointment/{appointmentId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PrescriptionResponseDTO> getPrescriptionByAppointmentId(
            @PathVariable Long appointmentId) {

        return ResponseEntity.ok(
                prescriptionService.getPrescriptionByAppointmentId(appointmentId)
        );
    }

    // Create prescription - Admin only for now
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PrescriptionResponseDTO> createPrescription(
            @Valid @RequestBody PrescriptionRequestDTO requestDTO) {

        PrescriptionResponseDTO response =
                prescriptionService.createPrescription(requestDTO);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // Update prescription - Admin only for now
    @PutMapping("/{prescriptionId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PrescriptionResponseDTO> updatePrescription(
            @PathVariable Long prescriptionId,
            @Valid @RequestBody PrescriptionRequestDTO requestDTO) {

        return ResponseEntity.ok(
                prescriptionService.updatePrescription(prescriptionId, requestDTO)
        );
    }

    // Delete prescription - Admin only
    @DeleteMapping("/{prescriptionId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deletePrescription(
            @PathVariable Long prescriptionId) {

        prescriptionService.deletePrescription(prescriptionId);

        return ResponseEntity.noContent().build();
    }
}