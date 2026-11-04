package com.medicare.backend.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.medicare.backend.dto.ContactMessageRequestDTO;
import com.medicare.backend.dto.ContactMessageResponseDTO;
import com.medicare.backend.entity.ContactMessage;
import com.medicare.backend.repository.ContactMessageRepository;

@Service
public class ContactMessageService {

    private final ContactMessageRepository contactMessageRepository;

    public ContactMessageService(ContactMessageRepository contactMessageRepository) {
        this.contactMessageRepository = contactMessageRepository;
    }

    // Get all contact messages
    public List<ContactMessageResponseDTO> getAllMessages() {
        return contactMessageRepository.findAll()
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

    // Get contact message by ID
    public ContactMessageResponseDTO getMessageById(Long messageId) {
        ContactMessage contactMessage = findMessage(messageId);
        return convertToDTO(contactMessage);
    }

    // Create contact message
    public ContactMessageResponseDTO createMessage(ContactMessageRequestDTO requestDTO) {

        ContactMessage contactMessage = new ContactMessage();

        contactMessage.setName(requestDTO.getName());
        contactMessage.setEmail(requestDTO.getEmail());
        contactMessage.setSubject(requestDTO.getSubject());
        contactMessage.setMessage(requestDTO.getMessage());

        ContactMessage savedMessage = contactMessageRepository.save(contactMessage);

        return convertToDTO(savedMessage);
    }

    // Delete contact message
    public void deleteMessage(Long messageId) {
        ContactMessage contactMessage = findMessage(messageId);
        contactMessageRepository.delete(contactMessage);
    }

    // Find message or return 404
    private ContactMessage findMessage(Long messageId) {
        return contactMessageRepository.findById(messageId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Contact message not found with ID: " + messageId
                ));
    }

    // Convert Entity to Response DTO
    private ContactMessageResponseDTO convertToDTO(ContactMessage contactMessage) {
        return new ContactMessageResponseDTO(
                contactMessage.getMessageId(),
                contactMessage.getName(),
                contactMessage.getEmail(),
                contactMessage.getSubject(),
                contactMessage.getMessage(),
                contactMessage.getCreatedAt()
        );
    }
}