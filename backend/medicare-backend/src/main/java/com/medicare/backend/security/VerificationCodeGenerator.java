package com.medicare.backend.security;

import java.security.SecureRandom;
import java.time.Year;

import org.springframework.stereotype.Component;

@Component
public class VerificationCodeGenerator {

    private static final String ALPHABET = "0123456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // 32 unambiguous chars
    private static final SecureRandom RANDOM = new SecureRandom();

    public String generateCode() {
        return generateCode(Year.now().getValue());
    }

    public String generateCode(int year) {
        StringBuilder sb = new StringBuilder("RX-").append(year).append("-");

        // Part 1: 4 chars
        for (int i = 0; i < 4; i++) {
            sb.append(ALPHABET.charAt(RANDOM.nextInt(ALPHABET.length())));
        }

        sb.append("-");

        // Part 2: 4 chars
        for (int i = 0; i < 4; i++) {
            sb.append(ALPHABET.charAt(RANDOM.nextInt(ALPHABET.length())));
        }

        return sb.toString();
    }
}
