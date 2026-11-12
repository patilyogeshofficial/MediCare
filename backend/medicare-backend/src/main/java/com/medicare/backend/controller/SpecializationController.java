package com.medicare.backend.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.medicare.backend.dto.SpecializationDTO;
import com.medicare.backend.entity.Specialization;
import com.medicare.backend.service.SpecializationService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/specializations")
public class SpecializationController {

    private final SpecializationService specializationService;

    public SpecializationController(SpecializationService specializationService) {
        this.specializationService = specializationService;
    }

    // Get all specializations (Public access)
    @GetMapping
    public ResponseEntity<List<Specialization>> getAllSpecializations() {
        return ResponseEntity.ok(specializationService.getAllSpecializations());
    }

    // Get specialization by ID
    @GetMapping("/{id}")
    public ResponseEntity<Specialization> getSpecializationById(@PathVariable Long id) {
        return ResponseEntity.ok(specializationService.getSpecializationById(id));
    }

    // Create a new specialization (Admin only)
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<Specialization> createSpecialization(
            @Valid @RequestBody SpecializationDTO dto) {
        Specialization created = specializationService.createSpecialization(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // Update an existing specialization (Admin only)
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<Specialization> updateSpecialization(
            @PathVariable Long id,
            @Valid @RequestBody SpecializationDTO dto) {
        Specialization updated = specializationService.updateSpecialization(id, dto);
        return ResponseEntity.ok(updated);
    }

    // Delete a specialization (Admin only)
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSpecialization(@PathVariable Long id) {
        specializationService.deleteSpecialization(id);
        return ResponseEntity.noContent().build();
    }
}
