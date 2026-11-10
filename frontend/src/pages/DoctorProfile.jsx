
import { useEffect, useState } from "react";
import {
  UserRound,
  Mail,
  BriefcaseMedical,
  GraduationCap,
  Award,
  CalendarDays,
  Pencil,
  Save,
  X,
  ShieldCheck,
  IndianRupee,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";

import api from "../services/api";

function DoctorProfile() {
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // ==========================================
  // FETCH LOGGED-IN DOCTOR PROFILE
  // ==========================================

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/doctors/me");

      setProfile(response.data);
      setFormData({
        userId: response.data.userId,
        specializationId: response.data.specializationId,
        licenseNumber: response.data.licenseNumber || "",
        qualification: response.data.qualification || "",
        experienceYears: response.data.experienceYears ?? 0,
        consultationFee: response.data.consultationFee ?? "",
      });
    } catch (err) {
      console.error("Failed to fetch doctor profile:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load your profile. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // ==========================================
  // HANDLE FORM CHANGES
  // ==========================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ==========================================
  // EDIT PROFILE
  // ==========================================

  const handleEdit = () => {
    setFormData({
      userId: profile.userId,
      specializationId: profile.specializationId,
      licenseNumber: profile.licenseNumber || "",
      qualification: profile.qualification || "",
      experienceYears: profile.experienceYears ?? 0,
      consultationFee: profile.consultationFee ?? "",
    });

    setIsEditing(true);
  };

  // ==========================================
  // CANCEL EDIT
  // ==========================================

  const handleCancel = () => {
    setFormData({
      userId: profile.userId,
      specializationId: profile.specializationId,
      licenseNumber: profile.licenseNumber || "",
      qualification: profile.qualification || "",
      experienceYears: profile.experienceYears ?? 0,
      consultationFee: profile.consultationFee ?? "",
    });

    setIsEditing(false);
  };

  // ==========================================
  // SAVE PROFILE
  // ==========================================

  const handleSave = async (e) => {
    e.preventDefault();

    if (!formData.licenseNumber.trim()) {
      toast.error("Medical license number is required.");
      return;
    }

    if (!formData.specializationId || Number(formData.specializationId) <= 0) {
      toast.error("Please enter a valid specialization ID.");
      return;
    }

    if (Number(formData.experienceYears) < 0) {
      toast.error("Experience cannot be negative.");
      return;
    }

    if (
      formData.consultationFee === "" ||
      Number(formData.consultationFee) < 0
    ) {
      toast.error("Please enter a valid consultation fee.");
      return;
    }

    const payload = {
      userId: profile.userId,
      specializationId: Number(formData.specializationId),
      licenseNumber: formData.licenseNumber.trim(),
      qualification: formData.qualification.trim(),
      experienceYears: Number(formData.experienceYears),
      consultationFee: Number(formData.consultationFee),
    };

    try {
      setSaving(true);

      const response = await api.put(
        `/doctors/${profile.doctorId}`,
        payload
      );

      setProfile(response.data);

      setFormData({
        userId: response.data.userId,
        specializationId: response.data.specializationId,
        licenseNumber: response.data.licenseNumber || "",
        qualification: response.data.qualification || "",
        experienceYears: response.data.experienceYears ?? 0,
        consultationFee: response.data.consultationFee ?? "",
      });

      setIsEditing(false);

      toast.success("Profile updated successfully!");
    } catch (err) {
      console.error("Failed to update doctor profile:", err);

      toast.error(
        err.response?.data?.message ||
          "Unable to update profile. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // DETAIL ITEM COMPONENT
  // ==========================================

  const DetailItem = ({ icon: Icon, label, value }) => (
    <div className="flex items-start gap-3">
      <div className="rounded-xl bg-cyan-50 p-3 text-cyan-600">
        <Icon size={19} />
      </div>

      <div>
        <p className="text-xs font-medium text-slate-400">
          {label}
        </p>

        <p className="mt-1 text-sm font-semibold text-slate-800">
          {value ?? "Not provided"}
        </p>
      </div>
    </div>
  );

  // ==========================================
  // FORM FIELD COMPONENT
  // ==========================================

  const FormField = ({
    label,
    name,
    type = "text",
    value,
    required = false,
    min,
    step,
    hint,
  }) => (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-sm font-semibold text-slate-700"
      >
        {label}

        {required && (
          <span className="ml-1 text-red-500">*</span>
        )}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        value={value ?? ""}
        onChange={handleChange}
        required={required}
        min={min}
        step={step}
        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
      />

      {hint && (
        <p className="mt-1 text-xs text-slate-400">
          {hint}
        </p>
      )}
    </div>
  );

  // ==========================================
  // LOADING STATE
  // ==========================================

  if (loading) {
    return (
      <div className="flex min-h-[350px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-cyan-100 border-t-cyan-600" />

          <p className="mt-4 text-sm font-medium text-slate-600">
            Loading your profile...
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // ERROR STATE
  // ==========================================

  if (error || !profile || !formData) {
    return (
      <div className="rounded-2xl border border-red-100 bg-white p-10 text-center shadow-sm">
        <UserRound size={42} className="mx-auto text-red-300" />

        <h2 className="mt-4 text-lg font-bold text-slate-800">
          Unable to Load Profile
        </h2>

        <p className="mt-2 text-sm text-red-500">
          {error || "Profile information is unavailable."}
        </p>

        <button
          onClick={fetchProfile}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white hover:bg-cyan-700"
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
      {/* PAGE HEADER */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            My Profile
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            View and update your professional information.
          </p>
        </div>

        {!isEditing && (
          <button
            onClick={handleEdit}
            className="flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700"
          >
            <Pencil size={17} />
            Edit Profile
          </button>
        )}
      </div>

      {/* PROFILE HEADER CARD */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="h-32 bg-gradient-to-r from-cyan-600 to-blue-500" />

        <div className="flex flex-col gap-5 px-6 pb-7 sm:flex-row sm:items-end">
          <div className="-mt-12 flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-white bg-cyan-50 text-3xl font-extrabold text-cyan-700 shadow-sm">
            {profile.fullName
              .split(" ")
              .filter((word) => word !== "Dr.")
              .map((word) => word.charAt(0))
              .join("")
              .slice(0, 2)}
          </div>

          <div className="flex-1 pt-2">
            <h2 className="text-xl font-bold text-slate-900">
              {profile.fullName}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {profile.specializationName}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                <ShieldCheck size={14} />
                Verified Doctor
              </span>

              <span className="text-xs text-slate-400">
                Medical Professional
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* EDIT FORM */}
      {isEditing ? (
        <form onSubmit={handleSave}>
          <div className="mt-8 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-lg font-bold text-slate-900">
              Edit Professional Information
            </h2>

            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                label="Full Name"
                name="fullName"
                value={profile.fullName}
                hint="Name changes are handled by Admin."
              />

              <FormField
                label="Email Address"
                name="email"
                type="email"
                value={profile.email}
                hint="Email changes are handled by Admin."
              />

              <FormField
                label="Specialization ID"
                name="specializationId"
                type="number"
                value={formData.specializationId}
                required
                min="1"
                hint={`Current specialization: ${profile.specializationName}`}
              />

              <FormField
                label="Qualification"
                name="qualification"
                value={formData.qualification}
              />

              <FormField
                label="Medical License Number"
                name="licenseNumber"
                value={formData.licenseNumber}
                required
              />

              <FormField
                label="Experience (Years)"
                name="experienceYears"
                type="number"
                value={formData.experienceYears}
                min="0"
                step="1"
                required
              />

              <FormField
                label="Consultation Fee (₹)"
                name="consultationFee"
                type="number"
                value={formData.consultationFee}
                min="0"
                step="0.01"
                required
              />
            </div>

            <div className="mt-7 flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                <X size={17} />
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save size={17} />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <>
          {/* PERSONAL INFORMATION */}
          <div className="mt-8 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-lg font-bold text-slate-900">
              Personal Information
            </h2>

            <div className="grid gap-6 sm:grid-cols-2">
              <DetailItem
                icon={UserRound}
                label="Full Name"
                value={profile.fullName}
              />

              <DetailItem
                icon={Mail}
                label="Email Address"
                value={profile.email}
              />

              <DetailItem
                icon={ShieldCheck}
                label="User ID"
                value={profile.userId}
              />

              <DetailItem
                icon={BriefcaseMedical}
                label="Doctor ID"
                value={profile.doctorId}
              />
            </div>
          </div>

          {/* PROFESSIONAL INFORMATION */}
          <div className="mt-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-lg font-bold text-slate-900">
              Professional Information
            </h2>

            <div className="grid gap-6 sm:grid-cols-2">
              <DetailItem
                icon={BriefcaseMedical}
                label="Specialization"
                value={profile.specializationName}
              />

              <DetailItem
                icon={GraduationCap}
                label="Qualification"
                value={profile.qualification}
              />

              <DetailItem
                icon={Award}
                label="Medical License Number"
                value={profile.licenseNumber}
              />

              <DetailItem
                icon={CalendarDays}
                label="Experience"
                value={`${profile.experienceYears} Years`}
              />

              <DetailItem
                icon={IndianRupee}
                label="Consultation Fee"
                value={
                  profile.consultationFee != null
                    ? `₹${Number(profile.consultationFee).toLocaleString("en-IN")}`
                    : "Not provided"
                }
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default DoctorProfile;
