
package com.medicare.backend.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

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
    private static final int MAX_OTP_ATTEMPTS = 5;

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

    // ==========================================
    // STEP 1: GENERATE AND SEND OTP
    // ==========================================

    @Transactional
    public void generateAndSendOtp(String email) {

        if (email == null || email.isBlank()) {
            return;
        }

        String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);

        Optional<User> optionalUser =
                userRepository.findByEmailForUpdate(normalizedEmail);

        if (optionalUser.isEmpty()) {
            return;
        }

        User user = optionalUser.get();

        // Only active accounts can reset passwords.
        if (!Boolean.TRUE.equals(user.getIsActive())) {
            return;
        }

        OffsetDateTime now = OffsetDateTime.now();

        // Check latest OTP request, including used OTPs.
        Optional<PasswordResetOtp> latestOtp =
                otpRepository.findTopByUserIdOrderByCreatedAtDesc(
                        user.getUserId());

        if (latestOtp.isPresent()) {

            OffsetDateTime lastRequestTime =
                    latestOtp.get().getCreatedAt();

            // Enforce 60-second cooldown.
            if (lastRequestTime != null
                    && lastRequestTime.isAfter(
                            now.minusSeconds(OTP_COOLDOWN_SECONDS))) {

                return;
            }
        }

        // Maximum five requests per hour.
        long requestCount =
                otpRepository.countByUserIdAndCreatedAtAfter(
                        user.getUserId(),
                        now.minusHours(1));

        if (requestCount >= MAX_OTP_REQUESTS_PER_HOUR) {
            return;
        }

        // Generate secure six-digit OTP.
        String otp = String.format(
                Locale.ROOT,
                "%06d",
                SECURE_RANDOM.nextInt(1_000_000));

        // Invalidate previous active OTP.
        Optional<PasswordResetOtp> activeOtp =
                otpRepository.findTopByUserIdAndUsedFalseOrderByCreatedAtDesc(
                        user.getUserId());

        if (activeOtp.isPresent()) {

            PasswordResetOtp previousOtp = activeOtp.get();

            previousOtp.setUsed(true);

            otpRepository.save(previousOtp);
        }

        // Invalidate previous reset tokens.
        tokenRepository.deleteByUserId(user.getUserId());

        // Create new OTP record.
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

    // ==========================================
    // STEP 2: VERIFY OTP AND GENERATE RESET TOKEN
    // ==========================================

    @Transactional
    public Optional<String> verifyOtp(String email, String otp) {

        if (email == null || email.isBlank()
                || otp == null || otp.isBlank()) {

            return Optional.empty();
        }

        // Accept only six-digit OTPs.
        if (!otp.matches("\\d{6}")) {
            return Optional.empty();
        }

        String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);

        Optional<User> optionalUser =
                userRepository.findByEmail(normalizedEmail);

        if (optionalUser.isEmpty()) {
            return Optional.empty();
        }

        User user = optionalUser.get();

        if (!Boolean.TRUE.equals(user.getIsActive())) {
            return Optional.empty();
        }

        // Lock active OTP records during verification.
        List<PasswordResetOtp> activeOtps =
                otpRepository.findActiveOtpForUpdate(user.getUserId());

        if (activeOtps.isEmpty()) {
            return Optional.empty();
        }

        PasswordResetOtp resetOtp = activeOtps.get(0);

        OffsetDateTime now = OffsetDateTime.now();

        // Validate OTP status and expiry.
        if (Boolean.TRUE.equals(resetOtp.getVerified())
                || Boolean.TRUE.equals(resetOtp.getUsed())
                || resetOtp.getExpiresAt() == null
                || !resetOtp.getExpiresAt().isAfter(now)
                || resetOtp.getAttempts() >= MAX_OTP_ATTEMPTS) {

            return Optional.empty();
        }

        // Verify OTP hash.
        if (!passwordEncoder.matches(otp, resetOtp.getOtpHash())) {

            resetOtp.setAttempts(resetOtp.getAttempts() + 1);

            otpRepository.save(resetOtp);

            return Optional.empty();
        }

        // Mark OTP as verified and used.
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
        resetToken.setExpiresAt(now.plusMinutes(10));
        resetToken.setUsed(false);

        // Invalidate previous reset tokens.
        tokenRepository.deleteByUserId(user.getUserId());

        tokenRepository.save(resetToken);

        // Return raw token only once to the frontend.
        return Optional.of(rawToken);
    }

    // ==========================================
    // STEP 3: RESET PASSWORD
    // ==========================================

    @Transactional
    public boolean resetPassword(
            String email,
            String rawToken,
            String newPassword) {

        if (email == null || email.isBlank()
                || rawToken == null || rawToken.isBlank()
                || newPassword == null || newPassword.isBlank()) {

            return false;
        }

        // Validate password length.
        int passwordLength = newPassword.codePointCount(
                0,
                newPassword.length());

        int passwordByteLength = newPassword.getBytes(
                StandardCharsets.UTF_8).length;

        if (passwordLength < 8 || passwordByteLength > 72) {
            return false;
        }

        String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);

        Optional<User> optionalUser =
                userRepository.findByEmail(normalizedEmail);

        if (optionalUser.isEmpty()) {
            return false;
        }

        User user = optionalUser.get();

        if (!Boolean.TRUE.equals(user.getIsActive())) {
            return false;
        }

        // Hash submitted token before database lookup.
        String tokenHash = hashToken(rawToken);

        Optional<PasswordResetToken> optionalToken =
                tokenRepository.findByTokenHashForUpdate(tokenHash);

        if (optionalToken.isEmpty()) {
            return false;
        }

        PasswordResetToken resetToken = optionalToken.get();

        OffsetDateTime now = OffsetDateTime.now();

        // Validate token ownership, usage and expiration.
        if (!resetToken.getUserId().equals(user.getUserId())
                || Boolean.TRUE.equals(resetToken.getUsed())
                || resetToken.getExpiresAt() == null
                || !resetToken.getExpiresAt().isAfter(now)) {

            return false;
        }

        // Update password using BCrypt.
        user.setPasswordHash(
                passwordEncoder.encode(newPassword));

        userRepository.save(user);

        // Invalidate token after successful password reset.
        resetToken.setUsed(true);

        tokenRepository.save(resetToken);

        return true;
    }

    // ==========================================
    // SHA-256 TOKEN HASHING
    // ==========================================

    private String hashToken(String rawToken) {

        try {

            MessageDigest digest =
                    MessageDigest.getInstance("SHA-256");

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
