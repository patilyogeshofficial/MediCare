package com.medicare.backend.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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

    // Get all prescriptions
    @GetMapping
    public ResponseEntity<List<PrescriptionResponseDTO>> getAllPrescriptions() {
        return ResponseEntity.ok(prescriptionService.getAllPrescriptions());
    }

    // Get prescription by ID
    @GetMapping("/{prescriptionId}")
    public ResponseEntity<PrescriptionResponseDTO> getPrescriptionById(
            @PathVariable Long prescriptionId) {
        return ResponseEntity.ok(
                prescriptionService.getPrescriptionById(prescriptionId));
    }

    // Get prescription by appointment ID
    @GetMapping("/appointment/{appointmentId}")
    public ResponseEntity<PrescriptionResponseDTO> getPrescriptionByAppointmentId(
            @PathVariable Long appointmentId) {
        return ResponseEntity.ok(
                prescriptionService.getPrescriptionByAppointmentId(appointmentId));
    }

    // Create prescription
    @PostMapping
    public ResponseEntity<PrescriptionResponseDTO> createPrescription(
            @Valid @RequestBody PrescriptionRequestDTO requestDTO) {
        PrescriptionResponseDTO response =
                prescriptionService.createPrescription(requestDTO);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // Update prescription
    @PutMapping("/{prescriptionId}")
    public ResponseEntity<PrescriptionResponseDTO> updatePrescription(
            @PathVariable Long prescriptionId,
            @Valid @RequestBody PrescriptionRequestDTO requestDTO) {
        return ResponseEntity.ok(
                prescriptionService.updatePrescription(prescriptionId, requestDTO));
    }

    // Delete prescription
    @DeleteMapping("/{prescriptionId}")
    public ResponseEntity<Void> deletePrescription(
            @PathVariable Long prescriptionId) {
        prescriptionService.deletePrescription(prescriptionId);
        return ResponseEntity.noContent().build();
    }
}