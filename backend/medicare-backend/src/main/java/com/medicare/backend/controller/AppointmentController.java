package com.medicare.backend.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.medicare.backend.dto.AppointmentRequestDTO;
import com.medicare.backend.dto.AppointmentResponseDTO;
import com.medicare.backend.service.AppointmentService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {

    private final AppointmentService appointmentService;

    public AppointmentController(AppointmentService appointmentService) {
        this.appointmentService = appointmentService;
    }

    // Get all appointments
    @GetMapping
    public ResponseEntity<List<AppointmentResponseDTO>> getAllAppointments() {

        return ResponseEntity.ok(
                appointmentService.getAllAppointments());
    }

    // Get appointment by ID
    @GetMapping("/{appointmentId}")
    public ResponseEntity<AppointmentResponseDTO> getAppointmentById(
            @PathVariable Long appointmentId) {

        return ResponseEntity.ok(
                appointmentService.getAppointmentById(appointmentId));
    }

    // Get appointments by patient ID
    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<AppointmentResponseDTO>> getAppointmentsByPatientId(
            @PathVariable Long patientId) {

        return ResponseEntity.ok(
                appointmentService.getAppointmentsByPatientId(patientId));
    }

    // Get appointments by doctor ID
    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<List<AppointmentResponseDTO>> getAppointmentsByDoctorId(
            @PathVariable Long doctorId) {

        return ResponseEntity.ok(
                appointmentService.getAppointmentsByDoctorId(doctorId));
    }

    // Create appointment
    @PostMapping
    public ResponseEntity<AppointmentResponseDTO> createAppointment(
            @Valid @RequestBody AppointmentRequestDTO dto) {

        AppointmentResponseDTO response =
                appointmentService.createAppointment(dto);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // Update appointment
    @PutMapping("/{appointmentId}")
    public ResponseEntity<AppointmentResponseDTO> updateAppointment(
            @PathVariable Long appointmentId,
            @Valid @RequestBody AppointmentRequestDTO dto) {

        return ResponseEntity.ok(
                appointmentService.updateAppointment(appointmentId, dto));
    }

    // Update appointment status
    @PatchMapping("/{appointmentId}/status")
    public ResponseEntity<AppointmentResponseDTO> updateAppointmentStatus(
            @PathVariable Long appointmentId,
            @RequestParam String status) {

        return ResponseEntity.ok(
                appointmentService.updateAppointmentStatus(
                        appointmentId, status));
    }

    // Delete appointment
    @DeleteMapping("/{appointmentId}")
    public ResponseEntity<Void> deleteAppointment(
            @PathVariable Long appointmentId) {

        appointmentService.deleteAppointment(appointmentId);

        return ResponseEntity.noContent().build();
    }
}