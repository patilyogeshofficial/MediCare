
import {
  LayoutDashboard,
  Users,
  UserRound,
  CalendarDays,
  Stethoscope,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  HeartPulse,
  Mail,
  ChevronRight,
  FileText,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

import AdminAppointments from "./AdminAppointments";
import AdminDoctors from "./AdminDoctors";
import AdminContactMessages from "./AdminContactMessages";
import AdminNotifications from "./AdminNotifications";
import AdminPatients from "./AdminPatients";
import AdminSettings from "./AdminSettings";
import AdminPrescriptions from "./AdminPrescriptions";

const navigation = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "Appointments", icon: CalendarDays },
  { name: "Patients", icon: Users },
  { name: "Doctors", icon: Stethoscope },
  { name: "Contact Messages", icon: Mail },
  { name: "Notifications", icon: Bell },
  { name: "Settings", icon: Settings },
  { name: "Prescriptions", icon: FileText },
];

function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState("Dashboard");
  const [adminUnreadCount, setAdminUnreadCount] = useState(0);

  // Dashboard summary
  const [summary, setSummary] = useState({
    totalPatients: 0,
    totalDoctors: 0,
    totalAppointments: 0,
    pendingAppointments: 0,
    confirmedAppointments: 0,
    completedAppointments: 0,
    cancelledAppointments: 0,
    rejectedAppointments: 0,
  });

  const [summaryLoading, setSummaryLoading] = useState(true);

  // Recent appointments
  const [appointments, setAppointments] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch dashboard statistics every 30 seconds
  useEffect(() => {
    let isMounted = true;
    let isInitialLoad = true;

    const fetchDashboardSummary = async () => {
      try {
        const response = await api.get("/admin/dashboard/summary");

        if (isMounted) {
          setSummary(response.data);
        }
      } catch (error) {
        console.error("Dashboard summary error:", error);

        if (isMounted && isInitialLoad) {
          toast.error("Unable to load dashboard statistics.");
        }
      } finally {
        if (isMounted && isInitialLoad) {
          setSummaryLoading(false);
        }

        isInitialLoad = false;
      }
    };

    fetchDashboardSummary();

    const interval = setInterval(fetchDashboardSummary, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Fetch appointments and related patient, user and doctor details
  useEffect(() => {
    let isMounted = true;
    let isInitialLoad = true;

    const fetchRecentAppointments = async () => {
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

        const formattedAppointments = appointmentData.map(
          (appointment) => {
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
          }
        );

        formattedAppointments.sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime()
        );

        if (isMounted) {
          setAppointments(formattedAppointments);
        }
      } catch (error) {
        console.error("Recent appointments error:", error);

        if (isMounted && isInitialLoad) {
          toast.error("Unable to load recent appointments.");
        }
      } finally {
        if (isMounted && isInitialLoad) {
          setAppointmentsLoading(false);
        }

        isInitialLoad = false;
      }
    };

    fetchRecentAppointments();

    const interval = setInterval(fetchRecentAppointments, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Fetch admin unread notification count
  useEffect(() => {
    let isMounted = true;

    const fetchUnreadCount = async () => {
      try {
        const response = await api.get(
          "/admin/notifications/unread-count"
        );

        if (isMounted) {
          setAdminUnreadCount(Number(response.data || 0));
        }
      } catch (error) {
        console.error("Unread notification count error:", error);
      }
    };

    fetchUnreadCount();

    const interval = setInterval(fetchUnreadCount, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [activeMenu]);

  // Dashboard statistics cards
  const stats = [
    {
      title: "Total Patients",
      value: summary.totalPatients,
      change: "Live data",
      icon: Users,
      color: "bg-blue-50 text-blue-600",
    },
    {
      title: "Total Doctors",
      value: summary.totalDoctors,
      change: "Live data",
      icon: Stethoscope,
      color: "bg-cyan-50 text-cyan-600",
    },
    {
      title: "Appointments",
      value: summary.totalAppointments,
      change: "Live data",
      icon: CalendarDays,
      color: "bg-purple-50 text-purple-600",
    },
    {
      title: "Pending Appointments",
      value: summary.pendingAppointments,
      change: "Needs attention",
      icon: Clock,
      color: "bg-orange-50 text-orange-600",
    },
  ];

  // Appointment status summary
  const appointmentStatusSummary = [
    {
      label: "Confirmed",
      count: Number(summary.confirmedAppointments || 0),
      color: "bg-green-500",
      icon: CheckCircle,
      iconColor: "bg-green-50 text-green-600",
    },
    {
      label: "Pending",
      count: Number(summary.pendingAppointments || 0),
      color: "bg-orange-400",
      icon: Clock,
      iconColor: "bg-orange-50 text-orange-600",
    },
    {
      label: "Completed",
      count: Number(summary.completedAppointments || 0),
      color: "bg-cyan-500",
      icon: CheckCircle,
      iconColor: "bg-cyan-50 text-cyan-600",
    },
    {
      label: "Cancelled",
      count: Number(summary.cancelledAppointments || 0),
      color: "bg-red-400",
      icon: XCircle,
      iconColor: "bg-red-50 text-red-600",
    },
    {
      label: "Rejected",
      count: Number(summary.rejectedAppointments || 0),
      color: "bg-slate-500",
      icon: XCircle,
      iconColor: "bg-slate-100 text-slate-600",
    },
  ];

  const getAppointmentPercentage = (count) => {
    const total = Number(summary.totalAppointments || 0);

    if (total === 0) return 0;

    return Math.round((count / total) * 100);
  };

  // Search appointments
  const filteredAppointments = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    if (!search) {
      return appointments.slice(0, 5);
    }

    return appointments.filter((appointment) => {
      const searchableValues = [
        appointment.appointmentId,
        appointment.patientName,
        appointment.doctorName,
        appointment.status,
        appointment.appointmentDate,
        appointment.reason,
      ];

      return searchableValues.some((value) =>
        String(value || "").toLowerCase().includes(search)
      );
    });
  }, [appointments, searchTerm]);

  // Sidebar navigation
  const handleNavigation = (menuName) => {
    setActiveMenu(menuName);
    setSidebarOpen(false);
  };

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully!");
    navigate("/");
  };

  // Appointment status labels
  const formatStatus = (status) => {
    if (!status) return "Unknown";

    const normalizedStatus = status.toUpperCase();

    switch (normalizedStatus) {
      case "CONFIRMED":
        return "Confirmed";
      case "PENDING":
        return "Pending";
      case "COMPLETED":
        return "Completed";
      case "CANCELLED":
        return "Cancelled";
      default:
        return status.charAt(0).toUpperCase() +
          status.slice(1).toLowerCase();
    }
  };

  // Status badge styles
  const getStatusStyle = (status) => {
    switch (status?.toUpperCase()) {
      case "CONFIRMED":
        return "bg-green-50 text-green-700";
      case "PENDING":
        return "bg-orange-50 text-orange-700";
      case "COMPLETED":
        return "bg-blue-50 text-blue-700";
      case "CANCELLED":
        return "bg-red-50 text-red-700";
      default:
        return "bg-slate-50 text-slate-700";
    }
  };

  // Format appointment date
  const formatDate = (date) => {
    if (!date) return "Date unavailable";

    const parsedDate = new Date(`${date}T00:00:00`);

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Format appointment time
  const formatTime = (time) => {
    if (!time) return "Time unavailable";

    const [hours, minutes] = time.split(":");

    const parsedTime = new Date();
    parsedTime.setHours(Number(hours), Number(minutes), 0, 0);

    return parsedTime.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const adminName = user?.fullName || "Administrator";
  const adminInitial = adminName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50">

      {/* MOBILE OVERLAY */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation overlay"
          className="fixed inset-0 z-40 cursor-default bg-slate-900/40 backdrop-blur-[2px] lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-100 bg-white shadow-sm transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        {/* LOGO */}
        <div className="flex h-20 shrink-0 items-center justify-between border-b border-slate-100 px-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-cyan-600 p-2.5 text-white shadow-sm">
              <HeartPulse size={24} />
            </div>

            <div>
              <h1 className="text-xl font-extrabold text-slate-900">
                Medi<span className="text-cyan-600">Care</span>
              </h1>
              <p className="text-xs font-medium text-slate-500">
                Admin Console
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 lg:hidden"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* NAVIGATION */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <p className="mb-4 px-3 text-xs font-bold uppercase tracking-wider text-slate-400">
            Main Menu
          </p>

          <nav className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = activeMenu === item.name;

              return (
                <button
                  type="button"
                  key={item.name}
                  onClick={() => handleNavigation(item.name)}
                  className={`group flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-semibold transition-all duration-200 ${isActive
                      ? "bg-cyan-50 text-cyan-700 shadow-sm"
                      : "text-slate-600 hover:bg-slate-50 hover:text-cyan-700"
                    }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon
                      size={19}
                      className={
                        isActive
                          ? "text-cyan-600"
                          : "text-slate-400 group-hover:text-cyan-600"
                      }
                    />

                    {item.name}

                    {item.name === "Notifications" &&
                      adminUnreadCount > 0 && (
                        <span className="ml-2 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
                          {adminUnreadCount > 99
                            ? "99+"
                            : adminUnreadCount}
                        </span>
                      )}
                  </span>

                  {isActive && (
                    <ChevronRight
                      size={16}
                      className="text-cyan-600"
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* ADMIN ACCOUNT */}
        <div className="border-t border-slate-100 p-4">
          <div className="mb-3 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-100 font-bold text-cyan-700">
              {adminInitial}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-800">
                {adminName}
              </p>
              <p className="text-xs text-slate-500">
                Administrator
              </p>
            </div>
          </div>

          {/* LOGOUT */}
          <button
            type="button"
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
          <div className="flex min-w-0 items-center gap-4">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 lg:hidden"
              aria-label="Open sidebar"
            >
              <Menu size={24} />
            </button>

            <div className="min-w-0">
              <h2 className="truncate text-xl font-bold text-slate-900">
                {activeMenu}
              </h2>
              <p className="hidden text-xs text-slate-500 sm:block">
                Welcome to MediCare Admin Panel
              </p>
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-3 sm:gap-5">
            <button
              type="button"
              onClick={() => handleNavigation("Notifications")}
              className="relative rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-cyan-600"
              aria-label="Notifications"
            >
              <Bell size={21} />

              {adminUnreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                  {adminUnreadCount > 99
                    ? "99+"
                    : adminUnreadCount}
                </span>
              )}
            </button>

            <div className="flex items-center gap-3 border-l border-slate-100 pl-4">
              <div className="hidden text-right sm:block">
                <p className="max-w-36 truncate text-sm font-bold text-slate-800">
                  {adminName}
                </p>
                <p className="text-xs text-slate-500">
                  Administrator
                </p>
              </div>

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-100 font-bold text-cyan-700">
                {adminInitial}
              </div>
            </div>
          </div>
        </header>

        {/* DASHBOARD CONTENT */}
        <div className="p-5 sm:p-8">

          {activeMenu === "Appointments" ? (
            <AdminAppointments />
          ) : activeMenu === "Patients" ? (
            <AdminPatients />
          ) : activeMenu === "Doctors" ? (
            <AdminDoctors />
            ) : activeMenu === "Prescriptions" ? (
  <AdminPrescriptions />
          ) : activeMenu === "Contact Messages" ? (
            <AdminContactMessages />
          ) : activeMenu === "Notifications" ? (
            <AdminNotifications />
          ) : activeMenu === "Settings" ? (
            <AdminSettings />
          ) : (
            <>
              {/* PAGE INTRO */}
              <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900">
                    Dashboard Overview
                  </h1>
                  <p className="mt-1 text-sm text-slate-500">
                    Here's what's happening in your hospital today.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600">
                  <CalendarDays className="mr-2 inline" size={17} />
                  {new Date().toLocaleDateString("en-IN", {
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

                        <span className="text-xs font-semibold text-slate-500">
                          {stat.change}
                        </span>
                      </div>

                      <p className="mt-5 text-sm font-medium text-slate-500">
                        {stat.title}
                      </p>

                      <h3 className="mt-1 text-3xl font-extrabold text-slate-900">
                        {summaryLoading
                          ? "..."
                          : Number(stat.value).toLocaleString("en-IN")}
                      </h3>
                    </div>
                  );
                })}
              </div>

              {/* LOWER DASHBOARD SECTION */}
              <div className="mt-8 grid gap-6 xl:grid-cols-3">

                {/* APPOINTMENT OVERVIEW */}
                <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm xl:col-span-2">
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">
                        Appointment Overview
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Appointment status distribution
                      </p>
                    </div>

                    <CalendarDays
                      className="text-cyan-600"
                      size={23}
                    />
                  </div>

                  {summaryLoading ? (
                    <p className="py-8 text-center text-sm text-slate-500">
                      Loading appointment statistics...
                    </p>
                  ) : (
                    <div className="space-y-6">
                      {appointmentStatusSummary.map((item) => {
                        const percentage = getAppointmentPercentage(
                          item.count
                        );

                        return (
                          <div key={item.label}>
                            <div className="mb-2 flex justify-between text-sm">
                              <span className="font-semibold text-slate-700">
                                {item.label}
                              </span>

                              <span className="font-bold text-slate-600">
                                {item.count} ({percentage}%)
                              </span>
                            </div>

                            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${item.color}`}
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
                    Hospital activity at a glance
                  </p>

                  {summaryLoading ? (
                    <p className="py-8 text-center text-sm text-slate-500">
                      Loading summary...
                    </p>
                  ) : (
                    <div className="mt-6 space-y-5">
                      {appointmentStatusSummary.map((item) => {
                        const Icon = item.icon;

                        return (
                          <div
                            key={item.label}
                            className="flex items-center gap-4"
                          >
                            <div className={`rounded-xl p-3 ${item.iconColor}`}>
                              <Icon size={22} />
                            </div>

                            <div>
                              <p className="text-xl font-bold text-slate-900">
                                {item.count}
                              </p>
                              <p className="text-sm text-slate-500">
                                {item.label}
                              </p>
                            </div>
                          </div>
                        );
                      })}

                      <div className="flex items-center gap-4">
                        <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                          <UserRound size={22} />
                        </div>

                        <div>
                          <p className="text-xl font-bold text-slate-900">
                            {Number(summary.totalDoctors || 0)}
                          </p>
                          <p className="text-sm text-slate-500">
                            Total Doctors
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* RECENT APPOINTMENTS */}
              <div className="mt-8 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-6 sm:flex-row sm:items-center">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Recent Appointments
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Latest appointment records
                    </p>
                  </div>

                  {/* SEARCH */}
                  <div className="relative">
                    <Search
                      size={17}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="search"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search appointments..."
                      className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-cyan-500 sm:w-64"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[750px] text-left">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="px-6 py-4 font-semibold">
                          Appointment ID
                        </th>
                        <th className="px-6 py-4 font-semibold">
                          Patient
                        </th>
                        <th className="px-6 py-4 font-semibold">
                          Doctor
                        </th>
                        <th className="px-6 py-4 font-semibold">
                          Date & Time
                        </th>
                        <th className="px-6 py-4 font-semibold">
                          Status
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {appointmentsLoading ? (
                        <tr>
                          <td
                            colSpan="5"
                            className="px-6 py-10 text-center text-sm text-slate-500"
                          >
                            Loading appointments...
                          </td>
                        </tr>
                      ) : filteredAppointments.length === 0 ? (
                        <tr>
                          <td
                            colSpan="5"
                            className="px-6 py-10 text-center text-sm text-slate-500"
                          >
                            {searchTerm
                              ? "No matching appointments found."
                              : "No appointments available."}
                          </td>
                        </tr>
                      ) : (
                        filteredAppointments.map((appointment) => (
                          <tr
                            key={appointment.appointmentId}
                            className="transition hover:bg-slate-50"
                          >
                            <td className="px-6 py-4 text-sm font-semibold text-cyan-700">
                              #{appointment.appointmentId}
                            </td>

                            <td className="px-6 py-4 text-sm font-semibold text-slate-800">
                              {appointment.patientName}
                            </td>

                            <td className="px-6 py-4 text-sm text-slate-600">
                              {appointment.doctorName}
                            </td>

                            <td className="px-6 py-4 text-sm text-slate-600">
                              <p>
                                {formatDate(appointment.appointmentDate)}
                              </p>
                              <p className="mt-1 text-xs text-slate-400">
                                {formatTime(appointment.appointmentTime)}
                              </p>
                            </td>

                            <td className="px-6 py-4">
                              <span
                                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${getStatusStyle(
                                  appointment.status
                                )}`}
                              >
                                {formatStatus(appointment.status)}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {!appointmentsLoading &&
                  appointments.length > 5 &&
                  !searchTerm && (
                    <div className="border-t border-slate-100 px-6 py-3 text-center text-xs text-slate-500">
                      Showing the 5 most recently created appointments
                    </div>
                  )}
              </div>

              {/* FOOTER */}
              <footer className="mt-8 pb-4 text-center text-sm text-slate-400">
                © 2026 MediCare Healthcare Administration Console. All rights
                reserved.
              </footer>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;
