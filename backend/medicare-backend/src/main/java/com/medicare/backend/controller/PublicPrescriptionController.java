package com.medicare.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.medicare.backend.dto.PublicPrescriptionVerificationDTO;
import com.medicare.backend.service.PrescriptionService;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/public/prescriptions")
public class PublicPrescriptionController {

    private final PrescriptionService prescriptionService;

    public PublicPrescriptionController(PrescriptionService prescriptionService) {
        this.prescriptionService = prescriptionService;
    }

    /**
     * Public verification by path variable: GET /api/public/prescriptions/verify/{code}
     */
    @GetMapping("/verify/{code}")
    public ResponseEntity<PublicPrescriptionVerificationDTO> verifyPrescriptionByPath(
            @PathVariable String code,
            HttpServletRequest request) {

        String clientIp = extractClientIp(request);
        PublicPrescriptionVerificationDTO result = prescriptionService.verifyPrescriptionPublic(code, clientIp);
        return ResponseEntity.ok(result);
    }

    /**
     * Public verification by query parameter: GET /api/public/prescriptions/verify?code=...
     */
    @GetMapping("/verify")
    public ResponseEntity<PublicPrescriptionVerificationDTO> verifyPrescriptionByQuery(
            @RequestParam(required = false, defaultValue = "") String code,
            HttpServletRequest request) {

        String clientIp = extractClientIp(request);
        PublicPrescriptionVerificationDTO result = prescriptionService.verifyPrescriptionPublic(code, clientIp);
        return ResponseEntity.ok(result);
    }

    private String extractClientIp(HttpServletRequest request) {
        if (request == null) return "127.0.0.1";
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader != null && !xfHeader.isEmpty()) {
            return xfHeader.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
