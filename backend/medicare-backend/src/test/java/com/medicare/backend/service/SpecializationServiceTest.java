package com.medicare.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.lang.reflect.Proxy;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import com.medicare.backend.dto.SpecializationDTO;
import com.medicare.backend.entity.Specialization;
import com.medicare.backend.repository.DoctorRepository;
import com.medicare.backend.repository.SpecializationRepository;

class SpecializationServiceTest {

    private final List<Specialization> db = new ArrayList<>();
    private SpecializationRepository specRepoProxy;
    private DoctorRepository doctorRepoProxy;
    private SpecializationService service;
    private long doctorCountReturn = 0L;

    @BeforeEach
    void setUp() {
        db.clear();
        doctorCountReturn = 0L;

        // Seed sample specializations
        Specialization s1 = new Specialization();
        s1.setSpecializationId(1L);
        s1.setSpecializationName("Cardiology");
        s1.setDescription("Heart care");
        db.add(s1);

        Specialization s2 = new Specialization();
        s2.setSpecializationId(2L);
        s2.setSpecializationName("Neurology");
        s2.setDescription("Brain and nervous system");
        db.add(s2);

        specRepoProxy = (SpecializationRepository) Proxy.newProxyInstance(
                SpecializationRepository.class.getClassLoader(),
                new Class<?>[]{SpecializationRepository.class},
                (proxy, method, args) -> {
                    String name = method.getName();
                    if ("findAll".equals(name) && args != null && args[0] instanceof Sort) {
                        return new ArrayList<>(db);
                    }
                    if ("findById".equals(name)) {
                        Long id = (Long) args[0];
                        return db.stream().filter(s -> s.getSpecializationId().equals(id)).findFirst();
                    }
                    if ("existsBySpecializationNameIgnoreCase".equals(name)) {
                        String checkName = (String) args[0];
                        return db.stream().anyMatch(s -> s.getSpecializationName().equalsIgnoreCase(checkName));
                    }
                    if ("existsBySpecializationNameIgnoreCaseAndSpecializationIdNot".equals(name)) {
                        String checkName = (String) args[0];
                        Long notId = (Long) args[1];
                        return db.stream().anyMatch(s -> s.getSpecializationName().equalsIgnoreCase(checkName) && !s.getSpecializationId().equals(notId));
                    }
                    if ("save".equals(name)) {
                        Specialization s = (Specialization) args[0];
                        if (s.getSpecializationId() == null) {
                            s.setSpecializationId((long) (db.size() + 1));
                            db.add(s);
                        } else {
                            db.removeIf(existing -> existing.getSpecializationId().equals(s.getSpecializationId()));
                            db.add(s);
                        }
                        return s;
                    }
                    if ("delete".equals(name)) {
                        Specialization s = (Specialization) args[0];
                        db.removeIf(existing -> existing.getSpecializationId().equals(s.getSpecializationId()));
                        return null;
                    }
                    return null;
                }
        );

        doctorRepoProxy = (DoctorRepository) Proxy.newProxyInstance(
                DoctorRepository.class.getClassLoader(),
                new Class<?>[]{DoctorRepository.class},
                (proxy, method, args) -> {
                    if ("countBySpecializationId".equals(method.getName())) {
                        return doctorCountReturn;
                    }
                    return null;
                }
        );

        service = new SpecializationService(specRepoProxy, doctorRepoProxy);
    }

    @Test
    void testGetAllSpecializations() {
        List<Specialization> all = service.getAllSpecializations();
        assertEquals(2, all.size());
    }

    @Test
    void testGetSpecializationById_Success() {
        Specialization found = service.getSpecializationById(1L);
        assertNotNull(found);
        assertEquals("Cardiology", found.getSpecializationName());
    }

    @Test
    void testGetSpecializationById_NotFound() {
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> service.getSpecializationById(99L));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
    }

    @Test
    void testCreateSpecialization_Success() {
        SpecializationDTO dto = new SpecializationDTO(null, "Orthopedics", "Bone and joint care");
        Specialization created = service.createSpecialization(dto);

        assertNotNull(created);
        assertEquals("Orthopedics", created.getSpecializationName());
        assertEquals("Bone and joint care", created.getDescription());
        assertEquals(3, db.size());
    }

    @Test
    void testCreateSpecialization_DuplicateName_ThrowsConflict() {
        SpecializationDTO dto = new SpecializationDTO(null, "cardiology", "Duplicate name in lower case");
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> service.createSpecialization(dto));

        assertEquals(HttpStatus.CONFLICT, ex.getStatusCode());
        assertTrue(ex.getReason().contains("already exists"));
    }

    @Test
    void testCreateSpecialization_BlankName_ThrowsBadRequest() {
        SpecializationDTO dto = new SpecializationDTO(null, "   ", "Empty name");
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> service.createSpecialization(dto));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
    }

    @Test
    void testUpdateSpecialization_Success() {
        SpecializationDTO dto = new SpecializationDTO(1L, "Advanced Cardiology", "Updated description");
        Specialization updated = service.updateSpecialization(1L, dto);

        assertEquals("Advanced Cardiology", updated.getSpecializationName());
        assertEquals("Updated description", updated.getDescription());
    }

    @Test
    void testUpdateSpecialization_DuplicateName_ThrowsConflict() {
        // Try to rename Cardiology (1L) to Neurology (2L)
        SpecializationDTO dto = new SpecializationDTO(1L, "Neurology", "Trying duplicate name");
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> service.updateSpecialization(1L, dto));

        assertEquals(HttpStatus.CONFLICT, ex.getStatusCode());
    }

    @Test
    void testDeleteSpecialization_WithAssignedDoctors_ThrowsConflict() {
        // Simulate 2 doctors assigned to Cardiology (1L)
        doctorCountReturn = 2L;

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> service.deleteSpecialization(1L));

        assertEquals(HttpStatus.CONFLICT, ex.getStatusCode());
        assertTrue(ex.getReason().contains("2 doctor(s) are assigned to this department"));
        assertEquals(2, db.size()); // Not deleted
    }

    @Test
    void testDeleteSpecialization_ZeroDoctors_Success() {
        // Zero doctors assigned
        doctorCountReturn = 0L;

        service.deleteSpecialization(1L);
        assertEquals(1, db.size());
    }
}
