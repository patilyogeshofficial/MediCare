package com.medicare.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.medicare.backend.entity.Patient;

@Repository
public interface PatientRepository extends JpaRepository<Patient, Long> {

    boolean existsByUserId(Long userId);

    Optional<Patient> findByUserId(Long userId);
}