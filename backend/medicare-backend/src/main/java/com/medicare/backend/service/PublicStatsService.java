package com.medicare.backend.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.medicare.backend.dto.PublicStatsDTO;
import com.medicare.backend.repository.AppointmentRepository;
import com.medicare.backend.repository.DoctorRepository;
import com.medicare.backend.repository.PatientRepository;
import com.medicare.backend.repository.SpecializationRepository;

@Service
public class PublicStatsService {

    private final DoctorRepository doctorRepository;
    private final SpecializationRepository specializationRepository;
    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;

    public PublicStatsService(
            DoctorRepository doctorRepository,
            SpecializationRepository specializationRepository,
            AppointmentRepository appointmentRepository,
            PatientRepository patientRepository) {

        this.doctorRepository = doctorRepository;
        this.specializationRepository = specializationRepository;
        this.appointmentRepository = appointmentRepository;
        this.patientRepository = patientRepository;
    }

    @Transactional(readOnly = true)
    public PublicStatsDTO getPublicStats() {
        long activeDoctors = doctorRepository.countActiveDoctors();
        long specializations = specializationRepository.count();
        long completedAppointments = appointmentRepository.countByStatus("COMPLETED");
        long registeredPatients = patientRepository.count();

        return new PublicStatsDTO(
                activeDoctors,
                specializations,
                completedAppointments,
                registeredPatients
        );
    }
}
