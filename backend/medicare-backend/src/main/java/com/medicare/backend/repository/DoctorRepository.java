package com.medicare.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.medicare.backend.entity.Doctor;
import java.util.Optional;

@Repository
public interface DoctorRepository extends JpaRepository<Doctor, Long> {

    boolean existsByUserId(Long userId);

    boolean existsByLicenseNumber(String licenseNumber);

    Optional<Doctor> findByUserId(Long userId);
}