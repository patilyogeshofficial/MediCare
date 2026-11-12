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
import com.medicare.backend.enums.Role;
import com.medicare.backend.repository.DoctorRepository;
import com.medicare.backend.repository.SpecializationRepository;
import com.medicare.backend.repository.UserRepository;
import com.medicare.backend.dto.PublicDoctorResponseDTO;
import java.util.Locale;
import org.springframework.transaction.annotation.Transactional;
import com.medicare.backend.dto.AdminDoctorUpdateDTO;

@Service
public class DoctorService {

        private final DoctorRepository doctorRepository;
        private final UserRepository userRepository;
        private final SpecializationRepository specializationRepository;
        private final NotificationService notificationService;

        public DoctorService(
                        DoctorRepository doctorRepository,
                        UserRepository userRepository,
                        SpecializationRepository specializationRepository,
                        NotificationService notificationService) {

                this.doctorRepository = doctorRepository;
                this.userRepository = userRepository;
                this.specializationRepository = specializationRepository;
                this.notificationService = notificationService;
        }

        // Get all doctors (defaults to active only)
        public List<PublicDoctorResponseDTO> getAllDoctors() {
                return getAllDoctors(false);
        }

        // Get all doctors with optional inactive filter
        public List<PublicDoctorResponseDTO> getAllDoctors(boolean includeInactive) {
                return doctorRepository.findAll()
                                .stream()
                                .map(this::convertToPublicDTO)
                                .filter(doc -> includeInactive || Boolean.TRUE.equals(doc.getIsActive()))
                                .toList();
        }

