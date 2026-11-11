package com.medicare.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.medicare.backend.dto.PublicStatsDTO;
import com.medicare.backend.service.PublicStatsService;

@RestController
@RequestMapping("/api/public/stats")
public class PublicStatsController {

    private final PublicStatsService publicStatsService;

    public PublicStatsController(PublicStatsService publicStatsService) {
        this.publicStatsService = publicStatsService;
    }

    @GetMapping
    public ResponseEntity<PublicStatsDTO> getPublicStats() {
        return ResponseEntity.ok(publicStatsService.getPublicStats());
    }
}
