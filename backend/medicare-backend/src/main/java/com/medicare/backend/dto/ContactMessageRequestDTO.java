
package com.medicare.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class ContactMessageRequestDTO {

    @NotBlank(message = "Name is required")
    @Size(min = 3, max = 50,
            message = "Name must be between 3 and 50 characters")
    @Pattern(
            regexp = "^[\\p{L}\\p{M}][\\p{L}\\p{M} '-]*$",
            message = "Name can contain only letters, spaces, apostrophes and hyphens"
    )
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Please enter a valid email address")
    @Size(max = 100,
            message = "Email cannot exceed 100 characters")
    private String email;

    @NotBlank(message = "Phone number is required")
    @Pattern(
            regexp = "^[0-9]{10}$",
            message = "Phone number must contain exactly 10 digits"
    )
    private String phone;

    @NotBlank(message = "Subject is required")
    @Size(min = 3, max = 100,
            message = "Subject must be between 3 and 100 characters")
    private String subject;

    @NotBlank(message = "Message is required")
    @Size(min = 10, max = 1000,
            message = "Message must be between 10 and 1000 characters")
    private String message;

    // Getters and Setters

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
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

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
