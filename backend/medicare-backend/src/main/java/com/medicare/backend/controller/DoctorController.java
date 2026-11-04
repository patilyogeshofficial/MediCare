package com.medicare.backend.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.medicare.backend.dto.DoctorRequestDTO;
import com.medicare.backend.dto.DoctorResponseDTO;
import com.medicare.backend.service.DoctorService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/doctors")
public class DoctorController {

    private final DoctorService doctorService;

    public DoctorController(DoctorService doctorService) {
        this.doctorService = doctorService;
    }

    // Get all doctors
    @GetMapping
    public ResponseEntity<List<DoctorResponseDTO>> getAllDoctors() {

        return ResponseEntity.ok(doctorService.getAllDoctors());
    }

    // Get doctor by ID
    @GetMapping("/{doctorId}")
    public ResponseEntity<DoctorResponseDTO> getDoctorById(
            @PathVariable Long doctorId) {

        return ResponseEntity.ok(
                doctorService.getDoctorById(doctorId));
    }

    // Create doctor
    @PostMapping
    public ResponseEntity<DoctorResponseDTO> createDoctor(
            @Valid @RequestBody DoctorRequestDTO dto) {

        DoctorResponseDTO response = doctorService.createDoctor(dto);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // Update doctor
    @PutMapping("/{doctorId}")
    public ResponseEntity<DoctorResponseDTO> updateDoctor(
            @PathVariable Long doctorId,
            @Valid @RequestBody DoctorRequestDTO dto) {

        return ResponseEntity.ok(
                doctorService.updateDoctor(doctorId, dto));
    }

    // Delete doctor
    @DeleteMapping("/{doctorId}")
    public ResponseEntity<Void> deleteDoctor(
            @PathVariable Long doctorId) {

        doctorService.deleteDoctor(doctorId);

        return ResponseEntity.noContent().build();
    }
}