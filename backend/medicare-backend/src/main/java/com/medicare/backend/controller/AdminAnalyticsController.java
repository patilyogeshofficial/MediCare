package com.medicare.backend.controller;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.medicare.backend.dto.analytics.AdminAnalyticsDashboardResponseDTO;
import com.medicare.backend.dto.analytics.AppointmentReportItemDTO;
import com.medicare.backend.dto.analytics.DoctorReportItemDTO;
import com.medicare.backend.dto.analytics.PaginatedResponseDTO;
import com.medicare.backend.dto.analytics.PatientReportItemDTO;
import com.medicare.backend.dto.analytics.SpecializationReportItemDTO;
import com.medicare.backend.service.AdminAnalyticsService;

@RestController
@RequestMapping("/api/admin/analytics")
@PreAuthorize("hasRole('ADMIN')")
public class AdminAnalyticsController {

    private final AdminAnalyticsService analyticsService;

    public AdminAnalyticsController(AdminAnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    /**
     * Get aggregate dashboard analytics for Admin Console.
     */
    @GetMapping("/dashboard")
    public ResponseEntity<AdminAnalyticsDashboardResponseDTO> getDashboardAnalytics(
            @RequestParam(required = false, defaultValue = "LAST_30_DAYS") String filter,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        AdminAnalyticsDashboardResponseDTO response = analyticsService.getDashboardAnalytics(filter, startDate, endDate);
        return ResponseEntity.ok(response);
    }

    /**
     * Get paginated Appointment Report data with server-side pagination and date filtering.
     */
    @GetMapping("/reports/appointments")
    public ResponseEntity<PaginatedResponseDTO<AppointmentReportItemDTO>> getAppointmentReport(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "appointmentDate") String sortBy,
            @RequestParam(defaultValue = "desc") String direction,
            @RequestParam(required = false, defaultValue = "LAST_30_DAYS") String filter,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        int clampedPage = Math.max(0, page);
        int clampedSize = Math.min(100, Math.max(1, size));

        Sort sort = "desc".equalsIgnoreCase(direction)
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(clampedPage, clampedSize, sort);

        PaginatedResponseDTO<AppointmentReportItemDTO> report =
                analyticsService.getAppointmentsReportPaginated(filter, startDate, endDate, pageable);
        return ResponseEntity.ok(report);
    }

    /**
     * Get paginated Patient Registry Report data with server-side pagination and date filtering.
     */
    @GetMapping("/reports/patients")
    public ResponseEntity<PaginatedResponseDTO<PatientReportItemDTO>> getPatientReport(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "patientId") String sortBy,
            @RequestParam(defaultValue = "asc") String direction,
            @RequestParam(required = false, defaultValue = "ALL_TIME") String filter,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        int clampedPage = Math.max(0, page);
        int clampedSize = Math.min(100, Math.max(1, size));

        Sort sort = "desc".equalsIgnoreCase(direction)
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(clampedPage, clampedSize, sort);

        PaginatedResponseDTO<PatientReportItemDTO> report =
                analyticsService.getPatientsReportPaginated(filter, startDate, endDate, pageable);
        return ResponseEntity.ok(report);
    }

    /**
     * Get detailed Doctor Workload and Performance Report data.
     */
    @GetMapping("/reports/doctors")
    public ResponseEntity<List<DoctorReportItemDTO>> getDoctorReport(
            @RequestParam(required = false, defaultValue = "LAST_30_DAYS") String filter,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        List<DoctorReportItemDTO> report = analyticsService.getDoctorReport(filter, startDate, endDate);
        return ResponseEntity.ok(report);
    }

    /**
     * Get detailed Specialization Utilization Report data.
     */
    @GetMapping("/reports/specializations")
    public ResponseEntity<List<SpecializationReportItemDTO>> getSpecializationReport(
            @RequestParam(required = false, defaultValue = "LAST_30_DAYS") String filter,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        List<SpecializationReportItemDTO> report = analyticsService.getSpecializationReport(filter, startDate, endDate);
        return ResponseEntity.ok(report);
    }

    /**
     * Export Appointment Report as CSV (all matching records within date filter).
     * Strictly privacy-safe, excluding patient symptoms and clinical consultation notes.
     */
    @GetMapping(value = "/export/appointments", produces = "text/csv")
    public ResponseEntity<byte[]> exportAppointmentsCsv(
            @RequestParam(required = false, defaultValue = "LAST_30_DAYS") String filter,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        String csv = analyticsService.exportAppointmentsCsv(filter, startDate, endDate);
        byte[] bytes = csv.getBytes(StandardCharsets.UTF_8);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"medicare_appointments_report.csv\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(bytes);
    }

    /**
     * Export Patient Registry Report as CSV.
     * Respects selected date range filter.
     */
    @GetMapping(value = "/export/patients", produces = "text/csv")
    public ResponseEntity<byte[]> exportPatientsCsv(
            @RequestParam(required = false, defaultValue = "ALL_TIME") String filter,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        String csv = analyticsService.exportPatientsCsv(filter, startDate, endDate);
        byte[] bytes = csv.getBytes(StandardCharsets.UTF_8);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"medicare_patients_report.csv\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(bytes);
    }

    /**
     * Export Doctor Workload Report as CSV.
     */
    @GetMapping(value = "/export/doctors", produces = "text/csv")
    public ResponseEntity<byte[]> exportDoctorsCsv(
            @RequestParam(required = false, defaultValue = "LAST_30_DAYS") String filter,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        String csv = analyticsService.exportDoctorsCsv(filter, startDate, endDate);
        byte[] bytes = csv.getBytes(StandardCharsets.UTF_8);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"medicare_doctors_report.csv\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(bytes);
    }

    /**
     * Export Specialization Utilization Report as CSV.
     */
    @GetMapping(value = "/export/specializations", produces = "text/csv")
    public ResponseEntity<byte[]> exportSpecializationsCsv(
            @RequestParam(required = false, defaultValue = "LAST_30_DAYS") String filter,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        String csv = analyticsService.exportSpecializationsCsv(filter, startDate, endDate);
        byte[] bytes = csv.getBytes(StandardCharsets.UTF_8);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"medicare_specializations_report.csv\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(bytes);
    }
}
