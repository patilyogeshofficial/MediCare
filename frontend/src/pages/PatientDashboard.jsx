import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { createNotificationStream } from "../services/notificationStream";
import AccessibleModal from "../components/ui/AccessibleModal";

import {
  HeartPulse,
  LayoutDashboard,
  CalendarDays,
  Search,
  FileText,
  UserRound,
  LogOut,
  Menu,
  X,
  Clock,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Bell,
  Printer,
  Pill,
  Stethoscope,
  ShieldCheck,
  Copy,
  ExternalLink,
  RotateCcw,
  CheckCircle2,
  Timer,
  Activity,
  Thermometer,
  Scale,
  Heart,
  ShieldAlert,
  Upload,
  Download,
  Plus,
  Trash2,
  ClipboardList,
  File,
  Filter,
  Info,
} from "lucide-react";

// Patient Navigation
const navigation = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "My Appointments", icon: CalendarDays },
  { name: "Find Doctors", icon: Search },
  { name: "My Prescriptions", icon: FileText },
  { name: "Medical History", icon: Clock },
  { name: "My Profile", icon: UserRound },
];

function PatientDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState("Dashboard");

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState(null);

  // Doctors
  const [doctors, setDoctors] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(false);
  const [doctorsError, setDoctorsError] = useState("");
  const [doctorSearch, setDoctorSearch] = useState("");

  // Prescriptions
  const [prescriptions, setPrescriptions] = useState([]);
  const [prescriptionsLoading, setPrescriptionsLoading] = useState(false);
  const [prescriptionsError, setPrescriptionsError] = useState("");
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [selectedPrescriptionAppointment, setSelectedPrescriptionAppointment] =
    useState(null);
  const [loadingPrescriptionModal, setLoadingPrescriptionModal] =
    useState(false);

  // Medical History & EHR (Module 5)
  const [medicalHistory, setMedicalHistory] = useState([]);
  const [medicalHistoryLoading, setMedicalHistoryLoading] = useState(false);
  const [medicalHistoryError, setMedicalHistoryError] = useState("");
  const [ehrData, setEhrData] = useState(null);
  const [ehrLoading, setEhrLoading] = useState(false);
  const [ehrError, setEhrError] = useState("");
  const [ehrSubTab, setEhrSubTab] = useState("timeline");
  const [timelineFilter, setTimelineFilter] = useState("ALL");

  // Vitals Modal
  const [vitalsModalOpen, setVitalsModalOpen] = useState(false);
  const [vitalsForm, setVitalsForm] = useState({
    systolicBp: "",
    diastolicBp: "",
    heartRateBpm: "",
    respiratoryRateBpm: "",
    temperatureCelsius: "",
    oxygenSaturationPercent: "",
    weightKg: "",
    heightCm: "",
    notes: "",
  });
  const [savingVitals, setSavingVitals] = useState(false);

  // Condition / Allergy Modal
  const [conditionModalOpen, setConditionModalOpen] = useState(false);
  const [conditionForm, setConditionForm] = useState({
    recordType: "ALLERGY",
    name: "",
    severity: "MODERATE",
    status: "ACTIVE",
    diagnosedDate: "",
    notes: "",
  });
  const [savingCondition, setSavingCondition] = useState(false);

  // Document Upload Modal
  const [documentModalOpen, setDocumentModalOpen] = useState(false);
  const [documentForm, setDocumentForm] = useState({
    title: "",
    category: "LAB_REPORT",
    description: "",
    file: null,
  });
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [deletingVitalId, setDeletingVitalId] = useState(null);
  const [deletingConditionId, setDeletingConditionId] = useState(null);
  const [deletingDocId, setDeletingDocId] = useState(null);

  // Patient Profile
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);

  // Notifications
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationError, setNotificationError] = useState("");
  const [markingNotificationId, setMarkingNotificationId] = useState(null);
  const [notificationCategoryFilter, setNotificationCategoryFilter] = useState("ALL");

  // Reschedule State (Module 4)
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [rescheduleSlots, setRescheduleSlots] = useState([]);
  const [rescheduleSlotsLoading, setRescheduleSlotsLoading] = useState(false);
  const [rescheduleSubmitting, setRescheduleSubmitting] = useState(false);

  // Focus management refs for drawer and notification dropdown (WCAG 2.4.3 / 2.1.2)
  const sidebarTriggerRef = useRef(null);
  const notificationTriggerRef = useRef(null);
  const notificationDropdownRef = useRef(null);

  const fetchRescheduleSlots = async (doctorId, date) => {
    if (!doctorId || !date) return;
    try {
      setRescheduleSlotsLoading(true);
      setRescheduleTime("");
      const res = await api.get("/appointments/available-slots", {
        params: { doctorId, date },
      });
      setRescheduleSlots(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to load reschedule slots:", err);
      setRescheduleSlots([]);
    } finally {
      setRescheduleSlotsLoading(false);
    }
  };

  const openRescheduleModal = (appointment) => {
    setRescheduleTarget(appointment);
    setRescheduleDate(appointment.appointmentDate);
    setRescheduleTime("");
    setRescheduleReason("");
    setRescheduleModalOpen(true);
    fetchRescheduleSlots(appointment.doctorId, appointment.appointmentDate);
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!rescheduleTime) {
      toast.error("Please choose a new consultation slot");
      return;
    }
    try {
      setRescheduleSubmitting(true);
      const response = await api.post(
        `/appointments/${rescheduleTarget.appointmentId}/reschedule-request`,
        {
          requestedDate: rescheduleDate,
          requestedTime: rescheduleTime,
          reason: rescheduleReason.trim() || "Patient requested reschedule",
        }
      );
      setAppointments((prev) =>
        prev.map((a) =>
          a.appointmentId === rescheduleTarget.appointmentId
            ? {
                ...a,
                rescheduleRequestedDate: response.data.rescheduleRequestedDate,
                rescheduleRequestedTime: response.data.rescheduleRequestedTime,
                rescheduleReason: response.data.rescheduleReason,
                rescheduleStatus: response.data.rescheduleStatus,
              }
            : a
        )
      );
      toast.success("Reschedule request submitted for doctor review!");
      setRescheduleModalOpen(false);
    } catch (err) {
      console.error("Reschedule request failed:", err);
      toast.error(
        err.response?.data?.message || "Failed to submit reschedule request."
      );
    } finally {
      setRescheduleSubmitting(false);
    }
  };

  const [profileForm, setProfileForm] = useState({
    fullName: "",
    dateOfBirth: "",
    gender: "",
    phone: "",
    address: "",
    bloodGroup: "",
  });

  // Fetch logged-in patient's appointments
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/appointments/my");
        setAppointments(response.data);
      } catch (err) {
        console.error("Failed to fetch appointments:", err);

        setError(
          err.response?.data?.message ||
          "Unable to load appointments. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  // Fetch doctors when required sections open
  useEffect(() => {
    if (
      !["Dashboard", "My Appointments", "Find Doctors"].includes(activeMenu)
    ) {
      return;
    }

    const fetchDoctors = async () => {
      try {
        setDoctorsLoading(true);
        setDoctorsError("");

        const response = await api.get("/doctors");
        const list = Array.isArray(response.data) ? response.data : [];
        setDoctors(list.filter((doc) => doc.isActive !== false));
      } catch (err) {
        console.error("Failed to fetch doctors:", err);

        setDoctorsError(
          err.response?.data?.message ||
          "Unable to load doctors. Please try again."
        );
      } finally {
        setDoctorsLoading(false);
      }
    };

    fetchDoctors();
  }, [activeMenu]);
  // Fetch prescriptions when Dashboard, My Appointments or My Prescriptions section opens
  const fetchPrescriptions = useCallback(async () => {
    try {
      setPrescriptionsLoading(true);
      setPrescriptionsError("");

      const response = await api.get("/prescriptions/my");

      setPrescriptions(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Failed to fetch prescriptions:", err);

      setPrescriptionsError(
        err.response?.data?.message ||
          "Unable to load prescriptions. Please try again."
      );
    } finally {
      setPrescriptionsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (
      ["Dashboard", "My Appointments", "My Prescriptions"].includes(activeMenu)
    ) {
      fetchPrescriptions();
    }
  }, [activeMenu, fetchPrescriptions]);

  // Map prescriptions by appointmentId for fast lookup
  const prescriptionMap = useMemo(() => {
    const map = new Map();
    (prescriptions || []).forEach((item) => {
      if (item.appointmentId) {
        map.set(Number(item.appointmentId), item);
      }
    });
    return map;
  }, [prescriptions]);

  // Load patient profile on mount if not yet cached
  useEffect(() => {
    if (!profile) {
      api
        .get("/patients/my-profile")
        .then((res) => {
          if (res.data) {
            setProfile(res.data);
            setProfileForm({
              fullName: res.data.fullName || "",
              dateOfBirth: res.data.dateOfBirth || "",
              gender: res.data.gender || "",
              phone: res.data.phone || "",
              address: res.data.address || "",
              bloodGroup: res.data.bloodGroup || "",
            });
          }
        })
        .catch(() => {});
    }
  }, [profile]);

  const parseMedications = (value) => {
    try {
      const parsed =
        typeof value === "string" ? JSON.parse(value) : value;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const openPrescriptionReceipt = async (
    prescriptionOrAppointment,
    maybeAppointment = null
  ) => {
    let appointment = maybeAppointment;
    let prescription = null;

    if (
      prescriptionOrAppointment?.appointmentId &&
      prescriptionOrAppointment?.diagnosis !== undefined
    ) {
      prescription = prescriptionOrAppointment;
      if (!appointment) {
        appointment =
          appointments.find(
            (a) =>
              Number(a.appointmentId) ===
              Number(prescription.appointmentId)
          ) || null;
      }
    } else if (prescriptionOrAppointment?.appointmentId) {
      appointment = prescriptionOrAppointment;
      prescription =
        prescriptionMap.get(Number(appointment.appointmentId)) || null;
    }

    setSelectedPrescriptionAppointment(appointment);

    if (prescription) {
      setSelectedPrescription(prescription);
    } else if (appointment) {
      setLoadingPrescriptionModal(true);
      try {
        const res = await api.get(
          `/prescriptions/appointment/${appointment.appointmentId}`
        );
        setSelectedPrescription(res.data);
      } catch (err) {
        toast.error(
          err.response?.data?.message ||
            "Prescription details not available for this appointment."
        );
      } finally {
        setLoadingPrescriptionModal(false);
      }
    }
  };

  const closePrescriptionReceipt = () => {
    setSelectedPrescription(null);
    setSelectedPrescriptionAppointment(null);
  };

  // Fetch medical history and comprehensive EHR data when section opens
  const fetchEhrData = useCallback(async () => {
    try {
      setEhrLoading(true);
      setMedicalHistoryLoading(true);
      setEhrError("");
      setMedicalHistoryError("");

      const [ehrRes, historyRes] = await Promise.all([
        api.get("/medical-records/my").catch((e) => {
          console.warn("EHR summary fetch notice:", e);
          return { data: null };
        }),
        api.get("/medical-history/my").catch(() => ({ data: [] })),
      ]);

      if (ehrRes.data) {
        setEhrData(ehrRes.data);
      }
      setMedicalHistory(Array.isArray(historyRes.data) ? historyRes.data : []);
    } catch (err) {
      console.error("Failed to fetch medical records:", err);
      const msg = err.response?.data?.message || "Unable to load medical records. Please try again.";
      setEhrError(msg);
      setMedicalHistoryError(msg);
    } finally {
      setEhrLoading(false);
      setMedicalHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeMenu === "Medical History") {
      fetchEhrData();
    }
  }, [activeMenu, fetchEhrData]);

  // Vitals BMI helper calculation
  const computedBmi = useMemo(() => {
    const w = parseFloat(vitalsForm.weightKg);
    const h = parseFloat(vitalsForm.heightCm);
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
  }, [vitalsForm.weightKg, vitalsForm.heightCm]);

  // Handle Save Vitals
  const handleSaveVitals = async (e) => {
    e.preventDefault();
    if (!ehrData?.patientId) {
      toast.error("Patient profile not resolved. Please refresh.");
      return;
    }
    try {
      setSavingVitals(true);
      const payload = {
        patientId: ehrData.patientId,
        systolicBp: vitalsForm.systolicBp ? parseInt(vitalsForm.systolicBp, 10) : null,
        diastolicBp: vitalsForm.diastolicBp ? parseInt(vitalsForm.diastolicBp, 10) : null,
        heartRateBpm: vitalsForm.heartRateBpm ? parseInt(vitalsForm.heartRateBpm, 10) : null,
        respiratoryRateBpm: vitalsForm.respiratoryRateBpm ? parseInt(vitalsForm.respiratoryRateBpm, 10) : null,
        temperatureCelsius: vitalsForm.temperatureCelsius ? parseFloat(vitalsForm.temperatureCelsius) : null,
        oxygenSaturationPercent: vitalsForm.oxygenSaturationPercent ? parseFloat(vitalsForm.oxygenSaturationPercent) : null,
        weightKg: vitalsForm.weightKg ? parseFloat(vitalsForm.weightKg) : null,
        heightCm: vitalsForm.heightCm ? parseFloat(vitalsForm.heightCm) : null,
        notes: vitalsForm.notes?.trim() || null,
        recordedAt: new Date().toISOString(),
      };
      await api.post("/medical-records/vitals", payload);
      toast.success("Vitals logged successfully!");
      setVitalsModalOpen(false);
      setVitalsForm({
        systolicBp: "",
        diastolicBp: "",
        heartRateBpm: "",
        respiratoryRateBpm: "",
        temperatureCelsius: "",
        oxygenSaturationPercent: "",
        weightKg: "",
        heightCm: "",
        notes: "",
      });
      fetchEhrData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to log vitals");
    } finally {
      setSavingVitals(false);
    }
  };

  // Handle Delete Vitals
  const handleDeleteVitals = async (vitalId) => {
    if (!window.confirm("Are you sure you want to delete this vital record?")) return;
    try {
      setDeletingVitalId(vitalId);
      await api.delete(`/medical-records/vitals/${vitalId}`);
      toast.success("Vital record deleted");
      fetchEhrData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete vital record");
    } finally {
      setDeletingVitalId(null);
    }
  };

  // Handle Save Condition / Allergy
  const handleSaveCondition = async (e) => {
    e.preventDefault();
    if (!conditionForm.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!ehrData?.patientId) {
      toast.error("Patient profile not resolved. Please refresh.");
      return;
    }
    try {
      setSavingCondition(true);
      const payload = {
        patientId: ehrData.patientId,
        recordType: conditionForm.recordType,
        name: conditionForm.name.trim(),
        severity: conditionForm.severity,
        status: conditionForm.status,
        diagnosedDate: conditionForm.diagnosedDate || null,
        notes: conditionForm.notes?.trim() || null,
      };
      await api.post("/medical-records/conditions", payload);
      toast.success(`${conditionForm.recordType === "ALLERGY" ? "Allergy" : "Condition"} recorded successfully!`);
      setConditionModalOpen(false);
      setConditionForm({
        recordType: "ALLERGY",
        name: "",
        severity: "MODERATE",
        status: "ACTIVE",
        diagnosedDate: "",
        notes: "",
      });
      fetchEhrData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to record entry");
    } finally {
      setSavingCondition(false);
    }
  };

  // Handle Delete Condition / Allergy
  const handleDeleteCondition = async (conditionId) => {
    if (!window.confirm("Are you sure you want to remove this record?")) return;
    try {
      setDeletingConditionId(conditionId);
      await api.delete(`/medical-records/conditions/${conditionId}`);
      toast.success("Record removed");
      fetchEhrData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove record");
    } finally {
      setDeletingConditionId(null);
    }
  };

  // Handle Upload Document
  const handleUploadDocument = async (e) => {
    e.preventDefault();
    if (!documentForm.title.trim()) {
      toast.error("Document title is required");
      return;
    }
    if (!documentForm.file) {
      toast.error("Please select a file to upload");
      return;
    }
    if (documentForm.file.size > 10 * 1024 * 1024) {
      toast.error("File size exceeds 10MB limit");
      return;
    }
    if (!ehrData?.patientId) {
      toast.error("Patient profile not resolved. Please refresh.");
      return;
    }
    try {
      setUploadingDocument(true);
      const formData = new FormData();
      formData.append("patientId", ehrData.patientId);
      formData.append("title", documentForm.title.trim());
      formData.append("category", documentForm.category);
      if (documentForm.description?.trim()) {
        formData.append("description", documentForm.description.trim());
      }
      formData.append("file", documentForm.file);

      await api.post("/medical-records/documents/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Document uploaded successfully!");
      setDocumentModalOpen(false);
      setDocumentForm({
        title: "",
        category: "LAB_REPORT",
        description: "",
        file: null,
      });
      fetchEhrData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to upload document");
    } finally {
      setUploadingDocument(false);
    }
  };

  // Handle Download Document
  const handleDownloadDocument = async (doc) => {
    try {
      toast.loading("Preparing document download...", { id: "doc-dl" });
      const response = await api.get(`/medical-records/documents/${doc.id}/download`, {
        responseType: "blob",
      });
      const blob = new Blob([response.data], { type: doc.fileMimeType || "application/octet-stream" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", doc.originalFileName || `medical-doc-${doc.id}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Document downloaded", { id: "doc-dl" });
    } catch (err) {
      console.error("Document download failed:", err);
      toast.error(err.response?.data?.message || "Download failed", { id: "doc-dl" });
    }
  };

  // Handle Delete Document
  const handleDeleteDocument = async (docId) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return;
    try {
      setDeletingDocId(docId);
      await api.delete(`/medical-records/documents/${docId}`);
      toast.success("Document removed");
      fetchEhrData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete document");
    } finally {
      setDeletingDocId(null);
    }
  };

  // Fetch patient notifications
  const fetchNotifications = async (showLoader = false) => {
    try {
      if (showLoader) setNotificationsLoading(true);
      setNotificationError("");

      const [notificationsResponse, countResponse] = await Promise.all([
        api.get("/notifications/my"),
        api.get("/notifications/unread-count"),
      ]);

      setNotifications(Array.isArray(notificationsResponse.data) ? notificationsResponse.data : []);
      setUnreadCount(Number(countResponse.data) || 0);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
      setNotificationError(
        err.response?.data?.message || "Unable to load notifications."
      );
    } finally {
      if (showLoader) setNotificationsLoading(false);
    }
  };

  // Real-Time SSE Stream & Polling fallback for notifications
  useEffect(() => {
    fetchNotifications(true);

    // Real-time Server-Sent Events stream listener
    const unsubscribe = createNotificationStream(
      "/notifications/stream",
      (incomingNotification) => {
        setNotifications((prev) => {
          if (prev.some((n) => n.notificationId === incomingNotification.notificationId)) {
            return prev;
          }
          return [incomingNotification, ...prev];
        });

        setUnreadCount((prev) => prev + 1);

        toast(
          `${incomingNotification.title}: ${incomingNotification.message.slice(0, 75)}${
            incomingNotification.message.length > 75 ? "..." : ""
          }`,
          {
            icon: incomingNotification.priority === "URGENT" ? "⚠️" : "🔔",
            duration: 4500,
          }
        );
      },
      () => {},
      () => {
        fetchNotifications(false);
      }
    );

    // Fallback polling every 30s
    const pollInterval = setInterval(() => {
      fetchNotifications(false);
    }, 30000);

    return () => {
      if (unsubscribe) unsubscribe();
      clearInterval(pollInterval);
    };
  }, []);

  // Mark notification as read
  const handleMarkNotificationAsRead = async (notificationId) => {
    const selectedNotification = notifications.find(
      (notification) => notification.notificationId === notificationId
    );

    if (!selectedNotification || selectedNotification.isRead) return;

    try {
      setMarkingNotificationId(notificationId);
      const response = await api.patch(
        `/notifications/${notificationId}/read`
      );

      setNotifications((previousNotifications) =>
        previousNotifications.map((notification) =>
          notification.notificationId === notificationId
            ? response.data
            : notification
        )
      );

      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
      toast.error(
        err.response?.data?.message || "Unable to update notification."
      );
    } finally {
      setMarkingNotificationId(null);
    }
  };

  // Archive / Soft-delete single notification
  const handleArchiveNotification = async (notificationId, e) => {
    if (e) e.stopPropagation();
    try {
      await api.delete(`/notifications/${notificationId}`);

      const removed = notifications.find((n) => n.notificationId === notificationId);
      setNotifications((prev) =>
        prev.filter((n) => n.notificationId !== notificationId)
      );

      if (removed && !removed.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      toast.success("Notification archived.");
    } catch (err) {
      console.error("Failed to archive notification:", err);
      toast.error("Unable to archive notification.");
    }
  };

  // Clear / archive all notifications
  const handleClearAllNotifications = async () => {
    if (notifications.length === 0) return;

    if (!window.confirm("Archive all notifications?")) {
      return;
    }

    try {
      await api.delete("/notifications/clear-all");
      setNotifications([]);
      setUnreadCount(0);
      toast.success("All notifications archived.");
    } catch (err) {
      console.error("Failed to clear notifications:", err);
      toast.error("Unable to clear notifications.");
    }
  };

  // Mark all unread notifications as read (single API call)
  const handleMarkAllNotificationsAsRead = async () => {
    if (unreadCount === 0) {
      return;
    }

    try {
      setMarkingNotificationId("all");
      await api.patch("/notifications/mark-all-read");

      setNotifications((previousNotifications) =>
        previousNotifications.map((notification) => ({
          ...notification,
          isRead: true,
        }))
      );

      setUnreadCount(0);
      toast.success("All notifications marked as read.");
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
      toast.error(
        err.response?.data?.message ||
          "Unable to mark all notifications as read."
      );
      fetchNotifications();
    } finally {
      setMarkingNotificationId(null);
    }
  };

  // Display notification time in a readable relative format
  const getNotificationTimeAgo = (createdAt) => {
    const createdTime = new Date(createdAt).getTime();
    const differenceInSeconds = Math.max(
      0,
      Math.floor((Date.now() - createdTime) / 1000)
    );

    if (differenceInSeconds < 60) {
      return "Just now";
    }

    const minutes = Math.floor(differenceInSeconds / 60);
    if (minutes < 60) {
      return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
    }

    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `${hours} hour${hours === 1 ? "" : "s"} ago`;
    }

    const days = Math.floor(hours / 24);
    if (days < 7) {
      return `${days} day${days === 1 ? "" : "s"} ago`;
    }

    return new Date(createdAt).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Fetch patient profile when My Profile section opens
  useEffect(() => {
    if (activeMenu !== "My Profile") {
      return;
    }

    const fetchMyProfile = async () => {
      try {
        setProfileLoading(true);
        setProfileError("");

        const response = await api.get("/patients/my-profile");

        const data = response.data;

        setProfile(data);

        setProfileForm({
          fullName: data.fullName || "",
          dateOfBirth: data.dateOfBirth || "",
          gender: data.gender || "",
          phone: data.phone || "",
          address: data.address || "",
          bloodGroup: data.bloodGroup || "",
        });
      } catch (err) {
        console.error("Failed to fetch patient profile:", err);

        setProfileError(
          err.response?.data?.message ||
          "Unable to load your profile. Please try again."
        );
      } finally {
        setProfileLoading(false);
      }
    };

    fetchMyProfile();
  }, [activeMenu]);

  // Escape key and focus management for mobile sidebar & notification dropdown (WCAG 2.1.2 / 2.4.3)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (notificationOpen) {
          setNotificationOpen(false);
          notificationTriggerRef.current?.focus();
        } else if (sidebarOpen) {
          setSidebarOpen(false);
          sidebarTriggerRef.current?.focus();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [notificationOpen, sidebarOpen]);

  // Outside-click listener for notification dropdown
  useEffect(() => {
    if (!notificationOpen) return;
    const handleClickOutside = (e) => {
      if (
        notificationDropdownRef.current &&
        !notificationDropdownRef.current.contains(e.target) &&
        notificationTriggerRef.current &&
        !notificationTriggerRef.current.contains(e.target)
      ) {
        setNotificationOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [notificationOpen]);

  // Filter doctors by name, specialization, or qualification
  const filteredDoctors = doctors.filter((doctor) => {
    const searchTerm = doctorSearch.toLowerCase().trim();

    return (
      doctor.fullName?.toLowerCase().includes(searchTerm) ||
      doctor.specializationName?.toLowerCase().includes(searchTerm) ||
      doctor.qualification?.toLowerCase().includes(searchTerm)
    );
  });

  // Get doctor details using doctor ID
  const getDoctorDetails = (doctorId) => {
    return doctors.find((doctor) => doctor.doctorId === doctorId);
  };

  // Logout
  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully!");
    navigate("/");
  };

  // Cancel patient's own appointment
  const handleCancelAppointment = async (appointmentId) => {
    const reason = window.prompt("Please state the reason for cancelling your appointment:");
    if (reason === null) {
      return;
    }

    try {
      setCancellingId(appointmentId);

      const response = await api.patch(
        `/appointments/${appointmentId}/cancel`,
        {
          cancellationReason: reason.trim() || "Patient requested cancellation",
        }
      );

      setAppointments((previousAppointments) =>
        previousAppointments.map((appointment) =>
          appointment.appointmentId === appointmentId
            ? {
              ...appointment,
              status: response.data.status,
              cancellationReason: response.data.cancellationReason || reason.trim(),
            }
            : appointment
        )
      );

      toast.success("Appointment cancelled successfully!");
    } catch (err) {
      console.error("Appointment cancellation failed:", err);

      toast.error(
        err.response?.data?.message ||
        "Unable to cancel appointment. Please try again."
      );
    } finally {
      setCancellingId(null);
    }
  };
  // Update patient profile
  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    try {
      setProfileSaving(true);

      const payload = {
        fullName: profileForm.fullName.trim(),
        dateOfBirth: profileForm.dateOfBirth || null,
        gender: profileForm.gender || null,
        phone: profileForm.phone || null,
        address: profileForm.address || null,
        bloodGroup: profileForm.bloodGroup || null,
      };

      const response = await api.put("/patients/my-profile", payload);

      setProfile(response.data);

      setProfileForm({
        fullName: response.data.fullName || "",
        dateOfBirth: response.data.dateOfBirth || "",
        gender: response.data.gender || "",
        phone: response.data.phone || "",
        address: response.data.address || "",
        bloodGroup: response.data.bloodGroup || "",
      });

      setIsEditingProfile(false);

      toast.success("Profile updated successfully!");
    } catch (err) {
      console.error("Failed to update profile:", err);

      toast.error(
        err.response?.data?.message ||
        "Unable to update profile. Please try again."
      );
    } finally {
      setProfileSaving(false);
    }
  };

  // Get today's date in local timezone
  const now = new Date();

  const today = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");

  // Appointment statistics
  const totalAppointments = appointments.length;

  const pendingAppointments = appointments.filter(
    (appointment) => appointment.status === "PENDING"
  ).length;

  const confirmedAppointments = appointments.filter(
    (appointment) => appointment.status === "CONFIRMED"
  ).length;

  const completedAppointments = appointments.filter(
    (appointment) => appointment.status === "COMPLETED"
  ).length;

  // Upcoming appointments
  const upcomingAppointments = appointments
    .filter(
      (appointment) =>
        appointment.appointmentDate >= today &&
        ["PENDING", "CONFIRMED"].includes(appointment.status)
    )
    .sort((a, b) => {
      const dateA = `${a.appointmentDate}T${a.appointmentTime}`;
      const dateB = `${b.appointmentDate}T${b.appointmentTime}`;

      return dateA.localeCompare(dateB);
    })
    .slice(0, 5);

  // Format date
  const formatDate = (date) => {
    return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Format time
  const formatTime = (time) => {
    const [hours, minutes] = time.split(":");

    return new Date(2000, 0, 1, hours, minutes).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Status styling
  const getStatusStyle = (status) => {
    switch (status) {
      case "CONFIRMED":
        return "bg-green-50 text-green-700";

      case "PENDING":
        return "bg-orange-50 text-orange-700";

      case "COMPLETED":
        return "bg-cyan-50 text-cyan-700";

      case "CANCELLED":
      case "REJECTED":
        return "bg-red-50 text-red-700";

      default:
        return "bg-slate-50 text-slate-700";
    }
  };

  // Statistics cards
  const stats = [
    {
      title: "Total Appointments",
      value: totalAppointments,
      icon: CalendarDays,
      color: "bg-cyan-50 text-cyan-600",
      change: "All appointments",
    },
    {
      title: "Upcoming Appointments",
      value: upcomingAppointments.length,
      icon: Clock,
      color: "bg-cyan-50 text-cyan-600",
      change: "Scheduled visits",
    },
    {
      title: "Completed Appointments",
      value: completedAppointments,
      icon: CheckCircle,
      color: "bg-green-50 text-green-600",
      change: "Successfully completed",
    },
    {
      title: "Pending Appointments",
      value: pendingAppointments,
      icon: AlertCircle,
      color: "bg-orange-50 text-orange-600",
      change: "Awaiting confirmation",
    },
  ];

  // Sidebar navigation
  const handleMenuClick = (menuName) => {
    setActiveMenu(menuName);
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* MOBILE OVERLAY */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-100 bg-white transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        {/* LOGO */}
        <div className="flex h-20 items-center justify-between border-b border-slate-100 px-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-cyan-600 p-2.5 text-white">
              <HeartPulse size={24} />
            </div>

            <div>
              <h1 className="text-xl font-extrabold text-slate-900">
                Medi<span className="text-cyan-600">Care</span>{" "}
                <span className="text-teal-600 font-black">Plus</span>
              </h1>

              <p className="text-xs text-slate-500">Patient Portal</p>
            </div>
          </div>

          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* NAVIGATION */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <p className="mb-4 px-3 text-xs font-bold uppercase tracking-wider text-slate-400">
            Patient Menu
          </p>

          <nav className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.name}
                  onClick={() => handleMenuClick(item.name)}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${activeMenu === item.name
                    ? "bg-cyan-50 text-cyan-700"
                    : "text-slate-600 hover:bg-slate-50"
                    }`}
                >
                  <Icon size={19} />
                  {item.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* LOGOUT */}
        <div className="border-t border-slate-100 p-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
          >
            <LogOut size={19} />
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main id="main-content" tabIndex="-1" className="min-h-screen lg:ml-64">
        {/* TOPBAR */}
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-100 bg-white px-5 sm:px-8">
          {/* LEFT */}
          <div className="flex items-center gap-4">
            <button
              ref={sidebarTriggerRef}
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600"
              aria-label="Open sidebar"
              aria-expanded={sidebarOpen}
            >
              <Menu size={24} />
            </button>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{activeMenu}</h2>
              <p className="hidden text-xs text-slate-500 sm:block">
                Welcome to your MediCare Plus Patient Portal
              </p>
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-3 sm:gap-5">
            {/* NOTIFICATIONS */}
            <div className="relative">
              <button
                ref={notificationTriggerRef}
                type="button"
                onClick={() => {
                  const nextOpen = !notificationOpen;
                  setNotificationOpen(nextOpen);
                  if (nextOpen) fetchNotifications();
                }}
                className="relative rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600"
                aria-label="Notifications"
                aria-expanded={notificationOpen}
                aria-haspopup="region"
              >
                <Bell size={23} />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>

              {/* NOTIFICATION DROPDOWN */}
              {notificationOpen && (
                <div
                  ref={notificationDropdownRef}
                  role="region"
                  aria-label="Notification Center"
                  className="fixed right-3 top-24 z-50 w-[calc(100vw-1.5rem)] overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl sm:absolute sm:right-0 sm:top-14 sm:w-[min(560px,calc(100vw-2rem))]"
                >
                  {/* HEADER */}
                  <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4 sm:px-6 sm:py-5">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-lg font-extrabold text-slate-900 sm:text-xl">
                          Notification Center
                        </h3>

                        {unreadCount > 0 ? (
                          <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-bold text-cyan-800">
                            {unreadCount} New
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                            All Caught Up
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-xs text-slate-400 sm:text-sm">
                        Real-time alerts for your appointments, prescriptions and medical records.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setNotificationOpen(false)}
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                      aria-label="Close notifications"
                    >
                      <X size={21} />
                    </button>
                  </div>

                  {/* CATEGORY FILTER TABS */}
                  <div className="flex border-b border-slate-100 bg-white px-3 py-2 text-xs overflow-x-auto">
                    {[
                      { id: "ALL", label: `All (${notifications.length})` },
                      { id: "UNREAD", label: `Unread (${unreadCount})` },
                      { id: "APPOINTMENT", label: "Appointments" },
                      { id: "PRESCRIPTION", label: "Prescriptions" },
                      { id: "MEDICAL_RECORD", label: "Records" },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setNotificationCategoryFilter(tab.id)}
                        className={`rounded-lg px-2.5 py-1.5 font-semibold transition whitespace-nowrap ${
                          notificationCategoryFilter === tab.id
                            ? "bg-cyan-50 font-bold text-cyan-800"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* ACTION BAR */}
                  {!notificationsLoading &&
                    !notificationError &&
                    notifications.length > 0 && (
                      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-5 py-2.5 sm:px-6">
                        <button
                          type="button"
                          onClick={handleMarkAllNotificationsAsRead}
                          disabled={
                            unreadCount === 0 || markingNotificationId !== null
                          }
                          className="flex items-center gap-1.5 text-xs font-bold text-cyan-700 transition hover:text-cyan-900 disabled:cursor-not-allowed disabled:opacity-40 sm:text-sm"
                        >
                          <CheckCircle size={16} />
                          {markingNotificationId === "all"
                            ? "Marking all as read..."
                            : "Mark all as read"}
                        </button>

                        <button
                          type="button"
                          onClick={handleClearAllNotifications}
                          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition hover:text-red-600"
                        >
                          <Trash2 size={13} />
                          Clear all
                        </button>
                      </div>
                    )}

                  {/* NOTIFICATION LIST */}
                  <div className="max-h-[min(55vh,420px)] overflow-y-auto divide-y divide-slate-100">
                    {notificationsLoading ? (
                      <p className="p-10 text-center text-sm text-slate-500">
                        Loading notifications...
                      </p>
                    ) : notificationError ? (
                      <div className="p-8 text-center">
                        <p className="text-sm text-red-500">
                          {notificationError}
                        </p>
                        <button
                          type="button"
                          onClick={() => fetchNotifications(true)}
                          className="mt-3 text-sm font-semibold text-cyan-700"
                        >
                          Try Again
                        </button>
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="p-10 text-center">
                        <Bell
                          size={38}
                          className="mx-auto text-slate-300"
                        />
                        <p className="mt-3 text-base font-bold text-slate-700">
                          No notifications
                        </p>
                        <p className="mt-1 text-sm text-slate-400">
                          You're all caught up!
                        </p>
                      </div>
                    ) : (
                      notifications
                        .filter((notification) => {
                          const nType = (notification.type || "").toUpperCase();
                          const nCat = (notification.category || "").toUpperCase();
                          if (notificationCategoryFilter === "UNREAD") return !notification.isRead;
                          if (notificationCategoryFilter === "APPOINTMENT") {
                            return nCat === "APPOINTMENT" || nType.includes("APPOINTMENT") || nType.includes("RESCHEDULE");
                          }
                          if (notificationCategoryFilter === "PRESCRIPTION") {
                            return nCat === "PRESCRIPTION" || nType.includes("PRESCRIPTION");
                          }
                          if (notificationCategoryFilter === "MEDICAL_RECORD") {
                            return nCat === "MEDICAL_RECORD" || nType.includes("EHR") || nType.includes("DOCUMENT") || nType.includes("CLINICAL");
                          }
                          return true;
                        })
                        .map((notification) => {
                          const notificationType = (
                            notification.type || ""
                          ).toUpperCase();
                          const notificationCat = (
                            notification.category || ""
                          ).toUpperCase();
                          const notificationPriority = (
                            notification.priority || "NORMAL"
                          ).toUpperCase();

                          let NotificationIcon = CalendarDays;
                          let iconStyle = "bg-cyan-50 text-cyan-600";

                          if (
                            notificationType.includes("CONFIRMED") ||
                            notificationType.includes("COMPLETED") ||
                            notificationType.includes("APPROVED")
                          ) {
                            NotificationIcon = CheckCircle;
                            iconStyle = "bg-emerald-50 text-emerald-600";
                          } else if (
                            notificationType.includes("CANCELLED") ||
                            notificationType.includes("REJECTED") ||
                            notificationType.includes("DECLINED")
                          ) {
                            NotificationIcon = AlertCircle;
                            iconStyle = "bg-red-50 text-red-600";
                          } else if (
                            notificationType.includes("PRESCRIPTION") ||
                            notificationCat === "PRESCRIPTION"
                          ) {
                            NotificationIcon = FileText;
                            iconStyle = "bg-violet-50 text-violet-600";
                          } else if (
                            notificationType.includes("UPCOMING") ||
                            notificationType.includes("REMINDER")
                          ) {
                            NotificationIcon = Clock;
                            iconStyle = "bg-amber-50 text-amber-600";
                          } else if (
                            notificationType.includes("EHR") ||
                            notificationType.includes("DOCUMENT") ||
                            notificationCat === "MEDICAL_RECORD"
                          ) {
                            NotificationIcon = Activity;
                            iconStyle = "bg-teal-50 text-teal-600";
                          }

                          return (
                            <div
                              key={notification.notificationId}
                              onClick={() => {
                                if (!notification.isRead) {
                                  handleMarkNotificationAsRead(
                                    notification.notificationId
                                  );
                                }
                              }}
                              className={`group flex w-full items-start gap-3 px-5 py-4 text-left transition hover:bg-slate-50 sm:gap-4 sm:px-6 sm:py-4 cursor-pointer ${
                                !notification.isRead
                                  ? "bg-cyan-50/30"
                                  : "bg-white"
                              }`}
                            >
                              <div
                                className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-12 ${iconStyle}`}
                              >
                                <NotificationIcon size={22} />
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <p className="text-sm font-extrabold text-slate-800 sm:text-base">
                                      {notification.title}
                                    </p>
                                    {notificationPriority === "URGENT" && (
                                      <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-extrabold text-red-700">
                                        URGENT
                                      </span>
                                    )}
                                    {notificationPriority === "IMPORTANT" && (
                                      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                                        Important
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    {!notification.isRead && (
                                      <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-cyan-600" />
                                    )}
                                    <button
                                      type="button"
                                      onClick={(e) =>
                                        handleArchiveNotification(
                                          notification.notificationId,
                                          e
                                        )
                                      }
                                      className="rounded p-1 text-slate-300 opacity-0 transition group-hover:opacity-100 hover:bg-slate-100 hover:text-red-500"
                                      title="Archive notification"
                                      aria-label="Archive notification"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </div>

                                <p className="mt-1.5 text-xs leading-5 text-slate-600 sm:text-sm sm:leading-6">
                                  {notification.message}
                                </p>

                                <div className="mt-2.5 flex items-center justify-between">
                                  <p className="text-[11px] font-medium text-slate-400 sm:text-xs">
                                    {getNotificationTimeAgo(
                                      notification.createdAt
                                    )}
                                  </p>

                                  {/* Quick Navigation CTA */}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (!notification.isRead) {
                                        handleMarkNotificationAsRead(
                                          notification.notificationId
                                        );
                                      }
                                      setNotificationOpen(false);

                                      if (
                                        notificationCat === "APPOINTMENT" ||
                                        notificationType.includes("APPOINTMENT") ||
                                        notificationType.includes("RESCHEDULE")
                                      ) {
                                        setActiveMenu("My Appointments");
                                      } else if (
                                        notificationCat === "PRESCRIPTION" ||
                                        notificationType.includes("PRESCRIPTION")
                                      ) {
                                        setActiveMenu("My Prescriptions");
                                      } else if (
                                        notificationCat === "MEDICAL_RECORD" ||
                                        notificationType.includes("EHR") ||
                                        notificationType.includes("DOCUMENT")
                                      ) {
                                        setActiveMenu("Medical History");
                                      }
                                    }}
                                    className="flex items-center gap-1 text-xs font-bold text-cyan-700 hover:text-cyan-900"
                                  >
                                    View
                                    <ExternalLink size={12} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })
                    )}
                  </div>

                  {/* FOOTER */}
                  <div className="border-t border-slate-100 bg-slate-50 px-5 py-3 text-center sm:py-3">
                    <p className="text-xs font-medium text-slate-400">
                      MediCare Plus Patient Portal • Real-Time Notification System
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* PATIENT PROFILE */}
            <div className="flex items-center gap-3 border-l border-slate-100 pl-4">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-bold text-slate-800">
                  {user?.fullName || "Patient"}
                </p>
                <p className="text-xs text-slate-500">Patient</p>
              </div>
              <button
                onClick={() => {
                  setActiveMenu("My Profile");
                  setSidebarOpen(false);
                  setNotificationOpen(false);
                }}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-100 font-bold text-cyan-700 transition hover:bg-cyan-200 hover:ring-2 hover:ring-cyan-300"
                title="View My Profile"
                aria-label="Open My Profile"
              >
                {user?.fullName?.charAt(0)?.toUpperCase() || "P"}
              </button>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <div className="p-5 sm:p-8">
          {/* ===================================== */}
          {/* DASHBOARD */}
          {/* ===================================== */}

          {activeMenu === "Dashboard" && (
            <>
              {/* PAGE INTRO */}
              <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900">
                    Patient Dashboard
                  </h1>

                  <p className="mt-1 text-sm text-slate-500">
                    Manage your appointments and healthcare activities.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600">
                  <CalendarDays className="mr-2 inline" size={17} />
                  {now.toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </div>
              </div>

              {/* STATISTICS CARDS */}
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {stats.map((stat) => {
                  const Icon = stat.icon;

                  return (
                    <div
                      key={stat.title}
                      className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                    >
                      <div className="flex items-center justify-between">
                        <div className={`rounded-xl p-3 ${stat.color}`}>
                          <Icon size={23} />
                        </div>

                        <span className="flex items-center gap-1 text-xs font-semibold text-green-600">
                          <TrendingUp size={14} />
                          {stat.change}
                        </span>
                      </div>

                      <p className="mt-5 text-sm font-medium text-slate-500">
                        {stat.title}
                      </p>

                      <h3 className="mt-1 text-3xl font-extrabold text-slate-900">
                        {loading ? "..." : stat.value}
                      </h3>
                    </div>
                  );
                })}
              </div>

              {/* APPOINTMENT OVERVIEW */}
              <div className="mt-8 grid gap-6 xl:grid-cols-3">
                {/* APPOINTMENT STATUS */}
                <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm xl:col-span-2">
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">
                        Appointment Overview
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        Your appointment statistics
                      </p>
                    </div>

                    <CalendarDays className="text-cyan-600" size={23} />
                  </div>

                  {loading ? (
                    <p className="py-8 text-center text-sm text-slate-500">
                      Loading appointment statistics...
                    </p>
                  ) : error ? (
                    <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">
                      {error}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {[
                        {
                          label: "Confirmed",
                          value: confirmedAppointments,
                          color: "bg-green-500",
                        },
                        {
                          label: "Pending",
                          value: pendingAppointments,
                          color: "bg-orange-400",
                        },
                        {
                          label: "Completed",
                          value: completedAppointments,
                          color: "bg-cyan-500",
                        },
                      ].map((item) => {
                        const percentage =
                          totalAppointments > 0
                            ? (item.value / totalAppointments) * 100
                            : 0;

                        return (
                          <div key={item.label}>
                            <div className="mb-2 flex justify-between text-sm">
                              <span className="font-semibold text-slate-700">
                                {item.label}
                              </span>

                              <span className="font-bold text-slate-600">
                                {item.value}
                              </span>
                            </div>

                            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className={`h-full rounded-full ${item.color}`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* QUICK SUMMARY */}
                <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900">
                    Quick Summary
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Your healthcare activity
                  </p>

                  <div className="mt-6 space-y-5">
                    <div className="flex items-center gap-4">
                      <div className="rounded-xl bg-green-50 p-3 text-green-600">
                        <CheckCircle size={22} />
                      </div>

                      <div>
                        <p className="text-xl font-bold text-slate-900">
                          {loading ? "..." : confirmedAppointments}
                        </p>

                        <p className="text-sm text-slate-500">Confirmed</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="rounded-xl bg-orange-50 p-3 text-orange-600">
                        <Clock size={22} />
                      </div>

                      <div>
                        <p className="text-xl font-bold text-slate-900">
                          {loading ? "..." : pendingAppointments}
                        </p>

                        <p className="text-sm text-slate-500">
                          Awaiting Confirmation
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="rounded-xl bg-cyan-50 p-3 text-cyan-600">
                        <CheckCircle size={22} />
                      </div>

                      <div>
                        <p className="text-xl font-bold text-slate-900">
                          {loading ? "..." : completedAppointments}
                        </p>

                        <p className="text-sm text-slate-500">Completed</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="rounded-xl bg-cyan-50 p-3 text-cyan-600">
                        <CalendarDays size={22} />
                      </div>

                      <div>
                        <p className="text-xl font-bold text-slate-900">
                          {loading ? "..." : upcomingAppointments.length}
                        </p>

                        <p className="text-sm text-slate-500">Upcoming</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* UPCOMING APPOINTMENTS TABLE */}
              <div className="mt-8 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                <div className="border-b border-slate-100 p-6">
                  <h3 className="text-lg font-bold text-slate-900">
                    Upcoming Appointments
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Your scheduled doctor consultations
                  </p>
                </div>

                {loading ? (
                  <div className="p-8 text-center text-sm text-slate-500">
                    Loading appointments...
                  </div>
                ) : error ? (
                  <div className="p-6 text-sm text-red-600">{error}</div>
                ) : upcomingAppointments.length === 0 ? (
                  <div className="p-8 text-center">
                    <CalendarDays
                      size={35}
                      className="mx-auto text-slate-300"
                    />

                    <p className="mt-3 font-semibold text-slate-700">
                      No upcoming appointments
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      Book an appointment with a doctor to get started.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[750px] text-left">
                      <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                        <tr>
                          <th className="px-6 py-4 font-semibold">
                            Appointment ID
                          </th>

                          <th className="px-6 py-4 font-semibold">Doctor</th>

                          <th className="px-6 py-4 font-semibold">
                            Date & Time
                          </th>

                          <th className="px-6 py-4 font-semibold">Reason</th>

                          <th className="px-6 py-4 font-semibold">Status</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {upcomingAppointments.map((appointment) => (
                          <tr
                            key={appointment.appointmentId}
                            className="transition hover:bg-slate-50"
                          >
                            <td className="px-6 py-4 text-sm font-semibold text-cyan-700">
                              <div>#{appointment.appointmentId}</div>
                              {appointment.status === "CONFIRMED" && appointment.queueNumber && (
                                <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-cyan-100 px-2 py-0.5 text-[11px] font-extrabold text-cyan-800">
                                  Queue #{appointment.queueNumber}
                                </span>
                              )}
                            </td>

                            <td className="px-6 py-4 text-sm font-semibold text-slate-800">
                              {getDoctorDetails(appointment.doctorId) ? (
                                <div>
                                  <p className="font-semibold text-slate-800">
                                    {
                                      getDoctorDetails(appointment.doctorId)
                                        .fullName
                                    }
                                  </p>

                                  <p className="mt-1 text-xs font-medium text-cyan-600">
                                    {
                                      getDoctorDetails(appointment.doctorId)
                                        .specializationName
                                    }
                                  </p>
                                </div>
                              ) : (
                                <span>Loading doctor details...</span>
                              )}
                            </td>

                            <td className="px-6 py-4 text-sm text-slate-600">
                              <p>
                                {formatDate(appointment.appointmentDate)}
                              </p>

                              <p className="mt-1 text-xs text-slate-400">
                                {formatTime(appointment.appointmentTime)}
                              </p>
                            </td>

                            <td className="px-6 py-4 text-sm text-slate-600">
                              {appointment.reason}
                            </td>

                            <td className="px-6 py-4">
                              <div className="flex flex-col gap-1 items-start">
                                <span
                                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${getStatusStyle(
                                    appointment.status
                                  )}`}
                                >
                                  {appointment.status}
                                </span>
                                {appointment.status === "PENDING" && appointment.holdExpiresAt && (
                                  <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-200">
                                    <Timer size={11} /> 15m Hold Active
                                  </span>
                                )}
                                {appointment.rescheduleStatus === "PENDING_APPROVAL" && (
                                  <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                                    Reschedule Pending
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* QUICK ACTIONS */}
              <div className="mt-8 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900">
                  Quick Actions
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Manage your healthcare activities.
                </p>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <button
                    onClick={() => navigate("/patient/appointments/book")}
                    className="flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-5 py-4 font-semibold text-white transition hover:bg-cyan-700"
                  >
                    <CalendarDays size={20} />
                    Book Appointment
                  </button>

                  <button
                    onClick={() => handleMenuClick("Find Doctors")}
                    className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-4 font-semibold text-slate-600 transition hover:bg-slate-50"
                  >
                    <Search size={20} />
                    Find a Doctor
                  </button>
                </div>
              </div>

              {/* FOOTER */}
              <footer className="mt-8 pb-4 text-center text-sm text-slate-400">
                © 2026 MediCare Plus — The Healthcare Administration Console. All rights
                reserved.
              </footer>
            </>
          )}

          {/* ===================================== */}
          {/* MY APPOINTMENTS */}
          {/* ===================================== */}

          {activeMenu === "My Appointments" && (
            <div>
              {/* PAGE HEADER */}
              <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900">
                    My Appointments
                  </h1>

                  <p className="mt-1 text-sm text-slate-500">
                    View all your scheduled and previous appointments.
                  </p>
                </div>

                <button
                  onClick={() => navigate("/patient/appointments/book")}
                  className="flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700"
                >
                  <CalendarDays size={18} />
                  Book Appointment
                </button>
              </div>

              {/* APPOINTMENT SUMMARY */}
              <div className="mb-8 grid gap-5 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                  <p className="text-sm text-slate-500">Total Appointments</p>

                  <h3 className="mt-2 text-3xl font-bold text-slate-900">
                    {loading ? "..." : appointments.length}
                  </h3>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                  <p className="text-sm text-slate-500">Upcoming</p>

                  <h3 className="mt-2 text-3xl font-bold text-cyan-600">
                    {loading ? "..." : upcomingAppointments.length}
                  </h3>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                  <p className="text-sm text-slate-500">Completed</p>

                  <h3 className="mt-2 text-3xl font-bold text-green-600">
                    {loading ? "..." : completedAppointments}
                  </h3>
                </div>
              </div>

              {/* APPOINTMENT TABLE */}
              <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                <div className="border-b border-slate-100 p-6">
                  <h2 className="text-lg font-bold text-slate-900">
                    Appointment History
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    All your appointments in one place.
                  </p>
                </div>

                {loading ? (
                  <div className="p-10 text-center text-sm text-slate-500">
                    Loading appointments...
                  </div>
                ) : error ? (
                  <div className="p-6 text-sm text-red-600">{error}</div>
                ) : appointments.length === 0 ? (
                  <div className="p-10 text-center">
                    <CalendarDays
                      size={42}
                      className="mx-auto text-slate-300"
                    />

                    <h3 className="mt-4 font-bold text-slate-800">
                      No appointments found
                    </h3>

                    <p className="mt-2 text-sm text-slate-500">
                      You haven't booked any appointments yet.
                    </p>

                    <button
                      onClick={() => navigate("/patient/appointments/book")}
                      className="mt-5 rounded-xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white hover:bg-cyan-700"
                    >
                      Book Your First Appointment
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px] text-left">
                      <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                        <tr>
                          <th className="px-6 py-4 font-semibold">
                            Appointment ID
                          </th>

                          <th className="px-6 py-4 font-semibold">Doctor</th>

                          <th className="px-6 py-4 font-semibold">
                            Date & Time
                          </th>

                          <th className="px-6 py-4 font-semibold">Reason</th>

                          <th className="px-6 py-4 font-semibold">Status</th>

                          <th className="px-6 py-4 font-semibold">Action</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {appointments
                          .slice()
                          .sort((a, b) => {
                            const dateA = `${a.appointmentDate}T${a.appointmentTime}`;
                            const dateB = `${b.appointmentDate}T${b.appointmentTime}`;

                            return dateB.localeCompare(dateA);
                          })
                          .map((appointment) => (
                            <tr
                              key={appointment.appointmentId}
                              className="transition hover:bg-slate-50"
                            >
                              <td className="px-6 py-4 text-sm font-semibold text-cyan-700">
                                <div>#{appointment.appointmentId}</div>
                                {appointment.status === "CONFIRMED" && appointment.queueNumber && (
                                  <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-cyan-100 px-2 py-0.5 text-[11px] font-extrabold text-cyan-800">
                                    Queue #{appointment.queueNumber}
                                  </span>
                                )}
                              </td>

                              <td className="px-6 py-4 text-sm font-semibold text-slate-800">
                                {getDoctorDetails(appointment.doctorId) ? (
                                  <div>
                                    <p className="font-semibold text-slate-800">
                                      {
                                        getDoctorDetails(appointment.doctorId)
                                          .fullName
                                      }
                                    </p>

                                    <p className="mt-1 text-xs font-medium text-cyan-600">
                                      {
                                        getDoctorDetails(appointment.doctorId)
                                          .specializationName
                                      }
                                    </p>
                                  </div>
                                ) : (
                                  <span>Loading doctor details...</span>
                                )}
                              </td>

                              <td className="px-6 py-4 text-sm text-slate-600">
                                <p>
                                  {formatDate(appointment.appointmentDate)}
                                </p>

                                <p className="mt-1 text-xs text-slate-400">
                                  {formatTime(appointment.appointmentTime)}
                                </p>
                              </td>

                              <td className="px-6 py-4 text-sm text-slate-600">
                                {appointment.reason}
                              </td>

                              <td className="px-6 py-4">
                                <div className="flex flex-col gap-1 items-start">
                                  <span
                                    className={`rounded-full px-3 py-1.5 text-xs font-semibold ${getStatusStyle(
                                      appointment.status
                                    )}`}
                                  >
                                    {appointment.status}
                                  </span>
                                  {appointment.status === "PENDING" && appointment.holdExpiresAt && (
                                    <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-200">
                                      <Timer size={11} /> 15m Hold Active
                                    </span>
                                  )}
                                  {appointment.rescheduleStatus === "PENDING_APPROVAL" && (
                                    <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                                      Reschedule Pending ({formatDate(appointment.rescheduleRequestedDate)})
                                    </span>
                                  )}
                                  {appointment.rescheduleStatus === "REJECTED" && (
                                    <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                                      Reschedule Declined
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* APPOINTMENT ACTIONS */}
                              <td className="px-6 py-4">
                                {["PENDING", "CONFIRMED"].includes(
                                  appointment.status
                                ) ? (
                                  <div className="flex flex-wrap items-center gap-2">
                                    {appointment.rescheduleStatus !== "PENDING_APPROVAL" && (
                                      <button
                                        onClick={() => openRescheduleModal(appointment)}
                                        className="inline-flex items-center gap-1 rounded-lg bg-cyan-50 px-3 py-2 text-xs font-semibold text-cyan-700 transition hover:bg-cyan-100"
                                      >
                                        <RotateCcw size={12} />
                                        <span>Reschedule</span>
                                      </button>
                                    )}
                                    <button
                                      onClick={() =>
                                        handleCancelAppointment(
                                          appointment.appointmentId
                                        )
                                      }
                                      disabled={
                                        cancellingId === appointment.appointmentId
                                      }
                                      className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      {cancellingId === appointment.appointmentId
                                        ? "Cancelling..."
                                        : "Cancel"}
                                    </button>
                                  </div>
                                ) : appointment.status === "COMPLETED" ? (
                                  prescriptionMap.has(
                                    Number(appointment.appointmentId)
                                  ) ? (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        openPrescriptionReceipt(
                                          prescriptionMap.get(
                                            Number(appointment.appointmentId)
                                          ),
                                          appointment
                                        )
                                      }
                                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                                    >
                                      <FileText size={15} />
                                      <span>View Prescription</span>
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        openPrescriptionReceipt(appointment)
                                      }
                                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                                    >
                                      <FileText
                                        size={14}
                                        className="text-slate-400"
                                      />
                                      <span>View Prescription</span>
                                    </button>
                                  )
                                ) : (
                                  <span className="text-xs text-slate-400">
                                    Not available
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ===================================== */}
          {/* FIND DOCTORS */}
          {/* ===================================== */}

          {activeMenu === "Find Doctors" && (
            <div>
              {/* PAGE INTRO */}
              <div className="mb-8">
                <h1 className="text-2xl font-extrabold text-slate-900">
                  Find Doctors
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Find experienced doctors and explore their specializations.
                </p>
              </div>

              {/* SEARCH BAR */}
              <div className="mb-8 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <div className="relative">
                  <Search
                    size={20}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="text"
                    value={doctorSearch}
                    onChange={(e) => setDoctorSearch(e.target.value)}
                    placeholder="Search by doctor name, specialization..."
                    className="w-full rounded-xl border border-slate-200 py-3 pl-12 pr-4 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                  />
                </div>
              </div>

              {/* LOADING */}
              {doctorsLoading && (
                <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
                  <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-cyan-100 border-t-cyan-600" />

                  <p className="mt-4 text-sm text-slate-500">
                    Loading doctors...
                  </p>
                </div>
              )}

              {/* ERROR */}
              {!doctorsLoading && doctorsError && (
                <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center">
                  <p className="font-semibold text-red-700">{doctorsError}</p>

                  <button
                    onClick={() => setActiveMenu("Dashboard")}
                    className="mt-4 rounded-lg bg-cyan-600 px-5 py-2 text-sm font-semibold text-white hover:bg-cyan-700"
                  >
                    Back to Dashboard
                  </button>
                </div>
              )}

              {/* DOCTOR CARDS */}
              {!doctorsLoading && !doctorsError && (
                <>
                  <div className="mb-5 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-800">
                      Available Doctors
                    </h2>

                    <span className="rounded-full bg-cyan-50 px-3 py-1 text-sm font-semibold text-cyan-700">
                      {filteredDoctors.length} Doctors
                    </span>
                  </div>

                  {filteredDoctors.length === 0 ? (
                    <div className="rounded-2xl border border-slate-100 bg-white p-12 text-center shadow-sm">
                      <Search
                        size={40}
                        className="mx-auto text-slate-300"
                      />

                      <p className="mt-4 font-semibold text-slate-800">
                        No doctors found
                      </p>

                      <p className="mt-2 text-sm text-slate-500">
                        Try searching with another name or specialization.
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                      {filteredDoctors.map((doctor) => (
                        <div
                          key={doctor.doctorId}
                          className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                        >
                          {/* CARD HEADER */}
                          <div className="flex items-center gap-4 border-b border-slate-100 p-5">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-cyan-50 text-cyan-700">
                              <UserRound size={28} />
                            </div>

                            <div className="min-w-0">
                              <h3 className="truncate font-bold text-slate-900">
                                {doctor.fullName}
                              </h3>

                              <p className="mt-1 text-sm font-medium text-cyan-700">
                                {doctor.specializationName}
                              </p>
                            </div>
                          </div>

                          {/* CARD DETAILS */}
                          <div className="space-y-4 p-5">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Qualification
                              </p>

                              <p className="mt-1 text-sm font-medium text-slate-700">
                                {doctor.qualification || "Not specified"}
                              </p>
                            </div>

                            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                              <div>
                                <p className="text-xs text-slate-400">
                                  Experience
                                </p>

                                <p className="mt-1 text-sm font-bold text-slate-800">
                                  {doctor.experienceYears ?? 0} Years
                                </p>
                              </div>

                              <div className="text-right">
                                <p className="text-xs text-slate-400">
                                  Consultation Fee
                                </p>

                                <p className="mt-1 text-lg font-extrabold text-cyan-700">
                                  ₹
                                  {Number(
                                    doctor.consultationFee || 0
                                  ).toLocaleString("en-IN")}
                                </p>
                              </div>
                            </div>

                            {/* BOOK APPOINTMENT */}
                            <button
                              onClick={() =>
                                navigate("/patient/appointments/book", {
                                  state: {
                                    doctorId: doctor.doctorId,
                                    doctorName: doctor.fullName,
                                  },
                                })
                              }
                              className="w-full rounded-xl bg-cyan-600 py-3 text-sm font-bold text-white transition hover:bg-cyan-700"
                            >
                              Book Appointment
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}



          {/* ===================================== */}
          {/* MY PRESCRIPTIONS */}
          {/* ===================================== */}

          {activeMenu === "My Prescriptions" && (
            <div>
              <div className="mb-8">
                <h1 className="text-2xl font-extrabold text-slate-900">
                  My Prescriptions
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  View your prescriptions, medicines and doctor's instructions.
                </p>
              </div>

              {prescriptionsLoading && (
                <div className="rounded-2xl border border-slate-100 bg-white p-10 text-center shadow-sm">
                  <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-cyan-100 border-t-cyan-600" />
                  <p className="mt-4 text-sm text-slate-500">
                    Loading your prescriptions...
                  </p>
                </div>
              )}

              {!prescriptionsLoading && prescriptionsError && (
                <div className="rounded-2xl border border-red-100 bg-red-50 p-6">
                  <p className="font-semibold text-red-700">
                    Unable to load prescriptions
                  </p>
                  <p className="mt-2 text-sm text-red-600">
                    {prescriptionsError}
                  </p>
                  <button
                    onClick={() => setActiveMenu("Dashboard")}
                    className="mt-4 rounded-lg bg-cyan-600 px-5 py-2 text-sm font-semibold text-white hover:bg-cyan-700"
                  >
                    Back to Dashboard
                  </button>
                </div>
              )}

              {!prescriptionsLoading &&
                !prescriptionsError &&
                prescriptions.length === 0 && (
                  <div className="rounded-2xl border border-slate-100 bg-white p-10 text-center shadow-sm">
                    <FileText size={44} className="mx-auto text-cyan-600" />
                    <h3 className="mt-4 font-bold text-slate-800">
                      No prescriptions available
                    </h3>
                    <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                      Your prescriptions will appear here once your doctor
                      creates them after your consultation.
                    </p>
                  </div>
                )}

              {!prescriptionsLoading &&
                !prescriptionsError &&
                prescriptions.length > 0 && (
                  <div className="space-y-6">
                    {prescriptions.map((prescription) => {
                      const appointment = appointments.find(
                        (item) =>
                          Number(item.appointmentId) ===
                          Number(prescription.appointmentId)
                      );

                      const doctor = appointment
                        ? getDoctorDetails(appointment.doctorId)
                        : null;

                      let medications = [];

                      try {
                        medications =
                          typeof prescription.medications === "string"
                            ? JSON.parse(prescription.medications)
                            : prescription.medications || [];

                        if (!Array.isArray(medications)) {
                          medications = [];
                        }
                      } catch (err) {
                        console.error(
                          "Invalid prescription medication data:",
                          err
                        );
                      }

                      return (
                        <div
                          key={prescription.prescriptionId}
                          className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm"
                        >
                          {/* PRESCRIPTION HEADER */}
                          <div className="flex flex-col gap-3 border-b border-slate-100 bg-cyan-50/50 p-5 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wider text-cyan-700">
                                Prescription #{prescription.prescriptionId}
                              </p>
                              <h3 className="mt-1 text-lg font-bold text-slate-900">
                                {prescription.diagnosis ||
                                  "Diagnosis not recorded"}
                              </h3>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  openPrescriptionReceipt(
                                    prescription,
                                    appointment
                                  )
                                }
                                className="flex items-center gap-1.5 rounded-lg border border-cyan-200 bg-white px-3.5 py-2 text-xs font-semibold text-cyan-700 shadow-sm transition hover:bg-cyan-50"
                              >
                                <Printer size={15} />
                                <span>Print Receipt</span>
                              </button>

                              <span className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm">
                                {prescription.prescribedAt
                                  ? new Date(
                                      prescription.prescribedAt
                                    ).toLocaleDateString("en-IN", {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                    })
                                  : "Date unavailable"}
                              </span>
                            </div>
                          </div>

                          <div className="p-5">
                            {/* DOCTOR AND APPOINTMENT */}
                            <div className="grid gap-4 sm:grid-cols-2">
                              <div className="rounded-xl bg-slate-50 p-4">
                                <p className="text-xs font-semibold uppercase text-slate-400">
                                  Prescribed By
                                </p>
                                <p className="mt-2 font-semibold text-slate-800">
                                  {doctor?.fullName ||
                                    "Doctor information unavailable"}
                                </p>
                                {doctor?.specializationName && (
                                  <p className="mt-1 text-sm text-cyan-700">
                                    {doctor.specializationName}
                                  </p>
                                )}
                              </div>

                              <div className="rounded-xl bg-slate-50 p-4">
                                <p className="text-xs font-semibold uppercase text-slate-400">
                                  Appointment
                                </p>
                                <p className="mt-2 font-semibold text-slate-800">
                                  Appointment #{prescription.appointmentId}
                                </p>
                                <p className="mt-1 text-sm text-slate-500">
                                  {appointment?.appointmentDate
                                    ? formatDate(appointment.appointmentDate)
                                    : "Appointment date unavailable"}
                                </p>
                              </div>
                            </div>

                            {/* DIAGNOSIS */}
                            <div className="mt-6">
                              <h4 className="font-bold text-slate-800">
                                Medical Diagnosis
                              </h4>
                              <p className="mt-2 rounded-xl border border-cyan-100 bg-cyan-50 p-4 text-sm leading-6 text-cyan-900">
                                {prescription.diagnosis ||
                                  "No diagnosis recorded."}
                              </p>
                            </div>

                            {/* MEDICINES */}
                            <div className="mt-6">
                              <h4 className="font-bold text-slate-800">
                                Prescribed Medicines
                              </h4>

                              {medications.length > 0 ? (
                                <div className="mt-3 overflow-x-auto rounded-xl border border-slate-100">
                                  <table className="w-full min-w-[750px] text-left text-sm">
                                    <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                      <tr>
                                        <th className="px-4 py-3 font-semibold">
                                          Medicine
                                        </th>
                                        <th className="px-4 py-3 font-semibold">
                                          Dosage
                                        </th>
                                        <th className="px-4 py-3 font-semibold">
                                          Frequency
                                        </th>
                                        <th className="px-4 py-3 font-semibold">
                                          Duration
                                        </th>
                                        <th className="px-4 py-3 font-semibold">
                                          Instructions
                                        </th>
                                      </tr>
                                    </thead>

                                    <tbody className="divide-y divide-slate-100">
                                      {medications.map((medicine, index) => (
                                        <tr key={index}>
                                          <td className="px-4 py-3 font-semibold text-slate-800">
                                            {medicine.medicineName ||
                                              medicine.medicine ||
                                              "Not specified"}
                                          </td>
                                          <td className="px-4 py-3 text-slate-600">
                                            {medicine.dosage || "Not specified"}
                                          </td>
                                          <td className="px-4 py-3 text-slate-600">
                                            {medicine.frequency ||
                                              "Not specified"}
                                          </td>
                                          <td className="px-4 py-3 text-slate-600">
                                            {medicine.duration ||
                                              "Not specified"}
                                          </td>
                                          <td className="px-4 py-3 text-slate-600">
                                            {medicine.instructions ||
                                              "Not specified"}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <p className="mt-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                                  No medicine details available.
                                </p>
                              )}
                            </div>

                            {/* DOCTOR INSTRUCTIONS */}
                            {prescription.instructions && (
                              <div className="mt-6 rounded-xl border border-amber-100 bg-amber-50 p-4">
                                <h4 className="font-bold text-amber-800">
                                  Doctor's Instructions
                                </h4>
                                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-amber-900">
                                  {prescription.instructions}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
            </div>
          )}

          {/* ===================================== */}
          {/* MEDICAL HISTORY */}
          {/* ===================================== */}

          {activeMenu === "Medical History" && (
            <div className="space-y-6">
              {/* PAGE HEADER */}
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-extrabold text-slate-900">
                      Electronic Health Record (EHR)
                    </h1>
                    <span className="rounded-full bg-cyan-100 px-2.5 py-0.5 text-xs font-bold text-cyan-800">
                      V2.0
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    Comprehensive clinical history, vitals monitoring, consultations, allergies, and diagnostic documents.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setVitalsModalOpen(true)}
                    className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-cyan-700"
                  >
                    <Plus size={15} /> Log Vitals
                  </button>
                  <button
                    type="button"
                    onClick={() => setConditionModalOpen(true)}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                    <ShieldAlert size={15} className="text-amber-500" /> Add Condition
                  </button>
                  <button
                    type="button"
                    onClick={() => setDocumentModalOpen(true)}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                    <Upload size={15} className="text-cyan-600" /> Upload Doc
                  </button>
                  <button
                    type="button"
                    onClick={() => fetchEhrData()}
                    disabled={ehrLoading}
                    title="Refresh EHR records"
                    className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    <RotateCcw size={16} className={ehrLoading ? "animate-spin" : ""} />
                  </button>
                </div>
              </div>

              {/* QUICK VITALS & CLINICAL METRICS CARDS */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Blood Pressure */}
                <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Blood Pressure
                    </span>
                    <div className="rounded-xl bg-rose-50 p-2.5 text-rose-600">
                      <Heart size={18} />
                    </div>
                  </div>
                  <h3 className="mt-3 text-xl font-extrabold text-slate-900">
                    {ehrData?.latestVitals?.systolicBp && ehrData?.latestVitals?.diastolicBp
                      ? `${ehrData.latestVitals.systolicBp}/${ehrData.latestVitals.diastolicBp}`
                      : "—"}
                    <span className="ml-1 text-xs font-normal text-slate-500">mmHg</span>
                  </h3>
                  <p className="mt-1 text-xs text-slate-400">
                    {ehrData?.latestVitals?.recordedAt
                      ? `Last: ${new Date(ehrData.latestVitals.recordedAt).toLocaleDateString("en-IN")}`
                      : "No vitals logged"}
                  </p>
                </div>

                {/* Heart Rate & SpO2 */}
                <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Pulse & Oxygen
                    </span>
                    <div className="rounded-xl bg-cyan-50 p-2.5 text-cyan-600">
                      <Activity size={18} />
                    </div>
                  </div>
                  <h3 className="mt-3 text-xl font-extrabold text-slate-900">
                    {ehrData?.latestVitals?.heartRateBpm ? `${ehrData.latestVitals.heartRateBpm} bpm` : "—"}
                    <span className="mx-2 text-slate-300">·</span>
                    <span className="text-sm font-bold text-cyan-700">
                      {ehrData?.latestVitals?.oxygenSaturationPercent ? `${ehrData.latestVitals.oxygenSaturationPercent}%` : "—"}
                    </span>
                  </h3>
                  <p className="mt-1 text-xs text-slate-400">Heart Rate & Oxygen Saturation</p>
                </div>

                {/* Weight & BMI */}
                <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Weight & BMI
                    </span>
                    <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
                      <Scale size={18} />
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <h3 className="text-xl font-extrabold text-slate-900">
                      {ehrData?.latestVitals?.weightKg ? `${ehrData.latestVitals.weightKg} kg` : "—"}
                    </h3>
                    {ehrData?.latestVitals?.bmi && (
                      <span className="rounded-md border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[11px] font-bold text-emerald-700">
                        BMI {ehrData.latestVitals.bmi} ({ehrData.latestVitals.bmiCategory || "Normal"})
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    {ehrData?.latestVitals?.heightCm ? `Height: ${ehrData.latestVitals.heightCm} cm` : "Height unrecorded"}
                  </p>
                </div>

                {/* Allergies & Conditions */}
                <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Allergies & Conditions
                    </span>
                    <div className="rounded-xl bg-amber-50 p-2.5 text-amber-600">
                      <ShieldAlert size={18} />
                    </div>
                  </div>
                  <h3 className="mt-3 text-xl font-extrabold text-slate-900">
                    {ehrData?.allergiesAndConditions?.length || 0}
                    <span className="ml-1 text-xs font-normal text-slate-500">recorded</span>
                  </h3>
                  <p className="mt-1 text-xs text-slate-400">
                    {ehrData?.allergiesAndConditions?.filter((c) => c.status === "ACTIVE").length || 0} active conditions
                  </p>
                </div>
              </div>

              {/* EHR NAVIGATION TABS */}
              <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
                {[
                  { id: "timeline", label: "Unified Timeline", icon: Clock, count: ehrData?.unifiedTimeline?.length },
                  { id: "consultations", label: "Consultation Notes", icon: ClipboardList, count: (ehrData?.consultationRecords?.length || 0) + (medicalHistory?.length || 0) },
                  { id: "vitals", label: "Vitals Tracker", icon: Activity, count: ehrData?.vitalsHistory?.length },
                  { id: "allergies", label: "Allergies & Conditions", icon: ShieldAlert, count: ehrData?.allergiesAndConditions?.length },
                  { id: "documents", label: "Medical Documents", icon: FileText, count: ehrData?.documents?.length },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = ehrSubTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setEhrSubTab(tab.id)}
                      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                        isActive
                          ? "bg-cyan-600 text-white shadow-sm"
                          : "bg-white text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <Icon size={16} />
                      <span>{tab.label}</span>
                      {tab.count != null && tab.count > 0 && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                            isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {tab.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* ERROR STATE */}
              {ehrError && (
                <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-red-700">
                  <div className="flex items-center gap-3">
                    <AlertCircle size={20} className="shrink-0 text-red-500" />
                    <div>
                      <p className="font-bold">Error loading medical records</p>
                      <p className="text-xs text-red-600 mt-0.5">{ehrError}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* LOADING STATE */}
              {ehrLoading && (
                <div className="rounded-2xl border border-slate-100 bg-white p-12 text-center shadow-sm">
                  <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-cyan-100 border-t-cyan-600" />
                  <p className="mt-4 text-sm font-medium text-slate-500">
                    Retrieving electronic health records...
                  </p>
                </div>
              )}

              {/* TAB 1: UNIFIED TIMELINE */}
              {!ehrLoading && ehrSubTab === "timeline" && (
                <div className="space-y-4">
                  {/* Filter chips */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1">
                      Filter Timeline:
                    </span>
                    {["ALL", "CONSULTATION", "PRESCRIPTION", "VITAL", "DOCUMENT"].map((flt) => (
                      <button
                        key={flt}
                        type="button"
                        onClick={() => setTimelineFilter(flt)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                          timelineFilter === flt
                            ? "bg-slate-900 text-white"
                            : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {flt}
                      </button>
                    ))}
                  </div>

                  {(!ehrData?.unifiedTimeline || ehrData.unifiedTimeline.length === 0) ? (
                    <div className="rounded-2xl border border-slate-100 bg-white p-12 text-center shadow-sm">
                      <Clock size={40} className="mx-auto text-slate-300" />
                      <h3 className="mt-3 text-base font-bold text-slate-800">No Timeline Events Recorded</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Consultations, vitals, prescriptions and diagnostic documents will be tracked chronologically here.
                      </p>
                    </div>
                  ) : (
                    <div className="relative border-l-2 border-slate-200 pl-6 ml-4 space-y-6">
                      {ehrData.unifiedTimeline
                        .filter((item) => timelineFilter === "ALL" || item.eventType === timelineFilter)
                        .map((item, idx) => {
                          const eventColors = {
                            CONSULTATION: "bg-cyan-500 text-white",
                            PRESCRIPTION: "bg-emerald-500 text-white",
                            VITAL: "bg-rose-500 text-white",
                            DOCUMENT: "bg-indigo-500 text-white",
                          };
                          const IconComp =
                            item.eventType === "CONSULTATION" ? ClipboardList :
                            item.eventType === "PRESCRIPTION" ? Pill :
                            item.eventType === "VITAL" ? Activity : FileText;

                          return (
                            <div key={idx} className="relative group">
                              {/* Timeline bullet */}
                              <div
                                className={`absolute -left-[35px] top-1 flex h-7 w-7 items-center justify-center rounded-full shadow-sm ring-4 ring-white ${
                                  eventColors[item.eventType] || "bg-slate-500 text-white"
                                }`}
                              >
                                <IconComp size={14} />
                              </div>

                              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">
                                      {item.eventType}
                                    </span>
                                    <h4 className="text-base font-bold text-slate-900">{item.title}</h4>
                                  </div>
                                  <span className="text-xs font-medium text-slate-400">
                                    {item.eventTimestamp ? new Date(item.eventTimestamp).toLocaleString("en-IN") : "—"}
                                  </span>
                                </div>

                                {item.actorName && (
                                  <p className="mt-1 text-xs font-semibold text-cyan-700">
                                    Attending / Recorded by: {item.actorName}
                                  </p>
                                )}

                                {item.summary && (
                                  <p className="mt-2 text-sm text-slate-600 bg-slate-50 p-3 rounded-xl whitespace-pre-line">
                                    {item.summary}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: VITALS TRACKER */}
              {!ehrLoading && ehrSubTab === "vitals" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Vitals & Physiological Metrics</h3>
                      <p className="text-xs text-slate-500">Track and review physiological readings logged by attending doctors or self-reported.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setVitalsModalOpen(true)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-cyan-700"
                    >
                      <Plus size={15} /> Log New Vitals
                    </button>
                  </div>

                  {(!ehrData?.vitalsHistory || ehrData.vitalsHistory.length === 0) ? (
                    <div className="rounded-2xl border border-slate-100 bg-white p-12 text-center shadow-sm">
                      <Activity size={40} className="mx-auto text-slate-300" />
                      <h4 className="mt-3 text-base font-bold text-slate-800">No Vitals Recorded Yet</h4>
                      <p className="mt-1 text-sm text-slate-500">Click "Log New Vitals" above to record blood pressure, pulse, temperature and weight.</p>
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[850px] text-left text-sm">
                          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                            <tr>
                              <th className="px-5 py-3 font-semibold">Date & Time</th>
                              <th className="px-5 py-3 font-semibold">BP (mmHg)</th>
                              <th className="px-5 py-3 font-semibold">Pulse</th>
                              <th className="px-5 py-3 font-semibold">Resp.</th>
                              <th className="px-5 py-3 font-semibold">Temp</th>
                              <th className="px-5 py-3 font-semibold">SpO2</th>
                              <th className="px-5 py-3 font-semibold">Weight / Height</th>
                              <th className="px-5 py-3 font-semibold">BMI</th>
                              <th className="px-5 py-3 font-semibold">Recorded By</th>
                              <th className="px-5 py-3 text-right font-semibold">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {ehrData.vitalsHistory.map((vital) => (
                              <tr key={vital.id} className="hover:bg-slate-50/80 transition">
                                <td className="px-5 py-3.5 font-medium text-slate-800">
                                  {vital.recordedAt ? new Date(vital.recordedAt).toLocaleString("en-IN") : "—"}
                                </td>
                                <td className="px-5 py-3.5 font-bold text-slate-900">
                                  {vital.systolicBp && vital.diastolicBp ? `${vital.systolicBp}/${vital.diastolicBp}` : "—"}
                                </td>
                                <td className="px-5 py-3.5 text-slate-700">
                                  {vital.heartRateBpm ? `${vital.heartRateBpm} bpm` : "—"}
                                </td>
                                <td className="px-5 py-3.5 text-slate-700">
                                  {vital.respiratoryRateBpm ? `${vital.respiratoryRateBpm} /min` : "—"}
                                </td>
                                <td className="px-5 py-3.5 text-slate-700">
                                  {vital.temperatureCelsius ? `${vital.temperatureCelsius} °C` : "—"}
                                </td>
                                <td className="px-5 py-3.5 text-slate-700">
                                  {vital.oxygenSaturationPercent ? `${vital.oxygenSaturationPercent}%` : "—"}
                                </td>
                                <td className="px-5 py-3.5 text-slate-700">
                                  {vital.weightKg ? `${vital.weightKg} kg` : "—"}
                                  {vital.heightCm ? ` / ${vital.heightCm} cm` : ""}
                                </td>
                                <td className="px-5 py-3.5">
                                  {vital.bmi ? (
                                    <span className="rounded bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">
                                      {vital.bmi} ({vital.bmiCategory || "Normal"})
                                    </span>
                                  ) : "—"}
                                </td>
                                <td className="px-5 py-3.5">
                                  {vital.recordedByDoctorName ? (
                                    <span className="rounded-full bg-cyan-50 px-2.5 py-0.5 text-xs font-semibold text-cyan-700">
                                      Dr. {vital.recordedByDoctorName}
                                    </span>
                                  ) : (
                                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                                      Self-Recorded
                                    </span>
                                  )}
                                </td>
                                <td className="px-5 py-3.5 text-right">
                                  {!vital.recordedByDoctorId ? (
                                    <button
                                      type="button"
                                      disabled={deletingVitalId === vital.id}
                                      onClick={() => handleDeleteVitals(vital.id)}
                                      className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50 transition disabled:opacity-40"
                                      title="Delete self-recorded vital"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  ) : (
                                    <span className="text-xs text-slate-400 italic" title="Clinical record locked by doctor">
                                      Doctor locked
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: CONSULTATION RECORDS */}
              {!ehrLoading && ehrSubTab === "consultations" && (
                <div className="space-y-6">
                  {/* Detailed Clinical Consultations (Module 5) */}
                  {ehrData?.consultationRecords && ehrData.consultationRecords.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-bold text-slate-900">Clinical Consultation Notes</h3>
                      {ehrData.consultationRecords.map((consult) => (
                        <div key={consult.id} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                          <div className="flex flex-col gap-2 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wider text-cyan-700">
                                Consultation #{consult.appointmentId}
                              </p>
                              <h4 className="text-lg font-bold text-slate-900 mt-0.5">
                                {consult.diagnosis || "Clinical Diagnosis"}
                              </h4>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-slate-800">
                                Dr. {consult.doctorName}
                              </p>
                              <p className="text-xs text-slate-500">
                                {consult.consultationDate ? new Date(consult.consultationDate).toLocaleDateString("en-IN") : ""}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 grid gap-4 sm:grid-cols-2">
                            {consult.symptoms && (
                              <div className="rounded-xl bg-slate-50 p-4">
                                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500">Reported Symptoms</h5>
                                <p className="mt-1 text-sm text-slate-700 whitespace-pre-line">{consult.symptoms}</p>
                              </div>
                            )}
                            {consult.clinicalObservations && (
                              <div className="rounded-xl bg-slate-50 p-4">
                                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500">Clinical Observations</h5>
                                <p className="mt-1 text-sm text-slate-700 whitespace-pre-line">{consult.clinicalObservations}</p>
                              </div>
                            )}
                          </div>

                          {consult.treatmentPlan && (
                            <div className="mt-4 rounded-xl border border-cyan-100 bg-cyan-50/50 p-4">
                              <h5 className="text-xs font-bold uppercase tracking-wider text-cyan-800">Treatment Plan</h5>
                              <p className="mt-1 text-sm text-cyan-900 whitespace-pre-line">{consult.treatmentPlan}</p>
                            </div>
                          )}

                          {consult.followUpRecommendations && (
                            <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50/50 p-4">
                              <h5 className="text-xs font-bold uppercase tracking-wider text-amber-800">Follow-up Recommendations</h5>
                              <p className="mt-1 text-sm text-amber-900 whitespace-pre-line">{consult.followUpRecommendations}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Completed Appointments History (Backward compatible) */}
                  {medicalHistory && medicalHistory.length > 0 && (
                    <div className="space-y-4 pt-4 border-t border-slate-200">
                      <h3 className="text-lg font-bold text-slate-900">Completed Appointment Records</h3>
                      {medicalHistory.map((record) => {
                        let medications = [];
                        try {
                          medications = typeof record.medications === "string" ? JSON.parse(record.medications) : record.medications || [];
                          if (!Array.isArray(medications)) medications = [];
                        } catch {
                          medications = [];
                        }
                        return (
                          <div key={record.appointmentId} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
                              <div>
                                <span className="text-xs font-bold text-cyan-700 uppercase">Appointment #{record.appointmentId}</span>
                                <h4 className="text-base font-bold text-slate-900">{record.diagnosis || "General Consultation"}</h4>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-semibold text-slate-800">{record.doctorName || "Doctor"}</p>
                                <p className="text-xs text-slate-400">
                                  {record.appointmentDate ? formatDate(record.appointmentDate) : ""}
                                </p>
                              </div>
                            </div>
                            {record.reason && (
                              <p className="mt-3 text-xs text-slate-500">
                                <span className="font-semibold text-slate-700">Reason:</span> {record.reason}
                              </p>
                            )}
                            {medications.length > 0 && (
                              <div className="mt-3">
                                <p className="text-xs font-bold uppercase text-slate-500 mb-1">Prescribed Medicines:</p>
                                <div className="flex flex-wrap gap-2">
                                  {medications.map((m, idx) => (
                                    <span key={idx} className="rounded-md bg-slate-100 px-2.5 py-1 text-xs text-slate-700 font-medium">
                                      {m.medicineName || m.medicine} ({m.dosage || "1 dose"})
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {(!ehrData?.consultationRecords || ehrData.consultationRecords.length === 0) &&
                   (!medicalHistory || medicalHistory.length === 0) && (
                    <div className="rounded-2xl border border-slate-100 bg-white p-12 text-center shadow-sm">
                      <ClipboardList size={40} className="mx-auto text-slate-300" />
                      <h4 className="mt-3 text-base font-bold text-slate-800">No Consultation Notes Available</h4>
                      <p className="mt-1 text-sm text-slate-500">
                        Doctor consultation notes and diagnoses will appear here following completed clinical visits.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: ALLERGIES & CONDITIONS */}
              {!ehrLoading && ehrSubTab === "allergies" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Allergies & Medical Conditions</h3>
                      <p className="text-xs text-slate-500">Maintain an accurate record of critical drug, food, or environmental allergies and ongoing diagnoses.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setConditionModalOpen(true)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-cyan-700"
                    >
                      <Plus size={15} /> Add Entry
                    </button>
                  </div>

                  {(!ehrData?.allergiesAndConditions || ehrData.allergiesAndConditions.length === 0) ? (
                    <div className="rounded-2xl border border-slate-100 bg-white p-12 text-center shadow-sm">
                      <ShieldAlert size={40} className="mx-auto text-slate-300" />
                      <h4 className="mt-3 text-base font-bold text-slate-800">No Allergies or Conditions Recorded</h4>
                      <p className="mt-1 text-sm text-slate-500">Add any drug allergies, asthma, hypertension or other conditions to inform your clinical team.</p>
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {ehrData.allergiesAndConditions.map((entry) => {
                        const isAllergy = entry.recordType === "ALLERGY";
                        const severityColors = {
                          MILD: "bg-blue-50 text-blue-700 border-blue-200",
                          MODERATE: "bg-amber-50 text-amber-700 border-amber-200",
                          SEVERE: "bg-orange-50 text-orange-700 border-orange-200",
                          LIFE_THREATENING: "bg-rose-50 text-rose-700 border-rose-200",
                        };

                        return (
                          <div key={entry.id} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm relative group">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-2">
                                <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                                  isAllergy ? "bg-rose-100 text-rose-800" : "bg-purple-100 text-purple-800"
                                }`}>
                                  {entry.recordType}
                                </span>
                                <span className={`rounded-md border px-2 py-0.5 text-[11px] font-bold ${severityColors[entry.severity] || "bg-slate-100 text-slate-700"}`}>
                                  {entry.severity}
                                </span>
                                <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${
                                  entry.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                                }`}>
                                  {entry.status}
                                </span>
                              </div>

                              <button
                                type="button"
                                disabled={deletingConditionId === entry.id}
                                onClick={() => handleDeleteCondition(entry.id)}
                                className="rounded-lg p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                                title="Remove entry"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>

                            <h4 className="mt-3 text-base font-bold text-slate-900">{entry.name}</h4>

                            {entry.diagnosedDate && (
                              <p className="mt-1 text-xs text-slate-400">
                                Diagnosed: {new Date(entry.diagnosedDate).toLocaleDateString("en-IN")}
                              </p>
                            )}

                            {entry.notes && (
                              <p className="mt-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl">
                                {entry.notes}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: MEDICAL DOCUMENTS */}
              {!ehrLoading && ehrSubTab === "documents" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Diagnostic Reports & Documents</h3>
                      <p className="text-xs text-slate-500">Securely stored lab reports, radiology imaging, discharge summaries and scans (PDF, PNG, JPG, WEBP up to 10MB).</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDocumentModalOpen(true)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-cyan-700"
                    >
                      <Upload size={15} /> Upload Document
                    </button>
                  </div>

                  {(!ehrData?.documents || ehrData.documents.length === 0) ? (
                    <div className="rounded-2xl border border-slate-100 bg-white p-12 text-center shadow-sm">
                      <FileText size={40} className="mx-auto text-slate-300" />
                      <h4 className="mt-3 text-base font-bold text-slate-800">No Medical Documents Uploaded</h4>
                      <p className="mt-1 text-sm text-slate-500">Upload diagnostic reports, lab results or imaging files to centralize your EHR records.</p>
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {ehrData.documents.map((doc) => {
                        const categoryLabels = {
                          LAB_REPORT: "Lab Report",
                          RADIOLOGY: "Radiology / Imaging",
                          DISCHARGE_SUMMARY: "Discharge Summary",
                          PRESCRIPTION_SCAN: "Prescription Scan",
                          OTHER: "Document",
                        };

                        const formatBytes = (bytes) => {
                          if (!bytes) return "0 B";
                          if (bytes < 1024) return bytes + " B";
                          if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
                          return (bytes / (1024 * 1024)).toFixed(1) + " MB";
                        };

                        return (
                          <div key={doc.id} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm flex flex-col justify-between">
                            <div>
                              <div className="flex items-start justify-between">
                                <span className="rounded-full bg-cyan-50 px-2.5 py-0.5 text-xs font-bold text-cyan-700">
                                  {categoryLabels[doc.documentCategory] || doc.documentCategory}
                                </span>
                                <span className="text-[11px] text-slate-400">
                                  {formatBytes(doc.fileSizeBytes)}
                                </span>
                              </div>

                              <h4 className="mt-3 text-base font-bold text-slate-900 line-clamp-1">{doc.title}</h4>
                              <p className="mt-0.5 text-xs text-slate-400 truncate">{doc.originalFileName}</p>

                              {doc.description && (
                                <p className="mt-2 text-xs text-slate-600 line-clamp-2 bg-slate-50 p-2 rounded-lg">
                                  {doc.description}
                                </p>
                              )}
                            </div>

                            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                              <span className="text-[11px] text-slate-400">
                                {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString("en-IN") : ""}
                              </span>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleDownloadDocument(doc)}
                                  className="inline-flex items-center gap-1 rounded-lg bg-cyan-50 px-2.5 py-1 text-xs font-bold text-cyan-700 hover:bg-cyan-100 transition"
                                >
                                  <Download size={13} /> Download
                                </button>
                                <button
                                  type="button"
                                  disabled={deletingDocId === doc.id}
                                  onClick={() => handleDeleteDocument(doc.id)}
                                  className="rounded-lg p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                                  title="Delete document"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ===================================== */}
          {/* MODALS: LOG VITALS */}
          {/* ===================================== */}
          <AccessibleModal
            isOpen={vitalsModalOpen}
            onClose={() => setVitalsModalOpen(false)}
            title="Log Vital Signs"
            description="Record self-measured or home diagnostic vitals."
            maxWidth="max-w-lg"
            showCloseButton={!savingVitals}
          >
            <form onSubmit={handleSaveVitals} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              {/* BP */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="patient-vital-systolic" className="text-xs font-semibold text-slate-700">Systolic BP (mmHg)</label>
                  <input
                    id="patient-vital-systolic"
                    type="number"
                    min="50"
                    max="260"
                    placeholder="e.g. 120"
                    value={vitalsForm.systolicBp}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, systolicBp: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label htmlFor="patient-vital-diastolic" className="text-xs font-semibold text-slate-700">Diastolic BP (mmHg)</label>
                  <input
                    id="patient-vital-diastolic"
                    type="number"
                    min="30"
                    max="180"
                    placeholder="e.g. 80"
                    value={vitalsForm.diastolicBp}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, diastolicBp: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Heart Rate & Respiratory Rate */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="patient-vital-hr" className="text-xs font-semibold text-slate-700">Heart Rate (bpm)</label>
                  <input
                    id="patient-vital-hr"
                    type="number"
                    min="30"
                    max="250"
                    placeholder="e.g. 72"
                    value={vitalsForm.heartRateBpm}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, heartRateBpm: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label htmlFor="patient-vital-resp" className="text-xs font-semibold text-slate-700">Resp. Rate (/min)</label>
                  <input
                    id="patient-vital-resp"
                    type="number"
                    min="6"
                    max="60"
                    placeholder="e.g. 16"
                    value={vitalsForm.respiratoryRateBpm}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, respiratoryRateBpm: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Temperature & SpO2 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="patient-vital-temp" className="text-xs font-semibold text-slate-700">Body Temp (°C)</label>
                  <input
                    id="patient-vital-temp"
                    type="number"
                    step="0.1"
                    min="30"
                    max="45"
                    placeholder="e.g. 36.8"
                    value={vitalsForm.temperatureCelsius}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, temperatureCelsius: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label htmlFor="patient-vital-spo2" className="text-xs font-semibold text-slate-700">Oxygen (SpO2 %)</label>
                  <input
                    id="patient-vital-spo2"
                    type="number"
                    step="0.1"
                    min="50"
                    max="100"
                    placeholder="e.g. 98"
                    value={vitalsForm.oxygenSaturationPercent}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, oxygenSaturationPercent: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Weight & Height */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="patient-vital-weight" className="text-xs font-semibold text-slate-700">Weight (kg)</label>
                  <input
                    id="patient-vital-weight"
                    type="number"
                    step="0.1"
                    min="2"
                    max="350"
                    placeholder="e.g. 70"
                    value={vitalsForm.weightKg}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, weightKg: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label htmlFor="patient-vital-height" className="text-xs font-semibold text-slate-700">Height (cm)</label>
                  <input
                    id="patient-vital-height"
                    type="number"
                    step="0.1"
                    min="40"
                    max="260"
                    placeholder="e.g. 175"
                    value={vitalsForm.heightCm}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, heightCm: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Computed BMI indicator preview */}
              {computedBmi && (
                <div className="flex items-center justify-between rounded-xl border p-3 bg-slate-50">
                  <span className="text-xs font-medium text-slate-600">Calculated BMI Preview:</span>
                  <span className={`rounded-md border px-2.5 py-0.5 text-xs font-bold ${computedBmi.badgeColor}`}>
                    BMI: {computedBmi.val} ({computedBmi.category})
                  </span>
                </div>
              )}

              {/* Notes */}
              <div>
                <label htmlFor="patient-vital-notes" className="text-xs font-semibold text-slate-700">Notes (Optional)</label>
                <textarea
                  id="patient-vital-notes"
                  rows={2}
                  placeholder="e.g. Taken before breakfast"
                  value={vitalsForm.notes}
                  onChange={(e) => setVitalsForm({ ...vitalsForm, notes: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setVitalsModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-cyan-600 focus-visible:outline-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingVitals}
                  className="rounded-xl bg-cyan-600 px-5 py-2 text-sm font-bold text-white shadow-sm hover:bg-cyan-700 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-cyan-600 focus-visible:outline-none"
                >
                  {savingVitals ? "Saving..." : "Save Vitals"}
                </button>
              </div>
            </form>
          </AccessibleModal>

          {/* ===================================== */}
          {/* MODALS: ADD ALLERGY / CONDITION */}
          {/* ===================================== */}
          <AccessibleModal
            isOpen={conditionModalOpen}
            onClose={() => setConditionModalOpen(false)}
            title="Add Allergy / Medical Condition"
            description="Record a known allergy or health condition."
            maxWidth="max-w-md"
            showCloseButton={!savingCondition}
          >
            <form onSubmit={handleSaveCondition} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              <div>
                <span className="text-xs font-semibold text-slate-700 block mb-1">Record Type</span>
                <div className="grid grid-cols-2 gap-2" role="group" aria-label="Record Type">
                  <button
                    type="button"
                    onClick={() => setConditionForm({ ...conditionForm, recordType: "ALLERGY" })}
                    aria-pressed={conditionForm.recordType === "ALLERGY"}
                    className={`rounded-xl py-2 text-xs font-bold border transition focus-visible:ring-2 focus-visible:ring-cyan-600 focus-visible:outline-none ${
                      conditionForm.recordType === "ALLERGY"
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : "bg-slate-50 text-slate-600 border-slate-200"
                    }`}
                  >
                    Allergy
                  </button>
                  <button
                    type="button"
                    onClick={() => setConditionForm({ ...conditionForm, recordType: "CONDITION" })}
                    aria-pressed={conditionForm.recordType === "CONDITION"}
                    className={`rounded-xl py-2 text-xs font-bold border transition focus-visible:ring-2 focus-visible:ring-cyan-600 focus-visible:outline-none ${
                      conditionForm.recordType === "CONDITION"
                        ? "bg-purple-50 text-purple-700 border-purple-200"
                        : "bg-slate-50 text-slate-600 border-slate-200"
                    }`}
                  >
                    Medical Condition
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="cond-name" className="text-xs font-semibold text-slate-700">Name / Description <span className="text-red-500">*</span></label>
                <input
                  id="cond-name"
                  type="text"
                  required
                  placeholder={conditionForm.recordType === "ALLERGY" ? "e.g. Penicillin, Peanuts" : "e.g. Type 2 Diabetes, Asthma"}
                  value={conditionForm.name}
                  onChange={(e) => setConditionForm({ ...conditionForm, name: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="cond-severity" className="text-xs font-semibold text-slate-700">Severity</label>
                  <select
                    id="cond-severity"
                    value={conditionForm.severity}
                    onChange={(e) => setConditionForm({ ...conditionForm, severity: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-500"
                  >
                    <option value="MILD">Mild</option>
                    <option value="MODERATE">Moderate</option>
                    <option value="SEVERE">Severe</option>
                    <option value="LIFE_THREATENING">Life Threatening</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="cond-status" className="text-xs font-semibold text-slate-700">Status</label>
                  <select
                    id="cond-status"
                    value={conditionForm.status}
                    onChange={(e) => setConditionForm({ ...conditionForm, status: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-500"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="RESOLVED">Resolved</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="cond-date" className="text-xs font-semibold text-slate-700">Diagnosed Date (Optional)</label>
                <input
                  id="cond-date"
                  type="date"
                  value={conditionForm.diagnosedDate}
                  onChange={(e) => setConditionForm({ ...conditionForm, diagnosedDate: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label htmlFor="cond-notes" className="text-xs font-semibold text-slate-700">Notes (Optional)</label>
                <textarea
                  id="cond-notes"
                  rows={2}
                  placeholder="e.g. Triggers hives and mild breathing difficulty"
                  value={conditionForm.notes}
                  onChange={(e) => setConditionForm({ ...conditionForm, notes: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setConditionModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-cyan-600 focus-visible:outline-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCondition}
                  className="rounded-xl bg-cyan-600 px-5 py-2 text-sm font-bold text-white shadow-sm hover:bg-cyan-700 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-cyan-600 focus-visible:outline-none"
                >
                  {savingCondition ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </AccessibleModal>

          {/* ===================================== */}
          {/* MODALS: UPLOAD MEDICAL DOCUMENT */}
          {/* ===================================== */}
          <AccessibleModal
            isOpen={documentModalOpen}
            onClose={() => setDocumentModalOpen(false)}
            title="Upload Diagnostic Document"
            description="PDF, PNG, JPG or WEBP (Max 10MB)."
            maxWidth="max-w-md"
            showCloseButton={!uploadingDocument}
          >
            <form onSubmit={handleUploadDocument} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              <div>
                <label htmlFor="doc-title" className="text-xs font-semibold text-slate-700">Document Title <span className="text-red-500">*</span></label>
                <input
                  id="doc-title"
                  type="text"
                  required
                  placeholder="e.g. Complete Blood Count (CBC) Report"
                  value={documentForm.title}
                  onChange={(e) => setDocumentForm({ ...documentForm, title: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label htmlFor="doc-category" className="text-xs font-semibold text-slate-700">Document Category</label>
                <select
                  id="doc-category"
                  value={documentForm.category}
                  onChange={(e) => setDocumentForm({ ...documentForm, category: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-500"
                >
                  <option value="LAB_REPORT">Lab Report</option>
                  <option value="RADIOLOGY">Radiology / X-Ray / MRI / CT</option>
                  <option value="DISCHARGE_SUMMARY">Discharge Summary</option>
                  <option value="PRESCRIPTION_SCAN">Prescription Scan</option>
                  <option value="OTHER">Other Clinical Document</option>
                </select>
              </div>

              <div>
                <label htmlFor="doc-file" className="text-xs font-semibold text-slate-700">Select File <span className="text-red-500">*</span> (Max 10MB)</label>
                <input
                  id="doc-file"
                  type="file"
                  required
                  accept=".pdf,.png,.jpg,.jpeg,.webp"
                  onChange={(e) => setDocumentForm({ ...documentForm, file: e.target.files?.[0] || null })}
                  className="mt-1 w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100"
                />
              </div>

              <div>
                <label htmlFor="doc-description" className="text-xs font-semibold text-slate-700">Description / Clinical Notes</label>
                <textarea
                  id="doc-description"
                  rows={2}
                  placeholder="e.g. Fasting blood work conducted at Apex Labs"
                  value={documentForm.description}
                  onChange={(e) => setDocumentForm({ ...documentForm, description: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDocumentModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-cyan-600 focus-visible:outline-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadingDocument}
                  className="rounded-xl bg-cyan-600 px-5 py-2 text-sm font-bold text-white shadow-sm hover:bg-cyan-700 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-cyan-600 focus-visible:outline-none"
                >
                  {uploadingDocument ? "Uploading..." : "Upload Document"}
                </button>
              </div>
            </form>
          </AccessibleModal>


          {/* ===================================== */}
          {/* MY PROFILE */}
          {/* ===================================== */}
          {activeMenu === "My Profile" && (
            <div className="space-y-6">

              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    My Profile
                  </h1>
                  <p className="text-gray-500 mt-1">
                    Manage your personal information and health details.
                  </p>
                </div>

                {!isEditingProfile && profile && (
                  <button
                    onClick={() => setIsEditingProfile(true)}
                    className="px-5 py-2.5 bg-cyan-600 text-white rounded-xl hover:bg-cyan-700 transition font-medium"
                  >
                    Edit Profile
                  </button>
                )}
              </div>

              {/* Loading */}
              {profileLoading && (
                <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
                  <div className="animate-spin h-10 w-10 border-4 border-cyan-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading your profile...</p>
                </div>
              )}

              {/* Error */}
              {!profileLoading && profileError && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
                  <div className="flex items-center gap-3 text-red-600">
                    <AlertCircle size={22} />
                    <p>{profileError}</p>
                  </div>
                </div>
              )}

              {/* Profile Content */}
              {!profileLoading && !profileError && profile && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

                  {/* Profile Header */}
                  <div className="bg-gradient-to-r from-cyan-600 to-cyan-700 p-6 sm:p-8">
                    <div className="flex items-center gap-5">
                      <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-white text-3xl font-bold">
                        {profile.fullName?.charAt(0)?.toUpperCase() || "P"}
                      </div>

                      <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-white">
                          {profile.fullName}
                        </h2>
                        <p className="text-cyan-100 mt-1">
                          {profile.email}
                        </p>
                        <span className="inline-block mt-2 px-3 py-1 bg-white/20 text-white text-xs rounded-full">
                          Patient
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Edit Form */}
                  {isEditingProfile ? (
                    <form onSubmit={handleUpdateProfile} className="p-6 sm:p-8">

                      <h3 className="text-lg font-semibold text-gray-900 mb-6">
                        Edit Personal Information
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Full Name */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Full Name *
                          </label>
                          <input
                            type="text"
                            required
                            maxLength={100}
                            value={profileForm.fullName}
                            onChange={(e) =>
                              setProfileForm({
                                ...profileForm,
                                fullName: e.target.value,
                              })
                            }
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
                            placeholder="Enter your full name"
                          />
                        </div>

                        {/* Email */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email Address
                          </label>
                          <input
                            type="email"
                            value={profile.email}
                            readOnly
                            className="w-full px-4 py-3 border border-gray-200 bg-gray-100 text-gray-500 rounded-xl cursor-not-allowed"
                          />
                          <p className="text-xs text-gray-400 mt-1">
                            Email cannot be changed here.
                          </p>
                        </div>

                        {/* Date of Birth */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Date of Birth
                          </label>
                          <input
                            type="date"
                            max={new Date().toISOString().split("T")[0]}
                            value={profileForm.dateOfBirth}
                            onChange={(e) =>
                              setProfileForm({
                                ...profileForm,
                                dateOfBirth: e.target.value,
                              })
                            }
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none"
                          />
                        </div>

                        {/* Gender */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Gender
                          </label>
                          <select
                            value={profileForm.gender}
                            onChange={(e) =>
                              setProfileForm({
                                ...profileForm,
                                gender: e.target.value,
                              })
                            }
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none bg-white"
                          >
                            <option value="">Select Gender</option>
                            <option value="MALE">Male</option>
                            <option value="FEMALE">Female</option>
                            <option value="OTHER">Other</option>
                            <option value="PREFER_NOT_TO_SAY">
                              Prefer not to say
                            </option>
                          </select>
                        </div>

                        {/* Phone */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Phone Number
                          </label>
                          <input
                            type="tel"
                            maxLength={15}
                            value={profileForm.phone}
                            onChange={(e) =>
                              setProfileForm({
                                ...profileForm,
                                phone: e.target.value,
                              })
                            }
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none"
                            placeholder="Enter phone number"
                          />
                        </div>

                        {/* Blood Group */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Blood Group
                          </label>
                          <select
                            value={profileForm.bloodGroup}
                            onChange={(e) =>
                              setProfileForm({
                                ...profileForm,
                                bloodGroup: e.target.value,
                              })
                            }
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none bg-white"
                          >
                            <option value="">Select Blood Group</option>
                            <option value="A+">A+</option>
                            <option value="A-">A-</option>
                            <option value="B+">B+</option>
                            <option value="B-">B-</option>
                            <option value="AB+">AB+</option>
                            <option value="AB-">AB-</option>
                            <option value="O+">O+</option>
                            <option value="O-">O-</option>
                          </select>
                        </div>

                        {/* Address */}
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Address
                          </label>
                          <textarea
                            rows={3}
                            value={profileForm.address}
                            onChange={(e) =>
                              setProfileForm({
                                ...profileForm,
                                address: e.target.value,
                              })
                            }
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none resize-none"
                            placeholder="Enter your address"
                          />
                        </div>

                      </div>

                      {/* Form Actions */}
                      <div className="flex flex-col sm:flex-row justify-end gap-3 mt-8">

                        <button
                          type="button"
                          onClick={() => {
                            setProfileForm({
                              fullName: profile.fullName || "",
                              dateOfBirth: profile.dateOfBirth || "",
                              gender: profile.gender || "",
                              phone: profile.phone || "",
                              address: profile.address || "",
                              bloodGroup: profile.bloodGroup || "",
                            });
                            setIsEditingProfile(false);
                          }}
                          disabled={profileSaving}
                          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition disabled:opacity-50"
                        >
                          Cancel
                        </button>

                        <button
                          type="submit"
                          disabled={profileSaving}
                          className="px-6 py-3 bg-cyan-600 text-white rounded-xl hover:bg-cyan-700 transition font-medium disabled:opacity-50"
                        >
                          {profileSaving ? "Saving..." : "Save Changes"}
                        </button>

                      </div>
                    </form>
                  ) : (

                    /* View Profile */
                    <div className="p-6 sm:p-8">

                      <h3 className="text-lg font-semibold text-gray-900 mb-6">
                        Personal Information
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {[
                          {
                            label: "Full Name",
                            value: profile.fullName,
                          },
                          {
                            label: "Email Address",
                            value: profile.email,
                          },
                          {
                            label: "Date of Birth",
                            value: profile.dateOfBirth
                              ? formatDate(profile.dateOfBirth)
                              : "Not provided",
                          },
                          {
                            label: "Gender",
                            value: profile.gender
                              ? profile.gender.replaceAll("_", " ")
                              : "Not provided",
                          },
                          {
                            label: "Phone Number",
                            value: profile.phone || "Not provided",
                          },
                          {
                            label: "Blood Group",
                            value: profile.bloodGroup || "Not provided",
                          },
                          {
                            label: "Address",
                            value: profile.address || "Not provided",
                            fullWidth: true,
                          },
                        ].map((item) => (
                          <div
                            key={item.label}
                            className={item.fullWidth ? "md:col-span-2" : ""}
                          >
                            <p className="text-sm text-gray-500 mb-1">
                              {item.label}
                            </p>
                            <p className="font-medium text-gray-900 break-words">
                              {item.value}
                            </p>
                          </div>
                        ))}

                      </div>

                    </div>
                  )}

                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* ================================================= */}
      {/* PRESCRIPTION RECEIPT / SLIP MODAL (PATIENT) */}
      {/* ================================================= */}
      <AccessibleModal
        isOpen={Boolean(selectedPrescription)}
        onClose={closePrescriptionReceipt}
        title="Prescription Receipt"
        description={selectedPrescription ? `Official Medical Slip · Appointment #${selectedPrescription.appointmentId}` : ""}
        maxWidth="max-w-3xl"
      >
        {selectedPrescription && (
          <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-1 print-receipt-modal">
            {/* ACTION BAR (hidden in print) */}
            <div className="no-print flex justify-end">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-cyan-700 focus-visible:ring-2 focus-visible:ring-cyan-600 focus-visible:outline-none"
                aria-label="Print receipt"
              >
                <Printer size={15} aria-hidden="true" />
                <span>Print Receipt</span>
              </button>
            </div>

            {/* PRINTABLE RECEIPT CONTENT */}
            <div className="space-y-6">
              {/* CLINIC / HOSPITAL HEADER */}
              <div className="flex flex-col border-b-2 border-cyan-700 pb-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-600 to-cyan-400 text-white shadow-md">
                    <HeartPulse size={26} />
                  </div>
                  <div>
                    <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
                      MediCare Plus Health
                    </h1>
                    <p className="text-xs font-medium text-slate-500">
                      The Healthcare Administration Console · Official Prescription Receipt
                    </p>
                  </div>
                </div>

                <div className="mt-3 text-left sm:mt-0 sm:text-right">
                  <span className="inline-block rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-700">
                    Prescription #{selectedPrescription.prescriptionId}
                  </span>
                  {selectedPrescription.verificationCode && (
                    <div className="mt-2 flex flex-col items-start gap-1 sm:items-end">
                      <span className="font-mono text-xs font-extrabold text-cyan-800 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded">
                        {selectedPrescription.verificationCode}
                      </span>
                      <div className="no-print mt-0.5 flex items-center gap-2 text-[11px]">
                        <button
                          type="button"
                          onClick={() => {
                            const url = `${window.location.origin}/verify-prescription?code=${encodeURIComponent(
                              selectedPrescription.verificationCode
                            )}`;
                            navigator.clipboard.writeText(url);
                            toast.success("Verification link copied!");
                          }}
                          className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-cyan-700"
                        >
                          <Copy size={12} />
                          Copy Link
                        </button>
                        <span>·</span>
                        <a
                          href={`/verify-prescription?code=${encodeURIComponent(
                            selectedPrescription.verificationCode
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 font-semibold text-cyan-600 hover:text-cyan-800 underline"
                        >
                          <ShieldCheck size={12} />
                          Verify Online
                        </a>
                      </div>
                    </div>
                  )}
                  <p className="mt-1 text-xs text-slate-500">
                    Date:{" "}
                    {formatDate(
                      selectedPrescription.prescribedAt?.slice(0, 10)
                    )}
                  </p>
                </div>
              </div>

              {/* TWO-COLUMN DETAILS: PATIENT & DOCTOR */}
              <div className="grid gap-4 rounded-2xl border border-slate-100 bg-slate-50/80 p-5 sm:grid-cols-2">
                {/* PATIENT INFO */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Patient Details
                  </p>
                  <p className="mt-1 text-base font-bold text-slate-900">
                    {profile?.fullName || user?.name || "Patient"}
                  </p>
                  <div className="mt-1 space-y-0.5 text-xs text-slate-600">
                    {profile?.gender && (
                      <p>
                        Gender / Age: {profile.gender.replaceAll("_", " ")}{" "}
                        {profile.dateOfBirth
                          ? `· ${formatDate(profile.dateOfBirth)}`
                          : ""}
                      </p>
                    )}
                    {profile?.phone && <p>Phone: {profile.phone}</p>}
                    {profile?.bloodGroup && (
                      <p>
                        Blood Group:{" "}
                        <span className="font-semibold text-rose-600">
                          {profile.bloodGroup}
                        </span>
                      </p>
                    )}
                    <p>Account Email: {user?.email}</p>
                  </div>
                </div>

                {/* DOCTOR & APPOINTMENT INFO */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Attending Physician
                  </p>
                  <p className="mt-1 text-base font-bold text-slate-900">
                    {getDoctorDetails(
                      selectedPrescriptionAppointment?.doctorId
                    )?.fullName || "Assigned Doctor"}
                  </p>
                  <div className="mt-1 space-y-0.5 text-xs text-slate-600">
                    <p className="font-medium text-cyan-700">
                      {getDoctorDetails(
                        selectedPrescriptionAppointment?.doctorId
                      )?.specializationName || "Specialist"}
                    </p>
                    <p>
                      Appointment ID: #{selectedPrescription.appointmentId}
                    </p>
                    {selectedPrescriptionAppointment?.appointmentDate && (
                      <p>
                        Consultation:{" "}
                        {formatDate(
                          selectedPrescriptionAppointment.appointmentDate
                        )}{" "}
                        at{" "}
                        {formatTime(
                          selectedPrescriptionAppointment.appointmentTime
                        )}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* MEDICAL DIAGNOSIS */}
              <div>
                <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600">
                  <Stethoscope size={15} className="text-cyan-600" />
                  Clinical Diagnosis
                </h4>
                <div className="mt-2 rounded-xl border border-cyan-100 bg-cyan-50/60 p-4 text-sm font-semibold text-cyan-950">
                  {selectedPrescription.diagnosis ||
                    "No specific diagnosis recorded."}
                </div>
              </div>

              {/* PRESCRIBED MEDICATIONS */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600">
                    <Pill size={15} className="text-emerald-600" />
                    Rx · Prescribed Medicines
                  </h4>
                  <span className="text-xs text-slate-400">
                    Take as directed
                  </span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full min-w-[550px] text-left text-sm">
                    <thead className="bg-slate-100/70 text-xs font-semibold uppercase text-slate-600">
                      <tr>
                        <th className="px-4 py-3">#</th>
                        <th className="px-4 py-3">Medicine</th>
                        <th className="px-4 py-3">Dosage</th>
                        <th className="px-4 py-3">Frequency</th>
                        <th className="px-4 py-3">Duration</th>
                        <th className="px-4 py-3">Special Instructions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parseMedications(
                        selectedPrescription.medications
                      ).map((med, index) => (
                        <tr key={index} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3 text-xs font-medium text-slate-400">
                            {index + 1}
                          </td>
                          <td className="px-4 py-3 font-bold text-slate-800">
                            {med.medicineName || med.medicine || "—"}
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-600">
                            {med.dosage || "—"}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                              {med.frequency || "—"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {med.duration || "—"}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500">
                            {med.instructions || "—"}
                          </td>
                        </tr>
                      ))}
                      {parseMedications(selectedPrescription.medications)
                        .length === 0 && (
                        <tr>
                          <td
                            colSpan={6}
                            className="p-4 text-center text-sm text-slate-400"
                          >
                            No specific medications listed.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* DOCTOR'S INSTRUCTIONS */}
              {selectedPrescription.instructions && (
                <div>
                  <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600">
                    <FileText size={15} className="text-amber-600" />
                    Doctor's Advice & Patient Instructions
                  </h4>
                  <div className="mt-2 whitespace-pre-wrap rounded-xl border border-amber-100 bg-amber-50/60 p-4 text-sm leading-relaxed text-amber-950">
                    {selectedPrescription.instructions}
                  </div>
                </div>
              )}

              {/* OFFICIAL RECEIPT SIGN-OFF & DISCLAIMER */}
              <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
                <p>
                  Computer-generated prescription slip issued through MediCare Plus.
                </p>
                <p className="text-right font-semibold text-slate-600">
                  Attending Doctor:{" "}
                  {getDoctorDetails(
                    selectedPrescriptionAppointment?.doctorId
                  )?.fullName || "MediCare Plus Medical Officer"}
                </p>
              </div>
            </div>

            {/* MODAL FOOTER (hidden in print) */}
            <div className="no-print mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={closePrescriptionReceipt}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600"
              >
                <Printer size={16} aria-hidden="true" />
                <span>Print Receipt</span>
              </button>
            </div>
          </div>
        )}
      </AccessibleModal>

      {/* ================================================= */}
      {/* APPOINTMENT RESCHEDULING MODAL (PATIENT) */}
      {/* ================================================= */}
      <AccessibleModal
        isOpen={Boolean(rescheduleModalOpen && rescheduleTarget)}
        onClose={() => setRescheduleModalOpen(false)}
        title="Reschedule Appointment"
        description={
          rescheduleTarget
            ? `Appointment #${rescheduleTarget.appointmentId} with ${
                getDoctorDetails(rescheduleTarget.doctorId)?.fullName || "Doctor"
              }`
            : ""
        }
        maxWidth="max-w-xl"
      >
        {rescheduleModalOpen && rescheduleTarget && (
          <form onSubmit={handleRescheduleSubmit} className="space-y-5">
            {/* CURRENT SLOT INFO */}
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-xs">
              <span className="font-semibold text-slate-500 uppercase tracking-wide text-[10px]">
                Current Scheduled Slot
              </span>
              <p className="mt-1 font-bold text-slate-800 text-sm">
                {formatDate(rescheduleTarget.appointmentDate)} at{" "}
                {formatTime(rescheduleTarget.appointmentTime)}
              </p>
              {rescheduleTarget.queueNumber && (
                <p className="text-cyan-700 font-semibold mt-0.5">
                  Assigned Queue #{rescheduleTarget.queueNumber}
                </p>
              )}
            </div>

            {/* NEW DATE PICKER */}
            <div>
              <label
                htmlFor="reschedule-date"
                className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700"
              >
                Choose New Consultation Date <span className="text-rose-500">*</span>
              </label>
              <input
                id="reschedule-date"
                type="date"
                value={rescheduleDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => {
                  const newD = e.target.value;
                  setRescheduleDate(newD);
                  fetchRescheduleSlots(rescheduleTarget.doctorId, newD);
                }}
                required
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              />
            </div>

            {/* AVAILABLE SLOTS */}
            <div>
              <label
                id="reschedule-slots-label"
                className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700"
              >
                Select Available Time Slot <span className="text-rose-500">*</span>
              </label>
              {rescheduleSlotsLoading ? (
                <div
                  role="status"
                  aria-live="polite"
                  className="rounded-xl border border-slate-100 bg-slate-50 p-6 text-center text-xs text-slate-500"
                >
                  <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-cyan-600 border-t-transparent mb-1" aria-hidden="true"></div>
                  <p>Loading available doctor slots...</p>
                </div>
              ) : rescheduleSlots.length === 0 ? (
                <div
                  role="status"
                  aria-live="polite"
                  className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-500"
                >
                  No consultation slots available on this date. Please pick another date.
                </div>
              ) : (
                <div
                  role="group"
                  aria-labelledby="reschedule-slots-label"
                  className="max-h-48 overflow-y-auto grid grid-cols-3 sm:grid-cols-4 gap-2 pr-1"
                >
                  {rescheduleSlots.map((slot) => {
                    const isSelected = rescheduleTime === slot.slotTime;
                    const isAvail = slot.available;
                    return (
                      <button
                        key={slot.slotTime}
                        type="button"
                        disabled={!isAvail}
                        onClick={() => setRescheduleTime(slot.slotTime)}
                        aria-pressed={isSelected}
                        aria-label={`Slot at ${slot.slotTime.slice(0, 5)}, ${
                          isSelected ? "selected" : isAvail ? "available" : "unavailable"
                        }`}
                        className={`rounded-lg px-2.5 py-2 text-xs font-semibold border transition ${
                          isSelected
                            ? "border-cyan-600 bg-cyan-600 text-white shadow-sm"
                            : isAvail
                            ? "border-slate-200 bg-white text-slate-800 hover:bg-cyan-50 hover:border-cyan-400"
                            : "border-slate-100 bg-slate-100 text-slate-400 cursor-not-allowed"
                        }`}
                      >
                        <div>{slot.slotTime.slice(0, 5)}</div>
                        <div className={`text-[9px] ${isSelected ? "text-cyan-100" : ""}`}>
                          {isSelected ? "Selected" : isAvail ? "Free" : "Busy"}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* REASON */}
            <div>
              <label
                htmlFor="reschedule-reason"
                className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700"
              >
                Reason for Rescheduling
              </label>
              <textarea
                id="reschedule-reason"
                value={rescheduleReason}
                onChange={(e) => setRescheduleReason(e.target.value)}
                rows={2}
                placeholder="Explain why you need to reschedule (e.g. personal conflict, work schedule)..."
                className="w-full resize-none rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              />
            </div>

            {/* ACTIONS */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRescheduleModalOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={rescheduleSubmitting || !rescheduleTime}
                className="rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600"
              >
                {rescheduleSubmitting ? "Submitting..." : "Submit Reschedule Request"}
              </button>
            </div>
          </form>
        )}
      </AccessibleModal>
    </div>

  );
}

export default PatientDashboard;