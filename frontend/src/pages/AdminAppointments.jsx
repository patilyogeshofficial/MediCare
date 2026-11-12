
import { useEffect, useMemo, useState } from "react";
import {
  Search,
  RefreshCw,
  Eye,
  CalendarDays,
  Clock,
  UserRound,
  Stethoscope,
  X,
  Trash2,
  CheckCircle,
  AlertCircle,
  FileText,
  Lock,
  History,
  RotateCcw,
  Timer,
} from "lucide-react";
import StatusBadge from "../components/ui/StatusBadge";
import AccessibleModal from "../components/ui/AccessibleModal";
import toast from "react-hot-toast";
import api from "../services/api";

const STATUS_OPTIONS = [
  "PENDING",
  "CONFIRMED",
  "REJECTED",
  "CANCELLED",
  "COMPLETED",
];

const statusStyle = {
  PENDING: "bg-orange-50 text-orange-700",
  CONFIRMED: "bg-green-50 text-green-700",
  REJECTED: "bg-red-50 text-red-700",
  CANCELLED: "bg-slate-100 text-slate-600",
  COMPLETED: "bg-cyan-50 text-cyan-700",
};

const formatStatus = (status) => {
  if (!status) return "Unknown";

  const normalized = String(status).toUpperCase();

  return (
    normalized.charAt(0) +
    normalized.slice(1).toLowerCase()
  );
};

