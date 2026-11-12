package com.medicare.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import java.lang.reflect.Proxy;

import org.junit.jupiter.api.Test;

import com.medicare.backend.dto.PublicStatsDTO;
import com.medicare.backend.repository.AppointmentRepository;
import com.medicare.backend.repository.DoctorRepository;
import com.medicare.backend.repository.PatientRepository;
import com.medicare.backend.repository.SpecializationRepository;

class PublicStatsServiceTest {

    @SuppressWarnings("unchecked")
    private <T> T createStub(Class<T> iface, String targetMethod, Object returnValue) {
        return (T) Proxy.newProxyInstance(
                iface.getClassLoader(),
                new Class<?>[]{iface},
                (proxy, method, args) -> {
                    if (method.getName().equals(targetMethod)) {
                        return returnValue;
                    }
                    if (method.getName().equals("equals")) {
                        return proxy == args[0];
                    }
                    if (method.getName().equals("hashCode")) {
                        return System.identityHashCode(proxy);
                    }
                    if (method.getName().equals("toString")) {
                        return "StubProxy[" + iface.getSimpleName() + "]";
                    }
                    return null;
                }
        );
    }

    @Test
    void testGetPublicStats_ReturnsAggregatedCounts() {
        DoctorRepository doctorRepo = createStub(DoctorRepository.class, "countActiveDoctors", 4L);
        SpecializationRepository specRepo = createStub(SpecializationRepository.class, "count", 6L);
        AppointmentRepository apptRepo = createStub(AppointmentRepository.class, "countByStatus", 12L);
        PatientRepository patientRepo = createStub(PatientRepository.class, "count", 35L);

        PublicStatsService service = new PublicStatsService(doctorRepo, specRepo, apptRepo, patientRepo);

        PublicStatsDTO stats = service.getPublicStats();

        assertNotNull(stats);
        assertEquals(4L, stats.getActiveDoctorsCount());
        assertEquals(6L, stats.getActiveSpecializationsCount());
        assertEquals(12L, stats.getCompletedAppointmentsCount());
        assertEquals(35L, stats.getRegisteredPatientsCount());
    }
}
