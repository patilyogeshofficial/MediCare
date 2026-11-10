import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

import {
  HeartPulse,
  LayoutDashboard,
  CalendarDays,
  Search,
  FileText,
  UserRound,
  LogOut,
  Menu,
  X,
  Clock,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Bell,
} from "lucide-react";

// Patient Navigation
const navigation = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "My Appointments", icon: CalendarDays },
  { name: "Find Doctors", icon: Search },
  { name: "My Prescriptions", icon: FileText },
  { name: "Medical History", icon: Clock },
  { name: "My Profile", icon: UserRound },
];

function PatientDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState("Dashboard");

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState(null);

  // Doctors
  const [doctors, setDoctors] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(false);
  const [doctorsError, setDoctorsError] = useState("");
  const [doctorSearch, setDoctorSearch] = useState("");

  // Prescriptions
  const [prescriptions, setPrescriptions] = useState([]);
  const [prescriptionsLoading, setPrescriptionsLoading] = useState(false);
  const [prescriptionsError, setPrescriptionsError] = useState("");

  // Medical History
  const [medicalHistory, setMedicalHistory] = useState([]);
  const [medicalHistoryLoading, setMedicalHistoryLoading] = useState(false);
  const [medicalHistoryError, setMedicalHistoryError] = useState("");

  // Patient Profile
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);

  // Notifications
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationError, setNotificationError] = useState("");
  const [markingNotificationId, setMarkingNotificationId] = useState(null);

  const [profileForm, setProfileForm] = useState({
    fullName: "",
    dateOfBirth: "",
    gender: "",
    phone: "",
    address: "",
    bloodGroup: "",
  });

  // Fetch logged-in patient's appointments
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/appointments/my");
        setAppointments(response.data);
      } catch (err) {
        console.error("Failed to fetch appointments:", err);

        setError(
          err.response?.data?.message ||
          "Unable to load appointments. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  // Fetch doctors when required sections open
  useEffect(() => {
    if (
      !["Dashboard", "My Appointments", "Find Doctors"].includes(activeMenu)
    ) {
      return;
    }

    const fetchDoctors = async () => {
      try {
        setDoctorsLoading(true);
        setDoctorsError("");

        const response = await api.get("/doctors");
        setDoctors(response.data);
      } catch (err) {
        console.error("Failed to fetch doctors:", err);

        setDoctorsError(
          err.response?.data?.message ||
          "Unable to load doctors. Please try again."
        );
      } finally {
        setDoctorsLoading(false);
      }
    };

    fetchDoctors();
  }, [activeMenu]);
  // Fetch prescriptions when My Prescriptions section opens
  useEffect(() => {
    if (activeMenu !== "My Prescriptions") {
      return;
    }

    const fetchPrescriptions = async () => {
      try {
        setPrescriptionsLoading(true);
        setPrescriptionsError("");

        const response = await api.get("/prescriptions/my");

        setPrescriptions(response.data);
      } catch (err) {
        console.error("Failed to fetch prescriptions:", err);

        setPrescriptionsError(
          err.response?.data?.message ||
          "Unable to load prescriptions. Please try again."
        );
      } finally {
        setPrescriptionsLoading(false);
      }
    };

    fetchPrescriptions();
  }, [activeMenu]);

  // Fetch medical history when Medical History section opens
  useEffect(() => {
    if (activeMenu !== "Medical History") {
      return;
    }

    const fetchMedicalHistory = async () => {
      try {
        setMedicalHistoryLoading(true);
        setMedicalHistoryError("");

        const response = await api.get("/medical-history/my");

        setMedicalHistory(response.data);
      } catch (err) {
        console.error("Failed to fetch medical history:", err);

        setMedicalHistoryError(
          err.response?.data?.message ||
          "Unable to load medical history. Please try again."
        );
      } finally {
        setMedicalHistoryLoading(false);
      }
    };

    fetchMedicalHistory();
  }, [activeMenu]);

  // Fetch patient notifications
  const fetchNotifications = async () => {
    try {
      setNotificationsLoading(true);
      setNotificationError("");

      const [notificationsResponse, countResponse] = await Promise.all([
        api.get("/notifications/my"),
        api.get("/notifications/unread-count"),
      ]);

      setNotifications(notificationsResponse.data);
      setUnreadCount(Number(countResponse.data) || 0);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
      setNotificationError(
        err.response?.data?.message || "Unable to load notifications."
      );
    } finally {
      setNotificationsLoading(false);
    }
  };

  // Load notifications when component mounts
  useEffect(() => {
    fetchNotifications();
  }, []);

  // Mark notification as read
  const handleMarkNotificationAsRead = async (notificationId) => {
    const selectedNotification = notifications.find(
      (notification) => notification.notificationId === notificationId
    );

    if (!selectedNotification || selectedNotification.isRead) return;

    try {
      setMarkingNotificationId(notificationId);
      const response = await api.patch(
        `/notifications/${notificationId}/read`
      );

      setNotifications((previousNotifications) =>
        previousNotifications.map((notification) =>
          notification.notificationId === notificationId
            ? response.data
            : notification
        )
      );

      const countResponse = await api.get("/notifications/unread-count");
      setUnreadCount(Number(countResponse.data) || 0);
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
      toast.error(
        err.response?.data?.message || "Unable to update notification."
      );
    } finally {
      setMarkingNotificationId(null);
    }
  };

  // Mark all unread notifications as read
  const handleMarkAllNotificationsAsRead = async () => {
    const unreadNotifications = notifications.filter(
      (notification) => !notification.isRead
    );

    if (unreadNotifications.length === 0) {
      return;
    }

    try {
      setMarkingNotificationId("all");

      const updatedNotifications = await Promise.all(
        unreadNotifications.map((notification) =>
          api.patch(`/notifications/${notification.notificationId}/read`)
        )
      );

      const updatedById = new Map(
        updatedNotifications.map((response) => [
          response.data.notificationId,
          response.data,
        ])
      );

      setNotifications((previousNotifications) =>
        previousNotifications.map(
          (notification) =>
            updatedById.get(notification.notificationId) || notification
        )
      );

      setUnreadCount(0);
      toast.success("All notifications marked as read.");
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
      toast.error(
        err.response?.data?.message ||
          "Unable to mark all notifications as read."
      );
      fetchNotifications();
    } finally {
      setMarkingNotificationId(null);
    }
  };

  // Display notification time in a readable relative format
  const getNotificationTimeAgo = (createdAt) => {
    const createdTime = new Date(createdAt).getTime();
    const differenceInSeconds = Math.max(
      0,
      Math.floor((Date.now() - createdTime) / 1000)
    );

    if (differenceInSeconds < 60) {
      return "Just now";
    }

    const minutes = Math.floor(differenceInSeconds / 60);
    if (minutes < 60) {
      return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
    }

    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `${hours} hour${hours === 1 ? "" : "s"} ago`;
    }

    const days = Math.floor(hours / 24);
    if (days < 7) {
      return `${days} day${days === 1 ? "" : "s"} ago`;
    }

    return new Date(createdAt).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Fetch patient profile when My Profile section opens
  useEffect(() => {
    if (activeMenu !== "My Profile") {
      return;
    }

    const fetchMyProfile = async () => {
      try {
        setProfileLoading(true);
        setProfileError("");

        const response = await api.get("/patients/my-profile");

        const data = response.data;

        setProfile(data);

        setProfileForm({
          fullName: data.fullName || "",
          dateOfBirth: data.dateOfBirth || "",
          gender: data.gender || "",
          phone: data.phone || "",
          address: data.address || "",
          bloodGroup: data.bloodGroup || "",
        });
      } catch (err) {
        console.error("Failed to fetch patient profile:", err);

        setProfileError(
          err.response?.data?.message ||
          "Unable to load your profile. Please try again."
        );
      } finally {
        setProfileLoading(false);
      }
    };

    fetchMyProfile();
  }, [activeMenu]);

  // Filter doctors by name, specialization, or qualification
  const filteredDoctors = doctors.filter((doctor) => {
    const searchTerm = doctorSearch.toLowerCase().trim();

    return (
      doctor.fullName?.toLowerCase().includes(searchTerm) ||
      doctor.specializationName?.toLowerCase().includes(searchTerm) ||
      doctor.qualification?.toLowerCase().includes(searchTerm)
    );
  });

  // Get doctor details using doctor ID
  const getDoctorDetails = (doctorId) => {
    return doctors.find((doctor) => doctor.doctorId === doctorId);
  };

  // Logout
  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully!");
    navigate("/");
  };

  // Cancel patient's own appointment
  const handleCancelAppointment = async (appointmentId) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this appointment?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setCancellingId(appointmentId);

      const response = await api.patch(
        `/appointments/${appointmentId}/cancel`
      );

      setAppointments((previousAppointments) =>
        previousAppointments.map((appointment) =>
          appointment.appointmentId === appointmentId
            ? {
              ...appointment,
              status: response.data.status,
            }
            : appointment
        )
      );

      toast.success("Appointment cancelled successfully!");
    } catch (err) {
      console.error("Appointment cancellation failed:", err);

      toast.error(
        err.response?.data?.message ||
        "Unable to cancel appointment. Please try again."
      );
    } finally {
      setCancellingId(null);
    }
  };
  // Update patient profile
  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    try {
      setProfileSaving(true);

      const payload = {
        fullName: profileForm.fullName.trim(),
        dateOfBirth: profileForm.dateOfBirth || null,
        gender: profileForm.gender || null,
        phone: profileForm.phone || null,
        address: profileForm.address || null,
        bloodGroup: profileForm.bloodGroup || null,
      };

      const response = await api.put("/patients/my-profile", payload);

      setProfile(response.data);

      setProfileForm({
        fullName: response.data.fullName || "",
        dateOfBirth: response.data.dateOfBirth || "",
        gender: response.data.gender || "",
        phone: response.data.phone || "",
        address: response.data.address || "",
        bloodGroup: response.data.bloodGroup || "",
      });

      setIsEditingProfile(false);

      toast.success("Profile updated successfully!");
    } catch (err) {
      console.error("Failed to update profile:", err);

      toast.error(
        err.response?.data?.message ||
        "Unable to update profile. Please try again."
      );
    } finally {
      setProfileSaving(false);
    }
  };

  // Get today's date in local timezone
  const now = new Date();

  const today = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");

  // Appointment statistics
  const totalAppointments = appointments.length;

  const pendingAppointments = appointments.filter(
    (appointment) => appointment.status === "PENDING"
  ).length;

  const confirmedAppointments = appointments.filter(
    (appointment) => appointment.status === "CONFIRMED"
  ).length;

  const completedAppointments = appointments.filter(
    (appointment) => appointment.status === "COMPLETED"
  ).length;

  // Upcoming appointments
  const upcomingAppointments = appointments
    .filter(
      (appointment) =>
        appointment.appointmentDate >= today &&
        ["PENDING", "CONFIRMED"].includes(appointment.status)
    )
    .sort((a, b) => {
      const dateA = `${a.appointmentDate}T${a.appointmentTime}`;
      const dateB = `${b.appointmentDate}T${b.appointmentTime}`;

      return dateA.localeCompare(dateB);
    })
    .slice(0, 5);

  // Format date
  const formatDate = (date) => {
    return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Format time
  const formatTime = (time) => {
    const [hours, minutes] = time.split(":");

    return new Date(2000, 0, 1, hours, minutes).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Status styling
  const getStatusStyle = (status) => {
    switch (status) {
      case "CONFIRMED":
        return "bg-green-50 text-green-700";

      case "PENDING":
        return "bg-orange-50 text-orange-700";

      case "COMPLETED":
        return "bg-cyan-50 text-cyan-700";

      case "CANCELLED":
      case "REJECTED":
        return "bg-red-50 text-red-700";

      default:
        return "bg-slate-50 text-slate-700";
    }
  };

  // Statistics cards
  const stats = [
    {
      title: "Total Appointments",
      value: totalAppointments,
      icon: CalendarDays,
      color: "bg-cyan-50 text-cyan-600",
      change: "All appointments",
    },
    {
      title: "Upcoming Appointments",
      value: upcomingAppointments.length,
      icon: Clock,
      color: "bg-cyan-50 text-cyan-600",
      change: "Scheduled visits",
    },
    {
      title: "Completed Appointments",
      value: completedAppointments,
      icon: CheckCircle,
      color: "bg-green-50 text-green-600",
      change: "Successfully completed",
    },
    {
      title: "Pending Appointments",
      value: pendingAppointments,
      icon: AlertCircle,
      color: "bg-orange-50 text-orange-600",
      change: "Awaiting confirmation",
    },
  ];

  // Sidebar navigation
  const handleMenuClick = (menuName) => {
    setActiveMenu(menuName);
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* MOBILE OVERLAY */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-100 bg-white transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        {/* LOGO */}
        <div className="flex h-20 items-center justify-between border-b border-slate-100 px-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-cyan-600 p-2.5 text-white">
              <HeartPulse size={24} />
            </div>

            <div>
              <h1 className="text-xl font-extrabold text-slate-900">
                Medi<span className="text-cyan-600">Care</span>
              </h1>

              <p className="text-xs text-slate-500">Patient Portal</p>
            </div>
          </div>

          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* NAVIGATION */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <p className="mb-4 px-3 text-xs font-bold uppercase tracking-wider text-slate-400">
            Patient Menu
          </p>

          <nav className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.name}
                  onClick={() => handleMenuClick(item.name)}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${activeMenu === item.name
                    ? "bg-cyan-50 text-cyan-700"
                    : "text-slate-600 hover:bg-slate-50"
                    }`}
                >
                  <Icon size={19} />
                  {item.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* LOGOUT */}
        <div className="border-t border-slate-100 p-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
          >
            <LogOut size={19} />
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="min-h-screen lg:ml-64">
        {/* TOPBAR */}
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-100 bg-white px-5 sm:px-8">
          {/* LEFT */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
              aria-label="Open sidebar"
            >
              <Menu size={24} />
            </button>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{activeMenu}</h2>
              <p className="hidden text-xs text-slate-500 sm:block">
                Welcome to your MediCare Patient Portal
              </p>
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-3 sm:gap-5">
            {/* NOTIFICATIONS */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  const nextOpen = !notificationOpen;
                  setNotificationOpen(nextOpen);
                  if (nextOpen) fetchNotifications();
                }}
                className="relative rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
                aria-label="Notifications"
                aria-expanded={notificationOpen}
              >
                <Bell size={23} />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>

              {/* NOTIFICATION DROPDOWN */}
              {notificationOpen && (
                <div className="fixed right-3 top-24 z-50 w-[calc(100vw-1.5rem)] overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl sm:absolute sm:right-0 sm:top-14 sm:w-[min(560px,calc(100vw-2rem))]">
                  {/* HEADER */}
                  <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4 sm:px-6 sm:py-5">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-lg font-extrabold text-slate-900 sm:text-xl">
                          Notifications
                        </h3>

                        {unreadCount > 0 && (
                          <span className="rounded-full bg-cyan-50 px-4 py-1.5 text-sm font-bold text-cyan-700">
                            {unreadCount} New
                          </span>
                        )}
                      </div>

                      <p className="mt-1.5 text-xs text-slate-400 sm:text-sm">
                        Stay updated with your healthcare activities.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setNotificationOpen(false)}
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                      aria-label="Close notifications"
                    >
                      <X size={23} />
                    </button>
                  </div>

                  {/* ACTION BAR */}
                  {!notificationsLoading &&
                    !notificationError &&
                    notifications.length > 0 && (
                      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3 sm:px-6">
                        <button
                          type="button"
                          onClick={handleMarkAllNotificationsAsRead}
                          disabled={
                            unreadCount === 0 || markingNotificationId !== null
                          }
                          className="flex items-center gap-2 text-sm font-bold text-cyan-700 transition hover:text-cyan-900 disabled:cursor-not-allowed disabled:opacity-40 sm:text-base"
                        >
                          <CheckCircle size={20} />
                          {markingNotificationId === "all"
                            ? "Marking all as read..."
                            : "Mark all as read"}
                        </button>

                        <span className="text-xs font-medium text-slate-400 sm:text-sm">
                          {notifications.length} total
                        </span>
                      </div>
                    )}

                  {/* NOTIFICATION LIST */}
                  <div className="max-h-[min(55vh,420px)] overflow-y-auto">
                    {notificationsLoading ? (
                      <p className="p-10 text-center text-sm text-slate-500">
                        Loading notifications...
                      </p>
                    ) : notificationError ? (
                      <div className="p-8 text-center">
                        <p className="text-sm text-red-500">
                          {notificationError}
                        </p>
                        <button
                          type="button"
                          onClick={fetchNotifications}
                          className="mt-3 text-sm font-semibold text-cyan-700"
                        >
                          Try Again
                        </button>
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="p-10 text-center">
                        <Bell
                          size={38}
                          className="mx-auto text-slate-300"
                        />
                        <p className="mt-3 text-base font-bold text-slate-700">
                          No notifications
                        </p>
                        <p className="mt-1 text-sm text-slate-400">
                          You're all caught up!
                        </p>
                      </div>
                    ) : (
                      notifications.map((notification) => {
                        const notificationType = (
                          notification.type || ""
                        ).toUpperCase();

                        let NotificationIcon = CalendarDays;
                        let iconStyle = "bg-cyan-50 text-cyan-600";

                        if (
                          notificationType.includes("CONFIRMED") ||
                          notificationType.includes("COMPLETED")
                        ) {
                          NotificationIcon = CheckCircle;
                          iconStyle = "bg-green-50 text-green-600";
                        } else if (
                          notificationType.includes("CANCELLED") ||
                          notificationType.includes("REJECTED")
                        ) {
                          NotificationIcon = AlertCircle;
                          iconStyle = "bg-red-50 text-red-600";
                        } else if (
                          notificationType.includes("PRESCRIPTION")
                        ) {
                          NotificationIcon = FileText;
                          iconStyle = "bg-violet-50 text-violet-600";
                        } else if (
                          notificationType.includes("UPCOMING")
                        ) {
                          NotificationIcon = Clock;
                          iconStyle = "bg-orange-50 text-orange-600";
                        }

                        return (
                          <button
                            key={notification.notificationId}
                            type="button"
                            disabled={
                              notification.isRead ||
                              markingNotificationId ===
                                notification.notificationId ||
                              markingNotificationId === "all"
                            }
                            onClick={() =>
                              handleMarkNotificationAsRead(
                                notification.notificationId
                              )
                            }
                            className={`flex w-full items-start gap-3 border-b border-slate-100 px-5 py-4 text-left transition hover:bg-slate-50 sm:gap-4 sm:px-6 sm:py-4 ${
                              !notification.isRead
                                ? "bg-cyan-50/30"
                                : "bg-white"
                            } disabled:cursor-default`}
                          >
                            <div
                              className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-12 ${iconStyle}`}
                            >
                              <NotificationIcon size={22} />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-3">
                                <p className="text-sm font-extrabold text-slate-800 sm:text-base">
                                  {notification.title}
                                </p>

                                {!notification.isRead && (
                                  <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-cyan-600" />
                                )}
                              </div>

                              <p className="mt-1.5 text-xs leading-5 text-slate-500 sm:text-sm sm:leading-6">
                                {notification.message}
                              </p>

                              <p className="mt-2 text-[11px] font-medium text-slate-400 sm:text-xs">
                                {getNotificationTimeAgo(
                                  notification.createdAt
                                )}
                              </p>

                              {!notification.isRead &&
                                markingNotificationId ===
                                  notification.notificationId && (
                                  <p className="mt-2 text-xs font-semibold text-cyan-700">
                                    Marking as read...
                                  </p>
                                )}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>

                  {/* FOOTER */}
                  <div className="border-t border-slate-100 bg-slate-50 px-5 py-3 text-center sm:py-3">
                    <p className="text-sm font-medium text-slate-400">
                      MediCare Patient Portal
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* PATIENT PROFILE */}
            <div className="flex items-center gap-3 border-l border-slate-100 pl-4">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-bold text-slate-800">
                  {user?.fullName || "Patient"}
                </p>
                <p className="text-xs text-slate-500">Patient</p>
              </div>
              <button
                onClick={() => {
                  setActiveMenu("My Profile");
                  setSidebarOpen(false);
                  setNotificationOpen(false);
                }}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-100 font-bold text-cyan-700 transition hover:bg-cyan-200 hover:ring-2 hover:ring-cyan-300"
                title="View My Profile"
                aria-label="Open My Profile"
              >
                {user?.fullName?.charAt(0)?.toUpperCase() || "P"}
              </button>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <div className="p-5 sm:p-8">
          {/* ===================================== */}
          {/* DASHBOARD */}
          {/* ===================================== */}

          {activeMenu === "Dashboard" && (
            <>
              {/* PAGE INTRO */}
              <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900">
                    Patient Dashboard
                  </h1>

                  <p className="mt-1 text-sm text-slate-500">
                    Manage your appointments and healthcare activities.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600">
                  <CalendarDays className="mr-2 inline" size={17} />
                  {now.toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </div>
              </div>

              {/* STATISTICS CARDS */}
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {stats.map((stat) => {
                  const Icon = stat.icon;

                  return (
                    <div
                      key={stat.title}
                      className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                    >
                      <div className="flex items-center justify-between">
                        <div className={`rounded-xl p-3 ${stat.color}`}>
                          <Icon size={23} />
                        </div>

                        <span className="flex items-center gap-1 text-xs font-semibold text-green-600">
                          <TrendingUp size={14} />
                          {stat.change}
                        </span>
                      </div>

                      <p className="mt-5 text-sm font-medium text-slate-500">
                        {stat.title}
                      </p>

                      <h3 className="mt-1 text-3xl font-extrabold text-slate-900">
                        {loading ? "..." : stat.value}
                      </h3>
                    </div>
                  );
                })}
              </div>

              {/* APPOINTMENT OVERVIEW */}
              <div className="mt-8 grid gap-6 xl:grid-cols-3">
                {/* APPOINTMENT STATUS */}
                <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm xl:col-span-2">
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">
                        Appointment Overview
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        Your appointment statistics
                      </p>
                    </div>

                    <CalendarDays className="text-cyan-600" size={23} />
                  </div>

                  {loading ? (
                    <p className="py-8 text-center text-sm text-slate-500">
                      Loading appointment statistics...
                    </p>
                  ) : error ? (
                    <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">
                      {error}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {[
                        {
                          label: "Confirmed",
                          value: confirmedAppointments,
                          color: "bg-green-500",
                        },
                        {
                          label: "Pending",
                          value: pendingAppointments,
                          color: "bg-orange-400",
                        },
                        {
                          label: "Completed",
                          value: completedAppointments,
                          color: "bg-cyan-500",
                        },
                      ].map((item) => {
                        const percentage =
                          totalAppointments > 0
                            ? (item.value / totalAppointments) * 100
                            : 0;

                        return (
                          <div key={item.label}>
                            <div className="mb-2 flex justify-between text-sm">
                              <span className="font-semibold text-slate-700">
                                {item.label}
                              </span>

                              <span className="font-bold text-slate-600">
                                {item.value}
                              </span>
                            </div>

                            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className={`h-full rounded-full ${item.color}`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* QUICK SUMMARY */}
                <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900">
                    Quick Summary
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Your healthcare activity
                  </p>

                  <div className="mt-6 space-y-5">
                    <div className="flex items-center gap-4">
                      <div className="rounded-xl bg-green-50 p-3 text-green-600">
                        <CheckCircle size={22} />
                      </div>

                      <div>
                        <p className="text-xl font-bold text-slate-900">
                          {loading ? "..." : confirmedAppointments}
                        </p>

                        <p className="text-sm text-slate-500">Confirmed</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="rounded-xl bg-orange-50 p-3 text-orange-600">
                        <Clock size={22} />
                      </div>

                      <div>
                        <p className="text-xl font-bold text-slate-900">
                          {loading ? "..." : pendingAppointments}
                        </p>

                        <p className="text-sm text-slate-500">
                          Awaiting Confirmation
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="rounded-xl bg-cyan-50 p-3 text-cyan-600">
                        <CheckCircle size={22} />
                      </div>

                      <div>
                        <p className="text-xl font-bold text-slate-900">
                          {loading ? "..." : completedAppointments}
                        </p>

                        <p className="text-sm text-slate-500">Completed</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="rounded-xl bg-cyan-50 p-3 text-cyan-600">
                        <CalendarDays size={22} />
                      </div>

                      <div>
                        <p className="text-xl font-bold text-slate-900">
                          {loading ? "..." : upcomingAppointments.length}
                        </p>

                        <p className="text-sm text-slate-500">Upcoming</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* UPCOMING APPOINTMENTS TABLE */}
              <div className="mt-8 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                <div className="border-b border-slate-100 p-6">
                  <h3 className="text-lg font-bold text-slate-900">
                    Upcoming Appointments
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Your scheduled doctor consultations
                  </p>
                </div>

                {loading ? (
                  <div className="p-8 text-center text-sm text-slate-500">
                    Loading appointments...
                  </div>
                ) : error ? (
                  <div className="p-6 text-sm text-red-600">{error}</div>
                ) : upcomingAppointments.length === 0 ? (
                  <div className="p-8 text-center">
                    <CalendarDays
                      size={35}
                      className="mx-auto text-slate-300"
                    />

                    <p className="mt-3 font-semibold text-slate-700">
                      No upcoming appointments
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      Book an appointment with a doctor to get started.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[750px] text-left">
                      <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                        <tr>
                          <th className="px-6 py-4 font-semibold">
                            Appointment ID
                          </th>

                          <th className="px-6 py-4 font-semibold">Doctor</th>

                          <th className="px-6 py-4 font-semibold">
                            Date & Time
                          </th>

                          <th className="px-6 py-4 font-semibold">Reason</th>

                          <th className="px-6 py-4 font-semibold">Status</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {upcomingAppointments.map((appointment) => (
                          <tr
                            key={appointment.appointmentId}
                            className="transition hover:bg-slate-50"
                          >
                            <td className="px-6 py-4 text-sm font-semibold text-cyan-700">
                              #{appointment.appointmentId}
                            </td>

                            <td className="px-6 py-4 text-sm font-semibold text-slate-800">
                              {getDoctorDetails(appointment.doctorId) ? (
                                <div>
                                  <p className="font-semibold text-slate-800">
                                    {
                                      getDoctorDetails(appointment.doctorId)
                                        .fullName
                                    }
                                  </p>

                                  <p className="mt-1 text-xs font-medium text-cyan-600">
                                    {
                                      getDoctorDetails(appointment.doctorId)
                                        .specializationName
                                    }
                                  </p>
                                </div>
                              ) : (
                                <span>Loading doctor details...</span>
                              )}
                            </td>

                            <td className="px-6 py-4 text-sm text-slate-600">
                              <p>
                                {formatDate(appointment.appointmentDate)}
                              </p>

                              <p className="mt-1 text-xs text-slate-400">
                                {formatTime(appointment.appointmentTime)}
                              </p>
                            </td>

                            <td className="px-6 py-4 text-sm text-slate-600">
                              {appointment.reason}
                            </td>

                            <td className="px-6 py-4">
                              <span
                                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${getStatusStyle(
                                  appointment.status
                                )}`}
                              >
                                {appointment.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* QUICK ACTIONS */}
              <div className="mt-8 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900">
                  Quick Actions
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Manage your healthcare activities.
                </p>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <button
                    onClick={() => navigate("/patient/appointments/book")}
                    className="flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-5 py-4 font-semibold text-white transition hover:bg-cyan-700"
                  >
                    <CalendarDays size={20} />
                    Book Appointment
                  </button>

                  <button
                    onClick={() => handleMenuClick("Find Doctors")}
                    className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-4 font-semibold text-slate-600 transition hover:bg-slate-50"
                  >
                    <Search size={20} />
                    Find a Doctor
                  </button>
                </div>
              </div>

              {/* FOOTER */}
              <footer className="mt-8 pb-4 text-center text-sm text-slate-400">
                © 2026 MediCare Healthcare Administration Console. All rights
                reserved.
              </footer>
            </>
          )}

          {/* ===================================== */}
          {/* MY APPOINTMENTS */}
          {/* ===================================== */}

          {activeMenu === "My Appointments" && (
            <div>
              {/* PAGE HEADER */}
              <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900">
                    My Appointments
                  </h1>

                  <p className="mt-1 text-sm text-slate-500">
                    View all your scheduled and previous appointments.
                  </p>
                </div>

                <button
                  onClick={() => navigate("/patient/appointments/book")}
                  className="flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700"
                >
                  <CalendarDays size={18} />
                  Book Appointment
                </button>
              </div>

              {/* APPOINTMENT SUMMARY */}
              <div className="mb-8 grid gap-5 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                  <p className="text-sm text-slate-500">Total Appointments</p>

                  <h3 className="mt-2 text-3xl font-bold text-slate-900">
                    {loading ? "..." : appointments.length}
                  </h3>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                  <p className="text-sm text-slate-500">Upcoming</p>

                  <h3 className="mt-2 text-3xl font-bold text-cyan-600">
                    {loading ? "..." : upcomingAppointments.length}
                  </h3>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                  <p className="text-sm text-slate-500">Completed</p>

                  <h3 className="mt-2 text-3xl font-bold text-green-600">
                    {loading ? "..." : completedAppointments}
                  </h3>
                </div>
              </div>

              {/* APPOINTMENT TABLE */}
              <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                <div className="border-b border-slate-100 p-6">
                  <h2 className="text-lg font-bold text-slate-900">
                    Appointment History
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    All your appointments in one place.
                  </p>
                </div>

                {loading ? (
                  <div className="p-10 text-center text-sm text-slate-500">
                    Loading appointments...
                  </div>
                ) : error ? (
                  <div className="p-6 text-sm text-red-600">{error}</div>
                ) : appointments.length === 0 ? (
                  <div className="p-10 text-center">
                    <CalendarDays
                      size={42}
                      className="mx-auto text-slate-300"
                    />

                    <h3 className="mt-4 font-bold text-slate-800">
                      No appointments found
                    </h3>

                    <p className="mt-2 text-sm text-slate-500">
                      You haven't booked any appointments yet.
                    </p>

                    <button
                      onClick={() => navigate("/patient/appointments/book")}
                      className="mt-5 rounded-xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white hover:bg-cyan-700"
                    >
                      Book Your First Appointment
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px] text-left">
                      <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                        <tr>
                          <th className="px-6 py-4 font-semibold">
                            Appointment ID
                          </th>

                          <th className="px-6 py-4 font-semibold">Doctor</th>

                          <th className="px-6 py-4 font-semibold">
                            Date & Time
                          </th>

                          <th className="px-6 py-4 font-semibold">Reason</th>

                          <th className="px-6 py-4 font-semibold">Status</th>

                          <th className="px-6 py-4 font-semibold">Action</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {appointments
                          .slice()
                          .sort((a, b) => {
                            const dateA = `${a.appointmentDate}T${a.appointmentTime}`;
                            const dateB = `${b.appointmentDate}T${b.appointmentTime}`;

                            return dateB.localeCompare(dateA);
                          })
                          .map((appointment) => (
                            <tr
                              key={appointment.appointmentId}
                              className="transition hover:bg-slate-50"
                            >
                              <td className="px-6 py-4 text-sm font-semibold text-cyan-700">
                                #{appointment.appointmentId}
                              </td>

                              <td className="px-6 py-4 text-sm font-semibold text-slate-800">
                                {getDoctorDetails(appointment.doctorId) ? (
                                  <div>
                                    <p className="font-semibold text-slate-800">
                                      {
                                        getDoctorDetails(appointment.doctorId)
                                          .fullName
                                      }
                                    </p>

                                    <p className="mt-1 text-xs font-medium text-cyan-600">
                                      {
                                        getDoctorDetails(appointment.doctorId)
                                          .specializationName
                                      }
                                    </p>
                                  </div>
                                ) : (
                                  <span>Loading doctor details...</span>
                                )}
                              </td>

                              <td className="px-6 py-4 text-sm text-slate-600">
                                <p>
                                  {formatDate(appointment.appointmentDate)}
                                </p>

                                <p className="mt-1 text-xs text-slate-400">
                                  {formatTime(appointment.appointmentTime)}
                                </p>
                              </td>

                              <td className="px-6 py-4 text-sm text-slate-600">
                                {appointment.reason}
                              </td>

                              <td className="px-6 py-4">
                                <span
                                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${getStatusStyle(
                                    appointment.status
                                  )}`}
                                >
                                  {appointment.status}
                                </span>
                              </td>

                              {/* CANCEL APPOINTMENT ACTION */}
                              <td className="px-6 py-4">
                                {["PENDING", "CONFIRMED"].includes(
                                  appointment.status
                                ) ? (
                                  <button
                                    onClick={() =>
                                      handleCancelAppointment(
                                        appointment.appointmentId
                                      )
                                    }
                                    disabled={
                                      cancellingId === appointment.appointmentId
                                    }
                                    className="rounded-lg bg-red-50 px-4 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    {cancellingId === appointment.appointmentId
                                      ? "Cancelling..."
                                      : "Cancel"}
                                  </button>
                                ) : (
                                  <span className="text-xs text-slate-400">
                                    Not available
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
            </div>
          )}

          {/* ===================================== */}
          {/* FIND DOCTORS */}
          {/* ===================================== */}

          {activeMenu === "Find Doctors" && (
            <div>
              {/* PAGE INTRO */}
              <div className="mb-8">
                <h1 className="text-2xl font-extrabold text-slate-900">
                  Find Doctors
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Find experienced doctors and explore their specializations.
                </p>
              </div>

              {/* SEARCH BAR */}
              <div className="mb-8 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <div className="relative">
                  <Search
                    size={20}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="text"
                    value={doctorSearch}
                    onChange={(e) => setDoctorSearch(e.target.value)}
                    placeholder="Search by doctor name, specialization..."
                    className="w-full rounded-xl border border-slate-200 py-3 pl-12 pr-4 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                  />
                </div>
              </div>

              {/* LOADING */}
              {doctorsLoading && (
                <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
                  <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-cyan-100 border-t-cyan-600" />

                  <p className="mt-4 text-sm text-slate-500">
                    Loading doctors...
                  </p>
                </div>
              )}

              {/* ERROR */}
              {!doctorsLoading && doctorsError && (
                <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center">
                  <p className="font-semibold text-red-700">{doctorsError}</p>

                  <button
                    onClick={() => setActiveMenu("Dashboard")}
                    className="mt-4 rounded-lg bg-cyan-600 px-5 py-2 text-sm font-semibold text-white hover:bg-cyan-700"
                  >
                    Back to Dashboard
                  </button>
                </div>
              )}

              {/* DOCTOR CARDS */}
              {!doctorsLoading && !doctorsError && (
                <>
                  <div className="mb-5 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-800">
                      Available Doctors
                    </h2>

                    <span className="rounded-full bg-cyan-50 px-3 py-1 text-sm font-semibold text-cyan-700">
                      {filteredDoctors.length} Doctors
                    </span>
                  </div>

                  {filteredDoctors.length === 0 ? (
                    <div className="rounded-2xl border border-slate-100 bg-white p-12 text-center shadow-sm">
                      <Search
                        size={40}
                        className="mx-auto text-slate-300"
                      />

                      <p className="mt-4 font-semibold text-slate-800">
                        No doctors found
                      </p>

                      <p className="mt-2 text-sm text-slate-500">
                        Try searching with another name or specialization.
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                      {filteredDoctors.map((doctor) => (
                        <div
                          key={doctor.doctorId}
                          className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                        >
                          {/* CARD HEADER */}
                          <div className="flex items-center gap-4 border-b border-slate-100 p-5">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-cyan-50 text-cyan-700">
                              <UserRound size={28} />
                            </div>

                            <div className="min-w-0">
                              <h3 className="truncate font-bold text-slate-900">
                                {doctor.fullName}
                              </h3>

                              <p className="mt-1 text-sm font-medium text-cyan-700">
                                {doctor.specializationName}
                              </p>
                            </div>
                          </div>

                          {/* CARD DETAILS */}
                          <div className="space-y-4 p-5">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Qualification
                              </p>

                              <p className="mt-1 text-sm font-medium text-slate-700">
                                {doctor.qualification || "Not specified"}
                              </p>
                            </div>

                            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                              <div>
                                <p className="text-xs text-slate-400">
                                  Experience
                                </p>

                                <p className="mt-1 text-sm font-bold text-slate-800">
                                  {doctor.experienceYears ?? 0} Years
                                </p>
                              </div>

                              <div className="text-right">
                                <p className="text-xs text-slate-400">
                                  Consultation Fee
                                </p>

                                <p className="mt-1 text-lg font-extrabold text-cyan-700">
                                  ₹
                                  {Number(
                                    doctor.consultationFee || 0
                                  ).toLocaleString("en-IN")}
                                </p>
                              </div>
                            </div>

                            {/* BOOK APPOINTMENT */}
                            <button
                              onClick={() =>
                                navigate("/patient/appointments/book", {
                                  state: {
                                    doctorId: doctor.doctorId,
                                    doctorName: doctor.fullName,
                                  },
                                })
                              }
                              className="w-full rounded-xl bg-cyan-600 py-3 text-sm font-bold text-white transition hover:bg-cyan-700"
                            >
                              Book Appointment
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}



          {/* ===================================== */}
          {/* MY PRESCRIPTIONS */}
          {/* ===================================== */}

          {activeMenu === "My Prescriptions" && (
            <div>
              <div className="mb-8">
                <h1 className="text-2xl font-extrabold text-slate-900">
                  My Prescriptions
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  View your prescriptions, medicines and doctor's instructions.
                </p>
              </div>

              {prescriptionsLoading && (
                <div className="rounded-2xl border border-slate-100 bg-white p-10 text-center shadow-sm">
                  <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-cyan-100 border-t-cyan-600" />
                  <p className="mt-4 text-sm text-slate-500">
                    Loading your prescriptions...
                  </p>
                </div>
              )}

              {!prescriptionsLoading && prescriptionsError && (
                <div className="rounded-2xl border border-red-100 bg-red-50 p-6">
                  <p className="font-semibold text-red-700">
                    Unable to load prescriptions
                  </p>
                  <p className="mt-2 text-sm text-red-600">
                    {prescriptionsError}
                  </p>
                  <button
                    onClick={() => setActiveMenu("Dashboard")}
                    className="mt-4 rounded-lg bg-cyan-600 px-5 py-2 text-sm font-semibold text-white hover:bg-cyan-700"
                  >
                    Back to Dashboard
                  </button>
                </div>
              )}

              {!prescriptionsLoading &&
                !prescriptionsError &&
                prescriptions.length === 0 && (
                  <div className="rounded-2xl border border-slate-100 bg-white p-10 text-center shadow-sm">
                    <FileText size={44} className="mx-auto text-cyan-600" />
                    <h3 className="mt-4 font-bold text-slate-800">
                      No prescriptions available
                    </h3>
                    <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                      Your prescriptions will appear here once your doctor
                      creates them after your consultation.
                    </p>
                  </div>
                )}

              {!prescriptionsLoading &&
                !prescriptionsError &&
                prescriptions.length > 0 && (
                  <div className="space-y-6">
                    {prescriptions.map((prescription) => {
                      const appointment = appointments.find(
                        (item) =>
                          Number(item.appointmentId) ===
                          Number(prescription.appointmentId)
                      );

                      const doctor = appointment
                        ? getDoctorDetails(appointment.doctorId)
                        : null;

                      let medications = [];

                      try {
                        medications =
                          typeof prescription.medications === "string"
                            ? JSON.parse(prescription.medications)
                            : prescription.medications || [];

                        if (!Array.isArray(medications)) {
                          medications = [];
                        }
                      } catch (err) {
                        console.error(
                          "Invalid prescription medication data:",
                          err
                        );
                      }

                      return (
                        <div
                          key={prescription.prescriptionId}
                          className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm"
                        >
                          {/* PRESCRIPTION HEADER */}
                          <div className="flex flex-col gap-3 border-b border-slate-100 bg-cyan-50/50 p-5 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wider text-cyan-700">
                                Prescription #{prescription.prescriptionId}
                              </p>
                              <h3 className="mt-1 text-lg font-bold text-slate-900">
                                {prescription.diagnosis ||
                                  "Diagnosis not recorded"}
                              </h3>
                            </div>

                            <span className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm">
                              {prescription.prescribedAt
                                ? new Date(
                                    prescription.prescribedAt
                                  ).toLocaleDateString("en-IN", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  })
                                : "Date unavailable"}
                            </span>
                          </div>

                          <div className="p-5">
                            {/* DOCTOR AND APPOINTMENT */}
                            <div className="grid gap-4 sm:grid-cols-2">
                              <div className="rounded-xl bg-slate-50 p-4">
                                <p className="text-xs font-semibold uppercase text-slate-400">
                                  Prescribed By
                                </p>
                                <p className="mt-2 font-semibold text-slate-800">
                                  {doctor?.fullName ||
                                    "Doctor information unavailable"}
                                </p>
                                {doctor?.specializationName && (
                                  <p className="mt-1 text-sm text-cyan-700">
                                    {doctor.specializationName}
                                  </p>
                                )}
                              </div>

                              <div className="rounded-xl bg-slate-50 p-4">
                                <p className="text-xs font-semibold uppercase text-slate-400">
                                  Appointment
                                </p>
                                <p className="mt-2 font-semibold text-slate-800">
                                  Appointment #{prescription.appointmentId}
                                </p>
                                <p className="mt-1 text-sm text-slate-500">
                                  {appointment?.appointmentDate
                                    ? formatDate(appointment.appointmentDate)
                                    : "Appointment date unavailable"}
                                </p>
                              </div>
                            </div>

                            {/* DIAGNOSIS */}
                            <div className="mt-6">
                              <h4 className="font-bold text-slate-800">
                                Medical Diagnosis
                              </h4>
                              <p className="mt-2 rounded-xl border border-cyan-100 bg-cyan-50 p-4 text-sm leading-6 text-cyan-900">
                                {prescription.diagnosis ||
                                  "No diagnosis recorded."}
                              </p>
                            </div>

                            {/* MEDICINES */}
                            <div className="mt-6">
                              <h4 className="font-bold text-slate-800">
                                Prescribed Medicines
                              </h4>

                              {medications.length > 0 ? (
                                <div className="mt-3 overflow-x-auto rounded-xl border border-slate-100">
                                  <table className="w-full min-w-[750px] text-left text-sm">
                                    <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                      <tr>
                                        <th className="px-4 py-3 font-semibold">
                                          Medicine
                                        </th>
                                        <th className="px-4 py-3 font-semibold">
                                          Dosage
                                        </th>
                                        <th className="px-4 py-3 font-semibold">
                                          Frequency
                                        </th>
                                        <th className="px-4 py-3 font-semibold">
                                          Duration
                                        </th>
                                        <th className="px-4 py-3 font-semibold">
                                          Instructions
                                        </th>
                                      </tr>
                                    </thead>

                                    <tbody className="divide-y divide-slate-100">
                                      {medications.map((medicine, index) => (
                                        <tr key={index}>
                                          <td className="px-4 py-3 font-semibold text-slate-800">
                                            {medicine.medicineName ||
                                              medicine.medicine ||
                                              "Not specified"}
                                          </td>
                                          <td className="px-4 py-3 text-slate-600">
                                            {medicine.dosage || "Not specified"}
                                          </td>
                                          <td className="px-4 py-3 text-slate-600">
                                            {medicine.frequency ||
                                              "Not specified"}
                                          </td>
                                          <td className="px-4 py-3 text-slate-600">
                                            {medicine.duration ||
                                              "Not specified"}
                                          </td>
                                          <td className="px-4 py-3 text-slate-600">
                                            {medicine.instructions ||
                                              "Not specified"}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <p className="mt-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                                  No medicine details available.
                                </p>
                              )}
                            </div>

                            {/* DOCTOR INSTRUCTIONS */}
                            {prescription.instructions && (
                              <div className="mt-6 rounded-xl border border-amber-100 bg-amber-50 p-4">
                                <h4 className="font-bold text-amber-800">
                                  Doctor's Instructions
                                </h4>
                                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-amber-900">
                                  {prescription.instructions}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
            </div>
          )}

          {/* ===================================== */}
          {/* MEDICAL HISTORY */}
          {/* ===================================== */}

          {activeMenu === "Medical History" && (
            <div>
              {/* PAGE HEADER */}
              <div className="mb-8">
                <h1 className="text-2xl font-extrabold text-slate-900">
                  Medical History
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  View your previous consultations, diagnoses and treatment
                  records.
                </p>
              </div>

              {/* SUMMARY */}
              {!medicalHistoryLoading && !medicalHistoryError && (
                <div className="mb-8 grid gap-5 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-cyan-50 p-3 text-cyan-600">
                        <Clock size={22} />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">
                          Completed Consultations
                        </p>
                        <h3 className="mt-1 text-2xl font-bold text-slate-900">
                          {medicalHistory.length}
                        </h3>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-green-50 p-3 text-green-600">
                        <CheckCircle size={22} />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">
                          Available Medical Records
                        </p>
                        <h3 className="mt-1 text-2xl font-bold text-slate-900">
                          {
                            medicalHistory.filter(
                              (record) => record.diagnosis
                            ).length
                          }
                        </h3>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* LOADING */}
              {medicalHistoryLoading && (
                <div className="rounded-2xl border border-slate-100 bg-white p-10 text-center shadow-sm">
                  <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-cyan-100 border-t-cyan-600" />
                  <p className="mt-4 text-sm font-medium text-slate-500">
                    Loading your medical history...
                  </p>
                </div>
              )}

              {/* ERROR */}
              {!medicalHistoryLoading && medicalHistoryError && (
                <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center">
                  <AlertCircle size={38} className="mx-auto text-red-500" />
                  <h3 className="mt-3 font-bold text-red-700">
                    Unable to load medical history
                  </h3>
                  <p className="mt-2 text-sm text-red-600">
                    {medicalHistoryError}
                  </p>
                  <button
                    onClick={() => setActiveMenu("Dashboard")}
                    className="mt-4 rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700"
                  >
                    Back to Dashboard
                  </button>
                </div>
              )}

              {/* EMPTY STATE */}
              {!medicalHistoryLoading &&
                !medicalHistoryError &&
                medicalHistory.length === 0 && (
                  <div className="rounded-2xl border border-slate-100 bg-white p-12 text-center shadow-sm">
                    <Clock size={48} className="mx-auto text-cyan-600" />
                    <h3 className="mt-4 text-lg font-bold text-slate-800">
                      No Medical History Available
                    </h3>
                    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                      Your completed consultations and medical records will
                      appear here once you have completed an appointment.
                    </p>
                  </div>
                )}

              {/* MEDICAL HISTORY RECORDS */}
              {!medicalHistoryLoading &&
                !medicalHistoryError &&
                medicalHistory.length > 0 && (
                  <div className="space-y-6">
                    {medicalHistory.map((record) => {
                      let medications = [];

                      try {
                        medications =
                          typeof record.medications === "string"
                            ? JSON.parse(record.medications)
                            : record.medications || [];

                        if (!Array.isArray(medications)) {
                          medications = [];
                        }
                      } catch (err) {
                        console.error(
                          "Invalid medical history medications:",
                          err
                        );
                      }

                      return (
                        <div
                          key={record.appointmentId}
                          className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm"
                        >
                          {/* RECORD HEADER */}
                          <div className="flex flex-col gap-3 border-b border-slate-100 bg-cyan-50/50 p-5 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wider text-cyan-700">
                                Consultation #{record.appointmentId}
                              </p>
                              <h3 className="mt-1 text-lg font-bold text-slate-900">
                                {record.diagnosis ||
                                  "Diagnosis not recorded"}
                              </h3>
                            </div>
                            <span className="w-fit rounded-full bg-green-100 px-3 py-1.5 text-xs font-bold text-green-700">
                              COMPLETED
                            </span>
                          </div>

                          <div className="p-5">
                            {/* DOCTOR AND CONSULTATION DETAILS */}
                            <div className="grid gap-4 sm:grid-cols-2">
                              <div className="rounded-xl bg-slate-50 p-4">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                  Consulting Doctor
                                </p>
                                <p className="mt-2 font-semibold text-slate-800">
                                  {record.doctorName || "Not available"}
                                </p>
                                <p className="mt-1 text-sm text-cyan-700">
                                  {record.specialization ||
                                    "Specialization unavailable"}
                                </p>
                              </div>

                              <div className="rounded-xl bg-slate-50 p-4">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                  Consultation Date
                                </p>
                                <p className="mt-2 font-semibold text-slate-800">
                                  {record.appointmentDate
                                    ? formatDate(record.appointmentDate)
                                    : "Date unavailable"}
                                </p>
                                <p className="mt-1 text-sm text-slate-500">
                                  {record.appointmentTime
                                    ? formatTime(record.appointmentTime)
                                    : "Time unavailable"}
                                </p>
                              </div>
                            </div>

                            {/* CONSULTATION REASON */}
                            <div className="mt-6">
                              <h4 className="font-bold text-slate-800">
                                Consultation Reason
                              </h4>
                              <p className="mt-2 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                                {record.reason || "No reason recorded."}
                              </p>
                            </div>

                            {/* DIAGNOSIS */}
                            <div className="mt-6">
                              <h4 className="font-bold text-slate-800">
                                Medical Diagnosis
                              </h4>
                              <p className="mt-2 rounded-xl border border-cyan-100 bg-cyan-50 p-4 text-sm leading-6 text-cyan-900">
                                {record.diagnosis || "No diagnosis recorded."}
                              </p>
                            </div>

                            {/* MEDICINES */}
                            <div className="mt-6">
                              <h4 className="font-bold text-slate-800">
                                Prescribed Medicines
                              </h4>

                              {medications.length > 0 ? (
                                <div className="mt-3 overflow-x-auto rounded-xl border border-slate-100">
                                  <table className="w-full min-w-[750px] text-left text-sm">
                                    <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                      <tr>
                                        <th className="px-4 py-3 font-semibold">
                                          Medicine
                                        </th>
                                        <th className="px-4 py-3 font-semibold">
                                          Dosage
                                        </th>
                                        <th className="px-4 py-3 font-semibold">
                                          Frequency
                                        </th>
                                        <th className="px-4 py-3 font-semibold">
                                          Duration
                                        </th>
                                        <th className="px-4 py-3 font-semibold">
                                          Instructions
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                      {medications.map((medicine, index) => (
                                        <tr key={index}>
                                          <td className="px-4 py-3 font-semibold text-slate-800">
                                            {medicine.medicineName ||
                                              medicine.medicine ||
                                              "Not specified"}
                                          </td>
                                          <td className="px-4 py-3 text-slate-600">
                                            {medicine.dosage || "Not specified"}
                                          </td>
                                          <td className="px-4 py-3 text-slate-600">
                                            {medicine.frequency ||
                                              "Not specified"}
                                          </td>
                                          <td className="px-4 py-3 text-slate-600">
                                            {medicine.duration ||
                                              "Not specified"}
                                          </td>
                                          <td className="px-4 py-3 text-slate-600">
                                            {medicine.instructions ||
                                              "Not specified"}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <p className="mt-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                                  No prescribed medicines available.
                                </p>
                              )}
                            </div>

                            {/* DOCTOR INSTRUCTIONS */}
                            {record.instructions && (
                              <div className="mt-6 rounded-xl border border-amber-100 bg-amber-50 p-4">
                                <h4 className="font-bold text-amber-800">
                                  Treatment Instructions
                                </h4>
                                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-amber-900">
                                  {record.instructions}
                                </p>
                              </div>
                            )}

                            {/* PRESCRIPTION DATE */}
                            {record.prescribedAt && (
                              <div className="mt-5 border-t border-slate-100 pt-4">
                                <p className="text-xs text-slate-400">
                                  Prescription Date
                                </p>
                                <p className="mt-1 text-sm font-medium text-slate-600">
                                  {new Date(
                                    record.prescribedAt
                                  ).toLocaleDateString("en-IN", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
            </div>
          )}


          {/* ===================================== */}
          {/* MY PROFILE */}
          {/* ===================================== */}
          {activeMenu === "My Profile" && (
            <div className="space-y-6">

              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    My Profile
                  </h1>
                  <p className="text-gray-500 mt-1">
                    Manage your personal information and health details.
                  </p>
                </div>

                {!isEditingProfile && profile && (
                  <button
                    onClick={() => setIsEditingProfile(true)}
                    className="px-5 py-2.5 bg-cyan-600 text-white rounded-xl hover:bg-cyan-700 transition font-medium"
                  >
                    Edit Profile
                  </button>
                )}
              </div>

              {/* Loading */}
              {profileLoading && (
                <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
                  <div className="animate-spin h-10 w-10 border-4 border-cyan-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading your profile...</p>
                </div>
              )}

              {/* Error */}
              {!profileLoading && profileError && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
                  <div className="flex items-center gap-3 text-red-600">
                    <AlertCircle size={22} />
                    <p>{profileError}</p>
                  </div>
                </div>
              )}

              {/* Profile Content */}
              {!profileLoading && !profileError && profile && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

                  {/* Profile Header */}
                  <div className="bg-gradient-to-r from-cyan-600 to-cyan-700 p-6 sm:p-8">
                    <div className="flex items-center gap-5">
                      <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-white text-3xl font-bold">
                        {profile.fullName?.charAt(0)?.toUpperCase() || "P"}
                      </div>

                      <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-white">
                          {profile.fullName}
                        </h2>
                        <p className="text-cyan-100 mt-1">
                          {profile.email}
                        </p>
                        <span className="inline-block mt-2 px-3 py-1 bg-white/20 text-white text-xs rounded-full">
                          Patient
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Edit Form */}
                  {isEditingProfile ? (
                    <form onSubmit={handleUpdateProfile} className="p-6 sm:p-8">

                      <h3 className="text-lg font-semibold text-gray-900 mb-6">
                        Edit Personal Information
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Full Name */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Full Name *
                          </label>
                          <input
                            type="text"
                            required
                            maxLength={100}
                            value={profileForm.fullName}
                            onChange={(e) =>
                              setProfileForm({
                                ...profileForm,
                                fullName: e.target.value,
                              })
                            }
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
                            placeholder="Enter your full name"
                          />
                        </div>

                        {/* Email */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email Address
                          </label>
                          <input
                            type="email"
                            value={profile.email}
                            readOnly
                            className="w-full px-4 py-3 border border-gray-200 bg-gray-100 text-gray-500 rounded-xl cursor-not-allowed"
                          />
                          <p className="text-xs text-gray-400 mt-1">
                            Email cannot be changed here.
                          </p>
                        </div>

                        {/* Date of Birth */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Date of Birth
                          </label>
                          <input
                            type="date"
                            max={new Date().toISOString().split("T")[0]}
                            value={profileForm.dateOfBirth}
                            onChange={(e) =>
                              setProfileForm({
                                ...profileForm,
                                dateOfBirth: e.target.value,
                              })
                            }
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none"
                          />
                        </div>

                        {/* Gender */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Gender
                          </label>
                          <select
                            value={profileForm.gender}
                            onChange={(e) =>
                              setProfileForm({
                                ...profileForm,
                                gender: e.target.value,
                              })
                            }
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none bg-white"
                          >
                            <option value="">Select Gender</option>
                            <option value="MALE">Male</option>
                            <option value="FEMALE">Female</option>
                            <option value="OTHER">Other</option>
                            <option value="PREFER_NOT_TO_SAY">
                              Prefer not to say
                            </option>
                          </select>
                        </div>

                        {/* Phone */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Phone Number
                          </label>
                          <input
                            type="tel"
                            maxLength={15}
                            value={profileForm.phone}
                            onChange={(e) =>
                              setProfileForm({
                                ...profileForm,
                                phone: e.target.value,
                              })
                            }
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none"
                            placeholder="Enter phone number"
                          />
                        </div>

                        {/* Blood Group */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Blood Group
                          </label>
                          <select
                            value={profileForm.bloodGroup}
                            onChange={(e) =>
                              setProfileForm({
                                ...profileForm,
                                bloodGroup: e.target.value,
                              })
                            }
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none bg-white"
                          >
                            <option value="">Select Blood Group</option>
                            <option value="A+">A+</option>
                            <option value="A-">A-</option>
                            <option value="B+">B+</option>
                            <option value="B-">B-</option>
                            <option value="AB+">AB+</option>
                            <option value="AB-">AB-</option>
                            <option value="O+">O+</option>
                            <option value="O-">O-</option>
                          </select>
                        </div>

                        {/* Address */}
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Address
                          </label>
                          <textarea
                            rows={3}
                            value={profileForm.address}
                            onChange={(e) =>
                              setProfileForm({
                                ...profileForm,
                                address: e.target.value,
                              })
                            }
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none resize-none"
                            placeholder="Enter your address"
                          />
                        </div>

                      </div>

                      {/* Form Actions */}
                      <div className="flex flex-col sm:flex-row justify-end gap-3 mt-8">

                        <button
                          type="button"
                          onClick={() => {
                            setProfileForm({
                              fullName: profile.fullName || "",
                              dateOfBirth: profile.dateOfBirth || "",
                              gender: profile.gender || "",
                              phone: profile.phone || "",
                              address: profile.address || "",
                              bloodGroup: profile.bloodGroup || "",
                            });
                            setIsEditingProfile(false);
                          }}
                          disabled={profileSaving}
                          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition disabled:opacity-50"
                        >
                          Cancel
                        </button>

                        <button
                          type="submit"
                          disabled={profileSaving}
                          className="px-6 py-3 bg-cyan-600 text-white rounded-xl hover:bg-cyan-700 transition font-medium disabled:opacity-50"
                        >
                          {profileSaving ? "Saving..." : "Save Changes"}
                        </button>

                      </div>
                    </form>
                  ) : (

                    /* View Profile */
                    <div className="p-6 sm:p-8">

                      <h3 className="text-lg font-semibold text-gray-900 mb-6">
                        Personal Information
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {[
                          {
                            label: "Full Name",
                            value: profile.fullName,
                          },
                          {
                            label: "Email Address",
                            value: profile.email,
                          },
                          {
                            label: "Date of Birth",
                            value: profile.dateOfBirth
                              ? formatDate(profile.dateOfBirth)
                              : "Not provided",
                          },
                          {
                            label: "Gender",
                            value: profile.gender
                              ? profile.gender.replaceAll("_", " ")
                              : "Not provided",
                          },
                          {
                            label: "Phone Number",
                            value: profile.phone || "Not provided",
                          },
                          {
                            label: "Blood Group",
                            value: profile.bloodGroup || "Not provided",
                          },
                          {
                            label: "Address",
                            value: profile.address || "Not provided",
                            fullWidth: true,
                          },
                        ].map((item) => (
                          <div
                            key={item.label}
                            className={item.fullWidth ? "md:col-span-2" : ""}
                          >
                            <p className="text-sm text-gray-500 mb-1">
                              {item.label}
                            </p>
                            <p className="font-medium text-gray-900 break-words">
                              {item.value}
                            </p>
                          </div>
                        ))}

                      </div>

                    </div>
                  )}

                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>

  );
}

export default PatientDashboard;