        // Convert Doctor entity to public response DTO
        private PublicDoctorResponseDTO convertToPublicDTO(Doctor doctor) {

                User user = userRepository.findById(doctor.getUserId())
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.NOT_FOUND,
                                                "Doctor user not found"));

                Specialization specialization = specializationRepository
                                .findById(doctor.getSpecializationId())
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.NOT_FOUND,
                                                "Specialization not found"));

                return new PublicDoctorResponseDTO(
                                doctor.getDoctorId(),
                                user.getUserId(),
                                user.getFullName(),
                                specialization.getSpecializationName(),
                                doctor.getQualification(),
                                doctor.getExperienceYears(),
                                doctor.getConsultationFee(),
                                user.getIsActive()
                );
        }

        // Get doctor by ID
        public DoctorResponseDTO getDoctorById(Long doctorId) {

                Doctor doctor = doctorRepository.findById(doctorId)
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.NOT_FOUND, "Doctor not found"));

                return convertToDTO(doctor);
        }

        // Get public doctor details by ID (Patient access - active only)
        public PublicDoctorResponseDTO getPublicDoctorById(Long doctorId) {

                Doctor doctor = doctorRepository.findById(doctorId)
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.NOT_FOUND, "Doctor not found"));

                PublicDoctorResponseDTO dto = convertToPublicDTO(doctor);
                if (!Boolean.TRUE.equals(dto.getIsActive())) {
                        throw new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Doctor is currently unavailable");
                }

                return dto;
        }



        // Get doctor by ID
        // Get the currently logged-in doctor's profile
        public DoctorResponseDTO getMyDoctorProfile(String authenticatedEmail) {

                User user = userRepository.findByEmail(
                                authenticatedEmail.trim().toLowerCase(Locale.ROOT))
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.NOT_FOUND,
                                                "User not found"));

                Doctor doctor = doctorRepository.findByUserId(user.getUserId())
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.NOT_FOUND,
                                                "Doctor profile not found"));

                return convertToDTO(doctor);
        }

        // Create a new doctor profile (Admin only)
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

                Specialization specialization = specializationRepository
                                .findById(dto.getSpecializationId())
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

                notificationService.createAdminActivityNotification(
                                "New Doctor Registered",
                                "A new doctor profile has been created for Dr. " + user.getFullName() + " (License: " + savedDoctor.getLicenseNumber() + ").",
                                "DOCTOR_STATUS_CHANGED",
                                null,
                                null,
                                "ACCOUNT",
                                "IMPORTANT",
                                "/admin/doctors"
                );

                return convertToDTO(savedDoctor);
        }

        // Update doctor profile (Admin or own Doctor profile)
        public DoctorResponseDTO updateDoctor(
                        Long doctorId,
                        DoctorRequestDTO dto,
                        String authenticatedEmail) {

                // Find doctor profile
                Doctor doctor = doctorRepository.findById(doctorId)
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.NOT_FOUND, "Doctor not found"));

                // Find authenticated user
                User authenticatedUser = userRepository.findByEmail(authenticatedEmail)
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.UNAUTHORIZED,
                                                "Authenticated user not found"));

                // Only ADMIN and DOCTOR can update doctor profiles
                if (authenticatedUser.getRole() != Role.ADMIN
                                && authenticatedUser.getRole() != Role.DOCTOR) {

                        throw new ResponseStatusException(
                                        HttpStatus.FORBIDDEN,
                                        "You are not allowed to update doctor profiles");
                }

                // Doctor can update only their own profile
                // Doctor cannot change the linked user account
                if (authenticatedUser.getRole() == Role.DOCTOR) {
                        if (!Boolean.TRUE.equals(authenticatedUser.getIsActive())) {
                                throw new ResponseStatusException(
                                                HttpStatus.FORBIDDEN,
                                                "Your doctor account is deactivated by the administrator.");
                        }

                        if (!doctor.getUserId().equals(authenticatedUser.getUserId())
                                        || !doctor.getUserId().equals(dto.getUserId())) {
                                throw new ResponseStatusException(
                                                HttpStatus.FORBIDDEN,
                                                "Doctors can update only their own profile and cannot change its user account");
                        }
                }

                // Find target doctor user
                User user = userRepository.findById(dto.getUserId())
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.NOT_FOUND, "User not found"));

                if (user.getRole() != Role.DOCTOR) {
                        throw new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST,
                                        "User must have DOCTOR role");
                }

                // Check duplicate doctor profile
                if (doctorRepository.existsByUserId(dto.getUserId())
                                && !doctor.getUserId().equals(dto.getUserId())) {

                        throw new ResponseStatusException(
                                        HttpStatus.CONFLICT,
                                        "This user already has a doctor profile");
                }

                // Check duplicate license number
                if (!doctor.getLicenseNumber().equals(dto.getLicenseNumber())
                                && doctorRepository.existsByLicenseNumber(dto.getLicenseNumber())) {

                        throw new ResponseStatusException(
                                        HttpStatus.CONFLICT,
                                        "License number already exists");
                }

                // Validate specialization
                Specialization specialization = specializationRepository
                                .findById(dto.getSpecializationId())
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.NOT_FOUND,
                                                "Specialization not found"));

                // Update doctor details
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

        // Delete doctor profile (Admin only)
        public void deleteDoctor(Long doctorId) {

                Doctor doctor = doctorRepository.findById(doctorId)
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.NOT_FOUND, "Doctor not found"));

                doctorRepository.delete(doctor);
        }

        // Convert Entity to Response DTO
        // Convert Entity to Response DTO
        private DoctorResponseDTO convertToDTO(Doctor doctor) {

                User user = userRepository.findById(doctor.getUserId())
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.NOT_FOUND, "Doctor user not found"));

                Specialization specialization = specializationRepository
                                .findById(doctor.getSpecializationId())
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.NOT_FOUND, "Specialization not found"));

                return new DoctorResponseDTO(
                                doctor.getDoctorId(),
                                doctor.getUserId(),
                                user.getFullName(),
                                user.getEmail(),
                                doctor.getSpecializationId(),
                                specialization.getSpecializationName(),
                                doctor.getLicenseNumber(),
                                doctor.getQualification(),
                                doctor.getExperienceYears(),
                                doctor.getConsultationFee(),
                                user.getIsActive());
        }

        @Transactional
        public DoctorResponseDTO updateDoctorByAdmin(
                        Long doctorId,
                        AdminDoctorUpdateDTO dto) {

                // Find doctor
                Doctor doctor = doctorRepository.findById(doctorId)
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.NOT_FOUND,
                                                "Doctor not found"));

                // Find linked user account
                User user = userRepository.findById(doctor.getUserId())
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.NOT_FOUND,
                                                "Doctor user account not found"));

                // Verify doctor role
                if (user.getRole() != Role.DOCTOR) {
                        throw new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST,
                                        "Linked account is not a doctor account");
                }

                // Normalize email
                String email = dto.getEmail()
                                .trim()
                                .toLowerCase(Locale.ROOT);

                // Check duplicate email
                if (userRepository.existsByEmailIgnoreCaseAndUserIdNot(
                                email, user.getUserId())) {

                        throw new ResponseStatusException(
                                        HttpStatus.CONFLICT,
                                        "Email address is already registered");
                }

                // Check duplicate license number
                if (!doctor.getLicenseNumber().equals(dto.getLicenseNumber())
                                && doctorRepository.existsByLicenseNumber(
                                                dto.getLicenseNumber())) {

                        throw new ResponseStatusException(
                                        HttpStatus.CONFLICT,
                                        "License number already exists");
                }

                // Validate specialization
                Specialization specialization = specializationRepository
                                .findById(dto.getSpecializationId())
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.NOT_FOUND,
                                                "Specialization not found"));

                // Update linked User account
                user.setFullName(dto.getFullName().trim());
                user.setEmail(email);

                // Update Doctor profile
                doctor.setSpecializationId(
                                specialization.getSpecializationId());

                doctor.setLicenseNumber(dto.getLicenseNumber().trim());
                doctor.setQualification(dto.getQualification());
                doctor.setExperienceYears(
                                dto.getExperienceYears() == null
                                                ? 0
                                                : dto.getExperienceYears());

                doctor.setConsultationFee(dto.getConsultationFee());

                // Save both records in one transaction
                userRepository.save(user);
                doctorRepository.save(doctor);

                return convertToDTO(doctor);
        }

}