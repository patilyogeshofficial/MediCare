package com.medicare.backend.entity;

import java.time.OffsetDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;

@Entity
@Table(name = "medical_document_contents", schema = "public")
public class MedicalDocumentContent {

    @Id
    @Column(name = "document_id")
    private Long documentId;

    @Lob
    @Column(name = "document_data", nullable = false)
    private byte[] documentData;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    public MedicalDocumentContent() {
    }

    public MedicalDocumentContent(Long documentId, byte[] documentData) {
        this.documentId = documentId;
        this.documentData = documentData;
        this.createdAt = OffsetDateTime.now();
    }

    public Long getDocumentId() {
        return documentId;
    }

    public void setDocumentId(Long documentId) {
        this.documentId = documentId;
    }

    public byte[] getDocumentData() {
        return documentData;
    }

    public void setDocumentData(byte[] documentData) {
        this.documentData = documentData;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
