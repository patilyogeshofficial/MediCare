package com.medicare.backend.repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.medicare.backend.entity.Doctor;

@Repository
public interface DoctorRepository extends JpaRepository<Doctor, Long> {

    boolean existsByUserId(Long userId);

    boolean existsByLicenseNumber(String licenseNumber);

    Optional<Doctor> findByUserId(Long userId);

    @Query("SELECT COUNT(d) FROM Doctor d, User u WHERE d.userId = u.userId AND u.isActive = true")
    long countActiveDoctors();

    long countBySpecializationId(Long specializationId);

    // =========================================================================
    // V2 MODULE 7 ADMIN ANALYTICS QUERIES
    // =========================================================================

    // Average consultation fee across all doctors
    @Query("SELECT COALESCE(AVG(d.consultationFee), 0) FROM Doctor d")
    BigDecimal getAverageConsultationFee();

    // Doctor count grouped by specialization ID
    @Query("SELECT d.specializationId, COUNT(d) FROM Doctor d GROUP BY d.specializationId")
    List<Object[]> countDoctorsBySpecializationGrouped();
}