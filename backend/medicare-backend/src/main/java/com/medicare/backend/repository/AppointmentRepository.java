package com.medicare.backend.repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.medicare.backend.entity.Appointment;


@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    // Find appointments by patient ID
    List<Appointment> findByPatientId(Long patientId);

    // Find appointments by doctor ID
    List<Appointment> findByDoctorId(Long doctorId);

    long countByStatus(String status);
    // Check doctor scheduling conflict
    boolean existsByDoctorIdAndAppointmentDateAndAppointmentTimeAndStatusIn(
            Long doctorId,
            LocalDate appointmentDate,
            LocalTime appointmentTime,
            List<String> statuses
    );

    // Check patient scheduling conflict
    boolean existsByPatientIdAndAppointmentDateAndAppointmentTimeAndStatusIn(
            Long patientId,
            LocalDate appointmentDate,
            LocalTime appointmentTime,
            List<String> statuses
    );
    // Check doctor conflict while updating an appointment
boolean existsByDoctorIdAndAppointmentDateAndAppointmentTimeAndStatusInAndAppointmentIdNot(
        Long doctorId,
        LocalDate appointmentDate,
        LocalTime appointmentTime,
        List<String> statuses,
        Long appointmentId
);

// Check patient conflict while updating an appointment
boolean existsByPatientIdAndAppointmentDateAndAppointmentTimeAndStatusInAndAppointmentIdNot(
        Long patientId,
        LocalDate appointmentDate,
        LocalTime appointmentTime,
        List<String> statuses,
        Long appointmentId
);
}