package com.medicare.backend.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;
import com.medicare.backend.dto.PrescriptionRequestDTO;
import com.medicare.backend.dto.PrescriptionResponseDTO;
import com.medicare.backend.entity.Appointment;
import com.medicare.backend.entity.Prescription;
import com.medicare.backend.repository.AppointmentRepository;
import com.medicare.backend.repository.PrescriptionRepository;

@Service
public class PrescriptionService {

    private final PrescriptionRepository prescriptionRepository;
    private final AppointmentRepository appointmentRepository;
    private final JsonMapper jsonMapper;

    public PrescriptionService(
            PrescriptionRepository prescriptionRepository,
            AppointmentRepository appointmentRepository,
            JsonMapper jsonMapper ) {

        this.prescriptionRepository = prescriptionRepository;
        this.appointmentRepository = appointmentRepository;
        this.jsonMapper = jsonMapper;
    }

    // Get all prescriptions
    public List<PrescriptionResponseDTO> getAllPrescriptions() {
        return prescriptionRepository.findAll()
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

    // Get prescription by ID
    public PrescriptionResponseDTO getPrescriptionById(Long prescriptionId) {
        return convertToDTO(findPrescription(prescriptionId));
    }

    // Get prescription by appointment ID
    public PrescriptionResponseDTO getPrescriptionByAppointmentId(Long appointmentId) {

        return prescriptionRepository.findByAppointmentId(appointmentId)
                .map(this::convertToDTO)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Prescription not found for appointment ID: " + appointmentId));
    }

    // Create prescription
    @Transactional
    public PrescriptionResponseDTO createPrescription(PrescriptionRequestDTO request) {

        Appointment appointment = validateAppointment(request.getAppointmentId());

        if (!"COMPLETED".equals(appointment.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Prescription can only be created for completed appointments");
        }

        if (prescriptionRepository.existsByAppointmentId(request.getAppointmentId())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Prescription already exists for this appointment");
        }

        validateMedications(request.getMedications());

        Prescription prescription = new Prescription();

        prescription.setAppointmentId(request.getAppointmentId());
        prescription.setDiagnosis(request.getDiagnosis());
        prescription.setMedications(request.getMedications());
        prescription.setInstructions(request.getInstructions());

        return convertToDTO(prescriptionRepository.save(prescription));
    }

    // Update prescription
    @Transactional
    public PrescriptionResponseDTO updatePrescription(
            Long prescriptionId,
            PrescriptionRequestDTO request) {

        Prescription prescription = findPrescription(prescriptionId);

        if (!prescription.getAppointmentId().equals(request.getAppointmentId())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Prescription cannot be moved to another appointment");
        }

        validateAppointment(request.getAppointmentId());
        validateMedications(request.getMedications());

        prescription.setDiagnosis(request.getDiagnosis());
        prescription.setMedications(request.getMedications());
        prescription.setInstructions(request.getInstructions());

        return convertToDTO(prescriptionRepository.save(prescription));
    }

    // Delete prescription
    @Transactional
    public void deletePrescription(Long prescriptionId) {

        Prescription prescription = findPrescription(prescriptionId);

        prescriptionRepository.delete(prescription);
    }

    // Find prescription
    private Prescription findPrescription(Long prescriptionId) {

        return prescriptionRepository.findById(prescriptionId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Prescription not found with ID: " + prescriptionId));
    }

    // Validate appointment
    private Appointment validateAppointment(Long appointmentId) {

        return appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Appointment not found with ID: " + appointmentId));
    }

    // Validate medications JSON
    private void validateMedications(String medications) {

        try {
            JsonNode jsonNode = jsonMapper.readTree(medications);

            if (jsonNode == null || !jsonNode.isArray()) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Medications must be a valid JSON array");
            }

        } catch (ResponseStatusException exception) {
            throw exception;

        } catch (Exception exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid medications JSON format");
        }
    }

    // Convert entity to response DTO
    private PrescriptionResponseDTO convertToDTO(Prescription prescription) {

        return new PrescriptionResponseDTO(
                prescription.getPrescriptionId(),
                prescription.getAppointmentId(),
                prescription.getDiagnosis(),
                prescription.getMedications(),
                prescription.getInstructions(),
                prescription.getPrescribedAt());
    }
}