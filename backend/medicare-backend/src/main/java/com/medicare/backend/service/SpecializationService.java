package com.medicare.backend.service;

import java.util.List;

import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.medicare.backend.dto.SpecializationDTO;
import com.medicare.backend.entity.Specialization;
import com.medicare.backend.repository.DoctorRepository;
import com.medicare.backend.repository.SpecializationRepository;

@Service
public class SpecializationService {

    private final SpecializationRepository specializationRepository;
    private final DoctorRepository doctorRepository;

    public SpecializationService(
            SpecializationRepository specializationRepository,
            DoctorRepository doctorRepository) {
        this.specializationRepository = specializationRepository;
        this.doctorRepository = doctorRepository;
    }

    // Get all specializations sorted alphabetically (Public access)
    public List<Specialization> getAllSpecializations() {
        return specializationRepository.findAll(
                Sort.by(Sort.Direction.ASC, "specializationName")
        );
    }

    // Get specialization by ID
    public Specialization getSpecializationById(Long specializationId) {
        return specializationRepository.findById(specializationId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Specialization not found with ID: " + specializationId
                ));
    }

    // Create a new specialization (Admin only)
    @Transactional
    public Specialization createSpecialization(SpecializationDTO dto) {
        String trimmedName = dto.getSpecializationName() != null ? dto.getSpecializationName().trim() : "";
        if (trimmedName.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Specialization name cannot be empty");
        }

        if (specializationRepository.existsBySpecializationNameIgnoreCase(trimmedName)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "A specialization with the name '" + trimmedName + "' already exists."
            );
        }

        Specialization specialization = new Specialization();
        specialization.setSpecializationName(trimmedName);
        specialization.setDescription(dto.getDescription() != null ? dto.getDescription().trim() : null);

        return specializationRepository.save(specialization);
    }

    // Update an existing specialization (Admin only)
    @Transactional
    public Specialization updateSpecialization(Long specializationId, SpecializationDTO dto) {
        Specialization specialization = getSpecializationById(specializationId);

        String trimmedName = dto.getSpecializationName() != null ? dto.getSpecializationName().trim() : "";
        if (trimmedName.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Specialization name cannot be empty");
        }

        if (specializationRepository.existsBySpecializationNameIgnoreCaseAndSpecializationIdNot(trimmedName, specializationId)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "A specialization with the name '" + trimmedName + "' already exists."
            );
        }

        specialization.setSpecializationName(trimmedName);
        specialization.setDescription(dto.getDescription() != null ? dto.getDescription().trim() : null);

        return specializationRepository.save(specialization);
    }

    // Delete a specialization with dependency protection (Admin only)
    @Transactional
    public void deleteSpecialization(Long specializationId) {
        Specialization specialization = getSpecializationById(specializationId);

        long doctorCount = doctorRepository.countBySpecializationId(specializationId);
        if (doctorCount > 0) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Cannot delete specialization '" + specialization.getSpecializationName() + "': "
                            + doctorCount + " doctor(s) are assigned to this department. Please reassign or remove associated doctors first."
            );
        }

        specializationRepository.delete(specialization);
    }
}
