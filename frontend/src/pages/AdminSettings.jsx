
import { useEffect, useState } from "react";
import {
  UserRound,
  Mail,
  ShieldCheck,
  Pencil,
  Save,
  X,
  LoaderCircle,
  LockKeyhole,
  Eye,
  EyeOff,
  Bell,
  CalendarDays,
  MessageSquare,
  FileText,
} from "lucide-react";

import toast from "react-hot-toast";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

// ==================== TOGGLE COMPONENT ====================

function PreferenceToggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
        checked ? "bg-cyan-600" : "bg-slate-300"
      } ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
    >
      <span
        className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function AdminSettings() {
  const { updateUser } = useAuth();

  // ==================== PROFILE STATE ====================

  const [profile, setProfile] = useState({
    fullName: "",
    email: "",
    role: "ADMIN",
  });

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // ==================== PASSWORD STATE ====================

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [changingPassword, setChangingPassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);

  // ==================== NOTIFICATION PREFERENCES STATE ====================

  const [preferences, setPreferences] = useState({
    allNotifications: true,
    appointmentNotifications: true,
    contactMessageNotifications: true,
    prescriptionNotifications: true,
  });

  const [preferencesLoading, setPreferencesLoading] = useState(true);
  const [savingPreferences, setSavingPreferences] = useState(false);

  // ==================== FETCH ADMIN PROFILE ====================

  const fetchProfile = async () => {
    try {
      setLoading(true);

      const response = await api.get("/admin/settings/profile");
      const data = response.data;

      setProfile({
        fullName: data.fullName || "",
        email: data.email || "",
        role: data.role || "ADMIN",
      });

      setFormData({
        fullName: data.fullName || "",
        email: data.email || "",
      });
    } catch (error) {
      console.error("Error fetching admin profile:", error);

      toast.error(
        error.response?.data?.message ||
          "Failed to load admin profile."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==================== FETCH NOTIFICATION PREFERENCES ====================

  const fetchPreferences = async () => {
    try {
      setPreferencesLoading(true);

      const response = await api.get(
        "/admin/settings/preferences"
      );

      const data = response.data;

      setPreferences({
        allNotifications: Boolean(data.allNotifications),
        appointmentNotifications: Boolean(
          data.appointmentNotifications
        ),
        contactMessageNotifications: Boolean(
          data.contactMessageNotifications
        ),
        prescriptionNotifications: Boolean(
          data.prescriptionNotifications
        ),
      });
    } catch (error) {
      console.error("Error fetching notification preferences:", error);

      toast.error(
        error.response?.data?.message ||
          "Failed to load notification preferences."
      );
    } finally {
      setPreferencesLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchPreferences();
  }, []);

  // ==================== PROFILE INPUT CHANGE ====================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ==================== EDIT PROFILE ====================

  const handleEdit = () => {
    setFormData({
      fullName: profile.fullName,
      email: profile.email,
    });

    setIsEditing(true);
  };

  // ==================== CANCEL PROFILE EDIT ====================

  const handleCancel = () => {
    setFormData({
      fullName: profile.fullName,
      email: profile.email,
    });

    setIsEditing(false);
  };

  // ==================== SAVE ADMIN PROFILE ====================

  const handleSave = async (e) => {
    e.preventDefault();

    if (!formData.fullName.trim() || !formData.email.trim()) {
      toast.error("Name and email are required.");
      return;
    }

    try {
      setSaving(true);

      const response = await api.put(
        "/admin/settings/profile",
        {
          fullName: formData.fullName.trim(),
          email: formData.email.trim(),
        }
      );

      const updatedData = response.data;

      const updatedProfile = {
        fullName:
          updatedData.fullName || formData.fullName.trim(),
        email:
          updatedData.email || formData.email.trim(),
        role: updatedData.role || profile.role,
      };

      updateUser({
        fullName: updatedProfile.fullName,
        email: updatedProfile.email,
      });

      setProfile(updatedProfile);

      setFormData({
        fullName: updatedProfile.fullName,
        email: updatedProfile.email,
      });

      setIsEditing(false);

      toast.success("Admin profile updated successfully!");
    } catch (error) {
      console.error("Error updating admin profile:", error);

      toast.error(
        error.response?.data?.message ||
          "Failed to update admin profile."
      );
    } finally {
      setSaving(false);
    }
  };

  // ==================== PASSWORD INPUT CHANGE ====================

  const handlePasswordInput = (e) => {
    const { name, value } = e.target;

    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ==================== CHANGE ADMIN PASSWORD ====================

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    const {
      currentPassword,
      newPassword,
      confirmPassword,
    } = passwordData;

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields.");
      return;
    }

    if (newPassword.length < 8 || newPassword.length > 100) {
      toast.error(
        "New password must be between 8 and 100 characters."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error(
        "New password and confirm password do not match."
      );
      return;
    }

    if (currentPassword === newPassword) {
      toast.error(
        "New password must be different from current password."
      );
      return;
    }

    try {
      setChangingPassword(true);

      const response = await api.put(
        "/admin/settings/change-password",
        {
          currentPassword,
          newPassword,
          confirmPassword,
        }
      );

      toast.success(
        typeof response.data === "string"
          ? response.data
          : "Password changed successfully!"
      );

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setShowPasswords(false);
    } catch (error) {
      console.error("Change password error:", error);

      const errorMessage =
        typeof error.response?.data === "string"
          ? error.response.data
          : error.response?.data?.message ||
            "Unable to change password. Please check your current password.";

      toast.error(errorMessage);
    } finally {
      setChangingPassword(false);
    }
  };

  // ==================== INDIVIDUAL PREFERENCE CHANGE ====================



  // ==================== MASTER PREFERENCE TOGGLE ====================

  const handleAllNotificationsChange = (checked) => {
    setPreferences({
      allNotifications: checked,
      appointmentNotifications: checked,
      contactMessageNotifications: checked,
      prescriptionNotifications: checked,
    });
  };

  // ==================== SAVE NOTIFICATION PREFERENCES ====================

  const handleSavePreferences = async () => {
    try {
      setSavingPreferences(true);

      const response = await api.put(
        "/admin/settings/preferences",
        preferences
      );

      const data = response.data;

      setPreferences({
        allNotifications: Boolean(data.allNotifications),
        appointmentNotifications: Boolean(
          data.appointmentNotifications
        ),
        contactMessageNotifications: Boolean(
          data.contactMessageNotifications
        ),
        prescriptionNotifications: Boolean(
          data.prescriptionNotifications
        ),
      });

      toast.success("Notification preferences saved successfully!");
    } catch (error) {
      console.error("Error saving notification preferences:", error);

      toast.error(
        error.response?.data?.message ||
          "Failed to save notification preferences."
      );
    } finally {
      setSavingPreferences(false);
    }
  };

  // ==================== LOADING SCREEN ====================

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <LoaderCircle
          className="animate-spin text-cyan-600"
          size={32}
        />
      </div>
    );
  }

  // ==================== UI ====================

  return (
    <div className="space-y-6">

      {/* PAGE HEADING */}

      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">
          Admin Settings
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Manage your administrator account and preferences.
        </p>
      </div>

      {/* ==================== ADMIN PROFILE ==================== */}

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">

        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-cyan-50 p-3 text-cyan-600">
              <UserRound size={24} />
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Admin Profile
              </h2>

              <p className="text-sm text-slate-500">
                View and update your administrator information.
              </p>
            </div>
          </div>

          {!isEditing && (
            <button
              type="button"
              onClick={handleEdit}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-700"
            >
              <Pencil size={16} />
              Edit Profile
            </button>
          )}
        </div>

        <form onSubmit={handleSave} className="space-y-6 p-6">

          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cyan-100 text-2xl font-bold text-cyan-700">
              {profile.fullName?.charAt(0)?.toUpperCase() || "A"}
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {profile.fullName || "Administrator"}
              </h3>

              <div className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                <ShieldCheck
                  size={15}
                  className="text-cyan-600"
                />
                Administrator Account
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Full Name
              </label>

              <div className="relative">
                <UserRound
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  disabled={!isEditing || saving}
                  placeholder="Enter full name"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-800 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:opacity-80"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Email Address
              </label>

              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={!isEditing || saving}
                  placeholder="Enter email address"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-800 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:opacity-80"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Account Role
              </label>

              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <ShieldCheck
                  size={18}
                  className="text-cyan-600"
                />

                <span className="text-sm font-medium text-slate-700">
                  {profile.role}
                </span>
              </div>
            </div>

          </div>

          {isEditing && (
            <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                <X size={16} />
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <LoaderCircle
                    size={16}
                    className="animate-spin"
                  />
                ) : (
                  <Save size={16} />
                )}

                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}

        </form>
      </div>

      {/* ==================== CHANGE PASSWORD ==================== */}

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">

        <div className="flex items-center gap-3 border-b border-slate-100 p-6">
          <div className="rounded-xl bg-cyan-50 p-3 text-cyan-600">
            <LockKeyhole size={24} />
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Change Password
            </h2>

            <p className="text-sm text-slate-500">
              Update your administrator account password.
            </p>
          </div>
        </div>

        <form
          onSubmit={handlePasswordChange}
          className="space-y-5 p-6"
        >
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Current Password
              </label>

              <input
                type={showPasswords ? "text" : "password"}
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordInput}
                placeholder="Enter current password"
                autoComplete="current-password"
                disabled={changingPassword}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 disabled:opacity-60"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                New Password
              </label>

              <input
                type={showPasswords ? "text" : "password"}
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordInput}
                placeholder="Enter new password"
                autoComplete="new-password"
                disabled={changingPassword}
                minLength={8}
                maxLength={100}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 disabled:opacity-60"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Confirm New Password
              </label>

              <input
                type={showPasswords ? "text" : "password"}
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordInput}
                placeholder="Confirm new password"
                autoComplete="new-password"
                disabled={changingPassword}
                minLength={8}
                maxLength={100}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 disabled:opacity-60"
                required
              />
            </div>

          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={() => setShowPasswords((prev) => !prev)}
              className="flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-cyan-600"
            >
              {showPasswords ? (
                <EyeOff size={17} />
              ) : (
                <Eye size={17} />
              )}

              {showPasswords ? "Hide passwords" : "Show passwords"}
            </button>

            <button
              type="submit"
              disabled={changingPassword}
              className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {changingPassword && (
                <LoaderCircle
                  size={16}
                  className="animate-spin"
                />
              )}

              {changingPassword ? "Updating..." : "Update Password"}
            </button>
          </div>

          <p className="text-xs text-slate-400">
            Your new password must contain between 8 and 100 characters.
          </p>
        </form>
      </div>

      {/* ==================== NOTIFICATION PREFERENCES ==================== */}

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">

        {/* PREFERENCES HEADER */}

        <div className="flex items-center gap-3 border-b border-slate-100 p-6">
          <div className="rounded-xl bg-cyan-50 p-3 text-cyan-600">
            <Bell size={24} />
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Notification Preferences
            </h2>

            <p className="text-sm text-slate-500">
              Choose which notification categories you want to enable.
            </p>
          </div>
        </div>

        {/* PREFERENCES CONTENT */}

        <div className="space-y-1 p-6">

          {preferencesLoading ? (
            <div className="flex min-h-[180px] items-center justify-center">
              <LoaderCircle
                className="animate-spin text-cyan-600"
                size={30}
              />
            </div>
          ) : (
            <>
              {/* ALL NOTIFICATIONS */}

              <div className="flex items-center justify-between gap-4 rounded-xl bg-cyan-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-white p-2 text-cyan-600">
                    <Bell size={20} />
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      All Notifications
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      Enable or disable all notification categories.
                    </p>
                  </div>
                </div>

                <PreferenceToggle
                  checked={preferences.allNotifications}
                  onChange={handleAllNotificationsChange}
                  disabled={savingPreferences}
                />
              </div>

              {/* APPOINTMENT NOTIFICATIONS */}

              <div className="flex items-center justify-between gap-4 border-b border-slate-100 py-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                    <CalendarDays size={20} />
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">
                      Appointment Notifications
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      Receive notifications about appointment activities.
                    </p>
                  </div>
                </div>

                <PreferenceToggle
                  checked={preferences.appointmentNotifications}
                  onChange={(checked) =>
                    handlePreferenceChange(
                      "appointmentNotifications",
                      checked
                    )
                  }
                  disabled={savingPreferences}
                />
              </div>

              {/* CONTACT MESSAGE NOTIFICATIONS */}

              <div className="flex items-center justify-between gap-4 border-b border-slate-100 py-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-purple-50 p-2 text-purple-600">
                    <MessageSquare size={20} />
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">
                      Contact Message Notifications
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      Receive notifications when new contact messages arrive.
                    </p>
                  </div>
                </div>

                <PreferenceToggle
                  checked={preferences.contactMessageNotifications}
                  onChange={(checked) =>
                    handlePreferenceChange(
                      "contactMessageNotifications",
                      checked
                    )
                  }
                  disabled={savingPreferences}
                />
              </div>

              {/* PRESCRIPTION NOTIFICATIONS */}

              <div className="flex items-center justify-between gap-4 py-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-green-50 p-2 text-green-600">
                    <FileText size={20} />
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">
                      Prescription Notifications
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      Receive notifications about prescription activities.
                    </p>
                  </div>
                </div>

                <PreferenceToggle
                  checked={preferences.prescriptionNotifications}
                  onChange={(checked) =>
                    handlePreferenceChange(
                      "prescriptionNotifications",
                      checked
                    )
                  }
                  disabled={savingPreferences}
                />
              </div>

              {/* SAVE PREFERENCES */}

              <div className="flex justify-end border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={handleSavePreferences}
                  disabled={savingPreferences}
                  className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingPreferences ? (
                    <LoaderCircle
                      size={16}
                      className="animate-spin"
                    />
                  ) : (
                    <Save size={16} />
                  )}

                  {savingPreferences
                    ? "Saving..."
                    : "Save Preferences"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

    </div>
  );
}

export default AdminSettings;
