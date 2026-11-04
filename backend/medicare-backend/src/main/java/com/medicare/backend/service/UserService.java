package com.medicare.backend.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.medicare.backend.dto.UserResponseDTO;
import com.medicare.backend.entity.User;
import com.medicare.backend.repository.UserRepository;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public List<UserResponseDTO> getAllUsers() {

        return userRepository.findAll()
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

    private UserResponseDTO convertToDTO(User user) {

        return new UserResponseDTO(
                user.getUserId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole(),
                user.getIsActive(),
                user.getCreatedAt()
        );
    }
}