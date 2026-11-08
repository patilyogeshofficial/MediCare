package com.medicare.backend.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Optional;
import java.util.List;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.medicare.backend.entity.PasswordResetOtp;
import com.medicare.backend.entity.PasswordResetToken;
import com.medicare.backend.entity.User;
import com.medicare.backend.repository.PasswordResetOtpRepository;
import com.medicare.backend.repository.PasswordResetTokenRepository;
import com.medicare.backend.repository.UserRepository;

@Service
public class PasswordResetService {

    private final UserRepository userRepository;
    private final PasswordResetOtpRepository otpRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private static final int MAX_OTP_REQUESTS_PER_HOUR = 5;
    private static final int OTP_COOLDOWN_SECONDS = 60;

    public PasswordResetService(
            UserRepository userRepository,
            PasswordResetOtpRepository otpRepository,
            PasswordResetTokenRepository tokenRepository,
            PasswordEncoder passwordEncoder,
            EmailService emailService) {

        this.userRepository = userRepository;
        this.otpRepository = otpRepository;
        this.tokenRepository = tokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
    }

    // Generate and send OTP
    @Transactional
    public void generateAndSendOtp(String email) {

        if (email == null || email.isBlank()) {
            return;
        }

        Optional<User> optionalUser = userRepository.findByEmailForUpdate(
                email.trim().toLowerCase());

        if (optionalUser.isEmpty()) {
            return;
        }

        User user = optionalUser.get();

        if (!Boolean.TRUE.equals(user.getIsActive())) {
            return;
        }

        OffsetDateTime now = OffsetDateTime.now();

        // Check the latest OTP request, including used OTPs.
        Optional<PasswordResetOtp> latestOtp = otpRepository.findTopByUserIdOrderByCreatedAtDesc(
                user.getUserId());

        if (latestOtp.isPresent()) {

            OffsetDateTime lastRequestTime = latestOtp.get().getCreatedAt();

            // Enforce 60-second cooldown.
            if (lastRequestTime != null
                    && lastRequestTime.isAfter(
                            now.minusSeconds(OTP_COOLDOWN_SECONDS))) {

                return;
            }
        }

        // Count OTP requests made during the previous hour.
        long requestCount = otpRepository.countByUserIdAndCreatedAtAfter(
                user.getUserId(),
                now.minusHours(1));

        if (requestCount >= MAX_OTP_REQUESTS_PER_HOUR) {
            return;
        }

        // Generate a secure six-digit OTP.
        String otp = String.format(
                "%06d",
                SECURE_RANDOM.nextInt(1_000_000));

        // Invalidate the previous active OTP.
        Optional<PasswordResetOtp> activeOtp = otpRepository.findTopByUserIdAndUsedFalseOrderByCreatedAtDesc(
                user.getUserId());

        if (activeOtp.isPresent()) {
            PasswordResetOtp previousOtp = activeOtp.get();
            previousOtp.setUsed(true);
            otpRepository.save(previousOtp);
        }

        // Invalidate previous reset tokens.
        tokenRepository.deleteByUserId(user.getUserId());

        // Create and store the new OTP.
        PasswordResetOtp resetOtp = new PasswordResetOtp();

        resetOtp.setUserId(user.getUserId());
        resetOtp.setOtpHash(passwordEncoder.encode(otp));
        resetOtp.setExpiresAt(now.plusMinutes(5));
        resetOtp.setAttempts(0);
        resetOtp.setUsed(false);

        otpRepository.save(resetOtp);

        // Send OTP to registered email.
        emailService.sendOtpEmail(user.getEmail(), otp);
    }

    // Verify OTP and generate reset token
    @Transactional
    public Optional<String> verifyOtp(String email, String otp) {

        if (email == null || otp == null || otp.isBlank()) {
            return Optional.empty();
        }

        Optional<User> optionalUser = userRepository.findByEmail(email.trim().toLowerCase());

        if (optionalUser.isEmpty()) {
            return Optional.empty();
        }

        User user = optionalUser.get();

        if (!Boolean.TRUE.equals(user.getIsActive())) {
            return Optional.empty();
        }

        List<PasswordResetOtp> activeOtps = otpRepository.findActiveOtpForUpdate(user.getUserId());

        if (activeOtps.isEmpty()) {
            return Optional.empty();
        }

        PasswordResetOtp resetOtp = activeOtps.get(0);

        if (Boolean.TRUE.equals(resetOtp.getVerified())
                || resetOtp.getExpiresAt().isBefore(OffsetDateTime.now())
                || resetOtp.getAttempts() >= 5) {

            return Optional.empty();
        }

        if (!passwordEncoder.matches(otp, resetOtp.getOtpHash())) {

            resetOtp.setAttempts(resetOtp.getAttempts() + 1);
            otpRepository.save(resetOtp);

            return Optional.empty();
        }

        resetOtp.setVerified(true);
        resetOtp.setUsed(true);

        otpRepository.save(resetOtp);

        // Generate cryptographically secure reset token.
        byte[] randomBytes = new byte[32];
        SECURE_RANDOM.nextBytes(randomBytes);

        String rawToken = Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(randomBytes);

        // Store only SHA-256 hash in database.
        PasswordResetToken resetToken = new PasswordResetToken();

        resetToken.setUserId(user.getUserId());
        resetToken.setTokenHash(hashToken(rawToken));
        resetToken.setExpiresAt(OffsetDateTime.now().plusMinutes(10));
        resetToken.setUsed(false);

        tokenRepository.deleteByUserId(user.getUserId());
        tokenRepository.save(resetToken);

        return Optional.of(rawToken);
    }

    // Reset password using verified token
    @Transactional
    public boolean resetPassword(
            String email,
            String rawToken,
            String newPassword) {

        if (email == null || rawToken == null || newPassword == null) {
            return false;
        }

        if (email.isBlank()
                || rawToken.isBlank()
                || newPassword.isBlank()) {
            return false;
        }

       int passwordLength = newPassword.codePointCount(
        0,
        newPassword.length()
);

int passwordByteLength = newPassword.getBytes(
        StandardCharsets.UTF_8
).length;

if (passwordLength < 8 || passwordByteLength > 72) {
    return false;
}

        Optional<User> optionalUser = userRepository.findByEmail(email.trim().toLowerCase());

        if (optionalUser.isEmpty()) {
            return false;
        }

        User user = optionalUser.get();

        if (!Boolean.TRUE.equals(user.getIsActive())) {
            return false;
        }

        String tokenHash = hashToken(rawToken);

        Optional<PasswordResetToken> optionalToken = tokenRepository.findByTokenHashForUpdate(tokenHash);

        if (optionalToken.isEmpty()) {
            return false;
        }

        PasswordResetToken resetToken = optionalToken.get();

        if (!resetToken.getUserId().equals(user.getUserId())
                || resetToken.getExpiresAt().isBefore(OffsetDateTime.now())) {

            return false;
        }

        // Update password with BCrypt.
        user.setPasswordHash(passwordEncoder.encode(newPassword));

        userRepository.save(user);

        // Invalidate token after successful password reset.
        resetToken.setUsed(true);

        tokenRepository.save(resetToken);

        return true;
    }

    // SHA-256 token hashing
    private String hashToken(String rawToken) {

        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");

            byte[] hash = digest.digest(
                    rawToken.getBytes(StandardCharsets.UTF_8));

            return HexFormat.of().formatHex(hash);

        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException(
                    "SHA-256 algorithm is unavailable.",
                    exception);
        }
    }
}