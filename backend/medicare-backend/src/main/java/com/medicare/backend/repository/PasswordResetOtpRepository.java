package com.medicare.backend.repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.medicare.backend.entity.PasswordResetOtp;

import jakarta.persistence.LockModeType;

@Repository
public interface PasswordResetOtpRepository
        extends JpaRepository<PasswordResetOtp, Long> {

    Optional<PasswordResetOtp> findTopByUserIdAndUsedFalseOrderByCreatedAtDesc(
            Long userId
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT o
            FROM PasswordResetOtp o
            WHERE o.userId = :userId
            AND o.used = false
            ORDER BY o.createdAt DESC
            """)
    List<PasswordResetOtp> findActiveOtpForUpdate(
            @Param("userId") Long userId
    );

    long countByUserIdAndCreatedAtAfter(
            Long userId,
            OffsetDateTime createdAt
    );

    Optional<PasswordResetOtp> findTopByUserIdOrderByCreatedAtDesc(
            Long userId
    );

    void deleteByUserId(Long userId);
}