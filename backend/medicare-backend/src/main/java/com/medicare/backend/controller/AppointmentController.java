
package com.medicare.backend.controller;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.server.ResponseStatusException;
import com.medicare.backend.dto.AppointmentStatusUpdateDTO;
import com.medicare.backend.dto.AvailableSlotDTO;
import com.medicare.backend.dto.DoctorPatientResponseDTO;
import com.medicare.backend.dto.AppointmentRequestDTO;
import com.medicare.backend.dto.AppointmentResponseDTO;
import com.medicare.backend.dto.RescheduleRequestDTO;
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

    private String extractClientIp(HttpServletRequest request) {
        if (request == null) return "127.0.0.1";
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader != null && !xfHeader.isEmpty()) {
            return xfHeader.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    // ==========================================
    // CANCEL MY APPOINTMENT (PATIENT ONLY)
    // ==========================================

    @PatchMapping("/{appointmentId}/cancel")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<AppointmentResponseDTO> cancelMyAppointment(
            @PathVariable Long appointmentId,
            @RequestBody(required = false) AppointmentStatusUpdateDTO dto,
            HttpServletRequest request,
            Authentication authentication) {

        String reason = dto != null ? dto.getCancellationReason() : null;
        String clientIp = extractClientIp(request);

        AppointmentResponseDTO response =
                appointmentService.cancelMyAppointment(
                        appointmentId,
                        authentication.getName(),
                        reason,
                        clientIp);

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
            @RequestParam(required = false) String status,
            @RequestBody(required = false) AppointmentStatusUpdateDTO statusDto,
            HttpServletRequest request,
            Authentication authentication) {

        String targetStatus = statusDto != null && statusDto.getStatus() != null
                ? statusDto.getStatus() : status;

        if (targetStatus == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Status parameter is required");
        }

        String normalizedStatus = targetStatus.trim().toUpperCase();
        String reason = statusDto != null ? statusDto.getCancellationReason() : null;
        String clientIp = extractClientIp(request);

        boolean isAdmin = authentication.getAuthorities()
                .stream()
                .anyMatch(authority ->
                        authority.getAuthority().equals("ROLE_ADMIN"));

        AppointmentResponseDTO response;

        if (isAdmin) {
            response = appointmentService.updateAppointmentStatus(
                    appointmentId,
                    normalizedStatus,
                    reason,
                    authentication.getName(),
                    "ADMIN",
                    clientIp);
        } else {
            response = appointmentService.updateAppointmentStatusByDoctor(
                    appointmentId,
                    normalizedStatus,
                    reason,
                    authentication.getName(),
                    clientIp);
        }

        return ResponseEntity.ok(response);
    }


    // ==========================================
    // GET AVAILABLE SLOTS (AUTHENTICATED)
    // ==========================================

    @GetMapping("/available-slots")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<AvailableSlotDTO>> getAvailableSlots(
            @RequestParam Long doctorId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        return ResponseEntity.ok(
                appointmentService.getAvailableSlots(doctorId, date));
    }

    // ==========================================
    // RESCHEDULE APPOINTMENT REQUEST (PATIENT ONLY)
    // ==========================================

    @PostMapping("/{appointmentId}/reschedule-request")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<AppointmentResponseDTO> requestReschedule(
            @PathVariable Long appointmentId,
            @Valid @RequestBody RescheduleRequestDTO dto,
            HttpServletRequest request,
            Authentication authentication) {

        String clientIp = extractClientIp(request);
        AppointmentResponseDTO response = appointmentService.requestReschedule(
                appointmentId,
                dto,
                authentication.getName(),
                clientIp
        );

        return ResponseEntity.ok(response);
    }

    // ==========================================
    // APPROVE RESCHEDULE (DOCTOR OR ADMIN)
    // ==========================================

    @PatchMapping("/{appointmentId}/reschedule-approve")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<AppointmentResponseDTO> approveReschedule(
            @PathVariable Long appointmentId,
            HttpServletRequest request,
            Authentication authentication) {

        boolean isAdmin = authentication.getAuthorities()
                .stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        String role = isAdmin ? "ADMIN" : "DOCTOR";
        String clientIp = extractClientIp(request);

        AppointmentResponseDTO response = appointmentService.approveReschedule(
                appointmentId,
                authentication.getName(),
                role,
                clientIp
        );

        return ResponseEntity.ok(response);
    }

    // ==========================================
    // REJECT RESCHEDULE (DOCTOR OR ADMIN)
    // ==========================================

    @PatchMapping("/{appointmentId}/reschedule-reject")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<AppointmentResponseDTO> rejectReschedule(
            @PathVariable Long appointmentId,
            @RequestBody(required = false) Map<String, String> body,
            HttpServletRequest request,
            Authentication authentication) {

        boolean isAdmin = authentication.getAuthorities()
                .stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        String role = isAdmin ? "ADMIN" : "DOCTOR";
        String clientIp = extractClientIp(request);
        String reason = body != null ? body.get("reason") : null;

        AppointmentResponseDTO response = appointmentService.rejectReschedule(
                appointmentId,
                reason,
                authentication.getName(),
                role,
                clientIp
        );

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
