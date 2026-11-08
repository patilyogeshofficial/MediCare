package com.medicare.backend.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.medicare.backend.dto.MedicalHistoryResponseDTO;
import com.medicare.backend.service.MedicalHistoryService;

@RestController
@RequestMapping("/api/medical-history")
public class MedicalHistoryController {

    private final MedicalHistoryService medicalHistoryService;

    public MedicalHistoryController(
            MedicalHistoryService medicalHistoryService) {

        this.medicalHistoryService = medicalHistoryService;
    }

    // Get medical history of the logged-in patient
    @GetMapping("/my")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<List<MedicalHistoryResponseDTO>> getMyMedicalHistory(
            Authentication authentication) {

        return ResponseEntity.ok(
                medicalHistoryService.getMyMedicalHistory(
                        authentication.getName())
        );
    }
}