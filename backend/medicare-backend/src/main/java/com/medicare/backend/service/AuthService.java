
package com.medicare.backend.service;

import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.medicare.backend.dto.AuthResponseDTO;
import com.medicare.backend.dto.LoginRequestDTO;
import com.medicare.backend.dto.RegisterRequestDTO;
import com.medicare.backend.entity.Patient;
import com.medicare.backend.entity.User;
import com.medicare.backend.enums.Role;
import com.medicare.backend.repository.PatientRepository;
import com.medicare.backend.repository.UserRepository;
import com.medicare.backend.security.JwtService;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PatientRepository patientRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public AuthService(
            UserRepository userRepository,
            PatientRepository patientRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            JwtService jwtService) {

        this.userRepository = userRepository;
        this.patientRepository = patientRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
    }

    // Register new PATIENT
    @Transactional
    public AuthResponseDTO register(RegisterRequestDTO request) {

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Email is already registered");
        }

        // 1. Create user account
        User user = new User();

        user.setFullName(request.getFullName().trim());
        user.setEmail(request.getEmail().trim().toLowerCase());
        user.setPasswordHash(
                passwordEncoder.encode(request.getPassword()));

        // Public registration always creates PATIENT
        user.setRole(Role.PATIENT);
        user.setIsActive(true);

        User savedUser = userRepository.save(user);

        // 2. Automatically create patient profile
        Patient patient = new Patient();

        patient.setUserId(savedUser.getUserId());

        patientRepository.save(patient);

        // 3. Generate JWT token
        UserDetails userDetails =
                org.springframework.security.core.userdetails.User
                        .withUsername(savedUser.getEmail())
                        .password(savedUser.getPasswordHash())
                        .roles(savedUser.getRole().name())
                        .build();

        String token = jwtService.generateToken(userDetails);

        // 4. Return authentication response
        return new AuthResponseDTO(
                token,
                savedUser.getUserId(),
                savedUser.getFullName(),
                savedUser.getEmail(),
                savedUser.getRole().name());
    }

    // Login existing user
    public AuthResponseDTO login(LoginRequestDTO request) {

        Authentication authentication =
                authenticationManager.authenticate(
                        new UsernamePasswordAuthenticationToken(
                                request.getEmail(),
                                request.getPassword()));

        UserDetails userDetails =
                (UserDetails) authentication.getPrincipal();

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "User not found"));

        String token = jwtService.generateToken(userDetails);

        return new AuthResponseDTO(
                token,
                user.getUserId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole().name());
    }
}
