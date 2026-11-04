package com.medicare.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.medicare.backend.entity.ContactMessage;

public interface ContactMessageRepository extends JpaRepository<ContactMessage, Long> {

}