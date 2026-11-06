package com.medicare.backend.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.medicare.backend.dto.DoctorRequestDTO;
import com.medicare.backend.dto.DoctorResponseDTO;
import com.medicare.backend.entity.Doctor;
import com.medicare.backend.entity.Specialization;
import com.medicare.backend.entity.User;
import com.medicare.backend.repository.DoctorRepository;
import com.medicare.backend.repository.SpecializationRepository;
import com.medicare.backend.repository.UserRepository;
import com.medicare.backend.enums.Role;

@Service
public class DoctorService {

        private final DoctorRepository doctorRepository;
        private final UserRepository userRepository;
        private final SpecializationRepository specializationRepository;

        public DoctorService(
                        DoctorRepository doctorRepository,
                        UserRepository userRepository,
                        SpecializationRepository specializationRepository) {

                this.doctorRepository = doctorRepository;
                this.userRepository = userRepository;
                this.specializationRepository = specializationRepository;
        }

        // Get all doctors
        public List<DoctorResponseDTO> getAllDoctors() {

                return doctorRepository.findAll()
                                .stream()
                                .map(this::convertToDTO)
                                .toList();
        }

        // Get doctor by ID
        public DoctorResponseDTO getDoctorById(Long doctorId) {

                Doctor doctor = doctorRepository.findById(doctorId)
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.NOT_FOUND, "Doctor not found"));

                return convertToDTO(doctor);
        }

        // Create a new doctor
        public DoctorResponseDTO createDoctor(DoctorRequestDTO dto) {

                User user = userRepository.findById(dto.getUserId())
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.NOT_FOUND, "User not found"));

                if (user.getRole() != Role.DOCTOR) {
                        throw new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST,
                                        "User must have DOCTOR role");
                }

                if (doctorRepository.existsByUserId(dto.getUserId())) {
                        throw new ResponseStatusException(
                                        HttpStatus.CONFLICT,
                                        "Doctor profile already exists for this user");
                }

                if (doctorRepository.existsByLicenseNumber(dto.getLicenseNumber())) {
                        throw new ResponseStatusException(
                                        HttpStatus.CONFLICT,
                                        "License number already exists");
                }

                Specialization specialization = specializationRepository.findById(dto.getSpecializationId())
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.NOT_FOUND,
                                                "Specialization not found"));

                Doctor doctor = new Doctor();

                doctor.setUserId(user.getUserId());
                doctor.setSpecializationId(specialization.getSpecializationId());
                doctor.setLicenseNumber(dto.getLicenseNumber());
                doctor.setQualification(dto.getQualification());
                doctor.setExperienceYears(
                                dto.getExperienceYears() == null ? 0 : dto.getExperienceYears());
                doctor.setConsultationFee(dto.getConsultationFee());

                Doctor savedDoctor = doctorRepository.save(doctor);

                return convertToDTO(savedDoctor);
        }

        // Update doctor
        public DoctorResponseDTO updateDoctor(Long doctorId, DoctorRequestDTO dto) {

                Doctor doctor = doctorRepository.findById(doctorId)
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.NOT_FOUND, "Doctor not found"));

                User user = userRepository.findById(dto.getUserId())
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.NOT_FOUND, "User not found"));

                if (user.getRole() != Role.DOCTOR) {
                        throw new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST,
                                        "User must have DOCTOR role");
                }

                if (doctorRepository.existsByUserId(dto.getUserId())
                                && !doctor.getUserId().equals(dto.getUserId())) {

                        throw new ResponseStatusException(
                                        HttpStatus.CONFLICT,
                                        "This user already has a doctor profile");
                }

                if (!doctor.getLicenseNumber().equals(dto.getLicenseNumber())
                                && doctorRepository.existsByLicenseNumber(dto.getLicenseNumber())) {

                        throw new ResponseStatusException(
                                        HttpStatus.CONFLICT,
                                        "License number already exists");
                }

                Specialization specialization = specializationRepository.findById(dto.getSpecializationId())
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.NOT_FOUND,
                                                "Specialization not found"));

                doctor.setUserId(user.getUserId());
                doctor.setSpecializationId(specialization.getSpecializationId());
                doctor.setLicenseNumber(dto.getLicenseNumber());
                doctor.setQualification(dto.getQualification());
                doctor.setExperienceYears(
                                dto.getExperienceYears() == null ? 0 : dto.getExperienceYears());
                doctor.setConsultationFee(dto.getConsultationFee());

                Doctor updatedDoctor = doctorRepository.save(doctor);

                return convertToDTO(updatedDoctor);
        }

        // Delete doctor
        public void deleteDoctor(Long doctorId) {

                Doctor doctor = doctorRepository.findById(doctorId)
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.NOT_FOUND, "Doctor not found"));

                doctorRepository.delete(doctor);
        }

        // Convert Entity to Response DTO
        private DoctorResponseDTO convertToDTO(Doctor doctor) {

                return new DoctorResponseDTO(
                                doctor.getDoctorId(),
                                doctor.getUserId(),
                                doctor.getSpecializationId(),
                                doctor.getLicenseNumber(),
                                doctor.getQualification(),
                                doctor.getExperienceYears(),
                                doctor.getConsultationFee());
        }
}