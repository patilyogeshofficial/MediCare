
package com.medicare.backend.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import jakarta.persistence.EntityManager;

import com.medicare.backend.dto.ContactMessageRequestDTO;
import com.medicare.backend.dto.ContactMessageResponseDTO;
import com.medicare.backend.entity.ContactMessage;
import com.medicare.backend.repository.ContactMessageRepository;

@Service
public class ContactMessageService {

    private final ContactMessageRepository contactMessageRepository;
    private final EntityManager entityManager;
    private final NotificationService notificationService;

    public ContactMessageService(
            ContactMessageRepository contactMessageRepository,
            EntityManager entityManager,
            NotificationService notificationService) {

        this.contactMessageRepository = contactMessageRepository;
        this.entityManager = entityManager;
        this.notificationService = notificationService;
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
    @Transactional
    public ContactMessageResponseDTO createMessage(
            ContactMessageRequestDTO requestDTO) {

        ContactMessage contactMessage = new ContactMessage();

        contactMessage.setName(requestDTO.getName());
        contactMessage.setEmail(requestDTO.getEmail());
        contactMessage.setPhone(requestDTO.getPhone());
        contactMessage.setSubject(requestDTO.getSubject());
        contactMessage.setMessage(requestDTO.getMessage());

        // New messages are unread
        contactMessage.setRead(false);

        ContactMessage savedMessage =
                contactMessageRepository.saveAndFlush(contactMessage);

        // Retrieve database-generated createdAt
        entityManager.refresh(savedMessage);

        // Notify all admins about the new contact message
        notificationService.createAdminActivityNotification(
                "New Contact Message",
                "A new contact message has been received from "
                        + savedMessage.getName() + ".",
                "NEW_CONTACT_MESSAGE",
                null,
                null
        );

        return convertToDTO(savedMessage);
    }

    // Mark contact message as read
    @Transactional
    public ContactMessageResponseDTO markAsRead(Long messageId) {

        ContactMessage contactMessage = findMessage(messageId);

        contactMessage.setRead(true);

        ContactMessage updatedMessage =
                contactMessageRepository.save(contactMessage);

        return convertToDTO(updatedMessage);
    }

    // Delete contact message
    @Transactional
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
    private ContactMessageResponseDTO convertToDTO(
            ContactMessage contactMessage) {

        return new ContactMessageResponseDTO(
                contactMessage.getMessageId(),
                contactMessage.getName(),
                contactMessage.getEmail(),
                contactMessage.getPhone(),
                contactMessage.getSubject(),
                contactMessage.getMessage(),
                contactMessage.isRead(),
                contactMessage.getCreatedAt()
        );
    }
}
