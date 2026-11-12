import { useEffect, useMemo, useState } from "react";

import {

  Search,

  RefreshCw,

  Eye,

  Stethoscope,

  UserRound,

  Mail,

  BriefcaseMedical,

  CalendarDays,

  Clock,

  IndianRupee,

  Award,

  CheckCircle,

  XCircle,

  X,

  Activity,

  Plus,

  Pencil,

  Save,

  Loader2,

} from "lucide-react";

import toast from "react-hot-toast";
import api from "../services/api";
import AccessibleModal from "../components/ui/AccessibleModal";

// Format doctor name without duplicating Dr. prefix.

const displayDoctorName = (name) => {

  const cleanName = String(name || "").trim();

  if (!cleanName) return "Doctor";

  return /^dr\.?\s*/i.test(cleanName)

    ? cleanName

    : `Dr. ${cleanName}`;

};

// Format date.

const formatDate = (date) => {

  if (!date) return "Not available";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return date;

  return parsed.toLocaleDateString("en-IN", {

    day: "2-digit",

    month: "short",

    year: "numeric",

  });

};

// Format time.

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

// Format appointment status.

const formatStatus = (status) => {

  if (!status) return "Unknown";

  return status.charAt(0) + status.slice(1).toLowerCase();

};

// Appointment status styles.

const statusStyle = {

  PENDING: "bg-orange-50 text-orange-700",

  CONFIRMED: "bg-green-50 text-green-700",

  REJECTED: "bg-red-50 text-red-700",

  CANCELLED: "bg-slate-100 text-slate-600",

  COMPLETED: "bg-cyan-50 text-cyan-700",

};

