package com.medicare.backend.service;

import java.time.LocalTime;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.medicare.backend.dto.DoctorAvailabilityRequestDTO;
import com.medicare.backend.dto.DoctorAvailabilityResponseDTO;
import com.medicare.backend.dto.DoctorResponseDTO;
import com.medicare.backend.entity.DoctorAvailability;
import com.medicare.backend.repository.DoctorAvailabilityRepository;

@Service
public class DoctorAvailabilityService {

    private final DoctorAvailabilityRepository availabilityRepository;
    private final DoctorService doctorService;

    private static final Set<String> VALID_DAYS = Set.of(
            "MONDAY", "TUESDAY", "WEDNESDAY",
            "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"
    );

    public DoctorAvailabilityService(
            DoctorAvailabilityRepository availabilityRepository,
            DoctorService doctorService) {

        this.availabilityRepository = availabilityRepository;
        this.doctorService = doctorService;
    }

    // Get logged-in doctor's availability
    public List<DoctorAvailabilityResponseDTO> getMyAvailability(
            String authenticatedEmail) {

        DoctorResponseDTO doctor =
                doctorService.getMyDoctorProfile(authenticatedEmail);

        return availabilityRepository.findByDoctorId(doctor.getDoctorId())
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

    // Save or update logged-in doctor's weekly availability
    @Transactional
    public List<DoctorAvailabilityResponseDTO> saveMyAvailability(
            String authenticatedEmail,
            List<DoctorAvailabilityRequestDTO> requests) {

        DoctorResponseDTO doctor =
                doctorService.getMyDoctorProfile(authenticatedEmail);

        if (!Boolean.TRUE.equals(doctor.getIsActive())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Your doctor account is deactivated by the administrator."
            );
        }

        if (requests == null || requests.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Availability schedule cannot be empty"
            );
        }

        Set<String> submittedDays = requests.stream()
                .map(dto -> normalizeDay(dto.getDayOfWeek()))
                .collect(Collectors.toSet());

        if (submittedDays.size() != requests.size()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Duplicate days are not allowed"
            );
        }

        for (DoctorAvailabilityRequestDTO dto : requests) {

            String day = normalizeDay(dto.getDayOfWeek());

            validateDay(day);

            validateAvailability(dto);

            DoctorAvailability availability =
                    availabilityRepository.findByDoctorId(doctor.getDoctorId())
                            .stream()
                            .filter(item -> item.getDayOfWeek().equals(day))
                            .findFirst()
                            .orElseGet(DoctorAvailability::new);

            availability.setDoctorId(doctor.getDoctorId());
            availability.setDayOfWeek(day);
            availability.setAvailable(
                    dto.getAvailable() != null && dto.getAvailable()
            );

            availability.setStartTime(dto.getStartTime());
            availability.setEndTime(dto.getEndTime());
            availability.setBreakStart(dto.getBreakStart());
            availability.setBreakEnd(dto.getBreakEnd());
            if (dto.getConsultationDuration() != null && dto.getConsultationDuration() > 0) {
                availability.setConsultationDuration(dto.getConsultationDuration());
            }

            availabilityRepository.save(availability);
        }

        return getMyAvailability(authenticatedEmail);
    }

    // Normalize day name
    private String normalizeDay(String day) {

        if (day == null || day.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Day of week is required"
            );
        }

        return day.trim().toUpperCase();
    }

    // Validate day
    private void validateDay(String day) {

        if (!VALID_DAYS.contains(day)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid day of week: " + day
            );
        }
    }

    // Validate time fields
    private void validateAvailability(DoctorAvailabilityRequestDTO dto) {

        if (Boolean.TRUE.equals(dto.getAvailable())) {

            if (dto.getStartTime() == null || dto.getEndTime() == null) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Start time and end time are required for available days"
                );
            }

            if (!dto.getStartTime().isBefore(dto.getEndTime())) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "End time must be after start time"
                );
            }

            boolean hasBreakStart = dto.getBreakStart() != null;
            boolean hasBreakEnd = dto.getBreakEnd() != null;

            if (hasBreakStart != hasBreakEnd) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Both break start and break end must be provided"
                );
            }

            if (hasBreakStart) {

                if (!dto.getBreakStart().isBefore(dto.getBreakEnd())
                        || dto.getBreakStart().isBefore(dto.getStartTime())
                        || dto.getBreakEnd().isAfter(dto.getEndTime())) {

                    throw new ResponseStatusException(
                            HttpStatus.BAD_REQUEST,
                            "Break time must be within working hours"
                    );
                }
            }
        }
    }

    // Convert Entity to Response DTO
    private DoctorAvailabilityResponseDTO convertToDTO(
            DoctorAvailability availability) {

        DoctorAvailabilityResponseDTO dto =
                new DoctorAvailabilityResponseDTO();

        dto.setAvailabilityId(availability.getAvailabilityId());
        dto.setDayOfWeek(availability.getDayOfWeek());
        dto.setAvailable(availability.getAvailable());
        dto.setStartTime(availability.getStartTime());
        dto.setEndTime(availability.getEndTime());
        dto.setBreakStart(availability.getBreakStart());
        dto.setBreakEnd(availability.getBreakEnd());
        dto.setConsultationDuration(availability.getConsultationDuration());

        return dto;
    }
}