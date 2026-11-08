
package com.medicare.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.medicare.backend.entity.AdminNotificationPreference;

@Repository
public interface AdminNotificationPreferenceRepository
        extends JpaRepository<AdminNotificationPreference, Long> {

    Optional<AdminNotificationPreference> findByUserId(Long userId);
}
