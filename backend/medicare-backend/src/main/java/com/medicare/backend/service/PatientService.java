package com.medicare.backend.service;

import java.util.List;
import java.util.Locale;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.medicare.backend.dto.PatientProfileResponseDTO;
import com.medicare.backend.dto.PatientProfileUpdateDTO;
import com.medicare.backend.dto.PatientRequestDTO;
import com.medicare.backend.dto.PatientResponseDTO;
import com.medicare.backend.entity.Patient;
import com.medicare.backend.entity.User;
import com.medicare.backend.enums.Role;
import com.medicare.backend.repository.PatientRepository;
import com.medicare.backend.repository.UserRepository;
import com.medicare.backend.dto.AdminPatientUpdateDTO;

@Service
public class PatientService {

        private final PatientRepository patientRepository;
        private final UserRepository userRepository;

        public PatientService(
                        PatientRepository patientRepository,
                        UserRepository userRepository) {

                this.patientRepository = patientRepository;
                this.userRepository = userRepository;
        }

        // Get all patients
        public List<PatientResponseDTO> getAllPatients() {

                return patientRepository.findAll()
                                .stream()
                                .map(this::convertToDTO)
                                .toList();
        }

        // Convert Patient entity to existing response DTO
        private PatientResponseDTO convertToDTO(Patient patient) {

                return new PatientResponseDTO(
                                patient.getPatientId(),
                                patient.getUserId(),
                                patient.getDateOfBirth(),
                                patient.getGender(),
                                patient.getPhone(),
                                patient.getAddress(),
                                patient.getBloodGroup());
        }

        // Get patient by ID
        public PatientResponseDTO getPatientById(Long patientId) {

                Patient patient = patientRepository.findById(patientId)
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.NOT_FOUND,
                                                "Patient not found with ID: " + patientId));

                return convertToDTO(patient);
        }

        // Create patient
        public PatientResponseDTO createPatient(PatientRequestDTO request) {

                User user = userRepository.findById(request.getUserId())
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.NOT_FOUND,
                                                "User not found with ID: " + request.getUserId()));

                if (user.getRole() != Role.PATIENT) {
                        throw new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST,
                                        "User must have PATIENT role");
                }

                Patient patient = patientRepository.findByUserId(request.getUserId())
                                .orElseGet(() -> {
                                        Patient newPatient = new Patient();
                                        newPatient.setUserId(request.getUserId());
                                        return newPatient;
                                });
                patient.setDateOfBirth(request.getDateOfBirth());
                patient.setGender(request.getGender());
                patient.setPhone(request.getPhone());
                patient.setAddress(request.getAddress());
                patient.setBloodGroup(request.getBloodGroup());

                Patient savedPatient = patientRepository.save(patient);

                return convertToDTO(savedPatient);
        }

        // Update patient by ID

        @Transactional
        public PatientProfileResponseDTO updatePatient(
                        Long patientId,
                        AdminPatientUpdateDTO request) {

                Patient patient = patientRepository.findById(patientId)
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.NOT_FOUND,
                                                "Patient not found with ID: " + patientId));

                User user = userRepository.findById(patient.getUserId())
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.NOT_FOUND,
                                                "Patient account not found"));

                String email = request.getEmail().trim().toLowerCase(Locale.ROOT);

                if (userRepository.existsByEmailIgnoreCaseAndUserIdNot(
                                email, user.getUserId())) {

                        throw new ResponseStatusException(
                                        HttpStatus.CONFLICT,
                                        "Email address is already registered");
                }

                // Update linked User account
                user.setFullName(request.getFullName().trim());
                user.setEmail(email);

                // Update Patient profile
                patient.setDateOfBirth(request.getDateOfBirth());
                patient.setGender(request.getGender());
                patient.setPhone(request.getPhone());
                patient.setAddress(request.getAddress());
                patient.setBloodGroup(request.getBloodGroup());

                userRepository.save(user);
                patientRepository.save(patient);

                return convertToProfileDTO(user, patient);
        }

        // Get logged-in patient's profile
        public PatientProfileResponseDTO getMyProfile(String authenticatedEmail) {

                User user = getAuthenticatedPatient(authenticatedEmail);

                Patient patient = patientRepository.findByUserId(user.getUserId())
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.NOT_FOUND,
                                                "Patient profile not found"));

                return convertToProfileDTO(user, patient);
        }

        // Update logged-in patient's profile
        @Transactional
        public PatientProfileResponseDTO updateMyProfile(
                        String authenticatedEmail,
                        PatientProfileUpdateDTO request) {

                User user = getAuthenticatedPatient(authenticatedEmail);

                Patient patient = patientRepository.findByUserId(user.getUserId())
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.NOT_FOUND,
                                                "Patient profile not found"));

                user.setFullName(request.getFullName().trim());

                patient.setDateOfBirth(request.getDateOfBirth());
                patient.setGender(request.getGender());
                patient.setPhone(request.getPhone());
                patient.setAddress(request.getAddress());
                patient.setBloodGroup(request.getBloodGroup());

                userRepository.save(user);
                patientRepository.save(patient);

                return convertToProfileDTO(user, patient);
        }

        // Verify authenticated user is a patient
        private User getAuthenticatedPatient(String authenticatedEmail) {

                String email = authenticatedEmail.trim().toLowerCase(Locale.ROOT);

                User user = userRepository.findByEmail(email)
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.NOT_FOUND,
                                                "Authenticated user not found"));

                if (user.getRole() != Role.PATIENT) {
                        throw new ResponseStatusException(
                                        HttpStatus.FORBIDDEN,
                                        "Only patients can access this profile");
                }

                return user;
        }

        // Convert User and Patient entities into profile response DTO
        private PatientProfileResponseDTO convertToProfileDTO(
                        User user,
                        Patient patient) {

                return new PatientProfileResponseDTO(
                                patient.getPatientId(),
                                user.getFullName(),
                                user.getEmail(),
                                patient.getDateOfBirth(),
                                patient.getGender(),
                                patient.getPhone(),
                                patient.getAddress(),
                                patient.getBloodGroup());
        }

        // Delete patient
        public void deletePatient(Long patientId) {

                Patient patient = patientRepository.findById(patientId)
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.NOT_FOUND,
                                                "Patient not found with ID: " + patientId));

                patientRepository.delete(patient);
        }
}