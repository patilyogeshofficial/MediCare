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
  Plus,
  Pencil,
  Power,
  Save,
  Loader2,
  Activity,
  ClipboardList,
  ShieldAlert,
  FileText,
  Download,
  Heart,
  Scale,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api";
import AccessibleModal from "../components/ui/AccessibleModal";

const emptyForm = {
  fullName: "",
  email: "",
  password: "",
  dateOfBirth: "",
  gender: "",
  phone: "",
  address: "",
  bloodGroup: "",
};

function AdminPatients() {
  const [patients, setPatients] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [genderFilter, setGenderFilter] = useState("ALL");
  const [selectedPatient, setSelectedPatient] = useState(null);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("add");
  const [formData, setFormData] = useState(emptyForm);
  const [editingPatientId, setEditingPatientId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);

  // Admin EHR modal state (Module 5)
  const [ehrModalOpen, setEhrModalOpen] = useState(false);
  const [ehrTargetPatient, setEhrTargetPatient] = useState(null);
  const [patientEhrData, setPatientEhrData] = useState(null);
  const [loadingEhr, setLoadingEhr] = useState(false);
  const [ehrError, setEhrError] = useState("");

  const openPatientEhr = async (patient) => {
    setEhrTargetPatient(patient);
    setPatientEhrData(null);
    setEhrError("");
    setEhrModalOpen(true);
    setLoadingEhr(true);
    try {
      const res = await api.get(`/medical-records/patient/${patient.patientId}`);
      setPatientEhrData(res.data);
    } catch (err) {
      console.error("Admin EHR fetch error:", err);
      setEhrError(err.response?.data?.message || "Unable to load patient EHR records.");
    } finally {
      setLoadingEhr(false);
    }
  };

  const handleAdminDownloadDoc = async (doc) => {
    try {
      const response = await api.get(`/medical-records/documents/${doc.id}/download`, {
        responseType: "blob",
      });
      const blob = new Blob([response.data], { type: doc.fileMimeType || "application/octet-stream" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", doc.originalFileName || `patient-doc-${doc.id}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Admin doc download error:", err);
      toast.error(err.response?.data?.message || "Failed to download document.");
    }
  };

  const fetchPatients = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);

      const [patientsResponse, usersResponse] = await Promise.all([
        api.get("/patients"),
        api.get("/users"),
      ]);

      setPatients(Array.isArray(patientsResponse.data) ? patientsResponse.data : []);
      setUsers(Array.isArray(usersResponse.data) ? usersResponse.data : []);
    } catch (error) {
      console.error("Patient loading error:", error);
      toast.error(error.response?.data?.message || "Unable to load patients.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const formattedPatients = useMemo(() => {
    const userMap = new Map(users.map((user) => [Number(user.userId), user]));

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

  const filteredPatients = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return formattedPatients.filter((patient) => {
      const matchesSearch = [
        patient.patientId,
        patient.fullName,
        patient.email,
        patient.phone,
        patient.bloodGroup,
      ].some((value) => String(value ?? "").toLowerCase().includes(search));

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

  const getInitials = (name) =>
    String(name || "P")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("");

  const openAddForm = () => {
    setFormMode("add");
    setEditingPatientId(null);
    setFormData(emptyForm);
    setFormOpen(true);
  };

  const openEditForm = (patient) => {
    setFormMode("edit");
    setEditingPatientId(patient.patientId);
    setFormData({
      fullName: patient.fullName === "Unknown Patient" ? "" : patient.fullName,
      email: patient.email === "Email unavailable" ? "" : patient.email,
      password: "",
      dateOfBirth: patient.dateOfBirth || "",
      gender: patient.gender || "",
      phone: patient.phone || "",
      address: patient.address || "",
      bloodGroup: patient.bloodGroup || "",
    });
    setSelectedPatient(null);
    setFormOpen(true);
  };

  const closeForm = () => {
    if (saving) return;
    setFormOpen(false);
    setEditingPatientId(null);
    setFormData(emptyForm);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.fullName.trim() || !formData.email.trim()) {
      toast.error("Full name and email are required.");
      return;
    }

    if (formMode === "add" && formData.password.length < 8) {
      toast.error("Password must contain at least 8 characters.");
      return;
    }

    const normalizedEmail = formData.email.trim().toLowerCase();

    const profilePayload = {
      dateOfBirth: formData.dateOfBirth || null,
      gender: formData.gender || null,
      phone: formData.phone.trim() || null,
      address: formData.address.trim() || null,
      bloodGroup: formData.bloodGroup || null,
    };

    setSaving(true);

    try {
      if (formMode === "add") {
        // Public registration creates a PATIENT user account.
        // The Admin-only patient endpoint then creates its patient profile.
        const accountResponse = await api.post("/auth/register", {
          fullName: formData.fullName.trim(),
          email: normalizedEmail,
          password: formData.password,
        });

        const userId = accountResponse.data?.userId;
        if (!userId) {
          throw new Error(
            "Patient account was created, but the response did not contain userId. Check the backend response."
          );
        }

        try {
          await api.post("/patients", {
            userId,
            ...profilePayload,
          });
        } catch (profileError) {
          console.error("Patient profile creation failed:", profileError);
          toast.error(
            `Account created (User ID ${userId}), but patient profile creation failed. Do not register again; create the profile for this user ID through the backend.`
          );
          return;
        }

        toast.success("Patient account and profile created successfully.");
      } else {
        await api.put(`/patients/${editingPatientId}`, {
          fullName: formData.fullName.trim(),
          email: normalizedEmail,
          ...profilePayload,
        });

        toast.success("Patient account and profile updated successfully.");
      }

      setFormOpen(false);
      setEditingPatientId(null);
      setFormData(emptyForm);
      await fetchPatients(false);
    } catch (error) {
      console.error("Patient save error:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          (formMode === "add"
            ? "Unable to create patient."
            : "Unable to update patient.")
      );
    } finally {
      setSaving(false);
    }
  };

  const togglePatientStatus = async (patient) => {
    if (patient.isActive === undefined || patient.isActive === null) {
      toast.error("Patient account status is unavailable.");
      return;
    }

    const nextStatus = !patient.isActive;
    const confirmed = window.confirm(
      `${nextStatus ? "Activate" : "Deactivate"} ${patient.fullName}'s account?`
    );
    if (!confirmed) return;

    setStatusUpdatingId(patient.userId);
    try {
      await api.patch(`/users/${patient.userId}/status`, {
        isActive: nextStatus,
      });
      toast.success(
        `Patient account ${nextStatus ? "activated" : "deactivated"} successfully.`
      );
      await fetchPatients(false);
      setSelectedPatient((current) =>
        current && Number(current.userId) === Number(patient.userId)
          ? { ...current, isActive: nextStatus }
          : current
      );
    } catch (error) {
      console.error("Patient status update error:", error);
      toast.error(
        error.response?.data?.message || "Unable to update patient account status."
      );
    } finally {
      setStatusUpdatingId(null);
    }
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
            View, add and manage registered patient accounts.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={openAddForm}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-700"
          >
            <Plus size={17} />
            Add Patient
          </button>
          <button
            type="button"
            onClick={() => fetchPatients()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* STATISTICS */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Patients</p>
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
              <p className="text-sm font-medium text-slate-500">Active Patient Accounts</p>
              <h2 className="mt-2 text-3xl font-extrabold text-slate-900">
                {loading
                  ? "..."
                  : formattedPatients.filter((patient) => patient.isActive === true).length}
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
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Registered Patients</h3>
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
                <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-left">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4 font-semibold">Patient</th>
                <th className="px-6 py-4 font-semibold">Contact</th>
                <th className="px-6 py-4 font-semibold">Gender</th>
                <th className="px-6 py-4 font-semibold">Blood Group</th>
                <th className="px-6 py-4 font-semibold">Date of Birth</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-sm text-slate-500">
                    Loading patients...
                  </td>
                </tr>
              ) : filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <Users className="mx-auto mb-3 text-slate-300" size={35} />
                    <p className="font-semibold text-slate-700">No patients found</p>
                    <p className="mt-1 text-sm text-slate-400">
                      Try changing your search or filter.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredPatients.map((patient) => (
                  <tr key={patient.patientId} className="transition hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-sm font-bold text-cyan-700">
                          {getInitials(patient.fullName)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{patient.fullName}</p>
                          <p className="text-xs text-slate-400">Patient #{patient.patientId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-700">{patient.email}</p>
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
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          patient.isActive
                            ? "bg-green-50 text-green-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {patient.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openPatientEhr(patient)}
                          title="View Electronic Health Record"
                          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100"
                        >
                          <ClipboardList size={15} /> EHR
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedPatient(patient)}
                          title="View patient"
                          className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-50 px-3 py-2 text-xs font-bold text-cyan-700 hover:bg-cyan-100"
                        >
                          <Eye size={15} /> View
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditForm(patient)}
                          title="Edit patient"
                          className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 hover:bg-amber-100"
                        >
                          <Pencil size={15} /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => togglePatientStatus(patient)}
                          disabled={statusUpdatingId === patient.userId}
                          title={patient.isActive ? "Deactivate patient" : "Activate patient"}
                          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold disabled:opacity-50 ${
                            patient.isActive
                              ? "bg-red-50 text-red-700 hover:bg-red-100"
                              : "bg-green-50 text-green-700 hover:bg-green-100"
                          }`}
                        >
                          {statusUpdatingId === patient.userId ? (
                            <Loader2 size={15} className="animate-spin" />
                          ) : (
                            <Power size={15} />
                          )}
                          {patient.isActive ? "Deactivate" : "Activate"}
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

      {/* ADD / EDIT PATIENT MODAL */}
      <AccessibleModal
        isOpen={formOpen}
        onClose={closeForm}
        title={formMode === "add" ? "Add New Patient" : "Edit Patient Account"}
        description={
          formMode === "add"
            ? "Create a patient login account and profile."
            : `Update patient #${editingPatientId} account and profile details.`
        }
        maxWidth="max-w-2xl"
        showCloseButton={!saving}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <h4 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
                  Account information
                </h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Full name" required>
                    <input
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      required
                      maxLength={100}
                      placeholder="Enter full name"
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Email address" required>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      maxLength={150}
                      placeholder="patient@example.com"
                      className={inputClass}
                    />
                  </Field>
                  {formMode === "add" && (
                    <Field label="Temporary password" required>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        minLength={8}
                        maxLength={72}
                        autoComplete="new-password"
                        placeholder="Minimum 8 characters"
                        className={inputClass}
                      />
                    </Field>
                  )}
                </div>
              </div>

              <div>
                <h4 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
                  Patient profile
                </h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Date of birth">
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                      max={new Date().toISOString().slice(0, 10)}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Gender">
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className={inputClass}
                    >
                      <option value="">Select gender</option>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                      <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                    </select>
                  </Field>
                  <Field label="Phone number">
                    <input
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      inputMode="numeric"
                      pattern="[0-9]{10,15}"
                      maxLength={15}
                      placeholder="10–15 digits"
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Blood group">
                    <select
                      name="bloodGroup"
                      value={formData.bloodGroup}
                      onChange={handleChange}
                      className={inputClass}
                    >
                      <option value="">Select blood group</option>
                      {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((group) => (
                        <option key={group} value={group}>{group}</option>
                      ))}
                    </select>
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label="Address">
                      <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        rows={3}
                        maxLength={1000}
                        placeholder="Enter patient address"
                        className={inputClass}
                      />
                    </Field>
                  </div>
                </div>
              </div>

              {formMode === "add" && (
                <p className="rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-800">
                  Patient creation uses two backend requests: account registration followed by patient-profile creation. If the second request fails, the account may already exist. The error message will show the new User ID; do not submit the same email again.
                </p>
              )}

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <Loader2 size={17} className="animate-spin" />
                  ) : (
                    <Save size={17} />
                  )}
                  {saving
                    ? "Saving..."
                    : formMode === "add"
                      ? "Create Patient"
                      : "Save Changes"}
                </button>
              </div>
            </form>
      </AccessibleModal>

      {/* PATIENT DETAILS MODAL */}
      <AccessibleModal
        isOpen={!!selectedPatient}
        onClose={() => setSelectedPatient(null)}
        title="Patient Details"
        description={selectedPatient ? `Patient #${selectedPatient.patientId}: ${selectedPatient.fullName}` : ""}
        maxWidth="max-w-lg"
      >
        {selectedPatient && (
          <div>
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cyan-100 text-xl font-extrabold text-cyan-700">
                {getInitials(selectedPatient.fullName)}
              </div>
              <div>
                <h4 className="text-xl font-bold text-slate-900">{selectedPatient.fullName}</h4>
                <p className="text-sm text-slate-500">Patient ID: #{selectedPatient.patientId}</p>
                <div className="mt-2">
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
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
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Detail icon={Mail} label="Email" value={selectedPatient.email} />
              <Detail icon={Phone} label="Phone" value={selectedPatient.phone} />
              <Detail icon={CalendarDays} label="Date of Birth" value={formatDate(selectedPatient.dateOfBirth)} />
              <Detail icon={UserRound} label="Gender" value={selectedPatient.gender} />
              <Detail icon={Droplets} label="Blood Group" value={selectedPatient.bloodGroup} />
              <Detail icon={CalendarDays} label="Registered On" value={formatDate(selectedPatient.createdAt)} />
              <div className="sm:col-span-2">
                <Detail icon={MapPin} label="Address" value={selectedPatient.address} />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-5">
              <button
                type="button"
                onClick={() => {
                  const target = selectedPatient;
                  setSelectedPatient(null);
                  openPatientEhr(target);
                }}
                className="rounded-xl bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 flex items-center gap-1.5"
              >
                <ClipboardList size={16} /> Inspect Full EHR
              </button>
              <button
                type="button"
                onClick={() => togglePatientStatus(selectedPatient)}
                disabled={statusUpdatingId === selectedPatient.userId}
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50 ${
                  selectedPatient.isActive
                    ? "bg-red-50 text-red-700 hover:bg-red-100"
                    : "bg-green-50 text-green-700 hover:bg-green-100"
                }`}
              >
                {selectedPatient.isActive ? "Deactivate Account" : "Activate Account"}
              </button>
              <button
                type="button"
                onClick={() => openEditForm(selectedPatient)}
                className="rounded-xl bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-700 hover:bg-amber-100"
              >
                Edit Patient
              </button>
              <button
                type="button"
                onClick={() => setSelectedPatient(null)}
                className="rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </AccessibleModal>

      {/* ADMIN EHR INSPECTION MODAL */}
      <AccessibleModal
        isOpen={ehrModalOpen && Boolean(ehrTargetPatient)}
        onClose={() => setEhrModalOpen(false)}
        title={ehrTargetPatient ? `Patient EHR: ${ehrTargetPatient.fullName}` : "Patient Electronic Health Record"}
        description={ehrTargetPatient ? `Patient #${ehrTargetPatient.patientId} • ${ehrTargetPatient.email} (Admin Oversight)` : ""}
        maxWidth="max-w-4xl"
      >
        {ehrTargetPatient && (
          <div className="max-h-[70vh] overflow-y-auto pr-1 space-y-6">
            {loadingEhr && (
              <div className="p-12 text-center text-sm text-slate-500" role="status" aria-live="polite">
                <Loader2 size={30} className="mx-auto mb-3 animate-spin text-indigo-600" aria-hidden="true" />
                <span>Loading patient medical records...</span>
              </div>
            )}

            {!loadingEhr && ehrError && (
              <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700" role="alert">
                {ehrError}
              </div>
            )}

            {!loadingEhr && !ehrError && patientEhrData && (
              <div className="space-y-6">
                  {/* Summary Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                      <p className="text-[11px] font-bold uppercase text-slate-400">Blood Group</p>
                      <p className="text-base font-extrabold text-slate-900 mt-0.5">
                        {patientEhrData.bloodGroup || ehrTargetPatient.bloodGroup || "—"}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                      <p className="text-[11px] font-bold uppercase text-slate-400">Latest BP</p>
                      <p className="text-base font-extrabold text-slate-900 mt-0.5">
                        {patientEhrData.latestVitals?.systolicBp && patientEhrData.latestVitals?.diastolicBp
                          ? `${patientEhrData.latestVitals.systolicBp}/${patientEhrData.latestVitals.diastolicBp}`
                          : "—"}{" "}
                        <span className="text-xs font-normal text-slate-500">mmHg</span>
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                      <p className="text-[11px] font-bold uppercase text-slate-400">Pulse / SpO2</p>
                      <p className="text-base font-extrabold text-slate-900 mt-0.5">
                        {patientEhrData.latestVitals?.heartRateBpm ? `${patientEhrData.latestVitals.heartRateBpm} bpm` : "—"} ·{" "}
                        {patientEhrData.latestVitals?.oxygenSaturationPercent ? `${patientEhrData.latestVitals.oxygenSaturationPercent}%` : "—"}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                      <p className="text-[11px] font-bold uppercase text-slate-400">BMI / Status</p>
                      <p className="text-base font-extrabold text-slate-900 mt-0.5">
                        {patientEhrData.latestVitals?.bmi ? `${patientEhrData.latestVitals.bmi}` : "—"}
                        {patientEhrData.latestVitals?.bmiCategory && (
                          <span className="ml-1 text-xs font-semibold text-emerald-600">
                            ({patientEhrData.latestVitals.bmiCategory})
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* 1. Allergies & Conditions */}
                  <div className="rounded-2xl border border-slate-100 bg-white p-5 space-y-3">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                      <ShieldAlert size={18} className="text-amber-500" />
                      <h4 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                        Allergies & Medical Conditions ({patientEhrData.allergiesAndConditions?.length || 0})
                      </h4>
                    </div>

                    {(!patientEhrData.allergiesAndConditions || patientEhrData.allergiesAndConditions.length === 0) ? (
                      <p className="text-xs text-slate-400 italic">No allergies or medical conditions recorded.</p>
                    ) : (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {patientEhrData.allergiesAndConditions.map((entry) => (
                          <div
                            key={entry.id}
                            className={`rounded-xl border p-3 text-xs ${
                              entry.recordType === "ALLERGY"
                                ? "border-rose-100 bg-rose-50/50"
                                : "border-purple-100 bg-purple-50/50"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900">{entry.name}</span>
                              <div className="flex items-center gap-1">
                                <span className="rounded bg-white px-1.5 py-0.5 text-[10px] font-bold text-slate-700 shadow-xs">
                                  {entry.severity}
                                </span>
                                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                                  {entry.status}
                                </span>
                              </div>
                            </div>
                            {entry.diagnosedDate && (
                              <p className="mt-1 text-[11px] text-slate-500">
                                Diagnosed: {new Date(entry.diagnosedDate).toLocaleDateString("en-IN")}
                              </p>
                            )}
                            {entry.notes && (
                              <p className="mt-1 text-[11px] text-slate-600">{entry.notes}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 2. Doctor Consultation Notes */}
                  <div className="rounded-2xl border border-slate-100 bg-white p-5 space-y-3">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                      <ClipboardList size={18} className="text-indigo-600" />
                      <h4 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                        Doctor Clinical Consultations ({patientEhrData.consultationRecords?.length || 0})
                      </h4>
                    </div>

                    {(!patientEhrData.consultationRecords || patientEhrData.consultationRecords.length === 0) ? (
                      <p className="text-xs text-slate-400 italic">No doctor consultation records logged yet.</p>
                    ) : (
                      <div className="space-y-4">
                        {patientEhrData.consultationRecords.map((consult) => (
                          <div key={consult.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-2">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                              <div>
                                <span className="text-[11px] font-bold text-indigo-700 uppercase">
                                  Consultation #{consult.appointmentId}
                                </span>
                                <h5 className="font-bold text-slate-900 text-sm">
                                  {consult.diagnosis || "Clinical Diagnosis"}
                                </h5>
                              </div>
                              <span className="text-xs text-slate-500 font-medium">
                                Dr. {consult.doctorName} · {consult.consultationDate ? new Date(consult.consultationDate).toLocaleDateString("en-IN") : ""}
                              </span>
                            </div>

                            {consult.symptoms && (
                              <p className="text-xs text-slate-600">
                                <span className="font-bold text-slate-700">Symptoms:</span> {consult.symptoms}
                              </p>
                            )}
                            {consult.clinicalObservations && (
                              <p className="text-xs text-slate-600">
                                <span className="font-bold text-slate-700">Observations:</span> {consult.clinicalObservations}
                              </p>
                            )}
                            {consult.treatmentPlan && (
                              <p className="text-xs text-indigo-900 bg-indigo-50 p-2.5 rounded-lg">
                                <span className="font-bold">Treatment Plan:</span> {consult.treatmentPlan}
                              </p>
                            )}
                            {consult.followUpRecommendations && (
                              <p className="text-xs text-amber-900 bg-amber-50 p-2.5 rounded-lg">
                                <span className="font-bold">Follow-up:</span> {consult.followUpRecommendations}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 3. Physiological Vitals History */}
                  <div className="rounded-2xl border border-slate-100 bg-white p-5 space-y-3">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                      <Activity size={18} className="text-rose-500" />
                      <h4 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                        Vitals Tracking History ({patientEhrData.vitalsHistory?.length || 0})
                      </h4>
                    </div>

                    {(!patientEhrData.vitalsHistory || patientEhrData.vitalsHistory.length === 0) ? (
                      <p className="text-xs text-slate-400 italic">No vitals readings recorded.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 uppercase text-slate-400">
                            <tr>
                              <th className="p-2 font-semibold">Date & Time</th>
                              <th className="p-2 font-semibold">BP (mmHg)</th>
                              <th className="p-2 font-semibold">Pulse</th>
                              <th className="p-2 font-semibold">Resp.</th>
                              <th className="p-2 font-semibold">Temp</th>
                              <th className="p-2 font-semibold">SpO2</th>
                              <th className="p-2 font-semibold">Weight / Height</th>
                              <th className="p-2 font-semibold">BMI</th>
                              <th className="p-2 font-semibold">Recorded By</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {patientEhrData.vitalsHistory.map((v) => (
                              <tr key={v.id}>
                                <td className="p-2 text-slate-700">{v.recordedAt ? new Date(v.recordedAt).toLocaleString("en-IN") : "—"}</td>
                                <td className="p-2 font-bold text-slate-900">{v.systolicBp && v.diastolicBp ? `${v.systolicBp}/${v.diastolicBp}` : "—"}</td>
                                <td className="p-2 text-slate-700">{v.heartRateBpm ? `${v.heartRateBpm} bpm` : "—"}</td>
                                <td className="p-2 text-slate-700">{v.respiratoryRateBpm ? `${v.respiratoryRateBpm} /min` : "—"}</td>
                                <td className="p-2 text-slate-700">{v.temperatureCelsius ? `${v.temperatureCelsius} °C` : "—"}</td>
                                <td className="p-2 text-slate-700">{v.oxygenSaturationPercent ? `${v.oxygenSaturationPercent}%` : "—"}</td>
                                <td className="p-2 text-slate-700">{v.weightKg ? `${v.weightKg} kg` : "—"}{v.heightCm ? ` / ${v.heightCm} cm` : ""}</td>
                                <td className="p-2">{v.bmi ? `${v.bmi} (${v.bmiCategory || "Normal"})` : "—"}</td>
                                <td className="p-2">
                                  {v.recordedByDoctorName ? (
                                    <span className="rounded bg-cyan-50 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-700">
                                      Dr. {v.recordedByDoctorName}
                                    </span>
                                  ) : (
                                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                                      Self-Recorded
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

                  {/* 4. Diagnostic Documents */}
                  <div className="rounded-2xl border border-slate-100 bg-white p-5 space-y-3">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                      <FileText size={18} className="text-cyan-600" />
                      <h4 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                        Diagnostic Reports & Medical Documents ({patientEhrData.documents?.length || 0})
                      </h4>
                    </div>

                    {(!patientEhrData.documents || patientEhrData.documents.length === 0) ? (
                      <p className="text-xs text-slate-400 italic">No diagnostic documents uploaded.</p>
                    ) : (
                      <div className="space-y-2">
                        {patientEhrData.documents.map((doc) => (
                          <div key={doc.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="rounded bg-cyan-100 px-2 py-0.5 text-[10px] font-bold text-cyan-800">
                                  {doc.documentCategory}
                                </span>
                                <span className="font-bold text-slate-900 text-xs">{doc.title}</span>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                {doc.originalFileName} · {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString("en-IN") : ""}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleAdminDownloadDoc(doc)}
                              className="inline-flex items-center gap-1 rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-cyan-700 transition"
                            >
                              <Download size={13} /> Download
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="flex justify-end border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setEhrModalOpen(false)}
                  className="rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition focus-visible:ring-2 focus-visible:ring-cyan-600 focus-visible:outline-none"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </AccessibleModal>
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100";

function Field({ label, required, children }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-semibold text-slate-700">
        {label}{required ? " *" : ""}
      </span>
      {children}
    </label>
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
