
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
} from "lucide-react";
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
    hasPrescription: false,
    prescriptionCheckFailed: false,
  };
};

function DoctorAppointments() {
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

  const updateStatus = async (appointment, newStatus) => {
    setUpdatingId(appointment.id);

    try {
      await api.patch(
        `/appointments/${appointment.id}/status`,
        null,
        {
          params: {
            status: newStatus.toUpperCase(),
          },
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

  const openPrescriptionForm = (appointment) => {
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
        className="rounded-lg bg-blue-50 p-2 text-blue-600 transition hover:bg-blue-100"
      >
        <Eye size={17} />
      </button>

      {appointment.status === "Pending" && (
        <>
          <button
            type="button"
            disabled={updatingId === appointment.id}
            onClick={() => updateStatus(appointment, "Confirmed")}
            title="Accept appointment"
            className="rounded-lg bg-green-50 p-2 text-green-600 transition hover:bg-green-100 disabled:opacity-50"
          >
            <CheckCircle size={17} />
          </button>

          <button
            type="button"
            disabled={updatingId === appointment.id}
            onClick={() => updateStatus(appointment, "Rejected")}
            title="Reject appointment"
            className="rounded-lg bg-red-50 p-2 text-red-600 transition hover:bg-red-100 disabled:opacity-50"
          >
            <XCircle size={17} />
          </button>
        </>
      )}

      {appointment.status === "Confirmed" && (
        <button
          type="button"
          disabled={updatingId === appointment.id}
          onClick={() => updateStatus(appointment, "Completed")}
          title="Complete appointment"
          className="rounded-lg bg-blue-50 p-2 text-blue-600 transition hover:bg-blue-100 disabled:opacity-50"
        >
          <CheckCircle size={17} />
        </button>
      )}

      {appointment.status === "Completed" && (
        appointment.hasPrescription ? (
          <button
            type="button"
            onClick={() => openViewPrescription(appointment)}
            title="View prescription"
            className="rounded-lg bg-emerald-50 p-2 text-emerald-600 transition hover:bg-emerald-100"
          >
            <FileText size={17} />
          </button>
        ) : (
          <button
            type="button"
            disabled={appointment.prescriptionCheckFailed}
            onClick={() => openPrescriptionForm(appointment)}
            title="Write prescription"
            className="rounded-lg bg-cyan-50 p-2 text-cyan-600 transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Pill size={17} />
          </button>
        )
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
                      #{appointment.id}
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
                      <p>{formatDate(appointment.date)}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {formatTime(appointment.time)}
                      </p>
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-600">
                      {appointment.reason}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold ${getStatusStyle(appointment.status)}`}
                      >
                        {appointment.status}
                      </span>
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
      {selectedAppointment && !showPrescriptionForm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-slate-900/50 p-4">
          <div className="my-8 w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 p-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Appointment Details
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  #{selectedAppointment.id}
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

            <div className="space-y-5 p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-cyan-50 p-3 text-cyan-600">
                  <UserRound size={24} />
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
                  <Stethoscope size={18} />
                  <p className="text-sm font-semibold">
                    Consultation Reason
                  </p>
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  {selectedAppointment.reason}
                </p>
              </div>

              {selectedAppointment.status === "Pending" && (
                <div className="flex gap-3">
                  <button
                    type="button"
                    disabled={updatingId === selectedAppointment.id}
                    onClick={() =>
                      updateStatus(selectedAppointment, "Confirmed")
                    }
                    className="flex-1 rounded-xl bg-green-600 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
                  >
                    Accept Appointment
                  </button>

                  <button
                    type="button"
                    disabled={updatingId === selectedAppointment.id}
                    onClick={() =>
                      updateStatus(selectedAppointment, "Rejected")
                    }
                    className="flex-1 rounded-xl bg-red-600 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              )}

              {selectedAppointment.status === "Confirmed" && (
                <button
                  type="button"
                  disabled={updatingId === selectedAppointment.id}
                  onClick={() =>
                    updateStatus(selectedAppointment, "Completed")
                  }
                  className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                >
                  <CheckCircle size={17} className="mr-2 inline" />
                  Complete Appointment
                </button>
              )}

              {selectedAppointment.status === "Completed" && (
                selectedAppointment.prescriptionCheckFailed ? (
                  <button
                    type="button"
                    onClick={() => fetchAppointments(true)}
                    className="w-full rounded-xl border border-orange-200 bg-orange-50 py-3 text-sm font-semibold text-orange-700"
                  >
                    Retry prescription status check
                  </button>
                ) : selectedAppointment.hasPrescription ? (
                  <div className="space-y-3">
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-center text-sm font-semibold text-emerald-700">
                      <CheckCircle className="mr-2 inline" size={17} />
                      Prescription already issued
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        openViewPrescription(selectedAppointment)
                      }
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                    >
                      <FileText size={17} />
                      View Prescription
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      openPrescriptionForm(selectedAppointment)
                    }
                    className="w-full rounded-xl bg-cyan-600 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700"
                  >
                    <Pill size={17} className="mr-2 inline" />
                    Write Prescription
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* Write Prescription Modal */}
      {showPrescriptionForm && selectedAppointment && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4">
          <div className="my-6 w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 p-6">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">
                  Write Prescription
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Appointment #{selectedAppointment.id} ·{" "}
                  {selectedAppointment.patient}
                </p>
              </div>

              <button
                type="button"
                disabled={savingPrescription}
                onClick={closePrescriptionForm}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
                aria-label="Close prescription form"
              >
                <X size={21} />
              </button>
            </div>

            <form onSubmit={savePrescription}>
              <div className="max-h-[70vh] space-y-6 overflow-y-auto p-6">
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                  <div className="flex items-center gap-2 text-blue-800">
                    <FileText size={19} />
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
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Diagnosis <span className="text-red-500">*</span>
                  </label>
                  <textarea
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
                      <h3 className="font-bold text-slate-900">
                        Medicines
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        Add one or more prescribed medicines.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={addMedicine}
                      className="rounded-xl bg-cyan-50 px-4 py-2.5 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-100"
                    >
                      <Plus size={16} className="mr-1 inline" />
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
                              <Pill size={18} />
                            </div>
                            <h4 className="font-semibold text-slate-800">
                              Medicine {index + 1}
                            </h4>
                          </div>

                          {medicines.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeMedicine(index)}
                              className="rounded-lg p-2 text-red-500 transition hover:bg-red-50"
                              title="Remove medicine"
                            >
                              <Trash2 size={17} />
                            </button>
                          )}
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="sm:col-span-2">
                            <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                              Medicine Name *
                            </label>
                            <input
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
                            <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                              Dosage *
                            </label>
                            <input
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
                            <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                              Frequency *
                            </label>
                            <input
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
                            <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                              Duration *
                            </label>
                            <input
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
                            <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                              Medicine Instructions
                            </label>
                            <input
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
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Additional Instructions
                  </label>
                  <textarea
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

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 p-6 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={savingPrescription}
                  onClick={closePrescriptionForm}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingPrescription}
                  className="rounded-xl bg-cyan-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingPrescription ? (
                    "Saving Prescription..."
                  ) : (
                    <>
                      <CheckCircle size={17} className="mr-2 inline" />
                      Save Prescription
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Prescription Modal */}
      {prescriptionModalAppointment && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4">
          <div className="my-6 w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl print-receipt-modal">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <FileText size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">
                    Prescription Details
                  </h2>
                  <p className="text-xs text-slate-500">
                    Appointment #{prescriptionModalAppointment.id} ·{" "}
                    {prescriptionModalAppointment.patient}
                  </p>
                </div>
              </div>

              <div className="no-print flex items-center gap-2">
                {viewingPrescription && (
                  <button
                    type="button"
                    onClick={() => window.print()}
                    title="Print prescription"
                    className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-50"
                  >
                    <Printer size={18} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={closeViewPrescription}
                  className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
                  aria-label="Close prescription"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="max-h-[75vh] space-y-6 overflow-y-auto p-6">
              {loadingPrescription ? (
                <div className="flex min-h-[220px] flex-col items-center justify-center">
                  <RefreshCw
                    size={28}
                    className="animate-spin text-emerald-600"
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
                    <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-700">
                      <Stethoscope size={16} className="text-cyan-600" />
                      Diagnosis
                    </h3>
                    <div className="mt-2 rounded-xl border border-cyan-100 bg-cyan-50/70 p-4 text-sm font-medium text-cyan-950">
                      {viewingPrescription.diagnosis ||
                        "No diagnosis specified."}
                    </div>
                  </div>

                  {/* Prescribed Medicines */}
                  <div>
                    <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-700">
                      <Pill size={16} className="text-emerald-600" />
                      Prescribed Medicines
                    </h3>
                    <div className="mt-2 overflow-x-auto rounded-xl border border-slate-100">
                      <table className="w-full min-w-[550px] text-left text-sm">
                        <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                          <tr>
                            <th className="px-4 py-3">Medicine</th>
                            <th className="px-4 py-3">Dosage</th>
                            <th className="px-4 py-3">Frequency</th>
                            <th className="px-4 py-3">Duration</th>
                            <th className="px-4 py-3">Instructions</th>
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
                      <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-700">
                        <FileText size={16} className="text-slate-600" />
                        Doctor's Advice & Instructions
                      </h3>
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
            </div>

            <div className="no-print flex justify-end border-t border-slate-100 bg-slate-50/50 p-4">
              <button
                type="button"
                onClick={closeViewPrescription}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
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

export default DoctorAppointments;
