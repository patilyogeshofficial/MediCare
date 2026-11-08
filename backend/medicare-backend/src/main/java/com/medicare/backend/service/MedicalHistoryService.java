package com.medicare.backend.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import com.medicare.backend.dto.MedicalHistoryResponseDTO;
import com.medicare.backend.entity.Appointment;
import com.medicare.backend.entity.Doctor;
import com.medicare.backend.entity.Patient;
import com.medicare.backend.entity.Prescription;
import com.medicare.backend.entity.Specialization;
import com.medicare.backend.entity.User;
import com.medicare.backend.repository.AppointmentRepository;
import com.medicare.backend.repository.DoctorRepository;
import com.medicare.backend.repository.PatientRepository;
import com.medicare.backend.repository.PrescriptionRepository;
import com.medicare.backend.repository.SpecializationRepository;
import com.medicare.backend.repository.UserRepository;

@Service
public class MedicalHistoryService {

    private final AppointmentRepository appointmentRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final PatientRepository patientRepository;
    private final UserRepository userRepository;
    private final DoctorRepository doctorRepository;
    private final SpecializationRepository specializationRepository;

    public MedicalHistoryService(
            AppointmentRepository appointmentRepository,
            PrescriptionRepository prescriptionRepository,
            PatientRepository patientRepository,
            UserRepository userRepository,
            DoctorRepository doctorRepository,
            SpecializationRepository specializationRepository) {

        this.appointmentRepository = appointmentRepository;
        this.prescriptionRepository = prescriptionRepository;
        this.patientRepository = patientRepository;
        this.userRepository = userRepository;
        this.doctorRepository = doctorRepository;
        this.specializationRepository = specializationRepository;
    }

    // Get medical history of the logged-in patient
    public List<MedicalHistoryResponseDTO> getMyMedicalHistory(
            String authenticatedEmail) {

        // Find authenticated user
        User user = userRepository.findByEmail(
                authenticatedEmail.trim().toLowerCase())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "User not found"));

        // Find patient profile
        Patient patient = patientRepository.findByUserId(user.getUserId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Patient profile not found"));

        // Get patient's appointments
        List<Appointment> appointments =
                appointmentRepository.findByPatientId(patient.getPatientId());

        // Keep only completed appointments
        return appointments.stream()
                .filter(appointment ->
                        "COMPLETED".equals(appointment.getStatus()))
                .map(this::convertToDTO)
                .toList();
    }

    // Convert appointment and related records into DTO
    private MedicalHistoryResponseDTO convertToDTO(Appointment appointment) {

        // Find doctor
        Doctor doctor = doctorRepository.findById(appointment.getDoctorId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Doctor not found"));

        // Find doctor's user details
        User doctorUser = userRepository.findById(doctor.getUserId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Doctor user not found"));

        // Find specialization
        Specialization specialization =
                specializationRepository.findById(doctor.getSpecializationId())
                        .orElseThrow(() -> new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Specialization not found"));

        // Find prescription for appointment
        Prescription prescription = prescriptionRepository
                .findByAppointmentId(appointment.getAppointmentId())
                .orElse(null);

        return new MedicalHistoryResponseDTO(
                appointment.getAppointmentId(),
                appointment.getAppointmentDate(),
                appointment.getAppointmentTime(),
                doctorUser.getFullName(),
                specialization.getSpecializationName(),
                appointment.getReason(),
                prescription != null ? prescription.getDiagnosis() : null,
                prescription != null ? prescription.getMedications() : "[]",
                prescription != null ? prescription.getInstructions() : null,
                prescription != null ? prescription.getPrescribedAt() : null
        );
    }
}