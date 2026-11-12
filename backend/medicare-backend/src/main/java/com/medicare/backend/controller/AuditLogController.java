package com.medicare.backend.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.medicare.backend.dto.AuditLogResponseDTO;
import com.medicare.backend.service.AuditLogService;

@RestController
@RequestMapping("/api/admin/audit-logs")
@PreAuthorize("hasRole('ADMIN')")
public class AuditLogController {

    private final AuditLogService auditLogService;

    public AuditLogController(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    /**
     * Get recent platform security audit logs (Admin only)
     */
    @GetMapping
    public ResponseEntity<List<AuditLogResponseDTO>> getRecentAuditLogs() {
        return ResponseEntity.ok(auditLogService.getRecentAuditLogs());
    }

    /**
     * Get audit trail for a specific entity (e.g. APPOINTMENT/10 or PRESCRIPTION/5)
     */
    @GetMapping("/{entityType}/{entityId}")
    public ResponseEntity<List<AuditLogResponseDTO>> getEntityAuditLogs(
            @PathVariable String entityType,
            @PathVariable Long entityId) {

        return ResponseEntity.ok(
                auditLogService.getAuditLogsForEntity(entityType.toUpperCase(), entityId)
        );
    }
}
