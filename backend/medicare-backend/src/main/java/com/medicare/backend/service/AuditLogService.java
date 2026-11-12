package com.medicare.backend.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.medicare.backend.dto.AuditLogResponseDTO;
import com.medicare.backend.entity.AuditLog;
import com.medicare.backend.repository.AuditLogRepository;

@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public AuditLogService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    /**
     * Appends an audit log record into the permanent, tamper-resistant trail.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(
            String entityType,
            Long entityId,
            String action,
            String performedBy,
            String userRole,
            String details,
            String ipAddress) {

        try {
            AuditLog log = new AuditLog(
                    entityType,
                    entityId != null ? entityId : 0L,
                    action,
                    performedBy != null ? performedBy : "SYSTEM",
                    userRole != null ? userRole : "SYSTEM",
                    details,
                    ipAddress
            );
            auditLogRepository.save(log);
        } catch (Exception e) {
            // Audit log write failure should not crash primary operation, but log to stderr
            System.err.println("CRITICAL: Failed to write audit log: " + e.getMessage());
        }
    }

    public List<AuditLogResponseDTO> getAuditLogsForEntity(String entityType, Long entityId) {
        return auditLogRepository.findByEntityTypeAndEntityIdOrderByCreatedAtDesc(entityType, entityId)
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

    public List<AuditLogResponseDTO> getRecentAuditLogs() {
        return auditLogRepository.findTop100ByOrderByCreatedAtDesc()
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

    private AuditLogResponseDTO convertToDTO(AuditLog log) {
        return new AuditLogResponseDTO(
                log.getLogId(),
                log.getEntityType(),
                log.getEntityId(),
                log.getAction(),
                log.getPerformedBy(),
                log.getUserRole(),
                log.getDetails(),
                log.getIpAddress(),
                log.getCreatedAt()
        );
    }
}
