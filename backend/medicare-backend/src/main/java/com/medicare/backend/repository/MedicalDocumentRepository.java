package com.medicare.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.medicare.backend.entity.MedicalDocument;

@Repository
public interface MedicalDocumentRepository
        extends JpaRepository<MedicalDocument, Long> {

    List<MedicalDocument> findByPatientIdOrderByUploadedAtDesc(Long patientId);

    List<MedicalDocument> findByPatientIdAndIsActiveTrueOrderByUploadedAtDesc(Long patientId);

    List<MedicalDocument> findByAppointmentId(Long appointmentId);
}
