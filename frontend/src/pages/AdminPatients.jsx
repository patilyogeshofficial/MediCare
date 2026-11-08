
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Users,
  Search,
  RefreshCw,
  Eye,
  X,
  Mail,
  Phone,
  MapPin,
  CalendarDays,
  Droplets,
  UserRound,
  Filter,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api";

function AdminPatients() {
  const [patients, setPatients] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [genderFilter, setGenderFilter] = useState("ALL");
  const [selectedPatient, setSelectedPatient] = useState(null);

  const fetchPatients = useCallback(async () => {
    try {
      setLoading(true);

      const [patientsResponse, usersResponse] = await Promise.all([
        api.get("/patients"),
        api.get("/users"),
      ]);

      const patientData = Array.isArray(patientsResponse.data)
        ? patientsResponse.data
        : [];

      const userData = Array.isArray(usersResponse.data)
        ? usersResponse.data
        : [];

      setPatients(patientData);
      setUsers(userData);
    } catch (error) {
      console.error("Patient loading error:", error);
      toast.error(
        error.response?.data?.message || "Unable to load patients."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  // Match patient profile with its user account.
  const formattedPatients = useMemo(() => {
    const userMap = new Map(
      users.map((user) => [Number(user.userId), user])
    );

    return patients.map((patient) => {
      const user = userMap.get(Number(patient.userId));

      return {
        ...patient,
        fullName: user?.fullName || "Unknown Patient",
        email: user?.email || "Email unavailable",
        isActive: user?.isActive,
        createdAt: user?.createdAt,
      };
    });
  }, [patients, users]);

  // Search and gender filtering.
  const filteredPatients = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return formattedPatients.filter((patient) => {
      const matchesSearch = [
        patient.patientId,
        patient.fullName,
        patient.email,
        patient.phone,
        patient.bloodGroup,
      ].some((value) =>
        String(value ?? "").toLowerCase().includes(search)
      );

      const matchesGender =
        genderFilter === "ALL" ||
        String(patient.gender || "").toUpperCase() === genderFilter;

      return matchesSearch && matchesGender;
    });
  }, [formattedPatients, searchTerm, genderFilter]);

  const formatDate = (date) => {
    if (!date) return "Not available";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) return date;

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getInitials = (name) => {
    return String(name || "P")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("");
  };

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Patient Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            View and manage registered patient records.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchPatients}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:opacity-60"
        >
          <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* STATISTICS */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Total Patients
              </p>
              <h2 className="mt-2 text-3xl font-extrabold text-slate-900">
                {loading ? "..." : formattedPatients.length}
              </h2>
            </div>
            <div className="rounded-xl bg-cyan-50 p-3 text-cyan-600">
              <Users size={25} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Active Patient Accounts
              </p>
              <h2 className="mt-2 text-3xl font-extrabold text-slate-900">
                {loading
                  ? "..."
                  : formattedPatients.filter(
                      (patient) => patient.isActive === true
                    ).length}
              </h2>
            </div>
            <div className="rounded-xl bg-green-50 p-3 text-green-600">
              <UserRound size={25} />
            </div>
          </div>
        </div>
      </div>

      {/* PATIENT TABLE */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        {/* SEARCH AND FILTER */}
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Registered Patients
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {filteredPatients.length} patient(s) found
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search patients..."
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-cyan-500 sm:w-60"
              />
            </div>

            <div className="relative">
              <Filter
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <select
                value={genderFilter}
                onChange={(event) => setGenderFilter(event.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-8 text-sm outline-none focus:border-cyan-500 sm:w-36"
              >
                <option value="ALL">All Gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4 font-semibold">Patient</th>
                <th className="px-6 py-4 font-semibold">Contact</th>
                <th className="px-6 py-4 font-semibold">Gender</th>
                <th className="px-6 py-4 font-semibold">Blood Group</th>
                <th className="px-6 py-4 font-semibold">Date of Birth</th>
                <th className="px-6 py-4 text-right font-semibold">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-12 text-center text-sm text-slate-500"
                  >
                    Loading patients...
                  </td>
                </tr>
              ) : filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <Users className="mx-auto mb-3 text-slate-300" size={35} />
                    <p className="font-semibold text-slate-700">
                      No patients found
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      Try changing your search or filter.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredPatients.map((patient) => (
                  <tr
                    key={patient.patientId}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-sm font-bold text-cyan-700">
                          {getInitials(patient.fullName)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">
                            {patient.fullName}
                          </p>
                          <p className="text-xs text-slate-400">
                            Patient #{patient.patientId}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-700">
                        {patient.email}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {patient.phone || "Phone unavailable"}
                      </p>
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-600">
                      {patient.gender || "Not specified"}
                    </td>

                    <td className="px-6 py-4">
                      <span className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600">
                        {patient.bloodGroup || "N/A"}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-600">
                      {formatDate(patient.dateOfBirth)}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedPatient(patient)}
                        className="inline-flex items-center gap-2 rounded-lg bg-cyan-50 px-3 py-2 text-xs font-bold text-cyan-700 transition hover:bg-cyan-100"
                      >
                        <Eye size={15} />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PATIENT DETAILS MODAL */}
      {selectedPatient && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          onClick={() => setSelectedPatient(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="patient-modal-title"
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div>
                <h3
                  id="patient-modal-title"
                  className="text-lg font-bold text-slate-900"
                >
                  Patient Details
                </h3>
                <p className="text-sm text-slate-500">
                  Patient #{selectedPatient.patientId}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedPatient(null)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Close patient details"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cyan-100 text-xl font-extrabold text-cyan-700">
                  {getInitials(selectedPatient.fullName)}
                </div>
                <div>
                  <h4 className="text-xl font-bold text-slate-900">
                    {selectedPatient.fullName}
                  </h4>
                  <p className="text-sm text-slate-500">
                    Patient ID: #{selectedPatient.patientId}
                  </p>
                  <span
                    className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                      selectedPatient.isActive === true
                        ? "bg-green-50 text-green-700"
                        : selectedPatient.isActive === false
                          ? "bg-red-50 text-red-700"
                          : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {selectedPatient.isActive === true
                      ? "Active Account"
                      : selectedPatient.isActive === false
                        ? "Inactive Account"
                        : "Status unavailable"}
                  </span>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Detail
                  icon={Mail}
                  label="Email"
                  value={selectedPatient.email}
                />
                <Detail
                  icon={Phone}
                  label="Phone"
                  value={selectedPatient.phone}
                />
                <Detail
                  icon={CalendarDays}
                  label="Date of Birth"
                  value={formatDate(selectedPatient.dateOfBirth)}
                />
                <Detail
                  icon={UserRound}
                  label="Gender"
                  value={selectedPatient.gender}
                />
                <Detail
                  icon={Droplets}
                  label="Blood Group"
                  value={selectedPatient.bloodGroup}
                />
                <Detail
                  icon={CalendarDays}
                  label="Registered On"
                  value={formatDate(selectedPatient.createdAt)}
                />
                <div className="sm:col-span-2">
                  <Detail
                    icon={MapPin}
                    label="Address"
                    value={selectedPatient.address}
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 p-5 text-right">
              <button
                type="button"
                onClick={() => setSelectedPatient(null)}
                className="rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700"
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

function Detail({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <div className="mb-2 flex items-center gap-2 text-cyan-600">
        <Icon size={16} />
        <span className="text-xs font-semibold text-slate-500">{label}</span>
      </div>
      <p className="break-words text-sm font-semibold text-slate-800">
        {value || "Not available"}
      </p>
    </div>
  );
}

export default AdminPatients;
