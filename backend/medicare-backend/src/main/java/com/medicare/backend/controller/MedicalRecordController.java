package com.medicare.backend.controller;

import java.util.List;

import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.medicare.backend.dto.ConsultationRecordRequestDTO;
import com.medicare.backend.dto.ConsultationRecordResponseDTO;
import com.medicare.backend.dto.MedicalConditionAllergyDTO;
import com.medicare.backend.dto.MedicalDocumentDTO;
import com.medicare.backend.dto.PatientEhrSummaryResponseDTO;
import com.medicare.backend.dto.PatientVitalDTO;
import com.medicare.backend.entity.MedicalDocument;
import com.medicare.backend.service.MedicalRecordService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/medical-records")
public class MedicalRecordController {

    private final MedicalRecordService medicalRecordService;

    public MedicalRecordController(MedicalRecordService medicalRecordService) {
        this.medicalRecordService = medicalRecordService;
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
    // GET MY EHR SUMMARY (PATIENT ONLY)
    // ==========================================

    @GetMapping("/my")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<PatientEhrSummaryResponseDTO> getMyEhr(Authentication authentication) {
        return ResponseEntity.ok(medicalRecordService.getMyEhr(authentication.getName()));
    }

    // ==========================================
    // GET PATIENT EHR SUMMARY (DOCTOR / ADMIN)
    // ==========================================

    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<PatientEhrSummaryResponseDTO> getPatientEhr(
            @PathVariable Long patientId,
            Authentication authentication) {
        return ResponseEntity.ok(medicalRecordService.getPatientEhr(patientId, authentication.getName()));
    }

    // ==========================================
    // CREATE CLINICAL CONSULTATION NOTE (DOCTOR ONLY)
    // ==========================================

    @PostMapping("/consultations")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<ConsultationRecordResponseDTO> createConsultationRecord(
            @Valid @RequestBody ConsultationRecordRequestDTO requestDTO,
            HttpServletRequest request,
            Authentication authentication) {

        String clientIp = extractClientIp(request);
        ConsultationRecordResponseDTO response = medicalRecordService.createConsultationRecord(
                requestDTO,
                authentication.getName(),
                clientIp
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // ==========================================
    // UPDATE CLINICAL CONSULTATION NOTE (ORIGINAL DOCTOR ONLY)
    // ==========================================

    @PutMapping("/consultations/{recordId}")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<ConsultationRecordResponseDTO> updateConsultationRecord(
            @PathVariable Long recordId,
            @Valid @RequestBody ConsultationRecordRequestDTO requestDTO,
            HttpServletRequest request,
            Authentication authentication) {

        String clientIp = extractClientIp(request);
        ConsultationRecordResponseDTO response = medicalRecordService.updateConsultationRecord(
                recordId,
                requestDTO,
                authentication.getName(),
                clientIp
        );

        return ResponseEntity.ok(response);
    }

    // ==========================================
    // RECORD VITALS (PATIENT / DOCTOR / ADMIN)
    // ==========================================

    @PostMapping("/vitals")
    @PreAuthorize("hasAnyRole('PATIENT', 'DOCTOR', 'ADMIN')")
    public ResponseEntity<PatientVitalDTO> recordVitals(
            @Valid @RequestBody PatientVitalDTO vitalDTO,
            HttpServletRequest request,
            Authentication authentication) {

        String clientIp = extractClientIp(request);
        PatientVitalDTO response = medicalRecordService.recordVitals(
                vitalDTO,
                authentication.getName(),
                clientIp
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // ==========================================
    // DELETE VITALS (DOCTOR / ADMIN OR PATIENT'S SELF-RECORDED ONLY)
    // ==========================================

    @DeleteMapping("/vitals/{vitalId}")
    @PreAuthorize("hasAnyRole('PATIENT', 'DOCTOR', 'ADMIN')")
    public ResponseEntity<Void> deleteVitals(
            @PathVariable Long vitalId,
            HttpServletRequest request,
            Authentication authentication) {

        String clientIp = extractClientIp(request);
        medicalRecordService.deleteVitals(vitalId, authentication.getName(), clientIp);

        return ResponseEntity.noContent().build();
    }

    // ==========================================
    // ADD CONDITION / ALLERGY (PATIENT / DOCTOR / ADMIN)
    // ==========================================

    @PostMapping("/conditions")
    @PreAuthorize("hasAnyRole('PATIENT', 'DOCTOR', 'ADMIN')")
    public ResponseEntity<MedicalConditionAllergyDTO> addConditionAllergy(
            @Valid @RequestBody MedicalConditionAllergyDTO dto,
            HttpServletRequest request,
            Authentication authentication) {

        String clientIp = extractClientIp(request);
        MedicalConditionAllergyDTO response = medicalRecordService.addConditionAllergy(
                dto,
                authentication.getName(),
                clientIp
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // ==========================================
    // DELETE CONDITION / ALLERGY (AUTHORIZED USER)
    // ==========================================

    @DeleteMapping("/conditions/{conditionId}")
    @PreAuthorize("hasAnyRole('PATIENT', 'DOCTOR', 'ADMIN')")
    public ResponseEntity<Void> deleteConditionAllergy(
            @PathVariable Long conditionId,
            HttpServletRequest request,
            Authentication authentication) {

        String clientIp = extractClientIp(request);
        medicalRecordService.deleteConditionAllergy(conditionId, authentication.getName(), clientIp);

        return ResponseEntity.noContent().build();
    }

    // ==========================================
    // UPLOAD MEDICAL DOCUMENT (PATIENT / DOCTOR / ADMIN)
    // ==========================================

    @PostMapping(value = "/documents/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('PATIENT', 'DOCTOR', 'ADMIN')")
    public ResponseEntity<MedicalDocumentDTO> uploadDocument(
            @RequestParam("patientId") Long patientId,
            @RequestParam(value = "appointmentId", required = false) Long appointmentId,
            @RequestParam("title") String title,
            @RequestParam(value = "category", defaultValue = "OTHER") String category,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam("file") MultipartFile file,
            HttpServletRequest request,
            Authentication authentication) {

        String clientIp = extractClientIp(request);
        MedicalDocumentDTO response = medicalRecordService.uploadDocument(
                patientId,
                appointmentId,
                title,
                category,
                description,
                file,
                authentication.getName(),
                clientIp
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // ==========================================
    // DOWNLOAD MEDICAL DOCUMENT (AUTHORIZED USER)
    // ==========================================

    @GetMapping("/documents/{documentId}/download")
    @PreAuthorize("hasAnyRole('PATIENT', 'DOCTOR', 'ADMIN')")
    public ResponseEntity<Resource> downloadDocument(
            @PathVariable Long documentId,
            HttpServletRequest request,
            Authentication authentication) {

        String clientIp = extractClientIp(request);
        MedicalDocument meta = medicalRecordService.getDocumentMetadata(documentId, authentication.getName());
        Resource resource = medicalRecordService.downloadDocument(documentId, authentication.getName(), clientIp);

        String contentType = meta.getFileMimeType() != null ? meta.getFileMimeType() : MediaType.APPLICATION_OCTET_STREAM_VALUE;

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + meta.getOriginalFileName() + "\"")
                .body(resource);
    }

    // ==========================================
    // DELETE MEDICAL DOCUMENT (AUTHORIZED USER)
    // ==========================================

    @DeleteMapping("/documents/{documentId}")
    @PreAuthorize("hasAnyRole('PATIENT', 'DOCTOR', 'ADMIN')")
    public ResponseEntity<Void> deleteDocument(
            @PathVariable Long documentId,
            HttpServletRequest request,
            Authentication authentication) {

        String clientIp = extractClientIp(request);
        medicalRecordService.deleteDocument(documentId, authentication.getName(), clientIp);

        return ResponseEntity.noContent().build();
    }
}
