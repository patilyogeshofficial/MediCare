package com.medicare.backend.service;

import java.io.StringWriter;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.Period;
import java.time.format.DateTimeFormatter;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.medicare.backend.dto.analytics.AdminAnalyticsDashboardResponseDTO;
import com.medicare.backend.dto.analytics.AdminAnalyticsOverviewDTO;
import com.medicare.backend.dto.analytics.AppointmentReportItemDTO;
import com.medicare.backend.dto.analytics.DemographicDistributionDTO;
import com.medicare.backend.dto.analytics.DoctorReportItemDTO;
import com.medicare.backend.dto.analytics.DoctorWorkloadDTO;
import com.medicare.backend.dto.analytics.PaginatedResponseDTO;
import com.medicare.backend.dto.analytics.PatientAnalyticsDTO;
import com.medicare.backend.dto.analytics.PatientReportItemDTO;
import com.medicare.backend.dto.analytics.SpecializationAnalyticsDTO;
import com.medicare.backend.dto.analytics.SpecializationReportItemDTO;
import com.medicare.backend.dto.analytics.StatusDistributionDTO;
import com.medicare.backend.dto.analytics.TrendDataPointDTO;
import com.medicare.backend.entity.Appointment;
import com.medicare.backend.entity.Doctor;
import com.medicare.backend.entity.Patient;
import com.medicare.backend.entity.Specialization;
import com.medicare.backend.entity.User;
import com.medicare.backend.enums.Role;
import com.medicare.backend.repository.AppointmentRepository;
import com.medicare.backend.repository.DoctorRepository;
import com.medicare.backend.repository.PatientRepository;
import com.medicare.backend.repository.PrescriptionRepository;
import com.medicare.backend.repository.SpecializationRepository;
import com.medicare.backend.repository.UserRepository;

@Service
public class AdminAnalyticsService {

    private static final Logger logger = LoggerFactory.getLogger(AdminAnalyticsService.class);

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter LABEL_FORMATTER = DateTimeFormatter.ofPattern("dd MMM");

    private static final String NOTICE_REVENUE_UNAVAILABLE =
            "Revenue tracking is not available. MediCare does not store verified payment transactions. " +
            "Displayed values represent Estimated Consultation Value calculated from doctor fee schedules.";

    private final AppointmentRepository appointmentRepository;
    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;
    private final UserRepository userRepository;
    private final SpecializationRepository specializationRepository;
    private final PrescriptionRepository prescriptionRepository;

    public AdminAnalyticsService(
            AppointmentRepository appointmentRepository,
            DoctorRepository doctorRepository,
            PatientRepository patientRepository,
            UserRepository userRepository,
            SpecializationRepository specializationRepository,
            PrescriptionRepository prescriptionRepository) {

        this.appointmentRepository = appointmentRepository;
        this.doctorRepository = doctorRepository;
        this.patientRepository = patientRepository;
        this.userRepository = userRepository;
        this.specializationRepository = specializationRepository;
        this.prescriptionRepository = prescriptionRepository;
    }

