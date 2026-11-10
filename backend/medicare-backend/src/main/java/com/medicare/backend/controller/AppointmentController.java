
package com.medicare.backend.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import com.medicare.backend.dto.DoctorPatientResponseDTO;
import com.medicare.backend.dto.AppointmentRequestDTO;
import com.medicare.backend.dto.AppointmentResponseDTO;
import com.medicare.backend.service.AppointmentService;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {

    private final AppointmentService appointmentService;

    public AppointmentController(
            AppointmentService appointmentService) {
        this.appointmentService = appointmentService;
    }

    // ==========================================
    // GET MY APPOINTMENTS (DOCTOR / PATIENT)
    // ==========================================

    @GetMapping("/my")
    @PreAuthorize("hasAnyRole('DOCTOR', 'PATIENT')")
    public ResponseEntity<List<AppointmentResponseDTO>> getMyAppointments(
            Authentication authentication) {

        boolean isPatient = authentication.getAuthorities()
                .stream()
                .anyMatch(authority ->
                        authority.getAuthority().equals("ROLE_PATIENT"));

        if (isPatient) {
            return ResponseEntity.ok(
                    appointmentService.getMyPatientAppointments(
                            authentication.getName()));
        }

        return ResponseEntity.ok(
                appointmentService.getMyAppointments(
                        authentication.getName()));
    }

    // ==========================================
    // GET ALL APPOINTMENTS (ADMIN ONLY)
    // ==========================================

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AppointmentResponseDTO>> getAllAppointments() {

        return ResponseEntity.ok(
                appointmentService.getAllAppointments());
    }

    // ==========================================
    // CANCEL MY APPOINTMENT (PATIENT ONLY)
    // ==========================================

    @PatchMapping("/{appointmentId}/cancel")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<AppointmentResponseDTO> cancelMyAppointment(
            @PathVariable Long appointmentId,
            Authentication authentication) {

        AppointmentResponseDTO response =
                appointmentService.cancelMyAppointment(
                        appointmentId,
                        authentication.getName());

        return ResponseEntity.ok(response);
    }

    // ==========================================
    // GET APPOINTMENT BY ID (ADMIN ONLY)
    // ==========================================

    @GetMapping("/{appointmentId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AppointmentResponseDTO> getAppointmentById(
            @PathVariable Long appointmentId) {

        return ResponseEntity.ok(
                appointmentService.getAppointmentById(appointmentId));
    }

    // ==========================================
    // GET APPOINTMENTS BY PATIENT ID (ADMIN ONLY)
    // ==========================================

    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AppointmentResponseDTO>> getAppointmentsByPatientId(
            @PathVariable Long patientId) {

        return ResponseEntity.ok(
                appointmentService.getAppointmentsByPatientId(patientId));
    }

    // ==========================================
    // GET APPOINTMENTS BY DOCTOR ID (ADMIN ONLY)
    // ==========================================

    @GetMapping("/doctor/{doctorId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AppointmentResponseDTO>> getAppointmentsByDoctorId(
            @PathVariable Long doctorId) {

        return ResponseEntity.ok(
                appointmentService.getAppointmentsByDoctorId(doctorId));
    }

    // ==========================================
// GET MY PATIENTS (DOCTOR ONLY)
// ==========================================

@GetMapping("/my-patients")
@PreAuthorize("hasRole('DOCTOR')")
public ResponseEntity<List<DoctorPatientResponseDTO>> getMyPatients(
        Authentication authentication) {

    return ResponseEntity.ok(
            appointmentService.getMyPatients(
                    authentication.getName()));
}
    // ==========================================
    // CREATE APPOINTMENT (PATIENT ONLY)
    // ==========================================

    @PostMapping
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<AppointmentResponseDTO> createAppointment(
            @Valid @RequestBody AppointmentRequestDTO dto,
            Authentication authentication) {

        AppointmentResponseDTO response =
                appointmentService.createAppointment(
                        dto,
                        authentication.getName());

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    // ==========================================
    // UPDATE APPOINTMENT DETAILS (ADMIN ONLY)
    // ==========================================

    @PutMapping("/{appointmentId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AppointmentResponseDTO> updateAppointment(
            @PathVariable Long appointmentId,
            @Valid @RequestBody AppointmentRequestDTO dto) {

        return ResponseEntity.ok(
                appointmentService.updateAppointment(
                        appointmentId, dto));
    }

    // ==========================================
    // UPDATE APPOINTMENT STATUS (ADMIN ONLY)
    // ==========================================

    // UPDATE APPOINTMENT STATUS (ADMIN / ASSIGNED DOCTOR)

    @PatchMapping("/{appointmentId}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    public ResponseEntity<AppointmentResponseDTO> updateAppointmentStatus(
            @PathVariable Long appointmentId,
            @RequestParam String status,
            Authentication authentication) {

        String normalizedStatus = status.trim().toUpperCase();

        boolean isAdmin = authentication.getAuthorities()
                .stream()
                .anyMatch(authority ->
                        authority.getAuthority().equals("ROLE_ADMIN"));

        AppointmentResponseDTO response;

        if (isAdmin) {
            response = appointmentService.updateAppointmentStatus(
                    appointmentId, normalizedStatus);
        } else {
            response = appointmentService.updateAppointmentStatusByDoctor(
                    appointmentId,
                    normalizedStatus,
                    authentication.getName());
        }

        return ResponseEntity.ok(response);
    }


    // ==========================================
    // DELETE APPOINTMENT (ADMIN ONLY)
    // ==========================================

    @DeleteMapping("/{appointmentId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteAppointment(
            @PathVariable Long appointmentId) {

        appointmentService.deleteAppointment(appointmentId);

        return ResponseEntity.noContent().build();
    }
}
