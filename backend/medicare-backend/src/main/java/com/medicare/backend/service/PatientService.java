package com.medicare.backend.service;

import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import java.util.List;

import org.springframework.stereotype.Service;

import com.medicare.backend.dto.PatientResponseDTO;
import com.medicare.backend.entity.Patient;
import com.medicare.backend.repository.PatientRepository;
import com.medicare.backend.dto.PatientRequestDTO;
import com.medicare.backend.entity.User;
import com.medicare.backend.repository.UserRepository;
@Service
public class PatientService {

private final PatientRepository patientRepository;
private final UserRepository userRepository;

public PatientService(PatientRepository patientRepository,
                      UserRepository userRepository) {
    this.patientRepository = patientRepository;
    this.userRepository = userRepository;
}

    public List<PatientResponseDTO> getAllPatients() {

        return patientRepository.findAll()
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

    private PatientResponseDTO convertToDTO(Patient patient) {

        return new PatientResponseDTO(
                patient.getPatientId(),
                patient.getUserId(),
                patient.getDateOfBirth(),
                patient.getGender(),
                patient.getPhone(),
                patient.getAddress(),
                patient.getBloodGroup()
        );

    }
    public PatientResponseDTO getPatientById(Long patientId) {

    Patient patient = patientRepository.findById(patientId)
            .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Patient not found with ID: " + patientId
            ));

    return convertToDTO(patient);
}
public PatientResponseDTO createPatient(PatientRequestDTO request) {

    // 1. Check whether user exists
    User user = userRepository.findById(request.getUserId())
            .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "User not found with ID: " + request.getUserId()
            ));

    // 2. Check user role
    if (!"PATIENT".equals(user.getRole())) {
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "User must have PATIENT role"
        );
    }

    // 3. Check duplicate patient profile
    if (patientRepository.existsByUserId(request.getUserId())) {
        throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Patient profile already exists for this user"
        );
    }

    // 4. Create patient entity
    Patient patient = new Patient();

    patient.setUserId(request.getUserId());
    patient.setDateOfBirth(request.getDateOfBirth());
    patient.setGender(request.getGender());
    patient.setPhone(request.getPhone());
    patient.setAddress(request.getAddress());
    patient.setBloodGroup(request.getBloodGroup());

    // 5. Save patient
    Patient savedPatient = patientRepository.save(patient);

    // 6. Return DTO
    return convertToDTO(savedPatient);
}
public PatientResponseDTO updatePatient(
        Long patientId, PatientRequestDTO request) {

    // 1. Find existing patient
    Patient patient = patientRepository.findById(patientId)
            .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Patient not found with ID: " + patientId
            ));

    // 2. Check user exists
    User user = userRepository.findById(request.getUserId())
            .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "User not found with ID: " + request.getUserId()
            ));

    // 3. Check user role
    if (!"PATIENT".equals(user.getRole())) {
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "User must have PATIENT role"
        );
    }

    // 4. Check duplicate profile
    if (!patient.getUserId().equals(request.getUserId())
            && patientRepository.existsByUserId(request.getUserId())) {

        throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Patient profile already exists for this user"
        );
    }

    // 5. Update patient details
    patient.setUserId(request.getUserId());
    patient.setDateOfBirth(request.getDateOfBirth());
    patient.setGender(request.getGender());
    patient.setPhone(request.getPhone());
    patient.setAddress(request.getAddress());
    patient.setBloodGroup(request.getBloodGroup());

    // 6. Save updated patient
    Patient updatedPatient = patientRepository.save(patient);

    return convertToDTO(updatedPatient);
}
public void deletePatient(Long patientId) {

    Patient patient = patientRepository.findById(patientId)

            .orElseThrow(() -> new ResponseStatusException(

                    HttpStatus.NOT_FOUND,

                    "Patient not found with ID: " + patientId

            ));

    patientRepository.delete(patient);

}
}