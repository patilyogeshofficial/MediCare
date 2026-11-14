package com.medicare.backend.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.medicare.backend.entity.Patient;

@Repository
public interface PatientRepository extends JpaRepository<Patient, Long> {

    boolean existsByUserId(Long userId);

    Optional<Patient> findByUserId(Long userId);

    // =========================================================================
    // V2 MODULE 7 ADMIN ANALYTICS QUERIES
    // =========================================================================

    // Group patients by gender
    @Query("SELECT COALESCE(p.gender, 'UNSPECIFIED'), COUNT(p) FROM Patient p GROUP BY p.gender")
    List<Object[]> countPatientsByGenderGrouped();

    // Group patients by blood group
    @Query("SELECT COALESCE(p.bloodGroup, 'UNSPECIFIED'), COUNT(p) FROM Patient p GROUP BY p.bloodGroup")
    List<Object[]> countPatientsByBloodGroupGrouped();

    // Database-level age-cohort aggregation (avoids loading DOB records into JVM memory)
    @Query(value = "SELECT " +
                   "CASE " +
                   "  WHEN p.date_of_birth IS NULL THEN 'Unspecified Age' " +
                   "  WHEN EXTRACT(YEAR FROM age(CURRENT_DATE, p.date_of_birth)) < 18 THEN '0-17 (Pediatric)' " +
                   "  WHEN EXTRACT(YEAR FROM age(CURRENT_DATE, p.date_of_birth)) <= 35 THEN '18-35 (Young Adult)' " +
                   "  WHEN EXTRACT(YEAR FROM age(CURRENT_DATE, p.date_of_birth)) <= 50 THEN '36-50 (Adult)' " +
                   "  WHEN EXTRACT(YEAR FROM age(CURRENT_DATE, p.date_of_birth)) <= 65 THEN '51-65 (Middle Aged)' " +
                   "  ELSE '65+ (Senior)' " +
                   "END AS age_cohort, " +
                   "COUNT(*) " +
                   "FROM patients p " +
                   "GROUP BY 1", nativeQuery = true)
    List<Object[]> countPatientsByAgeCohortGrouped();

    // Paginated patient list with registration date range filter
    @Query(value = "SELECT p.* FROM patients p " +
                   "JOIN users u ON p.user_id = u.user_id " +
                   "WHERE CAST(u.created_at AS DATE) BETWEEN :startDate AND :endDate",
           countQuery = "SELECT COUNT(*) FROM patients p " +
                        "JOIN users u ON p.user_id = u.user_id " +
                        "WHERE CAST(u.created_at AS DATE) BETWEEN :startDate AND :endDate",
           nativeQuery = true)
    Page<Patient> findPatientsByRegistrationDateRange(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            Pageable pageable
    );
}