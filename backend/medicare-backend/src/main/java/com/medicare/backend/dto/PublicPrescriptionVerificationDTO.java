package com.medicare.backend.dto;

import java.time.LocalDate;

public class PublicPrescriptionVerificationDTO {

    private boolean valid;
    private String verificationCode;
    private LocalDate prescribedDate;
    private String doctorName;
    private String doctorLicenseNumber;
    private String specializationName;
    private String hospitalName;
    private String status;
    private String disclaimer;
    private String message;

    public PublicPrescriptionVerificationDTO() {
    }

    public static PublicPrescriptionVerificationDTO valid(
            String verificationCode,
            LocalDate prescribedDate,
            String doctorName,
            String doctorLicenseNumber,
            String specializationName) {

        PublicPrescriptionVerificationDTO dto = new PublicPrescriptionVerificationDTO();
        dto.setValid(true);
        dto.setVerificationCode(verificationCode);
        dto.setPrescribedDate(prescribedDate);
        dto.setDoctorName(doctorName);
        dto.setDoctorLicenseNumber(doctorLicenseNumber);
        dto.setSpecializationName(specializationName);
        dto.setHospitalName("MediCare Hospital & Research Centre");
        dto.setStatus("AUTHENTIC");
        dto.setDisclaimer("Patient identity, clinical notes and prescribed medications are strictly protected and withheld in compliance with applicable health data protection guidelines.");
        dto.setMessage("This prescription record is authentic and officially issued by MediCare.");
        return dto;
    }

    public static PublicPrescriptionVerificationDTO invalid(String verificationCode, String reason) {
        PublicPrescriptionVerificationDTO dto = new PublicPrescriptionVerificationDTO();
        dto.setValid(false);
        dto.setVerificationCode(verificationCode);
        dto.setHospitalName("MediCare Hospital & Research Centre");
        dto.setStatus("INVALID");
        dto.setMessage(reason != null ? reason : "The provided verification code could not be verified against any authentic hospital record.");
        dto.setDisclaimer("Patient identity, clinical notes and prescribed medications are strictly protected and withheld in compliance with applicable health data protection guidelines.");
        return dto;
    }

    public boolean isValid() {
        return valid;
    }

    public void setValid(boolean valid) {
        this.valid = valid;
    }

    public String getVerificationCode() {
        return verificationCode;
    }

    public void setVerificationCode(String verificationCode) {
        this.verificationCode = verificationCode;
    }

    public LocalDate getPrescribedDate() {
        return prescribedDate;
    }

    public void setPrescribedDate(LocalDate prescribedDate) {
        this.prescribedDate = prescribedDate;
    }

    public String getDoctorName() {
        return doctorName;
    }

    public void setDoctorName(String doctorName) {
        this.doctorName = doctorName;
    }

    public String getDoctorLicenseNumber() {
        return doctorLicenseNumber;
    }

    public void setDoctorLicenseNumber(String doctorLicenseNumber) {
        this.doctorLicenseNumber = doctorLicenseNumber;
    }

    public String getSpecializationName() {
        return specializationName;
    }

    public void setSpecializationName(String specializationName) {
        this.specializationName = specializationName;
    }

    public String getHospitalName() {
        return hospitalName;
    }

    public void setHospitalName(String hospitalName) {
        this.hospitalName = hospitalName;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getDisclaimer() {
        return disclaimer;
    }

    public void setDisclaimer(String disclaimer) {
        this.disclaimer = disclaimer;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
