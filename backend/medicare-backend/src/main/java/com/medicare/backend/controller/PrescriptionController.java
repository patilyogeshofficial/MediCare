
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

    public PrescriptionController(
            PrescriptionService prescriptionService) {
        this.prescriptionService = prescriptionService;
    }

    // ==========================================
    // GET MY PRESCRIPTIONS (PATIENT ONLY)
    // ==========================================

    @GetMapping("/my")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<List<PrescriptionResponseDTO>> getMyPrescriptions(
            Authentication authentication) {

        return ResponseEntity.ok(
                prescriptionService.getMyPrescriptions(
                        authentication.getName()));
    }

    // ==========================================
    // GET ALL PRESCRIPTIONS (ADMIN ONLY)
    // ==========================================

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<PrescriptionResponseDTO>> getAllPrescriptions() {

        return ResponseEntity.ok(
                prescriptionService.getAllPrescriptions());
    }

    // ==========================================
    // GET PRESCRIPTION BY ID (ADMIN & DOCTOR)
    // ==========================================

    @GetMapping("/{prescriptionId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    public ResponseEntity<PrescriptionResponseDTO> getPrescriptionById(
            @PathVariable Long prescriptionId,
            Authentication authentication) {

        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        return ResponseEntity.ok(
                prescriptionService.getPrescriptionById(
                        prescriptionId,
                        authentication.getName(),
                        isAdmin));
    }

    // ==========================================
    // GET PRESCRIPTION BY APPOINTMENT (ADMIN & DOCTOR)
    // ==========================================

    @GetMapping("/appointment/{appointmentId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    public ResponseEntity<PrescriptionResponseDTO> getPrescriptionByAppointmentId(
            @PathVariable Long appointmentId,
            Authentication authentication) {

        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        return ResponseEntity.ok(
                prescriptionService.getPrescriptionByAppointmentId(
                        appointmentId,
                        authentication.getName(),
                        isAdmin));
    }

    // ==========================================
    // GET PRESCRIPTIONS BY PATIENT ID (ADMIN & DOCTOR)
    // ==========================================

    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    public ResponseEntity<List<PrescriptionResponseDTO>> getPrescriptionsByPatientId(
            @PathVariable Long patientId,
            Authentication authentication) {

        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        return ResponseEntity.ok(
                prescriptionService.getPrescriptionsByPatientId(
                        patientId,
                        authentication.getName(),
                        isAdmin));
    }

    // ==========================================
    // GET MY WRITTEN PRESCRIPTIONS (DOCTOR ONLY)
    // ==========================================

    @GetMapping("/my-doctor")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<List<PrescriptionResponseDTO>> getMyDoctorPrescriptions(
            Authentication authentication) {

        return ResponseEntity.ok(
                prescriptionService.getMyDoctorPrescriptions(
                        authentication.getName()));
    }

    // ==========================================
    // CREATE PRESCRIPTION (DOCTOR ONLY)
    // ==========================================

    @PostMapping
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<PrescriptionResponseDTO> createPrescription(
            @Valid @RequestBody PrescriptionRequestDTO requestDTO,
            Authentication authentication) {

        PrescriptionResponseDTO response =
                prescriptionService.createPrescription(
                        requestDTO,
                        authentication.getName());

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    // ==========================================
    // UPDATE PRESCRIPTION (ADMIN ONLY)
    // ==========================================

    @PutMapping("/{prescriptionId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PrescriptionResponseDTO> updatePrescription(
            @PathVariable Long prescriptionId,
            @Valid @RequestBody PrescriptionRequestDTO requestDTO) {

        return ResponseEntity.ok(
                prescriptionService.updatePrescription(
                        prescriptionId,
                        requestDTO));
    }

    // ==========================================
    // DELETE PRESCRIPTION (ADMIN ONLY)
    // ==========================================

    @DeleteMapping("/{prescriptionId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deletePrescription(
            @PathVariable Long prescriptionId) {

        prescriptionService.deletePrescription(prescriptionId);

        return ResponseEntity.noContent().build();
    }
    // Check prescription existence - DOCTOR only
@GetMapping("/appointment/{appointmentId}/my")
@PreAuthorize("hasRole('DOCTOR')")
public ResponseEntity<Boolean> hasPrescription(
        @PathVariable Long appointmentId,
        Authentication authentication) {

    return ResponseEntity.ok(
            prescriptionService.hasPrescription(
                    appointmentId,
                    authentication.getName()));
}
}
