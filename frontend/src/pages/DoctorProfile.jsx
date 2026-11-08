import { useState } from "react";
import {
  UserRound,
  Mail,
  Phone,
  MapPin,
  BriefcaseMedical,
  GraduationCap,
  Award,
  CalendarDays,
  Pencil,
  Save,
  X,
  ShieldCheck,
} from "lucide-react";
import toast from "react-hot-toast";

const initialProfile = {
  fullName: "Dr. Amit Sharma",
  email: "amit.sharma@medicare.com",
  phone: "+91 9876543210",
  specialization: "Cardiology",
  qualification: "MBBS, MD (Cardiology)",
  licenseNumber: "MH-MED-2020-12345",
  experience: "8 Years",
  gender: "Male",
  dateOfBirth: "15 June 1988",
  address: "Pune, Maharashtra, India",
  about:
    "Experienced cardiologist dedicated to providing quality healthcare and personalized treatment to patients.",
};

function DoctorProfile() {
  const [profile, setProfile] = useState(initialProfile);
  const [formData, setFormData] = useState(initialProfile);
  const [isEditing, setIsEditing] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEdit = () => {
    setFormData(profile);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setFormData(profile);
    setIsEditing(false);
  };

  const handleSave = (e) => {
    e.preventDefault();

    if (
      !formData.fullName.trim() ||
      !formData.email.trim() ||
      !formData.phone.trim()
    ) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setProfile(formData);
    setIsEditing(false);
    toast.success("Profile updated successfully!");
  };

  const DetailItem = ({ icon: Icon, label, value }) => (
    <div className="flex items-start gap-3">
      <div className="rounded-xl bg-cyan-50 p-3 text-cyan-600">
        <Icon size={19} />
      </div>

      <div>
        <p className="text-xs font-medium text-slate-400">{label}</p>
        <p className="mt-1 text-sm font-semibold text-slate-800">
          {value || "Not provided"}
        </p>
      </div>
    </div>
  );

  const FormField = ({
    label,
    name,
    type = "text",
    value,
    required = false,
  }) => (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-sm font-semibold text-slate-700"
      >
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={handleChange}
        required={required}
        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
      />
    </div>
  );

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
              {profile.specialization}
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
              Edit Personal Information
            </h2>

            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                label="Full Name"
                name="fullName"
                value={formData.fullName}
                required
              />

              <FormField
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                required
              />

              <FormField
                label="Phone Number"
                name="phone"
                type="tel"
                value={formData.phone}
                required
              />

              <FormField
                label="Gender"
                name="gender"
                value={formData.gender}
              />

              <FormField
                label="Date of Birth"
                name="dateOfBirth"
                value={formData.dateOfBirth}
              />

              <FormField
                label="Specialization"
                name="specialization"
                value={formData.specialization}
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
              />

              <FormField
                label="Experience"
                name="experience"
                value={formData.experience}
              />

              <FormField
                label="Address"
                name="address"
                value={formData.address}
              />
            </div>

            <div className="mt-5">
              <label
                htmlFor="about"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                About Me
              </label>

              <textarea
                id="about"
                name="about"
                rows="4"
                value={formData.about}
                onChange={handleChange}
                className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              />
            </div>

            <div className="mt-7 flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
              <button
                type="button"
                onClick={handleCancel}
                className="flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                <X size={17} />
                Cancel
              </button>

              <button
                type="submit"
                className="flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700"
              >
                <Save size={17} />
                Save Changes
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
                icon={Phone}
                label="Phone Number"
                value={profile.phone}
              />

              <DetailItem
                icon={UserRound}
                label="Gender"
                value={profile.gender}
              />

              <DetailItem
                icon={CalendarDays}
                label="Date of Birth"
                value={profile.dateOfBirth}
              />

              <DetailItem
                icon={MapPin}
                label="Address"
                value={profile.address}
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
                value={profile.specialization}
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
                value={profile.experience}
              />
            </div>
          </div>

          {/* ABOUT */}
          <div className="mt-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-slate-900">
              About Me
            </h2>

            <p className="text-sm leading-7 text-slate-600">
              {profile.about}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

export default DoctorProfile;