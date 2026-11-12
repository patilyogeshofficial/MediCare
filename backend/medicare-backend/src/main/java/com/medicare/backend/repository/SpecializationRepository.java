package com.medicare.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.medicare.backend.entity.Specialization;

@Repository
public interface SpecializationRepository extends JpaRepository<Specialization, Long> {

    boolean existsBySpecializationName(String specializationName);

    boolean existsBySpecializationNameIgnoreCase(String specializationName);

    boolean existsBySpecializationNameIgnoreCaseAndSpecializationIdNot(String specializationName, Long specializationId);

    Optional<Specialization> findBySpecializationNameIgnoreCase(String specializationName);
}
