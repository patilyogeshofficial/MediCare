package com.medicare.backend.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.medicare.backend.entity.Prescription;

public interface PrescriptionRepository extends JpaRepository<Prescription, Long> {

    Optional<Prescription> findByAppointmentId(Long appointmentId);

    boolean existsByAppointmentId(Long appointmentId);

    // Find prescriptions linked to multiple appointments
    List<Prescription> findByAppointmentIdIn(List<Long> appointmentIds);

    Optional<Prescription> findByVerificationCode(String verificationCode);

    boolean existsByVerificationCode(String verificationCode);

    // =========================================================================
    // V2 MODULE 7 ADMIN ANALYTICS QUERIES
    // =========================================================================

    // Count prescriptions issued within date range
    @Query(value = "SELECT COUNT(p.prescription_id) FROM prescriptions p WHERE CAST(p.prescribed_at AS DATE) BETWEEN :startDate AND :endDate", nativeQuery = true)
    long countPrescriptionsByDateRange(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );
}