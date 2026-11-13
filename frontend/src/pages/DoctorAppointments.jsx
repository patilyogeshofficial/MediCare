
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Search,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  UserRound,
  X,
  Stethoscope,
  RefreshCw,
  Plus,
  Trash2,
  Pill,
  FileText,
  Printer,
  RotateCcw,
  Timer,
  Activity,
  Scale,
  Thermometer,
  Heart,
  ClipboardList,
  ShieldAlert,
} from "lucide-react";
import StatusBadge from "../components/ui/StatusBadge";
import AccessibleModal from "../components/ui/AccessibleModal";
import toast from "react-hot-toast";
import api from "../services/api";

const emptyMedicine = () => ({
  medicineName: "",
  dosage: "",
  frequency: "",
  duration: "",
  instructions: "",
});

const normalizeStatus = (value) => {
  const status = String(value || "Pending").trim().toLowerCase();
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const getArrayFromResponse = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.appointments)) return data.appointments;
  if (Array.isArray(data?.content)) return data.content;
  return [];
};

const normalizeAppointment = (item) => {
  const patient = item.patient || {};
  const patientId =
    item.patientId ?? patient.patientId ?? patient.id ?? null;

  const rawDate =
    item.appointmentDate ?? item.date ?? item.bookingDate ?? "";

  const rawTime =
    item.appointmentTime ?? item.time ?? item.bookingTime ?? "";

  return {
    id: item.appointmentId ?? item.id ?? item.appointment_id,
    patientId,
    patient:
      item.patientName ??
      patient.fullName ??
      patient.name ??
      (patientId != null ? `Patient #${patientId}` : "Patient details unavailable"),
    age: item.patientAge ?? patient.age ?? null,
    gender: item.patientGender ?? patient.gender ?? null,
    phone: item.patientPhone ?? patient.phone ?? "Not provided",
    date: typeof rawDate === "string" ? rawDate.slice(0, 10) : "",
    time: rawTime,
    reason:
      item.reason ??
      item.appointmentReason ??
      item.description ??
      "Not provided",
    status: normalizeStatus(item.status ?? item.appointmentStatus),
    queueNumber: item.queueNumber ?? item.queue_number ?? null,
    rescheduleRequestedDate: item.rescheduleRequestedDate ?? item.reschedule_requested_date ?? null,
    rescheduleRequestedTime: item.rescheduleRequestedTime ?? item.reschedule_requested_time ?? null,
    rescheduleReason: item.rescheduleReason ?? item.reschedule_reason ?? null,
    rescheduleStatus: item.rescheduleStatus ?? item.reschedule_status ?? null,
    holdExpiresAt: item.holdExpiresAt ?? item.hold_expires_at ?? null,
    hasPrescription: false,
    prescriptionCheckFailed: false,
  };
};

