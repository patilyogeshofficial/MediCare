package com.medicare.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.medicare.backend.entity.Prescription;

public interface PrescriptionRepository extends JpaRepository<Prescription, Long> {

    Optional<Prescription> findByAppointmentId(Long appointmentId);

    boolean existsByAppointmentId(Long appointmentId);

    // Find prescriptions linked to multiple appointments
    List<Prescription> findByAppointmentIdIn(List<Long> appointmentIds);
}