package com.medicare.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.medicare.backend.entity.MedicalDocumentContent;

@Repository
public interface MedicalDocumentContentRepository extends JpaRepository<MedicalDocumentContent, Long> {

    Optional<MedicalDocumentContent> findByDocumentId(Long documentId);

    boolean existsByDocumentId(Long documentId);
}
