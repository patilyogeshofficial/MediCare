package com.medicare.backend.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.medicare.backend.entity.User;
import com.medicare.backend.enums.Role;

import jakarta.persistence.LockModeType;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    List<User> findByRole(Role role);

    long countByRole(Role role);

    Optional<User> findByEmail(String email);

    Optional<User> findByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCaseAndUserIdNot(
            String email,
            Long userId);

    boolean existsByEmail(String email);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT u FROM User u WHERE LOWER(u.email) = LOWER(:email)")
    Optional<User> findByEmailForUpdate(@Param("email") String email);

    // =========================================================================
    // V2 MODULE 7 ADMIN ANALYTICS QUERIES
    // =========================================================================

    // Patient registrations over time within date range
    @Query(value = "SELECT CAST(u.created_at AS DATE) as reg_date, COUNT(u.user_id) " +
                   "FROM users u WHERE u.role = 'PATIENT' " +
                   "AND CAST(u.created_at AS DATE) BETWEEN :startDate AND :endDate " +
                   "GROUP BY CAST(u.created_at AS DATE) ORDER BY reg_date ASC", nativeQuery = true)
    List<Object[]> getPatientRegistrationsByDateRange(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );
}