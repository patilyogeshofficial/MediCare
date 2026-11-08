package com.medicare.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    public void sendOtpEmail(String email, String otp) {

        SimpleMailMessage message = new SimpleMailMessage();

        message.setTo(email);
        message.setSubject("MediCare - Password Reset OTP");

        message.setText(
            "Hello,\n\n"
            + "We received a request to reset your MediCare account password.\n\n"
            + "Your OTP is: " + otp + "\n\n"
            + "This OTP is valid for 5 minutes.\n\n"
            + "Please do not share this OTP with anyone.\n\n"
            + "If you did not request a password reset, please ignore this email.\n\n"
            + "Regards,\n"
            + "MediCare Team"
        );

        mailSender.send(message);
    }
}