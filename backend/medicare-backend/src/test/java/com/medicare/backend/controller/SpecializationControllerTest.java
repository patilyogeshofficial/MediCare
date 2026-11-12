package com.medicare.backend.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import com.medicare.backend.dto.SpecializationDTO;
import com.medicare.backend.entity.Specialization;
import com.medicare.backend.repository.DoctorRepository;
import com.medicare.backend.repository.SpecializationRepository;
import com.medicare.backend.service.SpecializationService;

class SpecializationControllerTest {

    private SpecializationController controller;

    @BeforeEach
    void setUp() {
        // Create an in-memory test implementation of SpecializationService
        Specialization s1 = new Specialization();
        s1.setSpecializationId(1L);
        s1.setSpecializationName("Cardiology");
        s1.setDescription("Heart care");

        SpecializationService service = new SpecializationService(null, null) {
            @Override
            public List<Specialization> getAllSpecializations() {
                return List.of(s1);
            }

            @Override
            public Specialization getSpecializationById(Long id) {
                return s1;
            }

            @Override
            public Specialization createSpecialization(SpecializationDTO dto) {
                Specialization created = new Specialization();
                created.setSpecializationId(10L);
                created.setSpecializationName(dto.getSpecializationName());
                created.setDescription(dto.getDescription());
                return created;
            }

            @Override
            public Specialization updateSpecialization(Long id, SpecializationDTO dto) {
                Specialization updated = new Specialization();
                updated.setSpecializationId(id);
                updated.setSpecializationName(dto.getSpecializationName());
                updated.setDescription(dto.getDescription());
                return updated;
            }

            @Override
            public void deleteSpecialization(Long id) {
                // no-op for success test
            }
        };

        controller = new SpecializationController(service);
    }

    @Test
    void testGetAllSpecializations() {
        ResponseEntity<List<Specialization>> response = controller.getAllSpecializations();
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().size());
        assertEquals("Cardiology", response.getBody().get(0).getSpecializationName());
    }

    @Test
    void testGetSpecializationById() {
        ResponseEntity<Specialization> response = controller.getSpecializationById(1L);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(1L, response.getBody().getSpecializationId());
    }

    @Test
    void testCreateSpecialization() {
        SpecializationDTO dto = new SpecializationDTO(null, "Dermatology", "Skin care");
        ResponseEntity<Specialization> response = controller.createSpecialization(dto);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Dermatology", response.getBody().getSpecializationName());
    }

    @Test
    void testUpdateSpecialization() {
        SpecializationDTO dto = new SpecializationDTO(1L, "Pediatric Cardiology", "Children heart care");
        ResponseEntity<Specialization> response = controller.updateSpecialization(1L, dto);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Pediatric Cardiology", response.getBody().getSpecializationName());
    }

    @Test
    void testDeleteSpecialization() {
        ResponseEntity<Void> response = controller.deleteSpecialization(1L);
        assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());
    }
}
