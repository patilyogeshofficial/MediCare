package com.medicare.backend.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import com.medicare.backend.dto.PublicStatsDTO;
import com.medicare.backend.service.PublicStatsService;

class PublicStatsControllerTest {

    @Test
    void testGetPublicStats_ReturnsOkResponseWithPayload() {
        PublicStatsService stubService = new PublicStatsService(null, null, null, null) {
            @Override
            public PublicStatsDTO getPublicStats() {
                return new PublicStatsDTO(4L, 6L, 10L, 25L);
            }
        };

        PublicStatsController controller = new PublicStatsController(stubService);
        ResponseEntity<PublicStatsDTO> response = controller.getPublicStats();

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(4L, response.getBody().getActiveDoctorsCount());
        assertEquals(6L, response.getBody().getActiveSpecializationsCount());
        assertEquals(10L, response.getBody().getCompletedAppointmentsCount());
        assertEquals(25L, response.getBody().getRegisteredPatientsCount());
    }
}
