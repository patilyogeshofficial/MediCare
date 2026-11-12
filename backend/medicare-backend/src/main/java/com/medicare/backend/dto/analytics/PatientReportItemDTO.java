package com.medicare.backend.dto.analytics;

public class PatientReportItemDTO {

    private Long patientId;
    private Long userId;
    private String fullName;
    private String email;
    private String phone;
    private String gender;
    private String bloodGroup;
    private String dateOfBirth;
    private Integer age;
    private String registeredAt;
    private boolean isActive;

    public PatientReportItemDTO() {
    }

    public PatientReportItemDTO(
            Long patientId,
            Long userId,
            String fullName,
            String email,
            String phone,
            String gender,
            String bloodGroup,
            String dateOfBirth,
            Integer age,
            String registeredAt,
            boolean isActive) {

        this.patientId = patientId;
        this.userId = userId;
        this.fullName = fullName;
        this.email = email;
        this.phone = phone;
        this.gender = gender;
        this.bloodGroup = bloodGroup;
        this.dateOfBirth = dateOfBirth;
        this.age = age;
        this.registeredAt = registeredAt;
        this.isActive = isActive;
    }

    public Long getPatientId() {
        return patientId;
    }

    public void setPatientId(Long patientId) {
        this.patientId = patientId;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public String getBloodGroup() {
        return bloodGroup;
    }

    public void setBloodGroup(String bloodGroup) {
        this.bloodGroup = bloodGroup;
    }

    public String getDateOfBirth() {
        return dateOfBirth;
    }

    public void setDateOfBirth(String dateOfBirth) {
        this.dateOfBirth = dateOfBirth;
    }

    public Integer getAge() {
        return age;
    }

    public void setAge(Integer age) {
        this.age = age;
    }

    public String getRegisteredAt() {
        return registeredAt;
    }

    public void setRegisteredAt(String registeredAt) {
        this.registeredAt = registeredAt;
    }

    public boolean isActive() {
        return isActive;
    }

    public void setActive(boolean active) {
        isActive = active;
    }
}
