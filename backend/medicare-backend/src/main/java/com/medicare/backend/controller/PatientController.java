package com.medicare.backend.controller;

import java.util.List;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.DeleteMapping;
import com.medicare.backend.dto.PatientResponseDTO;
import com.medicare.backend.service.PatientService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import com.medicare.backend.dto.PatientRequestDTO;
@RestController
@RequestMapping("/api/patients")
public class PatientController {

    private final PatientService patientService;

    public PatientController(PatientService patientService) {
        this.patientService = patientService;
    }

    @GetMapping
    public List<PatientResponseDTO> getAllPatients() {
        return patientService.getAllPatients();
    }

    @GetMapping("/{patientId}")
    public PatientResponseDTO getPatientById(@PathVariable Long patientId) {
        return patientService.getPatientById(patientId);
    }
    @PostMapping
public ResponseEntity<PatientResponseDTO> createPatient(
        @Valid @RequestBody PatientRequestDTO request) {

    PatientResponseDTO response = patientService.createPatient(request);

    return ResponseEntity.status(HttpStatus.CREATED).body(response);
}
@PutMapping("/{patientId}")
public PatientResponseDTO updatePatient(
        @PathVariable Long patientId,
        @Valid @RequestBody PatientRequestDTO request) {

    return patientService.updatePatient(patientId, request);
}
@DeleteMapping("/{patientId}")
public ResponseEntity<Void> deletePatient(@PathVariable Long patientId) {

    patientService.deletePatient(patientId);

    return ResponseEntity.noContent().build();
}

}