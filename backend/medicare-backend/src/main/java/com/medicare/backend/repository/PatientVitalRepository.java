package com.medicare.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.medicare.backend.entity.PatientVital;

@Repository
public interface PatientVitalRepository
        extends JpaRepository<PatientVital, Long> {

    List<PatientVital> findByPatientIdOrderByMeasuredAtDesc(Long patientId);

    List<PatientVital> findByPatientIdAndIsActiveTrueOrderByMeasuredAtDesc(Long patientId);

    List<PatientVital> findByAppointmentId(Long appointmentId);
}