function DoctorAppointments({ isDeactivated = false }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [savingPrescription, setSavingPrescription] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("");

  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);

  const [viewingPrescription, setViewingPrescription] = useState(null);
  const [loadingPrescription, setLoadingPrescription] = useState(false);
  const [prescriptionModalAppointment, setPrescriptionModalAppointment] =
    useState(null);

  const [diagnosis, setDiagnosis] = useState("");
  const [medicines, setMedicines] = useState([emptyMedicine()]);
  const [instructions, setInstructions] = useState("");

  // Clinical Consultation & Vitals (Module 5)
  const [showConsultationModal, setShowConsultationModal] = useState(false);
  const [consultationAppointment, setConsultationAppointment] = useState(null);
  const [consultationRecordId, setConsultationRecordId] = useState(null);
  const [consultationLoading, setConsultationLoading] = useState(false);
  const [consultationSaving, setConsultationSaving] = useState(false);
  const [consultationForm, setConsultationForm] = useState({
    symptoms: "",
    clinicalObservations: "",
    diagnosis: "",
    treatmentPlan: "",
    followUpRecommendations: "",
  });
  const [consultationVitals, setConsultationVitals] = useState({
    systolicBp: "",
    diastolicBp: "",
    heartRateBpm: "",
    respiratoryRateBpm: "",
    temperatureCelsius: "",
    oxygenSaturationPercent: "",
    weightKg: "",
    heightCm: "",
    vitalsNotes: "",
  });

  const fetchAppointments = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    setError("");

    try {
      const response = await api.get("/appointments/my");

      const records = getArrayFromResponse(response.data)
        .map(normalizeAppointment)
        .filter((appointment) => appointment.id != null);

      // Check prescription existence only for completed appointments.
      const checkedRecords = await Promise.all(
        records.map(async (appointment) => {
          if (appointment.status !== "Completed") {
            return appointment;
          }

          try {
            const result = await api.get(
              `/prescriptions/appointment/${appointment.id}/my`
            );

            return {
              ...appointment,
              hasPrescription: result.data === true,
            };
          } catch (err) {
            return {
              ...appointment,
              prescriptionCheckFailed: true,
            };
          }
        })
      );

      setAppointments(checkedRecords);

      setSelectedAppointment((current) => {
        if (!current) return null;

        return (
          checkedRecords.find(
            (item) => String(item.id) === String(current.id)
          ) || null
        );
      });
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Unable to load your appointments. Please try again.";

      setError(message);

      if (isRefresh) toast.error(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const stats = useMemo(
    () => [
      {
        title: "Total Appointments",
        value: appointments.length,
        icon: CalendarDays,
        color: "bg-cyan-50 text-cyan-600",
      },
      {
        title: "Confirmed",
        value: appointments.filter((a) => a.status === "Confirmed").length,
        icon: CheckCircle,
        color: "bg-green-50 text-green-600",
      },
      {
        title: "Pending",
        value: appointments.filter((a) => a.status === "Pending").length,
        icon: Clock,
        color: "bg-orange-50 text-orange-600",
      },
      {
        title: "Completed",
        value: appointments.filter((a) => a.status === "Completed").length,
        icon: CheckCircle,
        color: "bg-blue-50 text-blue-600",
      },
    ],
    [appointments]
  );

  const filteredAppointments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return appointments.filter((appointment) => {
      const matchesSearch =
        String(appointment.patient).toLowerCase().includes(query) ||
        String(appointment.id).toLowerCase().includes(query) ||
        String(appointment.patientId ?? "").includes(query);

      const matchesStatus =
        statusFilter === "All" || appointment.status === statusFilter;

      const matchesDate =
        !dateFilter || appointment.date === dateFilter;

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [appointments, search, statusFilter, dateFilter]);

  // Escape key handler to close active modals (WCAG 2.1.2)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (showConsultationModal) setShowConsultationModal(false);
        if (showPrescriptionForm) setShowPrescriptionForm(false);
        if (viewingPrescription) setViewingPrescription(null);
        if (selectedAppointment) setSelectedAppointment(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showConsultationModal, showPrescriptionForm, viewingPrescription, selectedAppointment]);

  const updateStatus = async (appointment, newStatus) => {
    if (isDeactivated) {
      toast.error(
        "Action not permitted: Your doctor profile is deactivated by the administrator."
      );
      return;
    }

    const currentStatus = String(appointment.status || "").toUpperCase();
    if (["COMPLETED", "CANCELLED", "REJECTED"].includes(currentStatus)) {
      toast.error(
        `This appointment is in a terminal state (${appointment.status}) and cannot be changed.`
      );
      return;
    }

    let cancellationReason = null;
    if (newStatus === "Rejected" || newStatus === "Cancelled") {
      const reasonInput = window.prompt(
        `Please provide a reason for declining / cancelling Appointment #${appointment.id}:`
      );
      if (reasonInput === null) return;
      cancellationReason = reasonInput.trim() || `Doctor marked as ${newStatus}`;
    }

    setUpdatingId(appointment.id);

    try {
      await api.patch(
        `/appointments/${appointment.id}/status`,
        {
          status: newStatus.toUpperCase(),
          cancellationReason,
        }
      );

      setAppointments((previous) =>
        previous.map((item) =>
          String(item.id) === String(appointment.id)
            ? { ...item, status: newStatus }
            : item
        )
      );

      setSelectedAppointment((current) =>
        current && String(current.id) === String(appointment.id)
          ? { ...current, status: newStatus }
          : current
      );

      toast.success(
        `Appointment ${newStatus.toLowerCase()} successfully.`
      );

      if (newStatus === "Completed") {
        try {
          const result = await api.get(
            `/prescriptions/appointment/${appointment.id}/my`
          );

          const exists = result.data === true;

          setAppointments((previous) =>
            previous.map((item) =>
              String(item.id) === String(appointment.id)
                ? { ...item, hasPrescription: exists }
                : item
            )
          );

          setSelectedAppointment((current) =>
            current && String(current.id) === String(appointment.id)
              ? { ...current, hasPrescription: exists }
              : current
          );
        } catch {
          setAppointments((previous) =>
            previous.map((item) =>
              String(item.id) === String(appointment.id)
                ? { ...item, prescriptionCheckFailed: true }
                : item
            )
          );
        }
      }
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        `Could not ${newStatus.toLowerCase()} this appointment.`;

      toast.error(message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleApproveReschedule = async (appointment) => {
    try {
      setUpdatingId(appointment.id);
      const res = await api.patch(
        `/appointments/${appointment.id}/reschedule-approve`
      );
      toast.success("Reschedule request approved! Slot updated.");
      setAppointments((previous) =>
        previous.map((item) =>
          String(item.id) === String(appointment.id)
            ? {
                ...item,
                date: res.data.appointmentDate,
                time: res.data.appointmentTime,
                queueNumber: res.data.queueNumber,
                rescheduleStatus: "APPROVED",
              }
            : item
        )
      );
    } catch (err) {
      console.error("Approve reschedule failed:", err);
      toast.error(
        err.response?.data?.message || "Failed to approve reschedule request."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRejectReschedule = async (appointment) => {
    const reasonInput = window.prompt(
      "Reason for declining reschedule request (optional):"
    );
    if (reasonInput === null) return;

    try {
      setUpdatingId(appointment.id);
      await api.patch(
        `/appointments/${appointment.id}/reschedule-reject`,
        { reason: reasonInput.trim() }
      );
      toast.success(
        "Reschedule request declined. Original appointment slot preserved."
      );
      setAppointments((previous) =>
        previous.map((item) =>
          String(item.id) === String(appointment.id)
            ? { ...item, rescheduleStatus: "REJECTED" }
            : item
        )
      );
    } catch (err) {
      console.error("Reject reschedule failed:", err);
      toast.error(
        err.response?.data?.message || "Failed to decline reschedule request."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  // Live BMI Preview calculation for doctor vitals
  const doctorComputedBmi = useMemo(() => {
    const w = parseFloat(consultationVitals.weightKg);
    const h = parseFloat(consultationVitals.heightCm);
    if (!w || !h || h <= 0) return null;
    const heightM = h / 100.0;
    const val = (w / (heightM * heightM)).toFixed(1);
    let category = "Normal";
    let badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (val < 18.5) {
      category = "Underweight";
      badgeColor = "bg-blue-50 text-blue-700 border-blue-200";
    } else if (val >= 25 && val < 30) {
      category = "Overweight";
      badgeColor = "bg-amber-50 text-amber-700 border-amber-200";
    } else if (val >= 30) {
      category = "Obesity";
      badgeColor = "bg-rose-50 text-rose-700 border-rose-200";
    }
    return { val, category, badgeColor };
  }, [consultationVitals.weightKg, consultationVitals.heightCm]);

  // Open Clinical Consultation & Vitals modal
  const openConsultationModal = async (appointment) => {
    if (isDeactivated) {
      toast.error("Action not permitted: Your doctor profile is deactivated.");
      return;
    }

    setConsultationAppointment(appointment);
    setConsultationRecordId(null);
    setConsultationForm({
      symptoms: "",
      clinicalObservations: "",
      diagnosis: appointment.reason || "",
      treatmentPlan: "",
      followUpRecommendations: "",
    });
    setConsultationVitals({
      systolicBp: "",
      diastolicBp: "",
      heartRateBpm: "",
      respiratoryRateBpm: "",
      temperatureCelsius: "",
      oxygenSaturationPercent: "",
      weightKg: "",
      heightCm: "",
      vitalsNotes: "",
    });
    setShowConsultationModal(true);

    if (appointment.patientId) {
      try {
        setConsultationLoading(true);
        const res = await api.get(`/medical-records/patient/${appointment.patientId}`);
        const patientEhr = res.data;
        // Check for existing consultation record for this appointment
        const existing = patientEhr?.consultationRecords?.find(
          (r) => Number(r.appointmentId) === Number(appointment.id)
        );
        if (existing) {
          setConsultationRecordId(existing.id);
          setConsultationForm({
            symptoms: existing.symptoms || "",
            clinicalObservations: existing.clinicalObservations || "",
            diagnosis: existing.diagnosis || "",
            treatmentPlan: existing.treatmentPlan || "",
            followUpRecommendations: existing.followUpRecommendations || "",
          });
        }
      } catch (err) {
        console.warn("EHR lookup error:", err);
      } finally {
        setConsultationLoading(false);
      }
    }
  };

  // Save Clinical Consultation & Vitals
  const handleSaveConsultation = async (e) => {
    e.preventDefault();
    if (!consultationAppointment) return;

    try {
      setConsultationSaving(true);

      const consultPayload = {
        appointmentId: consultationAppointment.id,
        symptoms: consultationForm.symptoms?.trim() || null,
        clinicalObservations: consultationForm.clinicalObservations?.trim() || null,
        diagnosis: consultationForm.diagnosis?.trim() || null,
        treatmentPlan: consultationForm.treatmentPlan?.trim() || null,
        followUpRecommendations: consultationForm.followUpRecommendations?.trim() || null,
      };

      if (consultationRecordId) {
        await api.put(`/medical-records/consultations/${consultationRecordId}`, consultPayload);
      } else {
        await api.post("/medical-records/consultations", consultPayload);
      }

      // Check if any vitals were entered
      const hasVitals =
        consultationVitals.systolicBp ||
        consultationVitals.diastolicBp ||
        consultationVitals.heartRateBpm ||
        consultationVitals.respiratoryRateBpm ||
        consultationVitals.temperatureCelsius ||
        consultationVitals.oxygenSaturationPercent ||
        consultationVitals.weightKg ||
        consultationVitals.heightCm;

      if (hasVitals && consultationAppointment.patientId) {
        const vitalsPayload = {
          patientId: consultationAppointment.patientId,
          appointmentId: consultationAppointment.id,
          systolicBp: consultationVitals.systolicBp ? parseInt(consultationVitals.systolicBp, 10) : null,
          diastolicBp: consultationVitals.diastolicBp ? parseInt(consultationVitals.diastolicBp, 10) : null,
          heartRateBpm: consultationVitals.heartRateBpm ? parseInt(consultationVitals.heartRateBpm, 10) : null,
          respiratoryRateBpm: consultationVitals.respiratoryRateBpm ? parseInt(consultationVitals.respiratoryRateBpm, 10) : null,
          temperatureCelsius: consultationVitals.temperatureCelsius ? parseFloat(consultationVitals.temperatureCelsius) : null,
          oxygenSaturationPercent: consultationVitals.oxygenSaturationPercent ? parseFloat(consultationVitals.oxygenSaturationPercent) : null,
          weightKg: consultationVitals.weightKg ? parseFloat(consultationVitals.weightKg) : null,
          heightCm: consultationVitals.heightCm ? parseFloat(consultationVitals.heightCm) : null,
          notes: consultationVitals.vitalsNotes?.trim() || null,
          recordedAt: new Date().toISOString(),
        };
        await api.post("/medical-records/vitals", vitalsPayload);
      }

      toast.success("Consultation notes & clinical vitals recorded successfully!");
      setShowConsultationModal(false);
      fetchAppointments(true);
    } catch (err) {
      console.error("Save consultation error:", err);
      toast.error(err.response?.data?.message || "Failed to save consultation records.");
    } finally {
      setConsultationSaving(false);
    }
  };

  const openPrescriptionForm = (appointment) => {
    if (isDeactivated) {
      toast.error(
        "Action not permitted: Your doctor profile is deactivated by the administrator."
      );
      return;
    }

    if (appointment.prescriptionCheckFailed) {
      toast.error("Unable to check prescription status. Refresh and try again.");
      return;
    }

    if (appointment.hasPrescription) {
      toast.error("A prescription already exists for this appointment.");
      return;
    }

    setSelectedAppointment(appointment);
    setDiagnosis("");
    setInstructions("");
    setMedicines([emptyMedicine()]);
    setShowPrescriptionForm(true);
  };

  const closePrescriptionForm = () => {
    if (savingPrescription) return;

    setShowPrescriptionForm(false);
    setDiagnosis("");
    setInstructions("");
    setMedicines([emptyMedicine()]);
  };

  const parseMedications = (value) => {
    try {
      const parsed =
        typeof value === "string" ? JSON.parse(value) : value;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const openViewPrescription = async (appointment) => {
    setPrescriptionModalAppointment(appointment);
    setViewingPrescription(null);
    setLoadingPrescription(true);

    try {
      const response = await api.get(
        `/prescriptions/appointment/${appointment.id}`
      );
      setViewingPrescription(response.data);
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          "Unable to load prescription details. Please try again."
      );
      setPrescriptionModalAppointment(null);
    } finally {
      setLoadingPrescription(false);
    }
  };

  const closeViewPrescription = () => {
    setPrescriptionModalAppointment(null);
    setViewingPrescription(null);
  };

  const updateMedicine = (index, field, value) => {
    setMedicines((previous) =>
      previous.map((medicine, i) =>
        i === index ? { ...medicine, [field]: value } : medicine
      )
    );
  };

  const addMedicine = () => {
    setMedicines((previous) => [...previous, emptyMedicine()]);
  };

  const removeMedicine = (index) => {
    if (medicines.length === 1) {
      toast.error("At least one medicine is required.");
      return;
    }

    setMedicines((previous) =>
      previous.filter((_, i) => i !== index)
    );
  };

  const savePrescription = async (event) => {
    event.preventDefault();

    if (isDeactivated) {
      toast.error(
        "Action not permitted: Your doctor profile is deactivated by the administrator."
      );
      return;
    }

    if (!selectedAppointment) return;

    if (selectedAppointment.status !== "Completed") {
      toast.error("Only completed appointments can receive prescriptions.");
      return;
    }

    if (!diagnosis.trim()) {
      toast.error("Please enter the diagnosis.");
      return;
    }

    if (
      medicines.some(
        (medicine) =>
          !medicine.medicineName.trim() ||
          !medicine.dosage.trim() ||
          !medicine.frequency.trim() ||
          !medicine.duration.trim()
      )
    ) {
      toast.error("Please complete all required medicine fields.");
      return;
    }

    const payload = {
      appointmentId: selectedAppointment.id,
      diagnosis: diagnosis.trim(),
      medications: JSON.stringify(
        medicines.map((medicine) => ({
          medicineName: medicine.medicineName.trim(),
          dosage: medicine.dosage.trim(),
          frequency: medicine.frequency.trim(),
          duration: medicine.duration.trim(),
          instructions: medicine.instructions.trim(),
        }))
      ),
      instructions: instructions.trim(),
    };

    setSavingPrescription(true);

    try {
      await api.post("/prescriptions", payload);

      setAppointments((previous) =>
        previous.map((item) =>
          String(item.id) === String(selectedAppointment.id)
            ? {
                ...item,
                hasPrescription: true,
                prescriptionCheckFailed: false,
              }
            : item
        )
      );

      setSelectedAppointment((current) =>
        current &&
        String(current.id) === String(selectedAppointment.id)
          ? {
              ...current,
              hasPrescription: true,
              prescriptionCheckFailed: false,
            }
          : current
      );

      toast.success("Prescription created successfully.");

      setShowPrescriptionForm(false);
      setDiagnosis("");
      setInstructions("");
      setMedicines([emptyMedicine()]);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Unable to create prescription. Please try again.";

      toast.error(message);
    } finally {
      setSavingPrescription(false);
    }
  };

  const getStatusStyle = (status) => {
    const styles = {
      Confirmed: "bg-green-50 text-green-700",
      Pending: "bg-orange-50 text-orange-700",
      Completed: "bg-blue-50 text-blue-700",
      Cancelled: "bg-red-50 text-red-700",
      Rejected: "bg-red-50 text-red-700",
    };

    return styles[status] || "bg-slate-50 text-slate-600";
  };

  const formatDate = (date) => {
    if (!date) return "Date unavailable";

    const parsed = new Date(`${date}T00:00:00`);

    if (Number.isNaN(parsed.getTime())) return date;

    return parsed.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (time) => {
    if (!time) return "Time unavailable";

    if (
      typeof time === "string" &&
      /^\d{2}:\d{2}(:\d{2})?$/.test(time)
    ) {
      const [hours, minutes] = time.split(":");
      const parsed = new Date();

      parsed.setHours(Number(hours), Number(minutes), 0, 0);

      return parsed.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    }

    return String(time);
  };

  const renderAppointmentActions = (appointment) => (
    <div className="flex items-center justify-center gap-2">
      <button
        type="button"
        onClick={() => setSelectedAppointment(appointment)}
        title="View details"
        aria-label={`View details for appointment #${appointment.id}`}
        className="rounded-lg bg-blue-50 p-2 text-blue-600 transition hover:bg-blue-100 focus-visible:ring-2 focus-visible:ring-cyan-600 focus-visible:outline-none"
      >
        <Eye size={17} aria-hidden="true" />
      </button>

      {appointment.status === "Pending" && (
        <>
          <button
            type="button"
            disabled={isDeactivated || updatingId === appointment.id}
            onClick={() => updateStatus(appointment, "Confirmed")}
            title={isDeactivated ? "Action disabled: Doctor profile is deactivated" : "Accept appointment"}
            aria-label={`Accept appointment #${appointment.id}`}
            className="rounded-lg bg-green-50 p-2 text-green-600 transition hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-cyan-600 focus-visible:outline-none"
          >
            <CheckCircle size={17} aria-hidden="true" />
          </button>

          <button
            type="button"
            disabled={isDeactivated || updatingId === appointment.id}
            onClick={() => updateStatus(appointment, "Rejected")}
            title={isDeactivated ? "Action disabled: Doctor profile is deactivated" : "Reject appointment"}
            aria-label={`Reject appointment #${appointment.id}`}
            className="rounded-lg bg-red-50 p-2 text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-cyan-600 focus-visible:outline-none"
          >
            <XCircle size={17} aria-hidden="true" />
          </button>
        </>
      )}

      {appointment.status === "Confirmed" && (
        <button
          type="button"
          disabled={isDeactivated || updatingId === appointment.id}
          onClick={() => updateStatus(appointment, "Completed")}
          title={isDeactivated ? "Action disabled: Doctor profile is deactivated" : "Complete appointment"}
          aria-label={`Complete appointment #${appointment.id}`}
          className="rounded-lg bg-blue-50 p-2 text-blue-600 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-cyan-600 focus-visible:outline-none"
        >
          <CheckCircle size={17} aria-hidden="true" />
        </button>
      )}

      {appointment.status === "Completed" && (
        appointment.hasPrescription ? (
          <button
            type="button"
            onClick={() => openViewPrescription(appointment)}
            title="View prescription"
            aria-label={`View prescription for appointment #${appointment.id}`}
            className="rounded-lg bg-emerald-50 p-2 text-emerald-600 transition hover:bg-emerald-100 focus-visible:ring-2 focus-visible:ring-cyan-600 focus-visible:outline-none"
          >
            <FileText size={17} aria-hidden="true" />
          </button>
        ) : (
          <button
            type="button"
            disabled={isDeactivated || appointment.prescriptionCheckFailed}
            onClick={() => openPrescriptionForm(appointment)}
            title={isDeactivated ? "Action disabled: Doctor profile is deactivated" : "Write prescription"}
            aria-label={`Write prescription for appointment #${appointment.id}`}
            className="rounded-lg bg-cyan-50 p-2 text-cyan-600 transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-cyan-600 focus-visible:outline-none"
          >
            <Pill size={17} aria-hidden="true" />
          </button>
        )
      )}

      {/* Clinical Consultation Notes & Vitals (Module 5) */}
      {(appointment.status === "Confirmed" || appointment.status === "Completed") && (
        <button
          type="button"
          disabled={isDeactivated}
          onClick={() => openConsultationModal(appointment)}
          title="Record Clinical Consultation Notes & Vitals"
          aria-label={`Record clinical notes and vitals for appointment #${appointment.id}`}
          className="rounded-lg bg-indigo-50 p-2 text-indigo-600 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-cyan-600 focus-visible:outline-none"
        >
          <ClipboardList size={17} aria-hidden="true" />
        </button>
      )}
    </div>
  );

  return (
    <div>
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            My Appointments
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            View your appointments, complete consultations and write prescriptions.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchAppointments(true)}
          disabled={refreshing || loading}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshCw
            className={`mr-2 inline ${refreshing ? "animate-spin" : ""}`}
            size={16}
          />
          Refresh appointments
        </button>
      </div>

      {isDeactivated && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="font-semibold">Actions Disabled</p>
          <p className="mt-0.5 text-xs text-amber-700">
            Your profile is currently deactivated. Appointments can be reviewed, but updating statuses and writing new prescriptions are disabled.
          </p>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.title}
              className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className={`inline-flex rounded-xl p-3 ${stat.color}`}>
                <Icon size={23} />
              </div>

              <p className="mt-4 text-sm font-medium text-slate-500">
                {stat.title}
              </p>

              <h3 className="mt-1 text-3xl font-extrabold text-slate-900">
                {loading ? "—" : stat.value}
              </h3>
            </div>
          );
        })}
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-6">
          <h2 className="text-lg font-bold text-slate-900">
            Appointment Records
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Search, filter and manage your appointments.
          </p>
        </div>

        <div className="flex flex-col gap-3 border-b border-slate-100 p-5 lg:flex-row">
          <div className="relative flex-1">
            <Search
              size={19}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search patient or appointment ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
            />
          </div>

          <div className="relative">
            <Filter
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-8 text-sm outline-none focus:border-cyan-500 sm:w-48"
            >
              <option value="All">All Status</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-600 outline-none focus:border-cyan-500"
          />
        </div>

        {error && (
          <div className="m-5 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
            {error}
            <button
              type="button"
              onClick={() => fetchAppointments()}
              className="ml-2 font-semibold underline"
            >
              Try again
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-left">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4 font-semibold">Appointment ID</th>
                <th className="px-6 py-4 font-semibold">Patient</th>
                <th className="px-6 py-4 font-semibold">Date & Time</th>
                <th className="px-6 py-4 font-semibold">Reason</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 text-center font-semibold">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-16 text-center text-sm text-slate-500"
                  >
                    Loading your appointments...
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((appointment) => (
                  <tr
                    key={appointment.id}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="px-6 py-4 text-sm font-semibold text-cyan-700">
                      <div>#{appointment.id}</div>
                      {appointment.status.toLowerCase() === "confirmed" && appointment.queueNumber && (
                        <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-cyan-100 px-2.5 py-0.5 text-[11px] font-extrabold text-cyan-800 shadow-sm">
                          Queue #{appointment.queueNumber}
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-slate-800">
                        {appointment.patient}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {appointment.age != null
                          ? `${appointment.age} years`
                          : `Patient ID: ${appointment.patientId ?? "—"}`}
                        {appointment.gender ? ` · ${appointment.gender}` : ""}
                      </p>
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-600">
                      <p className="font-semibold text-slate-800">{formatDate(appointment.date)}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {formatTime(appointment.time)}
                      </p>
                      {appointment.rescheduleStatus === "PENDING_APPROVAL" && (
                        <div className="mt-2.5 rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-900 shadow-sm">
                          <div className="flex items-center gap-1 font-bold text-amber-800">
                            <RotateCcw size={12} className="animate-spin" />
                            <span>Reschedule Requested</span>
                          </div>
                          <p className="mt-1 font-semibold text-slate-800">
                            To: {formatDate(appointment.rescheduleRequestedDate)} at {formatTime(appointment.rescheduleRequestedTime)}
                          </p>
                          {appointment.rescheduleReason && (
                            <p className="mt-0.5 text-[11px] text-amber-700 italic">
                              "{appointment.rescheduleReason}"
                            </p>
                          )}
                          <div className="mt-2 flex items-center gap-2">
                            <button
                              type="button"
                              disabled={updatingId === appointment.id}
                              onClick={() => handleApproveReschedule(appointment)}
                              className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              disabled={updatingId === appointment.id}
                              onClick={() => handleRejectReschedule(appointment)}
                              className="rounded-lg border border-rose-200 bg-white px-2.5 py-1 text-[11px] font-bold text-rose-700 transition hover:bg-rose-50 disabled:opacity-50"
                            >
                              Decline
                            </button>
                          </div>
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-600">
                      {appointment.reason}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 items-start">
                        <StatusBadge status={appointment.status} size="sm" />
                        {appointment.status.toLowerCase() === "pending" && appointment.holdExpiresAt && (
                          <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-200">
                            <Timer size={11} /> 15m Hold
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      {renderAppointmentActions(appointment)}
                    </td>
                  </tr>
                ))
              )}

              {!loading && !error && filteredAppointments.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-16 text-center">
                    <CalendarDays
                      size={40}
                      className="mx-auto text-slate-300"
                    />
                    <p className="mt-3 font-semibold text-slate-600">
                      No appointments found
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      There are no appointments matching your search or filters.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-100 px-6 py-4 text-sm text-slate-500">
          Showing {loading ? "—" : filteredAppointments.length} of{" "}
          {loading ? "—" : appointments.length} appointments
        </div>
      </div>

      {/* Appointment Details Modal */}
      <AccessibleModal
        isOpen={Boolean(selectedAppointment && !showPrescriptionForm)}
        onClose={() => setSelectedAppointment(null)}
        title="Appointment Details"
        description={selectedAppointment ? `Appointment #${selectedAppointment.id}` : ""}
        maxWidth="max-w-lg"
      >
        {selectedAppointment && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-cyan-50 p-3 text-cyan-600">
                <UserRound size={24} aria-hidden="true" />
              </div>
              <div>
                <p className="font-bold text-slate-800">
                  {selectedAppointment.patient}
                </p>
                <p className="text-sm text-slate-500">
                  {selectedAppointment.age != null
                    ? `${selectedAppointment.age} years`
                    : `Patient ID: ${selectedAppointment.patientId ?? "—"}`}
                  {selectedAppointment.gender
                    ? ` · ${selectedAppointment.gender}`
                    : ""}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-400">Appointment Date</p>
                <p className="mt-1 text-sm font-semibold text-slate-700">
                  {formatDate(selectedAppointment.date)}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-400">Appointment Time</p>
                <p className="mt-1 text-sm font-semibold text-slate-700">
                  {formatTime(selectedAppointment.time)}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-400">Contact Number</p>
                <p className="mt-1 text-sm font-semibold text-slate-700">
                  {selectedAppointment.phone || "Not provided"}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-400">Status</p>
                <span
                  className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(selectedAppointment.status)}`}
                >
                  {selectedAppointment.status}
                </span>
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-slate-700">
                <Stethoscope size={18} aria-hidden="true" />
                <h4 className="text-sm font-semibold">
                  Consultation Reason
                </h4>
              </div>
              <p className="mt-2 text-sm text-slate-600">
                {selectedAppointment.reason}
              </p>
            </div>

            {selectedAppointment.status === "Pending" && (
              <div className="flex gap-3">
                <button
                  type="button"
                  disabled={isDeactivated || updatingId === selectedAppointment.id}
                  onClick={() =>
                    updateStatus(selectedAppointment, "Confirmed")
                  }
                  className="flex-1 rounded-xl bg-green-600 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-cyan-600 focus-visible:outline-none"
                >
                  Accept Appointment
                </button>

                <button
                  type="button"
                  disabled={isDeactivated || updatingId === selectedAppointment.id}
                  onClick={() =>
                    updateStatus(selectedAppointment, "Rejected")
                  }
                  className="flex-1 rounded-xl bg-red-600 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-cyan-600 focus-visible:outline-none"
                >
                  Reject
                </button>
              </div>
            )}

            {selectedAppointment.status === "Confirmed" && (
              <button
                type="button"
                disabled={isDeactivated || updatingId === selectedAppointment.id}
                onClick={() =>
                  updateStatus(selectedAppointment, "Completed")
                }
                className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-cyan-600 focus-visible:outline-none"
              >
                <CheckCircle size={17} className="mr-2 inline" aria-hidden="true" />
                Complete Appointment
              </button>
            )}

            {selectedAppointment.status === "Completed" && (
              selectedAppointment.prescriptionCheckFailed ? (
                <button
                  type="button"
                  onClick={() => fetchAppointments(true)}
                  className="w-full rounded-xl border border-orange-200 bg-orange-50 py-3 text-sm font-semibold text-orange-700 focus-visible:ring-2 focus-visible:ring-cyan-600 focus-visible:outline-none"
                >
                  Retry prescription status check
                </button>
              ) : selectedAppointment.hasPrescription ? (
                <div className="space-y-3">
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-center text-sm font-semibold text-emerald-700">
                    <CheckCircle className="mr-2 inline" size={17} aria-hidden="true" />
                    Prescription already issued
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      openViewPrescription(selectedAppointment)
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:ring-2 focus-visible:ring-cyan-600 focus-visible:outline-none"
                  >
                    <FileText size={17} aria-hidden="true" />
                    View Prescription
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={isDeactivated}
                  onClick={() =>
                    openPrescriptionForm(selectedAppointment)
                  }
                  className="w-full rounded-xl bg-cyan-600 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-cyan-600 focus-visible:outline-none"
                >
                  <Pill size={17} className="mr-2 inline" aria-hidden="true" />
                  Write Prescription
                </button>
              )
            )}
            {(selectedAppointment.status === "Confirmed" || selectedAppointment.status === "Completed") && (
              <button
                type="button"
                disabled={isDeactivated}
                onClick={() => openConsultationModal(selectedAppointment)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 py-3 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100 disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-cyan-600 focus-visible:outline-none"
              >
                <ClipboardList size={17} aria-hidden="true" />
                Clinical Notes & Vitals
              </button>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedAppointment(null)}
                className="rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition focus-visible:ring-2 focus-visible:ring-cyan-600 focus-visible:outline-none"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </AccessibleModal>

      {/* Write Prescription Modal */}
      <AccessibleModal
        isOpen={Boolean(showPrescriptionForm && selectedAppointment)}
        onClose={closePrescriptionForm}
        title="Write Prescription"
        description={selectedAppointment ? `Appointment #${selectedAppointment.id} · ${selectedAppointment.patient}` : ""}
        maxWidth="max-w-3xl"
        showCloseButton={!savingPrescription}
      >
        {selectedAppointment && (
          <form onSubmit={savePrescription}>
            <div className="max-h-[70vh] space-y-6 overflow-y-auto pr-1">
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                <div className="flex items-center gap-2 text-blue-800">
                  <FileText size={19} aria-hidden="true" />
                  <p className="font-semibold">Consultation Summary</p>
                </div>
                <p className="mt-2 text-sm text-blue-700">
                  Patient: {selectedAppointment.patient}
                </p>
                <p className="mt-1 text-sm text-blue-700">
                  Appointment: #{selectedAppointment.id}
                </p>
              </div>

              <div>
                <label htmlFor="rx-diagnosis" className="mb-2 block text-sm font-semibold text-slate-700">
                  Diagnosis <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="rx-diagnosis"
                  required
                  maxLength={5000}
                  rows={3}
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="Enter diagnosis..."
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                />
              </div>

              <div>
                <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <h4 className="font-bold text-slate-900">
                      Medicines
                    </h4>
                    <p className="mt-1 text-xs text-slate-500">
                      Add one or more prescribed medicines.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={addMedicine}
                    className="rounded-xl bg-cyan-50 px-4 py-2.5 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-100 focus-visible:ring-2 focus-visible:ring-cyan-600 focus-visible:outline-none"
                  >
                    <Plus size={16} className="mr-1 inline" aria-hidden="true" />
                    Add Medicine
                  </button>
                </div>

                <div className="space-y-4">
                  {medicines.map((medicine, index) => (
                    <div
                      key={index}
                      className="rounded-xl border border-slate-200 p-4"
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="rounded-lg bg-cyan-50 p-2 text-cyan-600">
                            <Pill size={18} aria-hidden="true" />
                          </div>
                          <h5 className="font-semibold text-slate-800">
                            Medicine {index + 1}
                          </h5>
                        </div>

                        {medicines.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeMedicine(index)}
                            className="rounded-lg p-2 text-red-500 transition hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-cyan-600 focus-visible:outline-none"
                            title="Remove medicine"
                            aria-label={`Remove medicine ${index + 1}`}
                          >
                            <Trash2 size={17} aria-hidden="true" />
                          </button>
                        )}
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                          <label htmlFor={`rx-med-${index}-name`} className="mb-1.5 block text-xs font-semibold text-slate-600">
                            Medicine Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            id={`rx-med-${index}-name`}
                            required
                            value={medicine.medicineName}
                            onChange={(e) =>
                              updateMedicine(
                                index,
                                "medicineName",
                                e.target.value
                              )
                            }
                            placeholder="Enter medicine name"
                            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-cyan-500"
                          />
                        </div>

                        <div>
                          <label htmlFor={`rx-med-${index}-dosage`} className="mb-1.5 block text-xs font-semibold text-slate-600">
                            Dosage <span className="text-red-500">*</span>
                          </label>
                          <input
                            id={`rx-med-${index}-dosage`}
                            required
                            value={medicine.dosage}
                            onChange={(e) =>
                              updateMedicine(
                                index,
                                "dosage",
                                e.target.value
                              )
                            }
                            placeholder="e.g. 500 mg"
                            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-cyan-500"
                          />
                        </div>

                        <div>
                          <label htmlFor={`rx-med-${index}-freq`} className="mb-1.5 block text-xs font-semibold text-slate-600">
                            Frequency <span className="text-red-500">*</span>
                          </label>
                          <input
                            id={`rx-med-${index}-freq`}
                            required
                            value={medicine.frequency}
                            onChange={(e) =>
                              updateMedicine(
                                index,
                                "frequency",
                                e.target.value
                              )
                            }
                            placeholder="e.g. Twice daily"
                            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-cyan-500"
                          />
                        </div>

                        <div>
                          <label htmlFor={`rx-med-${index}-dur`} className="mb-1.5 block text-xs font-semibold text-slate-600">
                            Duration <span className="text-red-500">*</span>
                          </label>
                          <input
                            id={`rx-med-${index}-dur`}
                            required
                            value={medicine.duration}
                            onChange={(e) =>
                              updateMedicine(
                                index,
                                "duration",
                                e.target.value
                              )
                            }
                            placeholder="e.g. 5 days"
                            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-cyan-500"
                          />
                        </div>

                        <div>
                          <label htmlFor={`rx-med-${index}-inst`} className="mb-1.5 block text-xs font-semibold text-slate-600">
                            Medicine Instructions
                          </label>
                          <input
                            id={`rx-med-${index}-inst`}
                            value={medicine.instructions}
                            onChange={(e) =>
                              updateMedicine(
                                index,
                                "instructions",
                                e.target.value
                              )
                            }
                            placeholder="e.g. After meals"
                            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-cyan-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="rx-instructions" className="mb-2 block text-sm font-semibold text-slate-700">
                  Additional Instructions
                </label>
                <textarea
                  id="rx-instructions"
                  maxLength={5000}
                  rows={3}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Enter follow-up advice or additional instructions..."
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                />
              </div>

              <p className="text-xs text-slate-500">
                Please verify all clinical details before saving this prescription.
              </p>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={savingPrescription}
                onClick={closePrescriptionForm}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-cyan-600 focus-visible:outline-none"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={savingPrescription}
                className="rounded-xl bg-cyan-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-cyan-600 focus-visible:outline-none"
              >
                {savingPrescription ? (
                  "Saving Prescription..."
                ) : (
                  <>
                    <CheckCircle size={17} className="mr-2 inline" aria-hidden="true" />
                    Save Prescription
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </AccessibleModal>

      {/* View Prescription Modal */}
      <AccessibleModal
        isOpen={Boolean(prescriptionModalAppointment)}
        onClose={closeViewPrescription}
        title="Prescription Details"
        description={prescriptionModalAppointment ? `Appointment #${prescriptionModalAppointment.id} · ${prescriptionModalAppointment.patient}` : ""}
        maxWidth="max-w-2xl"
      >
        {prescriptionModalAppointment && (
          <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-1 print-receipt-modal">
            <div className="flex justify-end no-print">
              {viewingPrescription && (
                <button
                  type="button"
                  onClick={() => window.print()}
                  title="Print prescription"
                  aria-label="Print prescription"
                  className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-cyan-600 focus-visible:outline-none"
                >
                  <Printer size={18} aria-hidden="true" />
                </button>
              )}
            </div>

            {loadingPrescription ? (
              <div className="flex min-h-[220px] flex-col items-center justify-center" role="status" aria-live="polite">
                <RefreshCw
                  size={28}
                  className="animate-spin text-emerald-600"
                  aria-hidden="true"
                />
                <p className="mt-3 text-sm font-medium text-slate-500">
                  Loading prescription...
                </p>
              </div>
            ) : viewingPrescription ? (
              <>
                {/* Patient & Summary Meta */}
                <div className="grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-400">
                      Patient
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-800">
                      {prescriptionModalAppointment.patient}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400">
                      Prescription #
                    </p>
                    <p className="mt-1 text-sm font-bold text-emerald-700">
                      #{viewingPrescription.prescriptionId}
                    </p>
                  </div>
                  {viewingPrescription.verificationCode && (
                    <div>
                      <p className="text-xs font-semibold text-slate-400">
                        Verification Code
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="font-mono text-xs font-extrabold text-cyan-800 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded">
                          {viewingPrescription.verificationCode}
                        </span>
                        <a
                          href={`/verify-prescription?code=${encodeURIComponent(
                            viewingPrescription.verificationCode
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="no-print inline-flex items-center gap-1 text-xs font-semibold text-cyan-600 hover:text-cyan-800 underline focus-visible:ring-2 focus-visible:ring-cyan-600 focus-visible:outline-none"
                        >
                          Verify Online
                        </a>
                      </div>
                    </div>
                  )}
                  <div className="col-span-2 sm:col-span-1">
                    <p className="text-xs font-semibold text-slate-400">
                      Prescribed On
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-800">
                      {formatDate(
                        viewingPrescription.prescribedAt?.slice(0, 10) ||
                          prescriptionModalAppointment.date
                      )}
                    </p>
                  </div>
                </div>

                {/* Diagnosis */}
                <div>
                  <h4 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-700">
                    <Stethoscope size={16} className="text-cyan-600" aria-hidden="true" />
                    Diagnosis
                  </h4>
                  <div className="mt-2 rounded-xl border border-cyan-100 bg-cyan-50/70 p-4 text-sm font-medium text-cyan-950">
                    {viewingPrescription.diagnosis ||
                      "No diagnosis specified."}
                  </div>
                </div>

                {/* Prescribed Medicines */}
                <div>
                  <h4 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-700">
                    <Pill size={16} className="text-emerald-600" aria-hidden="true" />
                    Prescribed Medicines
                  </h4>
                  <div className="mt-2 overflow-x-auto rounded-xl border border-slate-100">
                    <table className="w-full min-w-[550px] text-left text-sm">
                      <caption className="sr-only">List of medicines prescribed to patient</caption>
                      <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                        <tr>
                          <th scope="col" className="px-4 py-3">Medicine</th>
                          <th scope="col" className="px-4 py-3">Dosage</th>
                          <th scope="col" className="px-4 py-3">Frequency</th>
                          <th scope="col" className="px-4 py-3">Duration</th>
                          <th scope="col" className="px-4 py-3">Instructions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parseMedications(
                          viewingPrescription.medications
                        ).map((med, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="px-4 py-3 font-semibold text-slate-800">
                              {med.medicineName ||
                                med.medicine ||
                                "—"}
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {med.dosage || "—"}
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {med.frequency || "—"}
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {med.duration || "—"}
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {med.instructions || "—"}
                            </td>
                          </tr>
                        ))}
                        {parseMedications(viewingPrescription.medications)
                          .length === 0 && (
                          <tr>
                            <td
                              colSpan={5}
                              className="p-4 text-center text-sm text-slate-400"
                            >
                              No medicines recorded.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Instructions */}
                {viewingPrescription.instructions && (
                  <div>
                    <h4 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-700">
                      <FileText size={16} className="text-slate-600" aria-hidden="true" />
                      Doctor's Advice & Instructions
                    </h4>
                    <div className="mt-2 whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
                      {viewingPrescription.instructions}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="p-6 text-center text-sm text-slate-500">
                No prescription details available.
              </div>
            )}

            <div className="no-print flex justify-end border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={closeViewPrescription}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-cyan-600 focus-visible:outline-none"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </AccessibleModal>

      {/* Clinical Consultation Notes & Vitals Modal */}
      <AccessibleModal
        isOpen={Boolean(showConsultationModal && consultationAppointment)}
        onClose={() => setShowConsultationModal(false)}
        title="Clinical Consultation & Vitals"
        description={consultationAppointment ? `Appointment #${consultationAppointment.id} · Patient: ${consultationAppointment.patient} · Date: ${formatDate(consultationAppointment.date)}` : ""}
        maxWidth="max-w-3xl"
        showCloseButton={!consultationSaving}
      >
        {consultationAppointment && (
          <div>
            {consultationLoading ? (
              <div className="p-12 text-center text-sm text-slate-500" role="status" aria-live="polite">
                <RefreshCw size={24} className="mx-auto mb-2 animate-spin text-cyan-600" aria-hidden="true" />
                <p>Loading existing clinical notes...</p>
              </div>
            ) : (
              <form onSubmit={handleSaveConsultation} className="space-y-6 max-h-[72vh] overflow-y-auto pr-1">
                {/* 1. CLINICAL CONSULTATION NOTES */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                    <ClipboardList size={18} className="text-indigo-600" aria-hidden="true" />
                    <h4 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                      Doctor Clinical Consultation Notes
                    </h4>
                  </div>

                  <div>
                    <label htmlFor="consult-symptoms" className="text-xs font-semibold text-slate-700">Reported Symptoms</label>
                    <textarea
                      id="consult-symptoms"
                      rows={2}
                      placeholder="e.g. High fever for 3 days, body aches, persistent non-productive cough"
                      value={consultationForm.symptoms}
                      onChange={(e) => setConsultationForm({ ...consultationForm, symptoms: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="consult-obs" className="text-xs font-semibold text-slate-700">Clinical Observations & Physical Exam</label>
                    <textarea
                      id="consult-obs"
                      rows={2}
                      placeholder="e.g. Mild pharyngeal congestion, chest clear on auscultation, no cervical lymphadenopathy"
                      value={consultationForm.clinicalObservations}
                      onChange={(e) => setConsultationForm({ ...consultationForm, clinicalObservations: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="consult-diag" className="text-xs font-semibold text-slate-700">Clinical Diagnosis <span className="text-red-500">*</span></label>
                    <input
                      id="consult-diag"
                      type="text"
                      required
                      placeholder="e.g. Acute Viral Pharyngitis"
                      value={consultationForm.diagnosis}
                      onChange={(e) => setConsultationForm({ ...consultationForm, diagnosis: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="consult-plan" className="text-xs font-semibold text-slate-700">Treatment Plan</label>
                    <textarea
                      id="consult-plan"
                      rows={2}
                      placeholder="e.g. Warm saline gargles, adequate hydration, paracetamol 500mg SOS"
                      value={consultationForm.treatmentPlan}
                      onChange={(e) => setConsultationForm({ ...consultationForm, treatmentPlan: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="consult-followup" className="text-xs font-semibold text-slate-700">Follow-up Recommendations</label>
                    <input
                      id="consult-followup"
                      type="text"
                      placeholder="e.g. Review after 5 days if symptoms persist or fever spikes"
                      value={consultationForm.followUpRecommendations}
                      onChange={(e) => setConsultationForm({ ...consultationForm, followUpRecommendations: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* 2. CLINICAL VITALS RECORDING */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div className="flex items-center gap-2">
                      <Activity size={18} className="text-rose-600" aria-hidden="true" />
                      <h4 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                        Record Patient Vitals (Optional)
                      </h4>
                    </div>
                    <span className="rounded-full bg-cyan-100 px-2.5 py-0.5 text-xs font-bold text-cyan-800">
                      Attending Doctor
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label htmlFor="vital-systolic" className="text-xs font-semibold text-slate-700">Systolic (mmHg)</label>
                      <input
                        id="vital-systolic"
                        type="number"
                        min="50"
                        max="260"
                        placeholder="120"
                        value={consultationVitals.systolicBp}
                        onChange={(e) => setConsultationVitals({ ...consultationVitals, systolicBp: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="vital-diastolic" className="text-xs font-semibold text-slate-700">Diastolic (mmHg)</label>
                      <input
                        id="vital-diastolic"
                        type="number"
                        min="30"
                        max="180"
                        placeholder="80"
                        value={consultationVitals.diastolicBp}
                        onChange={(e) => setConsultationVitals({ ...consultationVitals, diastolicBp: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="vital-hr" className="text-xs font-semibold text-slate-700">Pulse (bpm)</label>
                      <input
                        id="vital-hr"
                        type="number"
                        min="30"
                        max="250"
                        placeholder="72"
                        value={consultationVitals.heartRateBpm}
                        onChange={(e) => setConsultationVitals({ ...consultationVitals, heartRateBpm: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="vital-resp" className="text-xs font-semibold text-slate-700">Resp. (/min)</label>
                      <input
                        id="vital-resp"
                        type="number"
                        min="6"
                        max="60"
                        placeholder="16"
                        value={consultationVitals.respiratoryRateBpm}
                        onChange={(e) => setConsultationVitals({ ...consultationVitals, respiratoryRateBpm: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label htmlFor="vital-temp" className="text-xs font-semibold text-slate-700">Temp (°C)</label>
                      <input
                        id="vital-temp"
                        type="number"
                        step="0.1"
                        min="30"
                        max="45"
                        placeholder="37.0"
                        value={consultationVitals.temperatureCelsius}
                        onChange={(e) => setConsultationVitals({ ...consultationVitals, temperatureCelsius: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="vital-spo2" className="text-xs font-semibold text-slate-700">SpO2 (%)</label>
                      <input
                        id="vital-spo2"
                        type="number"
                        step="0.1"
                        min="50"
                        max="100"
                        placeholder="99"
                        value={consultationVitals.oxygenSaturationPercent}
                        onChange={(e) => setConsultationVitals({ ...consultationVitals, oxygenSaturationPercent: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="vital-weight" className="text-xs font-semibold text-slate-700">Weight (kg)</label>
                      <input
                        id="vital-weight"
                        type="number"
                        step="0.1"
                        min="2"
                        max="350"
                        placeholder="70"
                        value={consultationVitals.weightKg}
                        onChange={(e) => setConsultationVitals({ ...consultationVitals, weightKg: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="vital-height" className="text-xs font-semibold text-slate-700">Height (cm)</label>
                      <input
                        id="vital-height"
                        type="number"
                        step="0.1"
                        min="40"
                        max="260"
                        placeholder="175"
                        value={consultationVitals.heightCm}
                        onChange={(e) => setConsultationVitals({ ...consultationVitals, heightCm: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  {doctorComputedBmi && (
                    <div className="flex items-center justify-between rounded-xl border p-3 bg-white">
                      <span className="text-xs font-medium text-slate-600">Calculated BMI:</span>
                      <span className={`rounded-md border px-2.5 py-0.5 text-xs font-bold ${doctorComputedBmi.badgeColor}`}>
                        BMI: {doctorComputedBmi.val} ({doctorComputedBmi.category})
                      </span>
                    </div>
                  )}

                  <div>
                    <label htmlFor="vital-notes" className="text-xs font-semibold text-slate-700">Vitals Notes</label>
                    <input
                      id="vital-notes"
                      type="text"
                      placeholder="e.g. Measured in clinic while seated"
                      value={consultationVitals.vitalsNotes}
                      onChange={(e) => setConsultationVitals({ ...consultationVitals, vitalsNotes: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowConsultationModal(false)}
                    className="rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-cyan-600 focus-visible:outline-none"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={consultationSaving}
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-cyan-600 focus-visible:outline-none"
                  >
                    {consultationSaving ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" aria-hidden="true" /> Saving...
                      </>
                    ) : (
                      "Save Consultation & Vitals"
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </AccessibleModal>
    </div>
  );
}

export default DoctorAppointments;
