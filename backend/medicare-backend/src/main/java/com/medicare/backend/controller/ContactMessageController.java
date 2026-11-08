
package com.medicare.backend.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.medicare.backend.dto.ContactMessageRequestDTO;
import com.medicare.backend.dto.ContactMessageResponseDTO;
import com.medicare.backend.service.ContactMessageService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/contact-messages")
public class ContactMessageController {

    private final ContactMessageService contactMessageService;

    public ContactMessageController(
            ContactMessageService contactMessageService) {

        this.contactMessageService = contactMessageService;
    }

    // Get all contact messages - Admin only
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ResponseEntity<List<ContactMessageResponseDTO>> getAllMessages() {

        return ResponseEntity.ok(contactMessageService.getAllMessages());
    }

    // Get contact message by ID - Admin only
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/{messageId}")
    public ResponseEntity<ContactMessageResponseDTO> getMessageById(
            @PathVariable Long messageId) {

        return ResponseEntity.ok(
                contactMessageService.getMessageById(messageId));
    }

    // Create contact message - Public
    @PostMapping
    public ResponseEntity<ContactMessageResponseDTO> createMessage(
            @Valid @RequestBody ContactMessageRequestDTO requestDTO) {

        ContactMessageResponseDTO response =
                contactMessageService.createMessage(requestDTO);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // Mark contact message as read - Admin only
    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{messageId}/read")
    public ResponseEntity<ContactMessageResponseDTO> markAsRead(
            @PathVariable Long messageId) {

        return ResponseEntity.ok(
                contactMessageService.markAsRead(messageId));
    }

    // Delete contact message - Admin only
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{messageId}")
    public ResponseEntity<Void> deleteMessage(
            @PathVariable Long messageId) {

        contactMessageService.deleteMessage(messageId);

        return ResponseEntity.noContent().build();
    }
}