function AdminDoctors() {

  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // All specialization options are loaded directly from the backend.
  const [specializationOptions, setSpecializationOptions] = useState([]);
  const [specializationsLoading, setSpecializationsLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");

  const [statusFilter, setStatusFilter] = useState("ALL");

  const [specializationFilter, setSpecializationFilter] =

    useState("ALL");

  const [selectedDoctor, setSelectedDoctor] = useState(null);

  const [appointments, setAppointments] = useState([]);

  const [appointmentsLoading, setAppointmentsLoading] = useState(false);

  const [updatingId, setUpdatingId] = useState(null);

  const [doctorFormOpen, setDoctorFormOpen] = useState(false);

  const [editingDoctor, setEditingDoctor] = useState(null);

  const [savingDoctor, setSavingDoctor] = useState(false);

  const emptyDoctorForm = {

    fullName: "",

    email: "",

    password: "",

    specializationId: "",

    licenseNumber: "",

    qualification: "",

    experienceYears: "0",

    consultationFee: "0",

  };

  const [doctorForm, setDoctorForm] = useState(emptyDoctorForm);

  // Fetch doctors and their linked user accounts.

  const fetchDoctors = async (showLoader = true) => {

    if (showLoader) {

      setLoading(true);

    } else {

      setRefreshing(true);

    }

    try {

      const [doctorsResponse, usersResponse] = await Promise.all([

        api.get("/doctors", { params: { includeInactive: true } }),

        api.get("/users"),

      ]);

      const doctorData = doctorsResponse.data || [];

      const users = usersResponse.data || [];

      const userMap = new Map(

        users.map((user) => [

          Number(user.userId),

          user,

        ])

      );

      const formattedDoctors = doctorData.map((doctor) => {

        const user =
          userMap.get(Number(doctor.userId)) ||
          users.find(
            (u) =>
              u.role === "DOCTOR" &&
              (String(u.fullName || "").trim().toLowerCase() ===
                String(doctor.fullName || "").trim().toLowerCase() ||
                (doctor.email &&
                  String(u.email || "").trim().toLowerCase() ===
                    String(doctor.email || "").trim().toLowerCase()))
          );

        return {

          ...doctor,

          userId: doctor.userId || user?.userId,

          fullName:

            doctor.fullName || user?.fullName || "Unknown Doctor",

          email: doctor.email || user?.email || "Not available",

          isActive: user?.isActive ?? false,

          createdAt: user?.createdAt || null,

        };

      });

      formattedDoctors.sort((a, b) =>

        a.fullName.localeCompare(b.fullName)

      );

      setDoctors(formattedDoctors);

      // Refresh the currently selected doctor.

      if (selectedDoctor) {

        const updatedSelected = formattedDoctors.find(

          (doctor) =>

            Number(doctor.doctorId) ===

            Number(selectedDoctor.doctorId)

        );

        setSelectedDoctor(updatedSelected || null);

      }

    } catch (error) {

      console.error("Doctors loading error:", error);

      toast.error(

        error.response?.data?.message ||

          "Unable to load doctors."

      );

    } finally {

      setLoading(false);

      setRefreshing(false);

    }

  };

  // Fetch all specializations directly from the database.
  const fetchSpecializations = async () => {
    setSpecializationsLoading(true);

    try {
      const response = await api.get("/specializations");
      const data = Array.isArray(response.data) ? response.data : [];

      const sortedSpecializations = [...data]
        .filter((item) => item?.specializationId && item?.specializationName)
        .sort((a, b) =>
          a.specializationName.localeCompare(b.specializationName)
        );

      setSpecializationOptions(
        sortedSpecializations.map((item) => ({
          id: Number(item.specializationId),
          name: item.specializationName,
        }))
      );
    } catch (error) {
      console.error("Specializations loading error:", error);
      toast.error(
        error.response?.data?.message || "Unable to load specializations."
      );
      setSpecializationOptions([]);
    } finally {
      setSpecializationsLoading(false);
    }
  };

  // Initial loading and automatic refresh.
  useEffect(() => {
    fetchDoctors();
    fetchSpecializations();

    const interval = setInterval(() => {

      fetchDoctors(false);

    }, 30000);

    return () => clearInterval(interval);

    // Initial fetch and polling only.

    // eslint-disable-next-line react-hooks/exhaustive-deps

  }, []);

  // Search and filter doctors.

  const filteredDoctors = useMemo(() => {

    const search = searchTerm.trim().toLowerCase();

    return doctors.filter((doctor) => {

      const matchesSearch = [

        doctor.doctorId,

        doctor.fullName,

        doctor.email,

        doctor.specializationName,

        doctor.qualification,

        doctor.licenseNumber,

        doctor.experienceYears,

      ].some((value) =>

        String(value ?? "").toLowerCase().includes(search)

      );

      const matchesStatus =

        statusFilter === "ALL" ||

        (statusFilter === "ACTIVE" && doctor.isActive) ||

        (statusFilter === "INACTIVE" && !doctor.isActive);

      const matchesSpecialization =

        specializationFilter === "ALL" ||

        doctor.specializationName === specializationFilter;

      return (

        matchesSearch &&

        matchesStatus &&

        matchesSpecialization

      );

    });

  }, [

    doctors,

    searchTerm,

    statusFilter,

    specializationFilter,

  ]);

  // Specialization names for the filter dropdown.
  const specializations = useMemo(
    () => specializationOptions.map((item) => item.name),
    [specializationOptions]
  );

  // Summary statistics.

  const doctorCounts = useMemo(

    () => ({

      total: doctors.length,

      active: doctors.filter((doctor) => doctor.isActive).length,

      inactive: doctors.filter((doctor) => !doctor.isActive).length,

      specializations: specializationOptions.length,
    }),
    [doctors, specializationOptions]

  );

  // Fetch doctor appointment history.

  const loadAppointments = async (doctor) => {

    setAppointments([]);

    setAppointmentsLoading(true);

    try {

      const response = await api.get(

        `/appointments/doctor/${doctor.doctorId}`

      );

      setAppointments(response.data || []);

    } catch (error) {

      console.error("Doctor appointments error:", error);

      toast.error(

        error.response?.data?.message ||

          "Unable to load doctor appointments."

      );

    } finally {

      setAppointmentsLoading(false);

    }

  };

  // Open doctor details.

  const handleViewDetails = (doctor) => {

    setSelectedDoctor(doctor);

    loadAppointments(doctor);

  };

  // Activate or deactivate doctor account.

  const handleAccountStatus = async (doctor) => {

    const newStatus = !doctor.isActive;

    const confirmed = window.confirm(

      `Are you sure you want to ${

        newStatus ? "activate" : "deactivate"

      } ${displayDoctorName(doctor.fullName)}'s account?`

    );

    if (!confirmed) return;

    setUpdatingId(doctor.userId);

    try {

      await api.patch(

        `/users/${doctor.userId}/status`,

        { isActive: newStatus }

      );

      setDoctors((previous) =>

        previous.map((item) =>

          Number(item.doctorId) === Number(doctor.doctorId)

            ? { ...item, isActive: newStatus }

            : item

        )

      );

      setSelectedDoctor((previous) =>

        previous &&

        Number(previous.doctorId) === Number(doctor.doctorId)

          ? { ...previous, isActive: newStatus }

          : previous

      );

      toast.success(

        `Doctor account ${

          newStatus ? "activated" : "deactivated"

        } successfully.`

      );

    } catch (error) {

      console.error("Doctor status update error:", error);

      toast.error(

        error.response?.data?.message ||

          "Unable to update doctor account."

      );

    } finally {

      setUpdatingId(null);

    }

  };

  const openAddDoctor = () => {

    setEditingDoctor(null);

    setDoctorForm({

      ...emptyDoctorForm,

      specializationId: specializationOptions[0]?.id?.toString() || "",

    });

    setDoctorFormOpen(true);

  };

  const openEditDoctor = (doctor) => {

    setEditingDoctor(doctor);

    setDoctorForm({

      fullName: doctor.fullName || "",

      email: doctor.email || "",

      password: "",

      specializationId: String(doctor.specializationId || ""),

      licenseNumber: doctor.licenseNumber || "",

      qualification: doctor.qualification || "",

      experienceYears: String(doctor.experienceYears ?? 0),

      consultationFee: String(doctor.consultationFee ?? 0),

    });

    setDoctorFormOpen(true);

  };

  const updateDoctorForm = (event) => {

    const { name, value } = event.target;

    setDoctorForm((previous) => ({ ...previous, [name]: value }));

  };

  const handleDoctorFormSubmit = async (event) => {

    event.preventDefault();

    if (!doctorForm.specializationId) {

      toast.error("No specialization is available. Add a specialization before creating a doctor.");

      return;

    }

    const profilePayload = {

      specializationId: Number(doctorForm.specializationId),

      licenseNumber: doctorForm.licenseNumber.trim(),

      qualification: doctorForm.qualification.trim(),

      experienceYears: Number(doctorForm.experienceYears),

      consultationFee: Number(doctorForm.consultationFee),

    };

    if (

      !doctorForm.fullName.trim() ||

      !doctorForm.email.trim() ||

      !profilePayload.licenseNumber ||

      !Number.isFinite(profilePayload.experienceYears) ||

      profilePayload.experienceYears < 0 ||

      !Number.isFinite(profilePayload.consultationFee) ||

      profilePayload.consultationFee < 0

    ) {

      toast.error("Please complete all required fields with valid values.");

      return;

    }

    setSavingDoctor(true);

    try {

      if (editingDoctor) {

        // This is the Admin-only endpoint added for synchronized User + Doctor updates.

        await api.put(`/doctors/${editingDoctor.doctorId}/admin`, {

          fullName: doctorForm.fullName.trim(),

          email: doctorForm.email.trim(),

          ...profilePayload,

        });

        toast.success("Doctor account and profile updated successfully.");

      } else {

        if (doctorForm.password.length < 8) {

          toast.error("Temporary password must contain at least 8 characters.");

          setSavingDoctor(false);

          return;

        }

        // Existing backend creates the login account first, then its doctor profile.

        const userResponse = await api.post("/users/doctors", {

          fullName: doctorForm.fullName.trim(),

          email: doctorForm.email.trim(),

          password: doctorForm.password,

        });

        const userId = userResponse.data?.userId;

        if (!userId) {

          throw new Error("Doctor login account was created but the response did not include userId.");

        }

        try {

          await api.post("/doctors", {

            userId,

            ...profilePayload,

          });

        } catch (profileError) {

          console.error("Doctor profile creation failed after account creation:", profileError);

          toast.error(`Login account created (User ID ${userId}), but doctor profile creation failed. Please retry profile creation or remove the unused account.`);

          return;

        }

        toast.success("Doctor account created successfully.");

      }

      setDoctorFormOpen(false);

      setEditingDoctor(null);

      await fetchDoctors(false);

    } catch (error) {

      console.error("Doctor save error:", error);

      toast.error(

        error.response?.data?.message ||

          error.response?.data?.detail ||

          error.message ||

          "Unable to save doctor details."

      );

    } finally {

      setSavingDoctor(false);

    }

  };

  return (

    <div className="space-y-6">

      {/* PAGE INTRO */}

      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">

        <div>

          <h1 className="text-2xl font-extrabold text-slate-900">

            Doctors Management

          </h1>

          <p className="mt-1 text-sm text-slate-500">

            View and manage hospital doctors and their accounts.

          </p>

        </div>

        <div className="flex flex-wrap items-center gap-2">

          <button

            type="button"

            onClick={openAddDoctor}

            className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-700"

          >

            <Plus size={17} />

            Add Doctor

          </button>

          <button

            type="button"

            onClick={() => fetchDoctors(false)}

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

      </div>

      {/* SUMMARY CARDS */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        {[

          {

            label: "Total Doctors",

            value: doctorCounts.total,

            icon: Stethoscope,

            color: "bg-cyan-50 text-cyan-600",

          },

          {

            label: "Active Doctors",

            value: doctorCounts.active,

            icon: CheckCircle,

            color: "bg-green-50 text-green-600",

          },

          {

            label: "Inactive Doctors",

            value: doctorCounts.inactive,

            icon: XCircle,

            color: "bg-red-50 text-red-600",

          },

          {

            label: "Specializations",

            value: doctorCounts.specializations,

            icon: BriefcaseMedical,

            color: "bg-blue-50 text-blue-600",

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

      {/* SEARCH AND FILTERS */}

      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">

        <div className="flex flex-col gap-4 lg:flex-row">

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

              placeholder="Search doctor, email, specialization or license..."

              className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-cyan-500"

            />

          </div>

          <select

            value={specializationFilter}

            onChange={(event) =>

              setSpecializationFilter(event.target.value)

            }

            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-cyan-500"

          >

            <option value="ALL">All Specializations</option>

            {specializations.map((specialization) => (

              <option key={specialization} value={specialization}>

                {specialization}

              </option>

            ))}

          </select>

          <select

            value={statusFilter}

            onChange={(event) => setStatusFilter(event.target.value)}

            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-cyan-500"

          >

            <option value="ALL">All Accounts</option>

            <option value="ACTIVE">Active</option>

            <option value="INACTIVE">Inactive</option>

          </select>

        </div>

        <p className="mt-3 text-xs text-slate-500">

          Showing {filteredDoctors.length} of {doctors.length} doctors

        </p>

      </div>

      {/* DOCTORS TABLE */}

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">

        <div className="border-b border-slate-100 p-5">

          <h3 className="font-bold text-slate-900">

            All Doctors

          </h3>

          <p className="mt-1 text-sm text-slate-500">

            View doctor profiles and manage account status.

          </p>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full min-w-[1100px] text-left">

            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">

              <tr>

                <th className="px-5 py-4">Doctor</th>

                <th className="px-5 py-4">Specialization</th>

                <th className="px-5 py-4">Qualification</th>

                <th className="px-5 py-4">Experience</th>

                <th className="px-5 py-4">Consultation Fee</th>

                <th className="px-5 py-4">Account Status</th>

                <th className="px-5 py-4">Actions</th>

              </tr>

            </thead>

            <tbody className="divide-y divide-slate-100">

              {loading ? (

                <tr>

                  <td

                    colSpan="7"

                    className="px-5 py-12 text-center text-sm text-slate-500"

                  >

                    Loading doctors...

                  </td>

                </tr>

              ) : filteredDoctors.length === 0 ? (

                <tr>

                  <td

                    colSpan="7"

                    className="px-5 py-12 text-center text-sm text-slate-500"

                  >

                    No doctors found.

                  </td>

                </tr>

              ) : (

                filteredDoctors.map((doctor) => (

                  <tr

                    key={doctor.doctorId}

                    className="transition hover:bg-slate-50"

                  >

                    <td className="px-5 py-4">

                      <div className="flex items-center gap-3">

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-50 text-cyan-700">

                          <Stethoscope size={19} />

                        </div>

                        <div>

                          <p className="text-sm font-semibold text-slate-800">

                            {displayDoctorName(doctor.fullName)}

                          </p>

                          <p className="mt-1 text-xs text-slate-400">

                            {doctor.email}

                          </p>

                          <p className="mt-1 text-xs text-cyan-700">

                            ID: #{doctor.doctorId}

                          </p>

                        </div>

                      </div>

                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">

                      {doctor.specializationName || "Not available"}

                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">

                      {doctor.qualification || "Not available"}

                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">

                      {doctor.experienceYears ?? 0} years

                    </td>

                    <td className="px-5 py-4 text-sm font-semibold text-slate-700">

                      ₹{doctor.consultationFee ?? "N/A"}

                    </td>

                    <td className="px-5 py-4">

                      <span

                        className={`rounded-full px-3 py-1.5 text-xs font-semibold ${

                          doctor.isActive

                            ? "bg-green-50 text-green-700"

                            : "bg-red-50 text-red-700"

                        }`}

                      >

                        {doctor.isActive ? "Active" : "Inactive"}

                      </span>

                    </td>

                    <td className="px-5 py-4">

                      <div className="flex items-center gap-2">

                        <button

                          type="button"

                          title="View details"

                          onClick={() => handleViewDetails(doctor)}

                          className="rounded-lg bg-cyan-50 p-2 text-cyan-700 transition hover:bg-cyan-100"

                        >

                          <Eye size={17} />

                        </button>

                        <button

                          type="button"

                          title="Edit doctor"

                          onClick={() => openEditDoctor(doctor)}

                          className="rounded-lg bg-blue-50 p-2 text-blue-700 transition hover:bg-blue-100"

                        >

                          <Pencil size={17} />

                        </button>

                        <button

                          type="button"

                          title={

                            doctor.isActive

                              ? "Deactivate account"

                              : "Activate account"

                          }

                          disabled={updatingId === doctor.userId}

                          onClick={() => handleAccountStatus(doctor)}

                          className={`rounded-lg p-2 transition disabled:opacity-50 ${

                            doctor.isActive

                              ? "bg-red-50 text-red-600 hover:bg-red-100"

                              : "bg-green-50 text-green-600 hover:bg-green-100"

                          }`}

                        >

                          {doctor.isActive ? (

                            <XCircle size={17} />

                          ) : (

                            <CheckCircle size={17} />

                          )}

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

      {/* ADD / EDIT DOCTOR MODAL */}
      <AccessibleModal
        isOpen={doctorFormOpen}
        onClose={() => !savingDoctor && setDoctorFormOpen(false)}
        title={editingDoctor ? "Edit Doctor Account" : "Add New Doctor"}
        description={editingDoctor ? "Update login account and professional information." : "Create login credentials and a professional doctor profile."}
        maxWidth="max-w-2xl"
        showCloseButton={!savingDoctor}
      >
        <form onSubmit={handleDoctorFormSubmit}>

              <div className="grid max-h-[70vh] gap-4 overflow-y-auto p-5 sm:grid-cols-2">

                <label className="space-y-1.5 sm:col-span-2">

                  <span className="text-sm font-semibold text-slate-700">Full name *</span>

                  <input name="fullName" value={doctorForm.fullName} onChange={updateDoctorForm} required maxLength={100} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-cyan-500" placeholder="Dr. Amit Patil" />

                </label>

                <label className="space-y-1.5 sm:col-span-2">

                  <span className="text-sm font-semibold text-slate-700">Email address *</span>

                  <input type="email" name="email" value={doctorForm.email} onChange={updateDoctorForm} required maxLength={150} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-cyan-500" placeholder="doctor@example.com" />

                </label>

                {!editingDoctor && (

                  <label className="space-y-1.5 sm:col-span-2">

                    <span className="text-sm font-semibold text-slate-700">Temporary password *</span>

                    <input type="password" name="password" value={doctorForm.password} onChange={updateDoctorForm} required minLength={8} maxLength={72} autoComplete="new-password" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-cyan-500" placeholder="At least 8 characters" />

                    <span className="text-xs text-slate-500">Share this temporary password securely with the doctor.</span>

                  </label>

                )}

                <label className="space-y-1.5">

                  <span className="text-sm font-semibold text-slate-700">Specialization *</span>

                  <select
                    name="specializationId"
                    value={doctorForm.specializationId}
                    onChange={updateDoctorForm}
                    required
                    disabled={specializationsLoading}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-cyan-500 disabled:bg-slate-100"
                  >
                    <option value="">
                      {specializationsLoading
                        ? "Loading specializations..."
                        : "Select specialization"}
                    </option>

                    {specializationOptions.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>

                  {!specializationsLoading && specializationOptions.length === 0 && (
                    <span className="text-xs text-red-600">
                      No specializations are available. Please refresh and try again.
                    </span>
                  )}

                </label>

                <label className="space-y-1.5">

                  <span className="text-sm font-semibold text-slate-700">License number *</span>

                  <input name="licenseNumber" value={doctorForm.licenseNumber} onChange={updateDoctorForm} required maxLength={100} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-cyan-500" placeholder="MH-2026-12345" />

                </label>

                <label className="space-y-1.5">

                  <span className="text-sm font-semibold text-slate-700">Qualification</span>

                  <input name="qualification" value={doctorForm.qualification} onChange={updateDoctorForm} maxLength={150} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-cyan-500" placeholder="MBBS, MD" />

                </label>

                <label className="space-y-1.5">

                  <span className="text-sm font-semibold text-slate-700">Experience (years) *</span>

                  <input type="number" name="experienceYears" value={doctorForm.experienceYears} onChange={updateDoctorForm} required min="0" step="1" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-cyan-500" />

                </label>

                <label className="space-y-1.5">

                  <span className="text-sm font-semibold text-slate-700">Consultation fee (₹) *</span>

                  <input type="number" name="consultationFee" value={doctorForm.consultationFee} onChange={updateDoctorForm} required min="0" step="0.01" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-cyan-500" />

                </label>

              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-slate-100 p-5 sm:flex-row sm:justify-end">

                <button type="button" onClick={() => setDoctorFormOpen(false)} disabled={savingDoctor} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Cancel</button>

                <button type="submit" disabled={savingDoctor || specializationsLoading || specializationOptions.length === 0} className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50">

                  {savingDoctor ? <Loader2 size={17} className="animate-spin" /> : <Save size={17} />}

                  {savingDoctor ? "Saving..." : editingDoctor ? "Save Changes" : "Create Doctor"}

                </button>

              </div>

            </form>
      </AccessibleModal>

      {/* DOCTOR DETAILS MODAL */}
      <AccessibleModal
        isOpen={!!selectedDoctor}
        onClose={() => setSelectedDoctor(null)}
        title={selectedDoctor ? displayDoctorName(selectedDoctor.fullName) : "Doctor Profile"}
        description={selectedDoctor ? `Doctor ID: #${selectedDoctor.doctorId} · ${selectedDoctor.specializationName || "General"}` : ""}
        maxWidth="max-w-3xl"
      >
        {selectedDoctor && (
          <div>
            <div className="max-h-[75vh] space-y-6 overflow-y-auto pr-1">

              {/* DOCTOR BASIC DETAILS */}

              <div className="flex flex-col gap-4 rounded-2xl bg-cyan-50 p-5 sm:flex-row sm:items-center">

                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-cyan-700">

                  <Stethoscope size={32} />

                </div>

                <div className="flex-1">

                  <h3 className="text-xl font-extrabold text-slate-900">

                    {displayDoctorName(selectedDoctor.fullName)}

                  </h3>

                  <p className="mt-1 text-sm text-cyan-800">

                    {selectedDoctor.specializationName}

                  </p>

                  <p className="mt-1 text-xs text-slate-500">

                    {selectedDoctor.email}

                  </p>

                </div>

                <span

                  className={`w-fit rounded-full px-3 py-1.5 text-xs font-semibold ${

                    selectedDoctor.isActive

                      ? "bg-green-100 text-green-700"

                      : "bg-red-100 text-red-700"

                  }`}

                >

                  {selectedDoctor.isActive ? "Active" : "Inactive"}

                </span>

              </div>

              {/* PROFILE INFORMATION */}

              <div>

                <h3 className="mb-3 font-bold text-slate-900">

                  Professional Information

                </h3>

                <div className="grid gap-3 sm:grid-cols-2">

                  {[

                    {

                      label: "Doctor ID",

                      value: selectedDoctor.doctorId,

                      icon: UserRound,

                    },

                    {

                      label: "User ID",

                      value: selectedDoctor.userId,

                      icon: UserRound,

                    },

                    {

                      label: "Email Address",

                      value: selectedDoctor.email,

                      icon: Mail,

                    },

                    {

                      label: "Specialization",

                      value: selectedDoctor.specializationName,

                      icon: BriefcaseMedical,

                    },

                    {

                      label: "Qualification",

                      value: selectedDoctor.qualification,

                      icon: Award,

                    },

                    {

                      label: "License Number",

                      value: selectedDoctor.licenseNumber,

                      icon: Activity,

                    },

                    {

                      label: "Experience",

                      value: `${selectedDoctor.experienceYears ?? 0} years`,

                      icon: Clock,

                    },

                    {

                      label: "Consultation Fee",

                      value: `₹${selectedDoctor.consultationFee ?? "N/A"}`,

                      icon: IndianRupee,

                    },

                    {

                      label: "Registration Date",

                      value: formatDate(selectedDoctor.createdAt),

                      icon: CalendarDays,

                    },

                  ].map((item) => {

                    const Icon = item.icon;

                    return (

                      <div

                        key={item.label}

                        className="flex items-start gap-3 rounded-xl bg-slate-50 p-4"

                      >

                        <Icon

                          size={19}

                          className="mt-0.5 shrink-0 text-cyan-600"

                        />

                        <div className="min-w-0">

                          <p className="text-xs text-slate-500">

                            {item.label}

                          </p>

                          <p className="mt-1 break-words text-sm font-semibold text-slate-800">

                            {item.value ?? "Not available"}

                          </p>

                        </div>

                      </div>

                    );

                  })}

                </div>

              </div>

              {/* ACCOUNT STATUS */}

              <div className="rounded-xl border border-slate-100 p-4">

                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">

                  <div>

                    <h3 className="font-bold text-slate-900">

                      Account Management

                    </h3>

                    <p className="mt-1 text-xs text-slate-500">

                      Change this doctor's account access.

                    </p>

                  </div>

                  <button

                    type="button"

                    disabled={updatingId === selectedDoctor.userId}

                    onClick={() =>

                      handleAccountStatus(selectedDoctor)

                    }

                    className={`rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 ${

                      selectedDoctor.isActive

                        ? "bg-red-500 hover:bg-red-600"

                        : "bg-green-600 hover:bg-green-700"

                    }`}

                  >

                    {updatingId === selectedDoctor.userId

                      ? "Updating..."

                      : selectedDoctor.isActive

                        ? "Deactivate Account"

                        : "Activate Account"}

                  </button>

                </div>

              </div>

              {/* APPOINTMENT HISTORY */}

              <div>

                <div className="mb-3 flex items-center justify-between">

                  <div>

                    <h3 className="font-bold text-slate-900">

                      Appointment History

                    </h3>

                    <p className="mt-1 text-xs text-slate-500">

                      Appointments assigned to this doctor.

                    </p>

                  </div>

                  <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">

                    {appointmentsLoading

                      ? "Loading..."

                      : `${appointments.length} Records`}

                  </span>

                </div>

                {appointmentsLoading ? (

                  <div className="rounded-xl bg-slate-50 p-8 text-center text-sm text-slate-500">

                    Loading appointment history...

                  </div>

                ) : appointments.length === 0 ? (

                  <div className="rounded-xl bg-slate-50 p-8 text-center text-sm text-slate-500">

                    No appointment records found.

                  </div>

                ) : (

                  <div className="overflow-x-auto rounded-xl border border-slate-100">

                    <table className="w-full min-w-[650px] text-left">

                      <thead className="bg-slate-50 text-xs uppercase text-slate-500">

                        <tr>

                          <th className="px-4 py-3">Appointment ID</th>

                          <th className="px-4 py-3">Patient ID</th>

                          <th className="px-4 py-3">Date & Time</th>

                          <th className="px-4 py-3">Status</th>

                        </tr>

                      </thead>

                      <tbody className="divide-y divide-slate-100">

                        {appointments.map((appointment) => (

                          <tr key={appointment.appointmentId}>

                            <td className="px-4 py-3 text-sm font-semibold text-cyan-700">

                              #{appointment.appointmentId}

                            </td>

                            <td className="px-4 py-3 text-sm text-slate-600">

                              #{appointment.patientId}

                            </td>

                            <td className="px-4 py-3 text-sm text-slate-600">

                              <p>

                                {formatDate(appointment.appointmentDate)}

                              </p>

                              <p className="mt-1 text-xs text-slate-400">

                                {formatTime(appointment.appointmentTime)}

                              </p>

                            </td>

                            <td className="px-4 py-3">

                              <span

                                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${

                                  statusStyle[appointment.status] ||

                                  "bg-slate-100 text-slate-600"

                                }`}

                              >

                                {formatStatus(appointment.status)}

                              </span>

                            </td>

                          </tr>

                        ))}

                      </tbody>

                    </table>

                  </div>

                )}

              </div>

            </div>

            {/* MODAL FOOTER */}
            <div className="flex justify-end border-t border-slate-100 pt-4 mt-6">
              <button
                type="button"
                onClick={() => setSelectedDoctor(null)}
                className="rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-700"
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

export default AdminDoctors;
