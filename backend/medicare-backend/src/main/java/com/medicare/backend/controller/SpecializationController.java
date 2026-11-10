package com.medicare.backend.controller;

import java.util.List;

import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.medicare.backend.entity.Specialization;
import com.medicare.backend.repository.SpecializationRepository;

@RestController
@RequestMapping("/api/specializations")
public class SpecializationController {

    private final SpecializationRepository specializationRepository;

    public SpecializationController(
            SpecializationRepository specializationRepository) {
        this.specializationRepository = specializationRepository;
    }


    // Get all specializations (Public access)
@GetMapping
public ResponseEntity<List<Specialization>> getAllSpecializations() {

        List<Specialization> specializations =
                specializationRepository.findAll(
                        Sort.by(Sort.Direction.ASC, "specializationName")
                );

        return ResponseEntity.ok(specializations);
    }
}