
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
} from "lucide-react";
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
  return status.charAt(0) + status.slice(1).toLowerCase();
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

  const [hours, minutes] = time.split(":");
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

  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

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
      ] = await Promise.all([
        api.get("/appointments"),
        api.get("/patients"),
        api.get("/users"),
        api.get("/doctors"),
      ]);

      const appointmentData = appointmentsResponse.data || [];
      const patients = patientsResponse.data || [];
      const users = usersResponse.data || [];
      const doctors = doctorsResponse.data || [];

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

      const formatted = appointmentData.map((appointment) => {
        const patientUserId = patientUserMap.get(
          Number(appointment.patientId)
        );

        return {
          ...appointment,
          patientName:
            userMap.get(patientUserId) || "Unknown Patient",
          doctorName:
            doctorMap.get(Number(appointment.doctorId)) ||
            "Unknown Doctor",
        };
      });

      formatted.sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
      );

      setAppointments(formatted);

      // Refresh the open modal with the latest appointment data.
      if (selectedAppointment) {
        const updatedSelected = formatted.find(
          (item) =>
            Number(item.appointmentId) ===
            Number(selectedAppointment.appointmentId)
        );

        setSelectedAppointment(updatedSelected || null);
      }
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

  useEffect(() => {
    fetchAppointments();

    // Refresh appointment data every 30 seconds.
    const interval = setInterval(() => {
      fetchAppointments(false);
    }, 30000);

    return () => clearInterval(interval);

    // Initial fetch and polling only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        appointment.status?.toUpperCase() === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [appointments, searchTerm, statusFilter]);

  const statusCounts = useMemo(() => {
    return {
      total: appointments.length,
      pending: appointments.filter(
        (item) => item.status === "PENDING"
      ).length,
      confirmed: appointments.filter(
        (item) => item.status === "CONFIRMED"
      ).length,
      completed: appointments.filter(
        (item) => item.status === "COMPLETED"
      ).length,
      cancelled: appointments.filter(
        (item) => item.status === "CANCELLED"
      ).length,
    };
  }, [appointments]);

  const handleStatusUpdate = async (appointment, newStatus) => {
    if (!newStatus || newStatus === appointment.status) return;

    const confirmed = window.confirm(
      `Change appointment #${appointment.appointmentId} status to ${formatStatus(newStatus)}?`
    );

    if (!confirmed) return;

    setUpdatingId(appointment.appointmentId);

    try {
      await api.patch(
        `/appointments/${appointment.appointmentId}/status`,
        null,
        { params: { status: newStatus } }
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
            item.appointmentId !== appointment.appointmentId
        )
      );

      if (
        selectedAppointment?.appointmentId ===
        appointment.appointmentId
      ) {
        setSelectedAppointment(null);
      }

      toast.success("Appointment deleted successfully.");
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

  return (
    <div className="space-y-6">

      {/* PAGE INTRO */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Appointments Management
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
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
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
        ].map((item) => {
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
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search ID, patient, doctor or reason..."
              className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-cyan-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
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
          Showing {filteredAppointments.length} of {appointments.length} appointments
        </p>
      </div>

      {/* APPOINTMENTS TABLE */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <h3 className="font-bold text-slate-900">
            All Appointments
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Manage appointment records and their status.
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
                  <td colSpan="6" className="px-5 py-12 text-center text-sm text-slate-500">
                    Loading appointments...
                  </td>
                </tr>
              ) : filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-5 py-12 text-center text-sm text-slate-500">
                    No appointments found.
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((appointment) => (
                  <tr
                    key={appointment.appointmentId}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="px-5 py-4 text-sm font-bold text-cyan-700">
                      #{appointment.appointmentId}
                    </td>

                    <td className="px-5 py-4 text-sm font-semibold text-slate-800">
                      {appointment.patientName}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {appointment.doctorName}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      <p>{formatDate(appointment.appointmentDate)}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {formatTime(appointment.appointmentTime)}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                          statusStyle[appointment.status] ||
                          "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {formatStatus(appointment.status)}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          title="View details"
                          onClick={() => setSelectedAppointment(appointment)}
                          className="rounded-lg bg-cyan-50 p-2 text-cyan-700 transition hover:bg-cyan-100"
                        >
                          <Eye size={17} />
                        </button>

                        <button
                          type="button"
                          title="Delete appointment"
                          disabled={deletingId === appointment.appointmentId}
                          onClick={() => handleDelete(appointment)}
                          className="rounded-lg bg-red-50 p-2 text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* APPOINTMENT DETAILS MODAL */}
      {selectedAppointment && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-slate-900/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedAppointment(null);
            }
          }}
        >
          <div className="my-auto w-full max-w-xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Appointment Details
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Appointment #{selectedAppointment.appointmentId}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedAppointment(null)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Close details"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5 p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-4">
                  <UserRound className="mb-2 text-cyan-600" size={20} />
                  <p className="text-xs text-slate-500">Patient</p>
                  <p className="mt-1 font-semibold text-slate-800">
                    {selectedAppointment.patientName}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Patient ID: {selectedAppointment.patientId}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <Stethoscope className="mb-2 text-cyan-600" size={20} />
                  <p className="text-xs text-slate-500">Doctor</p>
                  <p className="mt-1 font-semibold text-slate-800">
                    {selectedAppointment.doctorName}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Doctor ID: {selectedAppointment.doctorId}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <CalendarDays className="mb-2 text-cyan-600" size={20} />
                  <p className="text-xs text-slate-500">Appointment Date</p>
                  <p className="mt-1 font-semibold text-slate-800">
                    {formatDate(selectedAppointment.appointmentDate)}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <Clock className="mb-2 text-cyan-600" size={20} />
                  <p className="text-xs text-slate-500">Appointment Time</p>
                  <p className="mt-1 font-semibold text-slate-800">
                    {formatTime(selectedAppointment.appointmentTime)}
                  </p>
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold text-slate-700">
                  Appointment Reason
                </p>
                <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                  {selectedAppointment.reason || "No reason provided."}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Update Appointment Status
                </label>

                <select
                  value={selectedAppointment.status || ""}
                  disabled={updatingId === selectedAppointment.appointmentId}
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

                {updatingId === selectedAppointment.appointmentId && (
                  <p className="mt-2 text-xs text-cyan-600">
                    Updating appointment status...
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end border-t border-slate-100 p-5">
              <button
                type="button"
                onClick={() => setSelectedAppointment(null)}
                className="rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminAppointments;