const formatDate = (date) => {
  if (!date) return "Not available";

  const parsed = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) return date;

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (time) => {
  if (!time) return "Not available";

  const [hours, minutes] = String(time).split(":");
  const parsed = new Date();

  parsed.setHours(Number(hours), Number(minutes), 0, 0);

  return parsed.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

function AdminAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [selectedAppointment, setSelectedAppointment] =
    useState(null);

  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Audit Trail State
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [auditTarget, setAuditTarget] = useState(null);

  const openAuditModal = async (appointment) => {
    setAuditTarget(appointment);
    setAuditModalOpen(true);
    setAuditLoading(true);
    try {
      const res = await api.get(`/admin/audit-logs/APPOINTMENT/${appointment.appointmentId}`);
      setAuditLogs(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to load appointment audit logs:", err);
      toast.error("Unable to load audit trail.");
      setAuditLogs([]);
    } finally {
      setAuditLoading(false);
    }
  };

  // Fetch appointments and related details.
  const fetchAppointments = async (showLoader = true) => {
    if (showLoader) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const [
        appointmentsResponse,
        patientsResponse,
        usersResponse,
        doctorsResponse,
        prescriptionsResponse,
      ] = await Promise.all([
        api.get("/appointments"),
        api.get("/patients"),
        api.get("/users"),
        api.get("/doctors", { params: { includeInactive: true } }),
        api.get("/prescriptions"),
      ]);

      const appointmentData = appointmentsResponse.data || [];
      const patients = patientsResponse.data || [];
      const users = usersResponse.data || [];
      const doctors = doctorsResponse.data || [];
      const prescriptions = prescriptionsResponse.data || [];

      // Find appointments that already have prescriptions.
      const prescriptionAppointmentIds = new Set(
        prescriptions.map((prescription) =>
          Number(prescription.appointmentId)
        )
      );

      const patientUserMap = new Map(
        patients.map((patient) => [
          Number(patient.patientId),
          Number(patient.userId),
        ])
      );

      const userMap = new Map(
        users.map((user) => [
          Number(user.userId),
          user.fullName,
        ])
      );

      const doctorMap = new Map(
        doctors.map((doctor) => [
          Number(doctor.doctorId),
          doctor.fullName,
        ])
      );

      const formatted = appointmentData.map((appointment) => ({
        ...appointment,

        patientName:
          userMap.get(
            patientUserMap.get(Number(appointment.patientId))
          ) || "Unknown Patient",

        doctorName:
          doctorMap.get(Number(appointment.doctorId)) ||
          "Unknown Doctor",

        hasPrescription: prescriptionAppointmentIds.has(
          Number(appointment.appointmentId)
        ),
      }));

      formatted.sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
      );

      setAppointments(formatted);

      // Update the open modal with the latest appointment.
      setSelectedAppointment((previous) => {
        if (!previous) return null;

        return (
          formatted.find(
            (item) =>
              Number(item.appointmentId) ===
              Number(previous.appointmentId)
          ) || null
        );
      });
    } catch (error) {
      console.error("Appointments loading error:", error);

      toast.error(
        error.response?.data?.message ||
          "Unable to load appointments."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial fetch and automatic refresh.
  useEffect(() => {
    fetchAppointments();

    const interval = setInterval(() => {
      fetchAppointments(false);
    }, 30000);

    return () => clearInterval(interval);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Search and status filtering.
  const filteredAppointments = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return appointments.filter((appointment) => {
      const matchesSearch = [
        appointment.appointmentId,
        appointment.patientName,
        appointment.doctorName,
        appointment.status,
        appointment.reason,
        appointment.appointmentDate,
      ].some((value) =>
        String(value || "").toLowerCase().includes(search)
      );

      const matchesStatus =
        statusFilter === "ALL" ||
        String(appointment.status || "").toUpperCase() ===
          statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [appointments, searchTerm, statusFilter]);

  // Calculate all appointment status counts.
  const statusCounts = useMemo(() => {
    const getCount = (status) =>
      appointments.filter(
        (item) =>
          String(item.status || "").toUpperCase() === status
      ).length;

    return {
      total: appointments.length,
      pending: getCount("PENDING"),
      confirmed: getCount("CONFIRMED"),
      completed: getCount("COMPLETED"),
      cancelled: getCount("CANCELLED"),
      rejected: getCount("REJECTED"),
    };
  }, [appointments]);

  // Check whether an appointment is finalized.
  const isAppointmentFinalized = (appointment) =>
    String(appointment?.status || "").toUpperCase() ===
      "COMPLETED" &&
    appointment?.hasPrescription === true;

  // Update appointment status.
  const handleStatusUpdate = async (appointment, newStatus) => {
    const currentStatus = String(
      appointment.status || ""
    ).toUpperCase();

    if (!newStatus || newStatus === currentStatus) return;

    // Terminal state protection
    if (["COMPLETED", "CANCELLED", "REJECTED"].includes(currentStatus)) {
      toast.error(
        `Appointment #${appointment.appointmentId} is in a terminal state (${formatStatus(currentStatus)}) and cannot be modified.`
      );
      return;
    }

    // Directional transition protection
    if (currentStatus === "PENDING" && !["CONFIRMED", "REJECTED", "CANCELLED"].includes(newStatus)) {
      toast.error("Pending appointments can only transition to Confirmed, Rejected, or Cancelled.");
      return;
    }

    if (currentStatus === "CONFIRMED" && !["COMPLETED", "CANCELLED"].includes(newStatus)) {
      toast.error("Confirmed appointments can only transition to Completed or Cancelled.");
      return;
    }

    // Protect completed appointments with prescriptions.
    if (isAppointmentFinalized(appointment)) {
      toast.error(
        "This appointment is finalized because a prescription has been issued."
      );
      return;
    }

    let cancellationReason = null;
    if (newStatus === "CANCELLED" || newStatus === "REJECTED") {
      const reasonInput = window.prompt(
        `Please provide a reason for setting status to ${formatStatus(newStatus)}:`
      );
      if (reasonInput === null) return;
      cancellationReason = reasonInput.trim() || `Administrative ${formatStatus(newStatus)}`;
    } else {
      const confirmed = window.confirm(
        `Change appointment #${appointment.appointmentId} status to ${formatStatus(newStatus)}?`
      );
      if (!confirmed) return;
    }

    setUpdatingId(appointment.appointmentId);

    try {
      await api.patch(
        `/appointments/${appointment.appointmentId}/status`,
        {
          status: newStatus,
          cancellationReason,
        }
      );

      toast.success("Appointment status updated.");
      await fetchAppointments(false);
    } catch (error) {
      console.error("Status update error:", error);
      toast.error(
        error.response?.data?.message ||
          "Unable to update appointment status."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  // Delete appointment.
  const handleDelete = async (appointment) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete appointment #${appointment.appointmentId}? This action cannot be undone.`
    );

    if (!confirmed) return;

    setDeletingId(appointment.appointmentId);

    try {
      await api.delete(
        `/appointments/${appointment.appointmentId}`
      );

      setAppointments((previous) =>
        previous.filter(
          (item) =>
            Number(item.appointmentId) !==
            Number(appointment.appointmentId)
        )
      );

      setSelectedAppointment((previous) =>
        previous &&
        Number(previous.appointmentId) ===
          Number(appointment.appointmentId)
          ? null
          : previous
      );

      toast.success("Appointment deleted successfully.");

      await fetchAppointments(false);
    } catch (error) {
      console.error("Appointment delete error:", error);

      if (error.response?.status === 409) {
        toast.error(
          "This appointment has associated records and cannot be deleted."
        );
      } else {
        toast.error(
          error.response?.data?.message ||
            "Unable to delete appointment."
        );
      }
    } finally {
      setDeletingId(null);
    }
  };

  // Approve Reschedule (Admin)
  const handleApproveReschedule = async (appointment) => {
    try {
      setUpdatingId(appointment.appointmentId);
      const res = await api.patch(
        `/appointments/${appointment.appointmentId}/reschedule-approve`
      );
      toast.success("Reschedule request approved! Slot updated.");
      setAppointments((prev) =>
        prev.map((item) =>
          Number(item.appointmentId) === Number(appointment.appointmentId)
            ? {
                ...item,
                appointmentDate: res.data.appointmentDate,
                appointmentTime: res.data.appointmentTime,
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

  // Reject Reschedule (Admin)
  const handleRejectReschedule = async (appointment) => {
    const reasonInput = window.prompt(
      "Reason for declining reschedule request (optional):"
    );
    if (reasonInput === null) return;

    try {
      setUpdatingId(appointment.appointmentId);
      await api.patch(
        `/appointments/${appointment.appointmentId}/reschedule-reject`,
        { reason: reasonInput.trim() }
      );
      toast.success(
        "Reschedule request declined. Original appointment slot preserved."
      );
      setAppointments((prev) =>
        prev.map((item) =>
          Number(item.appointmentId) === Number(appointment.appointmentId)
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

  // Summary cards.
  const summaryCards = [
    {
      label: "Total",
      value: statusCounts.total,
      icon: CalendarDays,
      color: "bg-cyan-50 text-cyan-600",
    },
    {
      label: "Pending",
      value: statusCounts.pending,
      icon: Clock,
      color: "bg-orange-50 text-orange-600",
    },
    {
      label: "Confirmed",
      value: statusCounts.confirmed,
      icon: CheckCircle,
      color: "bg-green-50 text-green-600",
    },
    {
      label: "Completed",
      value: statusCounts.completed,
      icon: CheckCircle,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Cancelled",
      value: statusCounts.cancelled,
      icon: AlertCircle,
      color: "bg-red-50 text-red-600",
    },
    {
      label: "Rejected",
      value: statusCounts.rejected,
      icon: X,
      color: "bg-rose-50 text-rose-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* PAGE INTRO */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Appointments
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            View and manage hospital appointments.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchAppointments(false)}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-cyan-500 hover:text-cyan-700 disabled:opacity-50"
        >
          <RefreshCw
            size={17}
            className={refreshing ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {summaryCards.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    {item.label}
                  </p>

                  <p className="mt-2 text-2xl font-extrabold text-slate-900">
                    {loading ? "..." : item.value}
                  </p>
                </div>

                <div className={`rounded-xl p-3 ${item.color}`}>
                  <Icon size={22} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* SEARCH AND FILTER */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
              placeholder="Search ID, patient, doctor or reason..."
              className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-cyan-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Statuses</option>

            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {formatStatus(status)}
              </option>
            ))}
          </select>
        </div>

        <p className="mt-3 text-xs text-slate-500">
          Showing {filteredAppointments.length} of{" "}
          {appointments.length} appointments
        </p>
      </div>

      {/* APPOINTMENTS TABLE */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <h3 className="font-bold text-slate-900">
            All Appointments
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            View appointment records and their status.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-left">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-4">Appointment ID</th>
                <th className="px-5 py-4">Patient</th>
                <th className="px-5 py-4">Doctor</th>
                <th className="px-5 py-4">Date & Time</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-5 py-12 text-center text-sm text-slate-500"
                  >
                    Loading appointments...
                  </td>
                </tr>
              ) : filteredAppointments.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-5 py-12 text-center text-sm text-slate-500"
                  >
                    No appointments found.
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((appointment) => {
                  const normalizedStatus = String(
                    appointment.status || ""
                  ).toUpperCase();

                  const finalized =
                    isAppointmentFinalized(appointment);

                  return (
                    <tr
                      key={appointment.appointmentId}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-5 py-4 text-sm font-bold text-cyan-700">
                        <div>#{appointment.appointmentId}</div>
                        {normalizedStatus === "CONFIRMED" && appointment.queueNumber && (
                          <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-cyan-100 px-2 py-0.5 text-[11px] font-extrabold text-cyan-800">
                            Queue #{appointment.queueNumber}
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-sm font-semibold text-slate-800">
                        {appointment.patientName}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {appointment.doctorName}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        <p className="font-semibold text-slate-800">
                          {formatDate(appointment.appointmentDate)}
                        </p>

                        <p className="mt-0.5 text-xs text-slate-500">
                          {formatTime(appointment.appointmentTime)}
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
                                disabled={updatingId === appointment.appointmentId}
                                onClick={() => handleApproveReschedule(appointment)}
                                className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                disabled={updatingId === appointment.appointmentId}
                                onClick={() => handleRejectReschedule(appointment)}
                                className="rounded-lg border border-rose-200 bg-white px-2.5 py-1 text-[11px] font-bold text-rose-700 transition hover:bg-rose-50 disabled:opacity-50"
                              >
                                Decline
                              </button>
                            </div>
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex flex-col items-start gap-1.5">
                          <StatusBadge status={normalizedStatus} size="sm" />

                          {normalizedStatus === "PENDING" && appointment.holdExpiresAt && (
                            <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-200">
                              <Timer size={11} /> 15m Hold
                            </span>
                          )}

                          {finalized && (
                            <span className="flex items-center gap-1 text-[11px] font-semibold text-green-700">
                              <Lock size={12} />
                              Finalized
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            title="View details"
                            onClick={() =>
                              setSelectedAppointment(appointment)
                            }
                            className="rounded-lg bg-cyan-50 p-2 text-cyan-700 transition hover:bg-cyan-100"
                          >
                            <Eye size={17} />
                          </button>

                          <button
                            type="button"
                            title="View Audit Trail"
                            onClick={() =>
                              openAuditModal(appointment)
                            }
                            className="rounded-lg bg-slate-100 p-2 text-slate-700 transition hover:bg-slate-200"
                          >
                            <History size={17} />
                          </button>

                          <button
                            type="button"
                            title="Delete appointment"
                            disabled={
                              deletingId ===
                              appointment.appointmentId
                            }
                            onClick={() =>
                              handleDelete(appointment)
                            }
                            className="rounded-lg bg-red-50 p-2 text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* APPOINTMENT DETAILS MODAL */}
      <AccessibleModal
        isOpen={!!selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
        title={selectedAppointment ? `Appointment Details #${selectedAppointment.appointmentId}` : "Appointment Details"}
        description={selectedAppointment ? `Patient: ${selectedAppointment.patientName} · Doctor: ${selectedAppointment.doctorName}` : ""}
        maxWidth="max-w-xl"
      >
        {selectedAppointment && (
          <>
            <div className="space-y-5 p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-4">
                  <UserRound
                    className="mb-2 text-cyan-600"
                    size={20}
                  />

                  <p className="text-xs text-slate-500">
                    Patient
                  </p>

                  <p className="mt-1 font-semibold text-slate-800">
                    {selectedAppointment.patientName}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Patient ID: {selectedAppointment.patientId}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <Stethoscope
                    className="mb-2 text-cyan-600"
                    size={20}
                  />

                  <p className="text-xs text-slate-500">
                    Doctor
                  </p>

                  <p className="mt-1 font-semibold text-slate-800">
                    {selectedAppointment.doctorName}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Doctor ID: {selectedAppointment.doctorId}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <CalendarDays
                    className="mb-2 text-cyan-600"
                    size={20}
                  />

                  <p className="text-xs text-slate-500">
                    Appointment Date
                  </p>

                  <p className="mt-1 font-semibold text-slate-800">
                    {formatDate(
                      selectedAppointment.appointmentDate
                    )}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <Clock
                    className="mb-2 text-cyan-600"
                    size={20}
                  />

                  <p className="text-xs text-slate-500">
                    Appointment Time
                  </p>

                  <p className="mt-1 font-semibold text-slate-800">
                    {formatTime(
                      selectedAppointment.appointmentTime
                    )}
                  </p>

                  {selectedAppointment.queueNumber && (
                    <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-cyan-100 px-2.5 py-0.5 text-xs font-bold text-cyan-800">
                      Queue #{selectedAppointment.queueNumber}
                    </span>
                  )}
                </div>
              </div>

              {selectedAppointment.rescheduleStatus && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900">
                    <RotateCcw size={14} />
                    <span>Reschedule Request Status: {selectedAppointment.rescheduleStatus}</span>
                  </div>
                  {selectedAppointment.rescheduleRequestedDate && (
                    <p className="mt-1 text-slate-700">
                      Requested Slot: {formatDate(selectedAppointment.rescheduleRequestedDate)} at {formatTime(selectedAppointment.rescheduleRequestedTime)}
                    </p>
                  )}
                  {selectedAppointment.rescheduleReason && (
                    <p className="mt-0.5 text-amber-800 italic">
                      "{selectedAppointment.rescheduleReason}"
                    </p>
                  )}
                </div>
              )}

              <div>
                <p className="mb-2 text-sm font-semibold text-slate-700">
                  Appointment Reason
                </p>

                <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                  {selectedAppointment.reason ||
                    "No reason provided."}
                </div>
              </div>

              {selectedAppointment.cancellationReason && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-red-800">
                    Cancellation / Rejection Reason
                  </p>
                  <p className="mt-1 text-sm font-medium text-red-900">
                    {selectedAppointment.cancellationReason}
                  </p>
                </div>
              )}

              {/* PRESCRIPTION INFORMATION */}
              {selectedAppointment.hasPrescription && (
                <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                  <div className="flex items-center gap-2 text-green-800">
                    <FileText size={19} />
                    <p className="font-semibold">
                      Prescription Issued
                    </p>
                  </div>

                  <p className="mt-2 text-sm leading-6 text-green-700">
                    A prescription has been created for this
                    appointment and is available in the Patient
                    Portal.
                  </p>
                </div>
              )}

              {/* STATUS UPDATE OR FINALIZED MESSAGE */}
              {isAppointmentFinalized(selectedAppointment) ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-center gap-2 text-amber-800">
                    <Lock size={19} />
                    <p className="font-semibold">
                      Appointment Finalized
                    </p>
                  </div>

                  <p className="mt-2 text-sm leading-6 text-amber-800">
                    This appointment has been completed by the
                    doctor and a prescription has been issued.
                    Its status is locked to protect the medical
                    record.
                  </p>

                  <p className="mt-2 text-xs font-semibold text-amber-800">
                    Status: Completed · Prescription: Available
                  </p>
                </div>
              ) : (
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Update Appointment Status
                  </label>

                  <select
                    value={String(
                      selectedAppointment.status || ""
                    ).toUpperCase()}
                    disabled={
                      updatingId ===
                      selectedAppointment.appointmentId
                    }
                    onChange={(event) =>
                      handleStatusUpdate(
                        selectedAppointment,
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-500 disabled:opacity-50"
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {formatStatus(status)}
                      </option>
                    ))}
                  </select>

                  {updatingId ===
                    selectedAppointment.appointmentId && (
                    <p className="mt-2 text-xs text-cyan-600">
                      Updating appointment status...
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 p-5">
              <button
                type="button"
                onClick={() => {
                  const target = selectedAppointment;
                  setSelectedAppointment(null);
                  openAuditModal(target);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                <History size={15} />
                View Audit Trail
              </button>
              <button
                type="button"
                onClick={() => setSelectedAppointment(null)}
                className="rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-700"
              >
                Close
              </button>
            </div>
          </>
        )}
      </AccessibleModal>

      {/* APPOINTMENT AUDIT TRAIL MODAL */}
      <AccessibleModal
        isOpen={auditModalOpen}
        onClose={() => setAuditModalOpen(false)}
        title="Appointment Audit Trail"
        description={auditTarget ? `Immutable history for Appointment #${auditTarget.appointmentId} (${auditTarget.patientName} with ${auditTarget.doctorName})` : ""}
        maxWidth="max-w-2xl"
      >
        <div>
          {auditLoading ? (
            <div className="py-12 text-center" role="status" aria-live="polite">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-cyan-600 border-t-transparent" />
              <p className="mt-3 text-xs text-slate-500">Loading audit trail...</p>
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm" role="status">
              <History size={36} className="mx-auto text-slate-300 mb-2" />
              No audit logs recorded for this appointment.
            </div>
          ) : (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              {auditLogs.map((log) => (
                <div
                  key={log.logId}
                  className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between font-bold text-slate-800">
                    <span className="rounded bg-slate-200 px-2 py-0.5 text-[11px] font-mono uppercase tracking-wide">
                      {log.action}
                    </span>
                    <span className="text-slate-400 font-normal">
                      {new Date(log.createdAt).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-slate-700 leading-relaxed font-medium">
                    {log.details}
                  </p>
                  <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-500 font-mono">
                    <span>Actor: {log.performedBy} ({log.userRole})</span>
                    {log.ipAddress && <span>IP: {log.ipAddress}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-slate-100 pt-4 mt-6 flex justify-end">
            <button
              type="button"
              onClick={() => setAuditModalOpen(false)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              Close
            </button>
          </div>
        </div>
      </AccessibleModal>
    </div>
  );
}

export default AdminAppointments;
