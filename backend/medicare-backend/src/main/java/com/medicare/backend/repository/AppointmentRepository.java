package com.medicare.backend.repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.medicare.backend.entity.Appointment;

@Repository
public interface AppointmentRepository
        extends JpaRepository<Appointment, Long> {

    // Find appointments by patient ID
    List<Appointment> findByPatientId(Long patientId);

    // Find appointments by doctor ID
    List<Appointment> findByDoctorId(Long doctorId);

    // Find appointments by appointment date and status (for reminders)
    List<Appointment> findByAppointmentDateAndStatus(LocalDate appointmentDate, String status);

    // Count appointments by status
    long countByStatus(String status);

    // Check doctor scheduling conflict (legacy)
    boolean existsByDoctorIdAndAppointmentDateAndAppointmentTimeAndStatusIn(
            Long doctorId,
            LocalDate appointmentDate,
            LocalTime appointmentTime,
            List<String> statuses
    );

    // Check patient scheduling conflict (legacy)
    boolean existsByPatientIdAndAppointmentDateAndAppointmentTimeAndStatusIn(
            Long patientId,
            LocalDate appointmentDate,
            LocalTime appointmentTime,
            List<String> statuses
    );

    // Check doctor conflict while updating an appointment (legacy)
    boolean existsByDoctorIdAndAppointmentDateAndAppointmentTimeAndStatusInAndAppointmentIdNot(
            Long doctorId,
            LocalDate appointmentDate,
            LocalTime appointmentTime,
            List<String> statuses,
            Long appointmentId
    );

    // Check patient conflict while updating an appointment (legacy)
    boolean existsByPatientIdAndAppointmentDateAndAppointmentTimeAndStatusInAndAppointmentIdNot(
            Long patientId,
            LocalDate appointmentDate,
            LocalTime appointmentTime,
            List<String> statuses,
            Long appointmentId
    );

    // =========================================================================
    // V2 MODULE 4 ADVANCED SCHEDULING QUERIES & CONCURRENCY LOCKING
    // =========================================================================

    // PostgreSQL transaction-level advisory lock to serialize concurrent bookings & confirmations
    @Query(value = "SELECT pg_advisory_xact_lock(('x' || substr(md5(?1), 1, 16))::bit(64)::bigint)", nativeQuery = true)
    void acquireAdvisoryLock(String lockKey);

    // Find active appointments for a specific doctor on a given date (CONFIRMED or active PENDING hold)
    @Query("SELECT a FROM Appointment a WHERE a.doctorId = :doctorId AND a.appointmentDate = :date AND (a.status = 'CONFIRMED' OR (a.status = 'PENDING' AND (a.holdExpiresAt IS NULL OR a.holdExpiresAt > :now)))")
    List<Appointment> findActiveByDoctorIdAndDate(
            @Param("doctorId") Long doctorId,
            @Param("date") LocalDate date,
            @Param("now") OffsetDateTime now
    );

    // Find active appointments for a specific patient on a given date (CONFIRMED or active PENDING hold)
    @Query("SELECT a FROM Appointment a WHERE a.patientId = :patientId AND a.appointmentDate = :date AND (a.status = 'CONFIRMED' OR (a.status = 'PENDING' AND (a.holdExpiresAt IS NULL OR a.holdExpiresAt > :now)))")
    List<Appointment> findActiveByPatientIdAndDate(
            @Param("patientId") Long patientId,
            @Param("date") LocalDate date,
            @Param("now") OffsetDateTime now
    );

    // Check active conflict for doctor considering 15-minute pending hold expiration
    @Query("SELECT COUNT(a) > 0 FROM Appointment a WHERE a.doctorId = :doctorId AND a.appointmentDate = :date AND a.appointmentTime = :time AND (a.status = 'CONFIRMED' OR (a.status = 'PENDING' AND (a.holdExpiresAt IS NULL OR a.holdExpiresAt > :now)))")
    boolean hasDoctorActiveConflict(
            @Param("doctorId") Long doctorId,
            @Param("date") LocalDate date,
            @Param("time") LocalTime time,
            @Param("now") OffsetDateTime now
    );

    // Check active conflict for doctor excluding a specific appointment ID
    @Query("SELECT COUNT(a) > 0 FROM Appointment a WHERE a.doctorId = :doctorId AND a.appointmentDate = :date AND a.appointmentTime = :time AND (a.status = 'CONFIRMED' OR (a.status = 'PENDING' AND (a.holdExpiresAt IS NULL OR a.holdExpiresAt > :now))) AND a.appointmentId <> :appointmentId")
    boolean hasDoctorActiveConflictExcluding(
            @Param("doctorId") Long doctorId,
            @Param("date") LocalDate date,
            @Param("time") LocalTime time,
            @Param("now") OffsetDateTime now,
            @Param("appointmentId") Long appointmentId
    );

    // Check active conflict for patient considering 15-minute pending hold expiration
    @Query("SELECT COUNT(a) > 0 FROM Appointment a WHERE a.patientId = :patientId AND a.appointmentDate = :date AND a.appointmentTime = :time AND (a.status = 'CONFIRMED' OR (a.status = 'PENDING' AND (a.holdExpiresAt IS NULL OR a.holdExpiresAt > :now)))")
    boolean hasPatientActiveConflict(
            @Param("patientId") Long patientId,
            @Param("date") LocalDate date,
            @Param("time") LocalTime time,
            @Param("now") OffsetDateTime now
    );

    // Check active conflict for patient excluding a specific appointment ID
    @Query("SELECT COUNT(a) > 0 FROM Appointment a WHERE a.patientId = :patientId AND a.appointmentDate = :date AND a.appointmentTime = :time AND (a.status = 'CONFIRMED' OR (a.status = 'PENDING' AND (a.holdExpiresAt IS NULL OR a.holdExpiresAt > :now))) AND a.appointmentId <> :appointmentId")
    boolean hasPatientActiveConflictExcluding(
            @Param("patientId") Long patientId,
            @Param("date") LocalDate date,
            @Param("time") LocalTime time,
            @Param("now") OffsetDateTime now,
            @Param("appointmentId") Long appointmentId
    );

    // Find maximum queue number for a doctor on a specific date among CONFIRMED appointments
    @Query("SELECT COALESCE(MAX(a.queueNumber), 0) FROM Appointment a WHERE a.doctorId = :doctorId AND a.appointmentDate = :date AND a.status = 'CONFIRMED'")
    Integer findMaxQueueNumber(
            @Param("doctorId") Long doctorId,
            @Param("date") LocalDate date
    );

    // Find stale pending holds that have expired
    @Query("SELECT a FROM Appointment a WHERE a.status = 'PENDING' AND a.holdExpiresAt IS NOT NULL AND a.holdExpiresAt < :now")
    List<Appointment> findExpiredPendingHolds(
            @Param("now") OffsetDateTime now
    );

    // =========================================================================
    // V2 MODULE 7 ADMIN ANALYTICS & REPORTING QUERIES
    // =========================================================================

    // Count appointments within date range
    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.appointmentDate BETWEEN :startDate AND :endDate")
    long countByDateRange(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    // Count appointments by status within date range
    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.status = :status AND a.appointmentDate BETWEEN :startDate AND :endDate")
    long countByStatusAndDateRange(
            @Param("status") String status,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    // Status breakdown within date range
    @Query("SELECT a.status, COUNT(a) FROM Appointment a WHERE a.appointmentDate BETWEEN :startDate AND :endDate GROUP BY a.status")
    List<Object[]> countAppointmentsByStatusGrouped(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    // Daily appointment trends within date range
    @Query("SELECT a.appointmentDate, COUNT(a), " +
           "SUM(CASE WHEN a.status = 'COMPLETED' THEN 1 ELSE 0 END), " +
           "SUM(CASE WHEN a.status = 'CANCELLED' THEN 1 ELSE 0 END) " +
           "FROM Appointment a WHERE a.appointmentDate BETWEEN :startDate AND :endDate " +
           "GROUP BY a.appointmentDate ORDER BY a.appointmentDate ASC")
    List<Object[]> getDailyAppointmentTrends(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    // Doctor appointment stats within date range
    @Query("SELECT a.doctorId, COUNT(a), " +
           "SUM(CASE WHEN a.status = 'COMPLETED' THEN 1 ELSE 0 END), " +
           "SUM(CASE WHEN a.status = 'CANCELLED' THEN 1 ELSE 0 END) " +
           "FROM Appointment a WHERE a.appointmentDate BETWEEN :startDate AND :endDate " +
           "GROUP BY a.doctorId")
    List<Object[]> getDoctorAppointmentStats(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    // Specialization appointment stats within date range
    @Query("SELECT d.specializationId, COUNT(a), " +
           "SUM(CASE WHEN a.status = 'COMPLETED' THEN 1 ELSE 0 END) " +
           "FROM Appointment a, Doctor d WHERE a.doctorId = d.doctorId " +
           "AND a.appointmentDate BETWEEN :startDate AND :endDate " +
           "GROUP BY d.specializationId")
    List<Object[]> getSpecializationAppointmentStats(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    // Sum estimated consultation value for COMPLETED consultations within date range
    @Query("SELECT COALESCE(SUM(d.consultationFee), 0) FROM Appointment a, Doctor d " +
           "WHERE a.doctorId = d.doctorId AND a.status = 'COMPLETED' " +
           "AND a.appointmentDate BETWEEN :startDate AND :endDate")
    BigDecimal sumCompletedConsultationFeeByDateRange(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    // Sum estimated consultation value for BOOKED/CONFIRMED/COMPLETED consultations within date range
    @Query("SELECT COALESCE(SUM(d.consultationFee), 0) FROM Appointment a, Doctor d " +
           "WHERE a.doctorId = d.doctorId AND a.status IN ('CONFIRMED', 'COMPLETED') " +
           "AND a.appointmentDate BETWEEN :startDate AND :endDate")
    BigDecimal sumBookedConsultationFeeByDateRange(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    // Detailed appointments for report tables and CSV export within date range
    @Query("SELECT a FROM Appointment a WHERE a.appointmentDate BETWEEN :startDate AND :endDate ORDER BY a.appointmentDate DESC, a.appointmentTime DESC")
    List<Appointment> findAppointmentsByDateRange(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    // Paginated appointments for interactive report tables
    @Query(value = "SELECT a FROM Appointment a WHERE a.appointmentDate BETWEEN :startDate AND :endDate",
           countQuery = "SELECT COUNT(a) FROM Appointment a WHERE a.appointmentDate BETWEEN :startDate AND :endDate")
    Page<Appointment> findAppointmentsByDateRangePaginated(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            Pageable pageable
    );
}
