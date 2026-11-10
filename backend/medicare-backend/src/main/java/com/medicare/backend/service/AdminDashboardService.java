
package com.medicare.backend.service;

import org.springframework.stereotype.Service;

import com.medicare.backend.dto.AdminDashboardSummaryDTO;
import com.medicare.backend.repository.AppointmentRepository;
import com.medicare.backend.repository.DoctorRepository;
import com.medicare.backend.repository.PatientRepository;

@Service
public class AdminDashboardService {

    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final AppointmentRepository appointmentRepository;

    public AdminDashboardService(
            PatientRepository patientRepository,
            DoctorRepository doctorRepository,
            AppointmentRepository appointmentRepository) {

        this.patientRepository = patientRepository;
        this.doctorRepository = doctorRepository;
        this.appointmentRepository = appointmentRepository;
    }

    public AdminDashboardSummaryDTO getDashboardSummary() {

    return new AdminDashboardSummaryDTO(
            patientRepository.count(),
            doctorRepository.count(),
            appointmentRepository.count(),

            appointmentRepository.countByStatus("PENDING"),
            appointmentRepository.countByStatus("CONFIRMED"),
            appointmentRepository.countByStatus("COMPLETED"),
            appointmentRepository.countByStatus("CANCELLED"),
            appointmentRepository.countByStatus("REJECTED")
    );
}
}
