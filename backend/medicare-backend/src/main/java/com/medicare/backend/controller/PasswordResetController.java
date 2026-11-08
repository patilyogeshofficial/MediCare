package com.medicare.backend.controller;

import java.util.Optional;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.medicare.backend.service.PasswordResetService;

@RestController
@RequestMapping("/api/auth")
public class PasswordResetController {

    private final PasswordResetService passwordResetService;

    public PasswordResetController(
            PasswordResetService passwordResetService) {
        this.passwordResetService = passwordResetService;
    }

    // Step 1: Request OTP
    @PostMapping("/forgot-password")
    public ResponseEntity<String> forgotPassword(
            @RequestBody ForgotPasswordRequest request) {

        passwordResetService.generateAndSendOtp(request.getEmail());

        return ResponseEntity.ok(
                "If the account exists, a password reset OTP has been sent to the registered email."
        );
    }

    // Step 2: Verify OTP and receive reset token
    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(
            @RequestBody VerifyOtpRequest request) {

        Optional<String> resetToken =
                passwordResetService.verifyOtp(
                        request.getEmail(),
                        request.getOtp()
                );

        if (resetToken.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body("Invalid or expired OTP.");
        }

        return ResponseEntity.ok(
                new VerifyOtpResponse(
                        "OTP verified successfully.",
                        resetToken.get()
                )
        );
    }

    // Step 3: Reset password
    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(
            @RequestBody ResetPasswordRequest request) {

        boolean reset = passwordResetService.resetPassword(
                request.getEmail(),
                request.getResetToken(),
                request.getNewPassword()
        );

        if (!reset) {
            return ResponseEntity.badRequest()
                    .body("Invalid or expired reset token, or invalid password.");
        }

        return ResponseEntity.ok(
                "Password reset successfully. Please login with your new password."
        );
    }

    // Request DTOs

    public static class ForgotPasswordRequest {

        private String email;

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }
    }

    public static class VerifyOtpRequest {

        private String email;
        private String otp;

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getOtp() {
            return otp;
        }

        public void setOtp(String otp) {
            this.otp = otp;
        }
    }

    public static class ResetPasswordRequest {

        private String email;
        private String resetToken;
        private String newPassword;

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getResetToken() {
            return resetToken;
        }

        public void setResetToken(String resetToken) {
            this.resetToken = resetToken;
        }

        public String getNewPassword() {
            return newPassword;
        }

        public void setNewPassword(String newPassword) {
            this.newPassword = newPassword;
        }
    }

    // Response DTO

    public static class VerifyOtpResponse {

        private String message;
        private String resetToken;

        public VerifyOtpResponse(String message, String resetToken) {
            this.message = message;
            this.resetToken = resetToken;
        }

        public String getMessage() {
            return message;
        }

        public String getResetToken() {
            return resetToken;
        }
    }
}