package com.medicare.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.medicare.backend.entity.MedicalConditionAllergy;

@Repository
public interface MedicalConditionAllergyRepository
        extends JpaRepository<MedicalConditionAllergy, Long> {

    List<MedicalConditionAllergy> findByPatientIdOrderByCreatedAtDesc(Long patientId);

    List<MedicalConditionAllergy> findByPatientIdAndIsActiveTrueOrderByCreatedAtDesc(Long patientId);

    List<MedicalConditionAllergy> findByPatientIdAndTypeOrderByCreatedAtDesc(Long patientId, String type);
}