    /**
     * Resolves date bounds based on requested filter preset.
     */
    public LocalDate[] resolveDateRange(String filterType, LocalDate customStartDate, LocalDate customEndDate) {
        LocalDate today = LocalDate.now();
        String normalizedFilter = (filterType != null) ? filterType.trim().toUpperCase(Locale.ROOT) : "ALL_TIME";

        LocalDate startDate;
        LocalDate endDate = today;

        switch (normalizedFilter) {
            case "TODAY":
                startDate = today;
                endDate = today;
                break;
            case "LAST_7_DAYS":
                startDate = today.minusDays(6);
                endDate = today;
                break;
            case "LAST_30_DAYS":
                startDate = today.minusDays(29);
                endDate = today;
                break;
            case "THIS_MONTH":
                startDate = today.withDayOfMonth(1);
                endDate = today.with(TemporalAdjusters.lastDayOfMonth());
                break;
            case "ALL_TIME":
                startDate = LocalDate.of(2020, 1, 1);
                endDate = today.plusYears(1);
                break;
            case "CUSTOM":
                if (customStartDate == null || customEndDate == null) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Custom date range requires both startDate and endDate");
                }
                if (customStartDate.isAfter(customEndDate)) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "startDate cannot be after endDate");
                }
                startDate = customStartDate;
                endDate = customEndDate;
                break;
            default:
                startDate = LocalDate.of(2020, 1, 1);
                endDate = today.plusYears(1);
                break;
        }

        return new LocalDate[]{startDate, endDate};
    }

    /**
     * Comprehensive Dashboard Analytics aggregator.
     */
    @Transactional(readOnly = true)
    public AdminAnalyticsDashboardResponseDTO getDashboardAnalytics(
            String filterType,
            LocalDate customStartDate,
            LocalDate customEndDate) {

        LocalDate[] dates = resolveDateRange(filterType, customStartDate, customEndDate);
        LocalDate startDate = dates[0];
        LocalDate endDate = dates[1];

        // 1. Overview Statistics
        AdminAnalyticsOverviewDTO overview;
        try {
            overview = buildOverviewStats(startDate, endDate);
        } catch (Exception e) {
            logger.error("Failed to build overview stats:", e);
            overview = new AdminAnalyticsOverviewDTO(
                    patientRepository.count(),
                    doctorRepository.count(),
                    doctorRepository.countActiveDoctors(),
                    0L, 0L, 0L, 0L, 0L, 0L, 0L, 0L,
                    BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
                    false, NOTICE_REVENUE_UNAVAILABLE
            );
        }

        // 2. Appointment Status Breakdown
        List<StatusDistributionDTO> statusBreakdown;
        try {
            statusBreakdown = buildStatusBreakdown(startDate, endDate, overview.getTotalAppointments());
        } catch (Exception e) {
            logger.error("Failed to build status breakdown:", e);
            statusBreakdown = List.of();
        }

        // 3. Appointment Trends
        List<TrendDataPointDTO> appointmentTrends;
        try {
            appointmentTrends = buildAppointmentTrends(startDate, endDate);
        } catch (Exception e) {
            logger.error("Failed to build appointment trends:", e);
            appointmentTrends = List.of();
        }

        // 4. Doctor Workloads
        List<DoctorWorkloadDTO> doctorWorkloads;
        try {
            doctorWorkloads = buildDoctorWorkloads(startDate, endDate);
        } catch (Exception e) {
            logger.error("Failed to build doctor workloads:", e);
            doctorWorkloads = List.of();
        }

        // 5. Specialization Analytics
        List<SpecializationAnalyticsDTO> specializationAnalytics;
        try {
            specializationAnalytics = buildSpecializationAnalytics(startDate, endDate, overview.getTotalAppointments());
        } catch (Exception e) {
            logger.error("Failed to build specialization analytics:", e);
            specializationAnalytics = List.of();
        }

        // 6. Patient Analytics (Database-level demographic aggregations)
        PatientAnalyticsDTO patientAnalytics;
        try {
            patientAnalytics = buildPatientAnalytics(startDate, endDate);
        } catch (Exception e) {
            logger.error("Failed to build patient analytics:", e);
            patientAnalytics = new PatientAnalyticsDTO(
                    patientRepository.count(),
                    List.of(), List.of(), List.of(), List.of()
            );
        }

        return new AdminAnalyticsDashboardResponseDTO(
                overview,
                statusBreakdown,
                appointmentTrends,
                doctorWorkloads,
                specializationAnalytics,
                patientAnalytics,
                (filterType != null ? filterType.toUpperCase(Locale.ROOT) : "ALL_TIME"),
                startDate.format(DATE_FORMATTER),
                endDate.format(DATE_FORMATTER)
        );
    }

    private AdminAnalyticsOverviewDTO buildOverviewStats(LocalDate startDate, LocalDate endDate) {
        long totalPatients = patientRepository.count();
        long totalDoctors = doctorRepository.count();
        long activeDoctors = doctorRepository.countActiveDoctors();
        long inactiveDoctors = Math.max(0, totalDoctors - activeDoctors);

        long totalAppointments = appointmentRepository.countByDateRange(startDate, endDate);
        long pendingAppointments = appointmentRepository.countByStatusAndDateRange("PENDING", startDate, endDate);
        long confirmedAppointments = appointmentRepository.countByStatusAndDateRange("CONFIRMED", startDate, endDate);
        long completedAppointments = appointmentRepository.countByStatusAndDateRange("COMPLETED", startDate, endDate);
        long cancelledAppointments = appointmentRepository.countByStatusAndDateRange("CANCELLED", startDate, endDate);
        long rejectedAppointments = appointmentRepository.countByStatusAndDateRange("REJECTED", startDate, endDate);

        long totalPrescriptions = prescriptionRepository.countPrescriptionsByDateRange(startDate, endDate);

        BigDecimal estimatedConsultationValue = appointmentRepository.sumBookedConsultationFeeByDateRange(startDate, endDate);
        BigDecimal completedConsultationsValue = appointmentRepository.sumCompletedConsultationFeeByDateRange(startDate, endDate);
        Double avgFee = doctorRepository.getAverageConsultationFee();
        BigDecimal averageDoctorFee = (avgFee != null) ? BigDecimal.valueOf(avgFee) : BigDecimal.ZERO;

        if (estimatedConsultationValue == null) estimatedConsultationValue = BigDecimal.ZERO;
        if (completedConsultationsValue == null) completedConsultationsValue = BigDecimal.ZERO;
        if (averageDoctorFee == null) averageDoctorFee = BigDecimal.ZERO;

        return new AdminAnalyticsOverviewDTO(
                totalPatients,
                totalDoctors,
                activeDoctors,
                inactiveDoctors,
                totalAppointments,
                pendingAppointments,
                confirmedAppointments,
                completedAppointments,
                cancelledAppointments,
                rejectedAppointments,
                totalPrescriptions,
                estimatedConsultationValue.setScale(2, RoundingMode.HALF_UP),
                completedConsultationsValue.setScale(2, RoundingMode.HALF_UP),
                averageDoctorFee.setScale(2, RoundingMode.HALF_UP),
                false, // revenueTrackingAvailable is false as MediCare has no payment gateway
                NOTICE_REVENUE_UNAVAILABLE
        );
    }

    private List<StatusDistributionDTO> buildStatusBreakdown(LocalDate startDate, LocalDate endDate, long totalAppointments) {
        List<Object[]> rawGrouped = appointmentRepository.countAppointmentsByStatusGrouped(startDate, endDate);
        Map<String, Long> statusMap = new HashMap<>();

        for (Object[] row : rawGrouped) {
            String status = (String) row[0];
            Number count = (Number) row[1];
            if (status != null && count != null) {
                statusMap.put(status.toUpperCase(Locale.ROOT), count.longValue());
            }
        }

        List<String> canonicalStatuses = List.of("CONFIRMED", "PENDING", "COMPLETED", "CANCELLED", "REJECTED");
        List<StatusDistributionDTO> result = new ArrayList<>();

        for (String status : canonicalStatuses) {
            long count = statusMap.getOrDefault(status, 0L);
            double percentage = (totalAppointments > 0)
                    ? BigDecimal.valueOf((count * 100.0) / totalAppointments).setScale(1, RoundingMode.HALF_UP).doubleValue()
                    : 0.0;
            result.add(new StatusDistributionDTO(status, count, percentage));
        }

        return result;
    }

    private List<TrendDataPointDTO> buildAppointmentTrends(LocalDate startDate, LocalDate endDate) {
        List<Object[]> rows = appointmentRepository.getDailyAppointmentTrends(startDate, endDate);
        Map<LocalDate, long[]> dateMap = new HashMap<>();

        for (Object[] row : rows) {
            Object rawDate = row[0];
            Number total = (Number) row[1];
            Number completed = (Number) row[2];
            Number cancelled = (Number) row[3];

            LocalDate date = null;
            if (rawDate instanceof LocalDate ld) {
                date = ld;
            } else if (rawDate instanceof java.sql.Date sd) {
                date = sd.toLocalDate();
            } else if (rawDate != null) {
                try {
                    date = LocalDate.parse(rawDate.toString().substring(0, 10));
                } catch (Exception ignored) {
                }
            }

            if (date != null) {
                dateMap.put(date, new long[]{
                        total != null ? total.longValue() : 0L,
                        completed != null ? completed.longValue() : 0L,
                        cancelled != null ? cancelled.longValue() : 0L
                });
            }
        }

        List<TrendDataPointDTO> trends = new ArrayList<>();
        long daysBetween = Period.between(startDate, endDate).getDays() + (Period.between(startDate, endDate).getMonths() * 30L);

        // If date range is <= 90 days, render continuous day-by-day
        if (daysBetween <= 90) {
            LocalDate cur = startDate;
            while (!cur.isAfter(endDate)) {
                long[] stats = dateMap.getOrDefault(cur, new long[]{0L, 0L, 0L});
                trends.add(new TrendDataPointDTO(
                        cur.format(DATE_FORMATTER),
                        cur.format(LABEL_FORMATTER),
                        stats[0],
                        stats[1],
                        stats[2]
                ));
                cur = cur.plusDays(1);
            }
        } else {
            List<LocalDate> sortedDates = new ArrayList<>(dateMap.keySet());
            Collections.sort(sortedDates);
            for (LocalDate d : sortedDates) {
                long[] stats = dateMap.get(d);
                trends.add(new TrendDataPointDTO(
                        d.format(DATE_FORMATTER),
                        d.format(LABEL_FORMATTER),
                        stats[0],
                        stats[1],
                        stats[2]
                ));
            }
        }

        return trends;
    }

    private List<DoctorWorkloadDTO> buildDoctorWorkloads(LocalDate startDate, LocalDate endDate) {
        List<Doctor> doctors = doctorRepository.findAll();
        List<User> users = userRepository.findByRole(Role.DOCTOR);
        List<Specialization> specializations = specializationRepository.findAll();

        Map<Long, User> userMap = new HashMap<>();
        for (User u : users) {
            userMap.put(u.getUserId(), u);
        }

        Map<Long, String> specMap = new HashMap<>();
        for (Specialization s : specializations) {
            specMap.put(s.getSpecializationId(), s.getSpecializationName());
        }

        List<Object[]> rawDoctorStats = appointmentRepository.getDoctorAppointmentStats(startDate, endDate);
        Map<Long, long[]> statsMap = new HashMap<>();
        for (Object[] r : rawDoctorStats) {
            Long docId = (r[0] instanceof Number n) ? n.longValue() : Long.valueOf(r[0].toString());
            Number total = (Number) r[1];
            Number completed = (Number) r[2];
            Number cancelled = (Number) r[3];
            statsMap.put(docId, new long[]{
                    total != null ? total.longValue() : 0L,
                    completed != null ? completed.longValue() : 0L,
                    cancelled != null ? cancelled.longValue() : 0L
            });
        }

        List<DoctorWorkloadDTO> list = new ArrayList<>();
        for (Doctor d : doctors) {
            User u = userMap.get(d.getUserId());
            String doctorName = (u != null && u.getFullName() != null) ? "Dr. " + u.getFullName() : "Doctor #" + d.getDoctorId();
            boolean isActive = (u != null && Boolean.TRUE.equals(u.getIsActive()));
            String specName = specMap.getOrDefault(d.getSpecializationId(), "General Medicine");

            long[] st = statsMap.getOrDefault(d.getDoctorId(), new long[]{0L, 0L, 0L});
            long total = st[0];
            long completed = st[1];
            long cancelled = st[2];

            double completionRate = (total > 0)
                    ? BigDecimal.valueOf((completed * 100.0) / total).setScale(1, RoundingMode.HALF_UP).doubleValue()
                    : 0.0;

            BigDecimal fee = d.getConsultationFee() != null ? d.getConsultationFee() : BigDecimal.ZERO;
            BigDecimal estimatedValue = fee.multiply(BigDecimal.valueOf(completed)).setScale(2, RoundingMode.HALF_UP);

            list.add(new DoctorWorkloadDTO(
                    d.getDoctorId(),
                    doctorName,
                    specName,
                    d.getLicenseNumber(),
                    isActive,
                    fee,
                    total,
                    completed,
                    cancelled,
                    completionRate,
                    estimatedValue
            ));
        }

        list.sort((a, b) -> {
            int cmp = Long.compare(b.getTotalAppointments(), a.getTotalAppointments());
            return (cmp != 0) ? cmp : Long.compare(b.getCompletedAppointments(), a.getCompletedAppointments());
        });

        return list;
    }

    private List<SpecializationAnalyticsDTO> buildSpecializationAnalytics(LocalDate startDate, LocalDate endDate, long totalAppointments) {
        List<Specialization> specializations = specializationRepository.findAll();
        List<Doctor> doctors = doctorRepository.findAll();

        Map<Long, Long> docCountMap = new HashMap<>();
        for (Doctor d : doctors) {
            Long sid = d.getSpecializationId();
            if (sid != null) {
                docCountMap.put(sid, docCountMap.getOrDefault(sid, 0L) + 1);
            }
        }

        List<Object[]> rawApptStats = appointmentRepository.getSpecializationAppointmentStats(startDate, endDate);
        Map<Long, long[]> apptStatsMap = new HashMap<>();
        for (Object[] r : rawApptStats) {
            Long sid = (r[0] instanceof Number n) ? n.longValue() : Long.valueOf(r[0].toString());
            Number total = (Number) r[1];
            Number completed = (Number) r[2];
            apptStatsMap.put(sid, new long[]{
                    total != null ? total.longValue() : 0L,
                    completed != null ? completed.longValue() : 0L
            });
        }

        List<SpecializationAnalyticsDTO> list = new ArrayList<>();
        for (Specialization s : specializations) {
            Long sid = s.getSpecializationId();
            long docCount = docCountMap.getOrDefault(sid, 0L);
            long[] st = apptStatsMap.getOrDefault(sid, new long[]{0L, 0L});
            long apptCount = st[0];
            long completedCount = st[1];

            double sharePercentage = (totalAppointments > 0)
                    ? BigDecimal.valueOf((apptCount * 100.0) / totalAppointments).setScale(1, RoundingMode.HALF_UP).doubleValue()
                    : 0.0;

            list.add(new SpecializationAnalyticsDTO(
                    sid,
                    s.getSpecializationName(),
                    docCount,
                    apptCount,
                    completedCount,
                    sharePercentage,
                    BigDecimal.ZERO
            ));
        }

        list.sort((a, b) -> Long.compare(b.getAppointmentCount(), a.getAppointmentCount()));

        return list;
    }

    /**
     * Demographic analytics with 100% database-level SQL aggregations.
     * Zero dates of birth or raw patient rows loaded into JVM heap.
     */
    private PatientAnalyticsDTO buildPatientAnalytics(LocalDate startDate, LocalDate endDate) {
        long totalPatients = patientRepository.count();

        // 1. Registration trends
        List<Object[]> regRows = userRepository.getPatientRegistrationsByDateRange(startDate, endDate);
        List<TrendDataPointDTO> regTrends = new ArrayList<>();
        for (Object[] row : regRows) {
            Object rawDate = row[0];
            Number count = (Number) row[1];
            LocalDate lDate = null;
            if (rawDate instanceof LocalDate ld) {
                lDate = ld;
            } else if (rawDate instanceof java.sql.Date sd) {
                lDate = sd.toLocalDate();
            } else if (rawDate != null) {
                try {
                    lDate = LocalDate.parse(rawDate.toString().substring(0, 10));
                } catch (Exception ignored) {
                }
            }
            if (lDate != null && count != null) {
                regTrends.add(new TrendDataPointDTO(
                        lDate.format(DATE_FORMATTER),
                        lDate.format(LABEL_FORMATTER),
                        count.longValue(),
                        0L,
                        0L
                ));
            }
        }

        // 2. Gender distribution (database aggregate)
        List<Object[]> rawGender = patientRepository.countPatientsByGenderGrouped();
        List<DemographicDistributionDTO> genderDist = new ArrayList<>();
        for (Object[] row : rawGender) {
            String g = (String) row[0];
            Number count = (Number) row[1];
            long c = (count != null) ? count.longValue() : 0L;
            double pct = (totalPatients > 0)
                    ? BigDecimal.valueOf((c * 100.0) / totalPatients).setScale(1, RoundingMode.HALF_UP).doubleValue()
                    : 0.0;
            String label = switch (g != null ? g.toUpperCase(Locale.ROOT) : "") {
                case "MALE" -> "Male";
                case "FEMALE" -> "Female";
                case "OTHER" -> "Other";
                case "PREFER_NOT_TO_SAY" -> "Prefer Not to Say";
                default -> "Unspecified";
            };
            genderDist.add(new DemographicDistributionDTO(label, c, pct));
        }

        // 3. Blood group distribution (database aggregate)
        List<Object[]> rawBlood = patientRepository.countPatientsByBloodGroupGrouped();
        List<DemographicDistributionDTO> bloodDist = new ArrayList<>();
        for (Object[] row : rawBlood) {
            String bg = (String) row[0];
            Number count = (Number) row[1];
            long c = (count != null) ? count.longValue() : 0L;
            double pct = (totalPatients > 0)
                    ? BigDecimal.valueOf((c * 100.0) / totalPatients).setScale(1, RoundingMode.HALF_UP).doubleValue()
                    : 0.0;
            bloodDist.add(new DemographicDistributionDTO(bg != null && !bg.isBlank() ? bg : "Unspecified", c, pct));
        }

        // 4. Age cohort distribution (PostgreSQL-calculated, zero DOBs loaded into JVM)
        List<Object[]> rawAgeRows = patientRepository.countPatientsByAgeCohortGrouped();
        Map<String, Long> cohortCounts = new HashMap<>();
        for (Object[] r : rawAgeRows) {
            String cohort = (String) r[0];
            Number cnt = (Number) r[1];
            if (cohort != null && cnt != null) {
                cohortCounts.put(cohort, cnt.longValue());
            }
        }

        List<String> canonicalCohorts = List.of(
                "0-17 (Pediatric)",
                "18-35 (Young Adult)",
                "36-50 (Adult)",
                "51-65 (Middle Aged)",
                "65+ (Senior)"
        );
        List<DemographicDistributionDTO> ageDist = new ArrayList<>();
        for (String c : canonicalCohorts) {
            long count = cohortCounts.getOrDefault(c, 0L);
            double pct = (totalPatients > 0)
                    ? BigDecimal.valueOf((count * 100.0) / totalPatients).setScale(1, RoundingMode.HALF_UP).doubleValue()
                    : 0.0;
            ageDist.add(new DemographicDistributionDTO(c, count, pct));
        }
        long unspecified = cohortCounts.getOrDefault("Unspecified Age", 0L);
        if (unspecified > 0) {
            double pct = (totalPatients > 0)
                    ? BigDecimal.valueOf((unspecified * 100.0) / totalPatients).setScale(1, RoundingMode.HALF_UP).doubleValue()
                    : 0.0;
            ageDist.add(new DemographicDistributionDTO("Unspecified Age", unspecified, pct));
        }

        return new PatientAnalyticsDTO(totalPatients, regTrends, genderDist, bloodDist, ageDist);
    }

    /**
     * Paginated Appointment Report for interactive dashboard tables.
     * Loads only the requested page of appointments into memory.
     * Strictly excludes clinical notes and symptoms for administrative privacy.
     */
    @Transactional(readOnly = true)
    public PaginatedResponseDTO<AppointmentReportItemDTO> getAppointmentsReportPaginated(
            String filterType,
            LocalDate customStartDate,
            LocalDate customEndDate,
            Pageable pageable) {

        LocalDate[] dates = resolveDateRange(filterType, customStartDate, customEndDate);
        Page<Appointment> page = appointmentRepository.findAppointmentsByDateRangePaginated(dates[0], dates[1], pageable);

        if (page.isEmpty()) {
            return new PaginatedResponseDTO<>(
                    Collections.emptyList(),
                    page.getNumber(),
                    page.getSize(),
                    page.getTotalElements(),
                    page.getTotalPages(),
                    page.isFirst(),
                    page.isLast(),
                    page.hasNext(),
                    page.hasPrevious()
            );
        }

        Set<Long> patientIds = page.getContent().stream().map(Appointment::getPatientId).collect(Collectors.toSet());
        Set<Long> doctorIds = page.getContent().stream().map(Appointment::getDoctorId).collect(Collectors.toSet());

        Map<Long, String> patientNames = new HashMap<>();
        for (Long pid : patientIds) {
            patientRepository.findById(pid).ifPresent(p -> {
                userRepository.findById(p.getUserId()).ifPresent(u -> patientNames.put(pid, u.getFullName()));
            });
        }

        Map<Long, String[]> doctorDetails = new HashMap<>();
        for (Long did : doctorIds) {
            doctorRepository.findById(did).ifPresent(d -> {
                User u = userRepository.findById(d.getUserId()).orElse(null);
                String docName = (u != null) ? "Dr. " + u.getFullName() : "Doctor #" + did;
                String specName = specializationRepository.findById(d.getSpecializationId())
                        .map(Specialization::getSpecializationName).orElse("General Medicine");
                doctorDetails.put(did, new String[]{docName, specName});
            });
        }

        List<AppointmentReportItemDTO> items = new ArrayList<>();
        for (Appointment a : page.getContent()) {
            String pName = patientNames.getOrDefault(a.getPatientId(), "Patient #" + a.getPatientId());
            String[] docInfo = doctorDetails.getOrDefault(a.getDoctorId(), new String[]{"Doctor #" + a.getDoctorId(), "General"});

            items.add(new AppointmentReportItemDTO(
                    a.getAppointmentId(),
                    a.getAppointmentDate() != null ? a.getAppointmentDate().toString() : "",
                    a.getAppointmentTime() != null ? a.getAppointmentTime().toString() : "",
                    pName,
                    docInfo[0],
                    docInfo[1],
                    a.getStatus(),
                    a.getQueueNumber(),
                    a.getCreatedAt() != null ? a.getCreatedAt().format(DateTimeFormatter.ISO_OFFSET_DATE_TIME) : ""
            ));
        }

        return new PaginatedResponseDTO<>(
                items,
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isFirst(),
                page.isLast(),
                page.hasNext(),
                page.hasPrevious()
        );
    }

    /**
     * Paginated Patient Registry Report.
     * Respects registration date range filter.
     */
    @Transactional(readOnly = true)
    public PaginatedResponseDTO<PatientReportItemDTO> getPatientsReportPaginated(
            String filterType,
            LocalDate customStartDate,
            LocalDate customEndDate,
            Pageable pageable) {

        Page<Patient> page;
        if ("ALL_TIME".equalsIgnoreCase(filterType)) {
            page = patientRepository.findAll(pageable);
        } else {
            LocalDate[] dates = resolveDateRange(filterType, customStartDate, customEndDate);
            page = patientRepository.findPatientsByRegistrationDateRange(dates[0], dates[1], pageable);
        }

        if (page.isEmpty()) {
            return new PaginatedResponseDTO<>(
                    Collections.emptyList(),
                    page.getNumber(),
                    page.getSize(),
                    page.getTotalElements(),
                    page.getTotalPages(),
                    page.isFirst(),
                    page.isLast(),
                    page.hasNext(),
                    page.hasPrevious()
            );
        }

        LocalDate now = LocalDate.now();
        List<PatientReportItemDTO> items = new ArrayList<>();

        for (Patient p : page.getContent()) {
            User u = userRepository.findById(p.getUserId()).orElse(null);
            Integer age = null;
            if (p.getDateOfBirth() != null && !p.getDateOfBirth().isAfter(now)) {
                age = Period.between(p.getDateOfBirth(), now).getYears();
            }

            items.add(new PatientReportItemDTO(
                    p.getPatientId(),
                    p.getUserId(),
                    u != null ? u.getFullName() : "Patient #" + p.getPatientId(),
                    u != null ? u.getEmail() : "",
                    p.getPhone(),
                    p.getGender(),
                    p.getBloodGroup(),
                    p.getDateOfBirth() != null ? p.getDateOfBirth().toString() : "",
                    age,
                    u != null && u.getCreatedAt() != null ? u.getCreatedAt().format(DateTimeFormatter.ISO_OFFSET_DATE_TIME) : "",
                    u != null && Boolean.TRUE.equals(u.getIsActive())
            ));
        }

        return new PaginatedResponseDTO<>(
                items,
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isFirst(),
                page.isLast(),
                page.hasNext(),
                page.hasPrevious()
        );
    }

    /**
     * Report: Doctor Performance and Workload
     */
    @Transactional(readOnly = true)
    public List<DoctorReportItemDTO> getDoctorReport(String filterType, LocalDate customStartDate, LocalDate customEndDate) {
        LocalDate[] dates = resolveDateRange(filterType, customStartDate, customEndDate);
        List<Doctor> doctors = doctorRepository.findAll();
        List<User> users = userRepository.findByRole(Role.DOCTOR);
        Map<Long, User> userMap = new HashMap<>();
        for (User u : users) {
            userMap.put(u.getUserId(), u);
        }

        Map<Long, String> specMap = new HashMap<>();
        for (Specialization s : specializationRepository.findAll()) {
            specMap.put(s.getSpecializationId(), s.getSpecializationName());
        }

        List<Object[]> rawStats = appointmentRepository.getDoctorAppointmentStats(dates[0], dates[1]);
        Map<Long, long[]> statsMap = new HashMap<>();
        for (Object[] r : rawStats) {
            Long docId = (Long) r[0];
            Number total = (Number) r[1];
            Number completed = (Number) r[2];
            Number cancelled = (Number) r[3];
            statsMap.put(docId, new long[]{
                    total != null ? total.longValue() : 0L,
                    completed != null ? completed.longValue() : 0L,
                    cancelled != null ? cancelled.longValue() : 0L
            });
        }

        List<DoctorReportItemDTO> items = new ArrayList<>();
        for (Doctor d : doctors) {
            User u = userMap.get(d.getUserId());
            String docName = (u != null) ? "Dr. " + u.getFullName() : "Doctor #" + d.getDoctorId();
            String spec = specMap.getOrDefault(d.getSpecializationId(), "General Medicine");
            long[] st = statsMap.getOrDefault(d.getDoctorId(), new long[]{0L, 0L, 0L});

            long total = st[0];
            long completed = st[1];
            long cancelled = st[2];

            double completionRate = (total > 0)
                    ? BigDecimal.valueOf((completed * 100.0) / total).setScale(1, RoundingMode.HALF_UP).doubleValue()
                    : 0.0;

            BigDecimal fee = d.getConsultationFee() != null ? d.getConsultationFee() : BigDecimal.ZERO;
            BigDecimal estimatedValue = fee.multiply(BigDecimal.valueOf(completed)).setScale(2, RoundingMode.HALF_UP);

            items.add(new DoctorReportItemDTO(
                    d.getDoctorId(),
                    d.getUserId(),
                    docName,
                    u != null ? u.getEmail() : "",
                    spec,
                    d.getLicenseNumber(),
                    d.getQualification(),
                    d.getExperienceYears(),
                    fee,
                    u != null && Boolean.TRUE.equals(u.getIsActive()),
                    total,
                    completed,
                    cancelled,
                    completionRate,
                    estimatedValue
            ));
        }

        items.sort((a, b) -> Long.compare(b.getTotalAppointments(), a.getTotalAppointments()));
        return items;
    }

    /**
     * Report: Specialization Utilization
     */
    @Transactional(readOnly = true)
    public List<SpecializationReportItemDTO> getSpecializationReport(String filterType, LocalDate customStartDate, LocalDate customEndDate) {
        LocalDate[] dates = resolveDateRange(filterType, customStartDate, customEndDate);
        List<Specialization> specs = specializationRepository.findAll();
        List<Doctor> doctors = doctorRepository.findAll();
        List<User> doctorUsers = userRepository.findByRole(Role.DOCTOR);

        Map<Long, Boolean> doctorActiveMap = new HashMap<>();
        for (User u : doctorUsers) {
            doctorActiveMap.put(u.getUserId(), Boolean.TRUE.equals(u.getIsActive()));
        }

        Map<Long, Long> totalDocMap = new HashMap<>();
        Map<Long, Long> activeDocMap = new HashMap<>();
        for (Doctor d : doctors) {
            Long sid = d.getSpecializationId();
            if (sid != null) {
                totalDocMap.put(sid, totalDocMap.getOrDefault(sid, 0L) + 1);
                if (doctorActiveMap.getOrDefault(d.getUserId(), false)) {
                    activeDocMap.put(sid, activeDocMap.getOrDefault(sid, 0L) + 1);
                }
            }
        }

        long totalAppts = appointmentRepository.countByDateRange(dates[0], dates[1]);
        List<Object[]> rawStats = appointmentRepository.getSpecializationAppointmentStats(dates[0], dates[1]);
        Map<Long, long[]> statsMap = new HashMap<>();
        for (Object[] r : rawStats) {
            Long sid = (Long) r[0];
            Number total = (Number) r[1];
            Number completed = (Number) r[2];
            statsMap.put(sid, new long[]{
                    total != null ? total.longValue() : 0L,
                    completed != null ? completed.longValue() : 0L
            });
        }

        List<SpecializationReportItemDTO> items = new ArrayList<>();
        for (Specialization s : specs) {
            Long sid = s.getSpecializationId();
            long docCount = totalDocMap.getOrDefault(sid, 0L);
            long activeDocCount = activeDocMap.getOrDefault(sid, 0L);

            long[] st = statsMap.getOrDefault(sid, new long[]{0L, 0L});
            long total = st[0];
            long completed = st[1];

            double share = (totalAppts > 0)
                    ? BigDecimal.valueOf((total * 100.0) / totalAppts).setScale(1, RoundingMode.HALF_UP).doubleValue()
                    : 0.0;

            items.add(new SpecializationReportItemDTO(
                    sid,
                    s.getSpecializationName(),
                    s.getDescription(),
                    docCount,
                    activeDocCount,
                    total,
                    completed,
                    share,
                    BigDecimal.ZERO
            ));
        }

        items.sort((a, b) -> Long.compare(b.getTotalAppointments(), a.getTotalAppointments()));
        return items;
    }

    /**
     * CSV Export: Appointments
     * Strictly excludes clinical notes and symptoms for administrative privacy.
     */
    @Transactional(readOnly = true)
    public String exportAppointmentsCsv(String filterType, LocalDate customStartDate, LocalDate customEndDate) {
        LocalDate[] dates = resolveDateRange(filterType, customStartDate, customEndDate);
        List<Appointment> appts = appointmentRepository.findAppointmentsByDateRange(dates[0], dates[1]);

        Map<Long, String> patientNames = new HashMap<>();
        for (Patient p : patientRepository.findAll()) {
            User u = userRepository.findById(p.getUserId()).orElse(null);
            if (u != null) {
                patientNames.put(p.getPatientId(), u.getFullName());
            }
        }

        Map<Long, String[]> doctorDetails = new HashMap<>();
        Map<Long, String> specNames = new HashMap<>();
        for (Specialization s : specializationRepository.findAll()) {
            specNames.put(s.getSpecializationId(), s.getSpecializationName());
        }

        for (Doctor d : doctorRepository.findAll()) {
            User u = userRepository.findById(d.getUserId()).orElse(null);
            String docName = (u != null) ? "Dr. " + u.getFullName() : "Doctor #" + d.getDoctorId();
            String specName = specNames.getOrDefault(d.getSpecializationId(), "General Medicine");
            doctorDetails.put(d.getDoctorId(), new String[]{docName, specName});
        }

        StringWriter sw = new StringWriter();
        // UTF-8 BOM
        sw.write('\uFEFF');

        sw.write("Appointment ID,Date,Time,Patient Name,Doctor Name,Specialization,Status,Queue Number,Created At\n");
        for (Appointment a : appts) {
            String pName = patientNames.getOrDefault(a.getPatientId(), "Patient #" + a.getPatientId());
            String[] docInfo = doctorDetails.getOrDefault(a.getDoctorId(), new String[]{"Doctor #" + a.getDoctorId(), "General"});

            sw.write(String.format("%s,%s,%s,%s,%s,%s,%s,%s,%s\n",
                    escapeCsv(a.getAppointmentId()),
                    escapeCsv(a.getAppointmentDate()),
                    escapeCsv(a.getAppointmentTime()),
                    escapeCsv(pName),
                    escapeCsv(docInfo[0]),
                    escapeCsv(docInfo[1]),
                    escapeCsv(a.getStatus()),
                    escapeCsv(a.getQueueNumber() != null ? String.valueOf(a.getQueueNumber()) : ""),
                    escapeCsv(a.getCreatedAt() != null ? a.getCreatedAt().format(DateTimeFormatter.ISO_OFFSET_DATE_TIME) : "")
            ));
        }

        return sw.toString();
    }

    /**
     * CSV Export: Patients
     * Respects selected date range filter.
     */
    @Transactional(readOnly = true)
    public String exportPatientsCsv(String filterType, LocalDate customStartDate, LocalDate customEndDate) {
        List<Patient> patients;
        if ("ALL_TIME".equalsIgnoreCase(filterType)) {
            patients = patientRepository.findAll();
        } else {
            LocalDate[] dates = resolveDateRange(filterType, customStartDate, customEndDate);
            patients = patientRepository.findPatientsByRegistrationDateRange(dates[0], dates[1], Pageable.unpaged()).getContent();
        }

        Map<Long, User> userMap = new HashMap<>();
        for (User u : userRepository.findByRole(Role.PATIENT)) {
            userMap.put(u.getUserId(), u);
        }

        LocalDate now = LocalDate.now();
        StringWriter sw = new StringWriter();
        sw.write('\uFEFF');

        sw.write("Patient ID,User ID,Full Name,Email,Phone,Gender,Blood Group,Date of Birth,Age,Registration Date,Status\n");
        for (Patient p : patients) {
            User u = userMap.get(p.getUserId());
            Integer age = null;
            if (p.getDateOfBirth() != null && !p.getDateOfBirth().isAfter(now)) {
                age = Period.between(p.getDateOfBirth(), now).getYears();
            }

            sw.write(String.format("%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s\n",
                    escapeCsv(p.getPatientId()),
                    escapeCsv(p.getUserId()),
                    escapeCsv(u != null ? u.getFullName() : ""),
                    escapeCsv(u != null ? u.getEmail() : ""),
                    escapeCsv(p.getPhone()),
                    escapeCsv(p.getGender()),
                    escapeCsv(p.getBloodGroup()),
                    escapeCsv(p.getDateOfBirth()),
                    escapeCsv(age != null ? String.valueOf(age) : ""),
                    escapeCsv(u != null && u.getCreatedAt() != null ? u.getCreatedAt().format(DateTimeFormatter.ISO_OFFSET_DATE_TIME) : ""),
                    escapeCsv((u != null && Boolean.TRUE.equals(u.getIsActive())) ? "ACTIVE" : "INACTIVE")
            ));
        }

        return sw.toString();
    }

    /**
     * CSV Export: Doctors
     */
    @Transactional(readOnly = true)
    public String exportDoctorsCsv(String filterType, LocalDate customStartDate, LocalDate customEndDate) {
        List<DoctorReportItemDTO> items = getDoctorReport(filterType, customStartDate, customEndDate);
        StringWriter sw = new StringWriter();
        sw.write('\uFEFF');

        sw.write("Doctor ID,User ID,Doctor Name,Email,Specialization,License Number,Qualification,Experience (Years),Consultation Fee (INR),Status,Total Appointments,Completed Appointments,Cancelled Appointments,Completion Rate (%),Estimated Value (INR)\n");
        for (DoctorReportItemDTO i : items) {
            sw.write(String.format("%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s\n",
                    escapeCsv(i.getDoctorId()),
                    escapeCsv(i.getUserId()),
                    escapeCsv(i.getFullName()),
                    escapeCsv(i.getEmail()),
                    escapeCsv(i.getSpecialization()),
                    escapeCsv(i.getLicenseNumber()),
                    escapeCsv(i.getQualification()),
                    escapeCsv(i.getExperienceYears() != null ? String.valueOf(i.getExperienceYears()) : "0"),
                    escapeCsv(i.getConsultationFee() != null ? i.getConsultationFee().toString() : "0.00"),
                    escapeCsv(i.isActive() ? "ACTIVE" : "INACTIVE"),
                    escapeCsv(i.getTotalAppointments()),
                    escapeCsv(i.getCompletedAppointments()),
                    escapeCsv(i.getCancelledAppointments()),
                    escapeCsv(i.getCompletionRate() + "%"),
                    escapeCsv(i.getEstimatedValue() != null ? i.getEstimatedValue().toString() : "0.00")
            ));
        }

        return sw.toString();
    }

    /**
     * CSV Export: Specializations
     */
    @Transactional(readOnly = true)
    public String exportSpecializationsCsv(String filterType, LocalDate customStartDate, LocalDate customEndDate) {
        List<SpecializationReportItemDTO> items = getSpecializationReport(filterType, customStartDate, customEndDate);
        StringWriter sw = new StringWriter();
        sw.write('\uFEFF');

        sw.write("Specialization ID,Specialization Name,Description,Total Doctors,Active Doctors,Total Appointments,Completed Appointments,Appointment Share (%)\n");
        for (SpecializationReportItemDTO i : items) {
            sw.write(String.format("%s,%s,%s,%s,%s,%s,%s,%s\n",
                    escapeCsv(i.getSpecializationId()),
                    escapeCsv(i.getSpecializationName()),
                    escapeCsv(i.getDescription()),
                    escapeCsv(i.getDoctorCount()),
                    escapeCsv(i.getActiveDoctorCount()),
                    escapeCsv(i.getTotalAppointments()),
                    escapeCsv(i.getCompletedAppointments()),
                    escapeCsv(i.getAppointmentShare() + "%")
            ));
        }

        return sw.toString();
    }

    private String escapeCsv(Object value) {
        if (value == null) return "";
        String s = value.toString().trim();
        if (s.contains(",") || s.contains("\"") || s.contains("\n") || s.contains("\r")) {
            s = s.replace("\"", "\"\"");
            return "\"" + s + "\"";
        }
        return s;
    }
}
