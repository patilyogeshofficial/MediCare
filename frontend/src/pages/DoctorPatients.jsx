
import { useEffect, useMemo, useState } from "react";
import {
  Users,
  UserRound,
  Search,
  Eye,
  X,
  Phone,
  Mail,
  CalendarDays,
  UserCheck,
  Filter,
  Clock,
  MapPin,
  RefreshCw,
  FileText,
  Pill,
  Stethoscope,
  Printer,
  CheckCircle,
} from "lucide-react";

import api from "../services/api";

function DoctorPatients() {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState("All");
  const [selectedPatient, setSelectedPatient] = useState(null);

  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "prescriptions"
  const [patientPrescriptions, setPatientPrescriptions] = useState([]);
  const [loadingPrescriptions, setLoadingPrescriptions] = useState(false);
  const [prescriptionsError, setPrescriptionsError] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==========================================
  // FORMAT DATE
  // ==========================================

  const formatDate = (date) => {
    if (!date) return "N/A";

    const parsedDate = new Date(`${date}T00:00:00`);

    if (Number.isNaN(parsedDate.getTime())) return "N/A";

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // ==========================================
  // CALCULATE PATIENT AGE
  // ==========================================

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return "N/A";

    const today = new Date();
    const birth = new Date(`${dateOfBirth}T00:00:00`);

    if (Number.isNaN(birth.getTime())) return "N/A";

    let age = today.getFullYear() - birth.getFullYear();

    const monthDifference = today.getMonth() - birth.getMonth();

    if (
      monthDifference < 0 ||
      (monthDifference === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }

    return age >= 0 ? age : "N/A";
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

  const fetchPatientPrescriptions = async (patientId) => {
    if (!patientId) return;

    try {
      setLoadingPrescriptions(true);
      setPrescriptionsError("");

      const response = await api.get(`/prescriptions/patient/${patientId}`);
      setPatientPrescriptions(
        Array.isArray(response.data) ? response.data : []
      );
    } catch (err) {
      console.error("Failed to load patient prescriptions:", err);
      setPrescriptionsError(
        err.response?.data?.message ||
          "Unable to load prescriptions for this patient."
      );
    } finally {
      setLoadingPrescriptions(false);
    }
  };

  const handleOpenPatient = (patient, tab = "overview") => {
    setSelectedPatient(patient);
    setActiveTab(tab);
    setPatientPrescriptions([]);
    setPrescriptionsError("");
    fetchPatientPrescriptions(patient.patientId);
  };

  // ==========================================
  // FETCH DOCTOR'S PATIENTS FROM BACKEND
  // ==========================================

  const fetchPatients = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/appointments/my-patients");

      const formattedPatients = response.data.map((patient) => {
        const genderValue = patient.gender?.toUpperCase();

        let gender = "Other";

        if (genderValue === "MALE") {
          gender = "Male";
        } else if (genderValue === "FEMALE") {
          gender = "Female";
        }

        return {
          id: `PAT${String(patient.patientId).padStart(3, "0")}`,
          patientId: patient.patientId,
          name: patient.fullName || "Unknown Patient",
          age: calculateAge(patient.dateOfBirth),
          gender,
          phone: patient.phone || "N/A",
          email: patient.email || "N/A",
          bloodGroup: patient.bloodGroup || "N/A",
          lastVisit: formatDate(patient.lastVisit),
          totalAppointments: Number(patient.totalAppointments) || 0,
          condition: patient.condition || "N/A",
          address: patient.address || "N/A",
        };
      });

      setPatients(formattedPatients);
    } catch (err) {
      console.error("Failed to fetch doctor patients:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load patient records. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // LOAD PATIENTS ON PAGE LOAD
  // ==========================================

  useEffect(() => {
    fetchPatients();
  }, []);

  // ==========================================
  // SEARCH AND GENDER FILTER
  // ==========================================

  const filteredPatients = useMemo(() => {
    return patients.filter((patient) => {
      const searchValue = search.trim().toLowerCase();

      const matchesSearch =
        patient.name.toLowerCase().includes(searchValue) ||
        patient.id.toLowerCase().includes(searchValue) ||
        String(patient.patientId).includes(searchValue);

      const matchesGender =
        genderFilter === "All" || patient.gender === genderFilter;

      return matchesSearch && matchesGender;
    });
  }, [patients, search, genderFilter]);

  // ==========================================
  // PATIENT STATISTICS
  // ==========================================

  const stats = [
    {
      title: "Total Patients",
      value: patients.length,
      icon: Users,
      color: "bg-cyan-50 text-cyan-600",
      description: "All assigned patients",
    },
    {
      title: "Male Patients",
      value: patients.filter((p) => p.gender === "Male").length,
      icon: UserRound,
      color: "bg-blue-50 text-blue-600",
      description: "Male patients",
    },
    {
      title: "Female Patients",
      value: patients.filter((p) => p.gender === "Female").length,
      icon: UserCheck,
      color: "bg-pink-50 text-pink-600",
      description: "Female patients",
    },
    {
      title: "Total Appointments",
      value: patients.reduce(
        (sum, patient) => sum + patient.totalAppointments,
        0
      ),
      icon: CalendarDays,
      color: "bg-purple-50 text-purple-600",
      description: "Across all patients",
    },
  ];

  // ==========================================
  // LOADING STATE
  // ==========================================

  if (loading) {
    return (
      <div className="flex min-h-[350px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-cyan-100 border-t-cyan-600" />
          <p className="mt-4 text-sm font-medium text-slate-600">
            Loading patient records...
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // ERROR STATE
  // ==========================================

  if (error) {
    return (
      <div className="rounded-2xl border border-red-100 bg-white p-10 text-center shadow-sm">
        <Users size={42} className="mx-auto text-red-300" />

        <h2 className="mt-4 text-lg font-bold text-slate-800">
          Unable to Load Patients
        </h2>

        <p className="mt-2 text-sm text-red-500">{error}</p>

        <button
          onClick={fetchPatients}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700"
        >
          <RefreshCw size={16} />
          Try Again
        </button>
      </div>
    );
  }

  // ==========================================
  // MAIN PAGE
  // ==========================================

  return (
    <div>
      {/* PAGE INTRO */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            My Patients
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            View and manage information about your assigned patients.
          </p>
        </div>

        <button
          onClick={fetchPatients}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-cyan-300 hover:text-cyan-600"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* STATISTICS */}
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
                {stat.value}
              </h3>

              <p className="mt-1 text-xs text-slate-400">
                {stat.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* PATIENT RECORDS */}
      <div className="mt-8 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-6">
          <h2 className="text-lg font-bold text-slate-900">
            Patient Records
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Search and view your patient information.
          </p>
        </div>

        {/* SEARCH AND FILTER */}
        <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row">
          <div className="relative flex-1">
            <Search
              size={19}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              placeholder="Search by patient name or ID..."
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
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-8 text-sm outline-none focus:border-cyan-500 sm:w-48"
            >
              <option value="All">All Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* PATIENT TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4 font-semibold">Patient</th>
                <th className="px-6 py-4 font-semibold">Patient ID</th>
                <th className="px-6 py-4 font-semibold">Age / Gender</th>
                <th className="px-6 py-4 font-semibold">Blood Group</th>
                <th className="px-6 py-4 font-semibold">Last Visit</th>
                <th className="px-6 py-4 font-semibold">Appointments</th>
                <th className="px-6 py-4 text-center font-semibold">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredPatients.map((patient) => (
                <tr
                  key={patient.patientId}
                  className="transition hover:bg-slate-50"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-50 font-bold text-cyan-700">
                        {patient.name.charAt(0).toUpperCase()}
                      </div>

                      <span className="text-sm font-semibold text-slate-800">
                        {patient.name}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-sm font-semibold text-cyan-700">
                    {patient.id}
                  </td>

                  <td className="px-6 py-4 text-sm text-slate-600">
                    {patient.age === "N/A"
                      ? "N/A"
                      : `${patient.age} years`}

                    <p className="mt-1 text-xs text-slate-400">
                      {patient.gender}
                    </p>
                  </td>

                  <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                    {patient.bloodGroup}
                  </td>

                  <td className="px-6 py-4 text-sm text-slate-600">
                    {patient.lastVisit}
                  </td>

                  <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                    {patient.totalAppointments}
                  </td>

                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleOpenPatient(patient, "overview")}
                        title="View patient details"
                        className="rounded-lg bg-blue-50 p-2 text-blue-600 transition hover:bg-blue-100"
                      >
                        <Eye size={18} />
                      </button>

                      <button
                        onClick={() => handleOpenPatient(patient, "prescriptions")}
                        title="View patient prescriptions"
                        className="rounded-lg bg-emerald-50 p-2 text-emerald-600 transition hover:bg-emerald-100"
                      >
                        <FileText size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredPatients.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-16 text-center">
                    <Users
                      size={40}
                      className="mx-auto text-slate-300"
                    />

                    <p className="mt-3 font-semibold text-slate-600">
                      {patients.length === 0
                        ? "No patients assigned yet"
                        : "No patients found"}
                    </p>

                    <p className="mt-1 text-sm text-slate-400">
                      {patients.length === 0
                        ? "Patients with appointments will appear here."
                        : "Try changing your search or filter."}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-100 px-6 py-4 text-sm text-slate-500">
          Showing {filteredPatients.length} of {patients.length} patients
        </div>
      </div>

      {/* PATIENT DETAILS MODAL */}
      {selectedPatient && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            {/* MODAL HEADER */}
            <div className="flex items-center justify-between border-b border-slate-100 p-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {selectedPatient.name}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {selectedPatient.id} · {selectedPatient.gender}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {activeTab === "prescriptions" &&
                  patientPrescriptions.length > 0 && (
                    <button
                      type="button"
                      onClick={() => window.print()}
                      title="Print prescriptions"
                      className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-50"
                    >
                      <Printer size={18} />
                    </button>
                  )}
                <button
                  onClick={() => setSelectedPatient(null)}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                  aria-label="Close patient details"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* TAB SELECTOR */}
            <div className="flex border-b border-slate-100 bg-slate-50/50 px-6 pt-3">
              <button
                type="button"
                onClick={() => setActiveTab("overview")}
                className={`flex items-center gap-2 border-b-2 px-4 pb-3 text-sm font-semibold transition ${
                  activeTab === "overview"
                    ? "border-cyan-600 text-cyan-700"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                <UserRound size={16} />
                Patient Information
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("prescriptions");
                  fetchPatientPrescriptions(selectedPatient.patientId);
                }}
                className={`flex items-center gap-2 border-b-2 px-4 pb-3 text-sm font-semibold transition ${
                  activeTab === "prescriptions"
                    ? "border-emerald-600 text-emerald-700"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                <FileText size={16} />
                <span>Prescriptions</span>
                {patientPrescriptions.length > 0 && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
                    {patientPrescriptions.length}
                  </span>
                )}
              </button>
            </div>

            {/* MODAL BODY */}
            <div className="p-6">
              {activeTab === "overview" ? (
                <>
                  {/* PATIENT BASIC INFORMATION */}
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-50 text-2xl font-bold text-cyan-700">
                      {selectedPatient.name.charAt(0).toUpperCase()}
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-slate-900">
                        {selectedPatient.name}
                      </h3>

                      <p className="text-sm text-slate-500">
                        {selectedPatient.age === "N/A"
                          ? "Age unavailable"
                          : `${selectedPatient.age} years`}{" "}
                        · {selectedPatient.gender}
                      </p>
                    </div>
                  </div>

                  {/* PATIENT STATISTICS */}
                  <div className="mt-7 grid grid-cols-2 gap-5 sm:grid-cols-3">
                    <div>
                      <p className="text-xs text-slate-400">Patient ID</p>
                      <p className="mt-1 font-semibold text-slate-800">
                        {selectedPatient.patientId}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">Blood Group</p>
                      <p className="mt-1 font-semibold text-slate-800">
                        {selectedPatient.bloodGroup}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">Last Visit</p>
                      <p className="mt-1 font-semibold text-slate-800">
                        {selectedPatient.lastVisit}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">
                        Total Appointments
                      </p>
                      <p className="mt-1 font-semibold text-slate-800">
                        {selectedPatient.totalAppointments}
                      </p>
                    </div>

                    <div className="col-span-2">
                      <p className="text-xs text-slate-400">
                        Recent Consultation
                      </p>
                      <p className="mt-1 font-semibold text-slate-800">
                        {selectedPatient.condition}
                      </p>
                    </div>
                  </div>

                  {/* CONTACT INFORMATION */}
                  <div className="mt-7 space-y-4 border-t border-slate-100 pt-5">
                    <div className="flex items-center gap-3">
                      <Phone size={18} className="shrink-0 text-cyan-600" />
                      <span className="text-sm text-slate-600">
                        {selectedPatient.phone}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <Mail size={18} className="shrink-0 text-cyan-600" />
                      <span className="break-all text-sm text-slate-600">
                        {selectedPatient.email}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <MapPin size={18} className="shrink-0 text-cyan-600" />
                      <span className="text-sm text-slate-600">
                        {selectedPatient.address}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <Clock size={18} className="shrink-0 text-cyan-600" />
                      <span className="text-sm text-slate-600">
                        {selectedPatient.totalAppointments} appointments recorded
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                /* PRESCRIPTIONS TAB */
                <div>
                  {loadingPrescriptions ? (
                    <div className="flex min-h-[220px] flex-col items-center justify-center">
                      <RefreshCw
                        size={28}
                        className="animate-spin text-emerald-600"
                      />
                      <p className="mt-3 text-sm font-medium text-slate-500">
                        Loading patient prescriptions...
                      </p>
                    </div>
                  ) : prescriptionsError ? (
                    <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-center">
                      <p className="text-sm text-red-600">
                        {prescriptionsError}
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          fetchPatientPrescriptions(
                            selectedPatient.patientId
                          )
                        }
                        className="mt-3 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700"
                      >
                        <RefreshCw size={14} />
                        Retry
                      </button>
                    </div>
                  ) : patientPrescriptions.length === 0 ? (
                    <div className="py-12 text-center">
                      <FileText
                        size={40}
                        className="mx-auto text-slate-300"
                      />
                      <p className="mt-3 font-semibold text-slate-700">
                        No Prescriptions Found
                      </p>
                      <p className="mt-1 text-sm text-slate-400">
                        There are no recorded prescriptions for this patient
                        yet.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {patientPrescriptions.map((prescription) => (
                        <div
                          key={prescription.prescriptionId}
                          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                        >
                          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                              <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                                Prescription #{prescription.prescriptionId}
                              </span>
                              <span className="text-xs text-slate-500">
                                Appointment #{prescription.appointmentId}
                              </span>
                            </div>
                            <span className="text-xs font-medium text-slate-500">
                              {formatDate(
                                prescription.prescribedAt?.slice(0, 10)
                              )}
                            </span>
                          </div>

                          {prescription.diagnosis && (
                            <div>
                              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                Diagnosis
                              </p>
                              <p className="mt-1 rounded-xl border border-cyan-100 bg-cyan-50/70 p-3 text-sm font-medium text-cyan-900">
                                {prescription.diagnosis}
                              </p>
                            </div>
                          )}

                          <div>
                            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                              Prescribed Medications
                            </p>
                            <div className="overflow-x-auto rounded-xl border border-slate-100">
                              <table className="w-full min-w-[500px] text-left text-xs">
                                <thead className="bg-slate-50 uppercase font-semibold text-slate-500">
                                  <tr>
                                    <th className="px-3 py-2">Medicine</th>
                                    <th className="px-3 py-2">Dosage</th>
                                    <th className="px-3 py-2">Frequency</th>
                                    <th className="px-3 py-2">Duration</th>
                                    <th className="px-3 py-2">Instructions</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {parseMedications(
                                    prescription.medications
                                  ).map((med, idx) => (
                                    <tr
                                      key={idx}
                                      className="hover:bg-slate-50/50"
                                    >
                                      <td className="px-3 py-2 font-semibold text-slate-800">
                                        {med.medicineName ||
                                          med.medicine ||
                                          "—"}
                                      </td>
                                      <td className="px-3 py-2 text-slate-600">
                                        {med.dosage || "—"}
                                      </td>
                                      <td className="px-3 py-2 text-slate-600">
                                        {med.frequency || "—"}
                                      </td>
                                      <td className="px-3 py-2 text-slate-600">
                                        {med.duration || "—"}
                                      </td>
                                      <td className="px-3 py-2 text-slate-600">
                                        {med.instructions || "—"}
                                      </td>
                                    </tr>
                                  ))}
                                  {parseMedications(
                                    prescription.medications
                                  ).length === 0 && (
                                    <tr>
                                      <td
                                        colSpan={5}
                                        className="p-3 text-center text-slate-400"
                                      >
                                        No medications listed.
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {prescription.instructions && (
                            <div>
                              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                Instructions & Advice
                              </p>
                              <p className="mt-1 whitespace-pre-wrap rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs leading-relaxed text-slate-700">
                                {prescription.instructions}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DoctorPatients;
