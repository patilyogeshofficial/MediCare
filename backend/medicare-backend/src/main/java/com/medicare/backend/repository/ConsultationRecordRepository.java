package com.medicare.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.medicare.backend.entity.ConsultationRecord;

@Repository
public interface ConsultationRecordRepository
        extends JpaRepository<ConsultationRecord, Long> {

    List<ConsultationRecord> findByPatientIdOrderByCreatedAtDesc(Long patientId);

    List<ConsultationRecord> findByPatientIdAndIsActiveTrueOrderByCreatedAtDesc(Long patientId);

    List<ConsultationRecord> findByDoctorIdOrderByCreatedAtDesc(Long doctorId);

    Optional<ConsultationRecord> findByAppointmentId(Long appointmentId);

    boolean existsByAppointmentId(Long appointmentId);
}
