import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

import DoctorAppointments from "./DoctorAppointments";
import DoctorPatients from "./DoctorPatients";
import DoctorProfile from "./DoctorProfile";
import DoctorAvailability from "./DoctorAvailability";
import DoctorNotifications from "./DoctorNotifications";

import {
  HeartPulse,
  LayoutDashboard,
  CalendarDays,
  Users,
  UserRound,
  Clock,
  CheckCircle,
  XCircle,
  LogOut,
  Menu,
  X,
  Stethoscope,
  TrendingUp,
} from "lucide-react";

// Dashboard Statistics
const stats = [
  {
    title: "Today's Appointments",
    value: "12",
    icon: CalendarDays,
    color: "bg-cyan-50 text-cyan-600",
    change: "Today's schedule",
  },
  {
    title: "Total Patients",
    value: "186",
    icon: Users,
    color: "bg-blue-50 text-blue-600",
    change: "Assigned patients",
  },
  {
    title: "Upcoming Appointments",
    value: "28",
    icon: Clock,
    color: "bg-purple-50 text-purple-600",
    change: "Next appointments",
  },
  {
    title: "Pending Appointments",
    value: "5",
    icon: Stethoscope,
    color: "bg-orange-50 text-orange-600",
    change: "Needs attention",
  },
];

// Dummy Appointments
const appointments = [
  {
    id: "#APT101",
    patient: "Rahul Sharma",
    age: 32,
    date: "06 Nov 2026",
    time: "10:30 AM",
    reason: "General Checkup",
    status: "Confirmed",
  },
  {
    id: "#APT102",
    patient: "Priya Deshmukh",
    age: 27,
    date: "06 Nov 2026",
    time: "11:00 AM",
    reason: "Headache",
    status: "Pending",
  },
  {
    id: "#APT103",
    patient: "Rohan More",
    age: 45,
    date: "06 Nov 2026",
    time: "12:30 PM",
    reason: "Regular Follow-up",
    status: "Completed",
  },
  {
    id: "#APT104",
    patient: "Neha Patil",
    age: 29,
    date: "06 Nov 2026",
    time: "02:00 PM",
    reason: "Fever",
    status: "Confirmed",
  },
];

// Sidebar Navigation
const navigation = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "My Appointments", icon: CalendarDays },
  { name: "My Patients", icon: Users },
  { name: "My Profile", icon: UserRound },
  { name: "Availability", icon: Clock },
];

function DoctorDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState("Dashboard");

  // Logout
  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully!");
    navigate("/");
  };

  // Appointment Status Styling
  const getStatusStyle = (status) => {
    switch (status) {
      case "Confirmed":
        return "bg-green-50 text-green-700";

      case "Pending":
        return "bg-orange-50 text-orange-700";

      case "Completed":
        return "bg-blue-50 text-blue-700";

      case "Cancelled":
        return "bg-red-50 text-red-700";

      default:
        return "bg-slate-50 text-slate-700";
    }
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
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-100 bg-white transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
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

              <p className="text-xs text-slate-500">
                Doctor Portal
              </p>
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
        <div className="flex-1 px-4 py-6">
          <p className="mb-4 px-3 text-xs font-bold uppercase tracking-wider text-slate-400">
            Doctor Menu
          </p>

          <nav className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.name}
                  onClick={() => {
                    setActiveMenu(item.name);
                    setSidebarOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
                    activeMenu === item.name
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

          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
              aria-label="Open sidebar"
            >
              <Menu size={24} />
            </button>

            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {activeMenu}
              </h2>

              <p className="hidden text-xs text-slate-500 sm:block">
                Welcome to your MediCare Doctor Portal
              </p>
            </div>
          </div>

          {/* TOPBAR RIGHT */}
          <div className="flex items-center gap-3 sm:gap-5">

            {/* NOTIFICATIONS */}
            <DoctorNotifications />

            {/* DOCTOR PROFILE */}
            <div className="flex items-center gap-3 border-l border-slate-100 pl-4">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-bold text-slate-800">
                  Dr. {user?.fullName || "Doctor"}
                </p>

                <p className="text-xs text-slate-500">
                  Doctor
                </p>
              </div>

              <button
  onClick={() => {
    setActiveMenu("My Profile");
    setSidebarOpen(false);
  }}
  className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-100 font-bold text-cyan-700 transition hover:bg-cyan-200 hover:ring-2 hover:ring-cyan-300"
  title="View My Profile"
  aria-label="Open My Profile"
>
  {user?.fullName?.charAt(0)?.toUpperCase() || "D"}
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
                    Doctor Dashboard
                  </h1>

                  <p className="mt-1 text-sm text-slate-500">
                    Manage your appointments and patient activities.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600">
                  <CalendarDays className="mr-2 inline" size={17} />
                  06 November 2026
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
                        {stat.value}
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
                        Today's Appointment Schedule
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        Your daily appointment status
                      </p>
                    </div>

                    <CalendarDays className="text-cyan-600" size={23} />
                  </div>

                  <div className="space-y-6">
                    {[
                      {
                        label: "Confirmed",
                        value: 65,
                        color: "bg-green-500",
                      },
                      {
                        label: "Pending",
                        value: 20,
                        color: "bg-orange-400",
                      },
                      {
                        label: "Completed",
                        value: 85,
                        color: "bg-cyan-500",
                      },
                      {
                        label: "Cancelled",
                        value: 10,
                        color: "bg-red-400",
                      },
                    ].map((item) => (
                      <div key={item.label}>
                        <div className="mb-2 flex justify-between text-sm">
                          <span className="font-semibold text-slate-700">
                            {item.label}
                          </span>

                          <span className="font-bold text-slate-600">
                            {item.value}%
                          </span>
                        </div>

                        <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full ${item.color}`}
                            style={{ width: `${item.value}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* QUICK SUMMARY */}
                <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900">
                    Quick Summary
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Your appointment activity
                  </p>

                  <div className="mt-6 space-y-5">

                    <div className="flex items-center gap-4">
                      <div className="rounded-xl bg-green-50 p-3 text-green-600">
                        <CheckCircle size={22} />
                      </div>

                      <div>
                        <p className="text-xl font-bold text-slate-900">
                          18
                        </p>

                        <p className="text-sm text-slate-500">
                          Confirmed
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="rounded-xl bg-orange-50 p-3 text-orange-600">
                        <Clock size={22} />
                      </div>

                      <div>
                        <p className="text-xl font-bold text-slate-900">
                          5
                        </p>

                        <p className="text-sm text-slate-500">
                          Awaiting Approval
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                        <CheckCircle size={22} />
                      </div>

                      <div>
                        <p className="text-xl font-bold text-slate-900">
                          42
                        </p>

                        <p className="text-sm text-slate-500">
                          Completed
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="rounded-xl bg-red-50 p-3 text-red-600">
                        <XCircle size={22} />
                      </div>

                      <div>
                        <p className="text-xl font-bold text-slate-900">
                          3
                        </p>

                        <p className="text-sm text-slate-500">
                          Cancelled
                        </p>
                      </div>
                    </div>

                  </div>
                </div>
              </div>

              {/* TODAY'S APPOINTMENTS TABLE */}
              <div className="mt-8 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">

                <div className="border-b border-slate-100 p-6">
                  <h3 className="text-lg font-bold text-slate-900">
                    Today's Appointments
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Your scheduled patient consultations
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[850px] text-left">

                    <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="px-6 py-4 font-semibold">
                          Appointment ID
                        </th>

                        <th className="px-6 py-4 font-semibold">
                          Patient
                        </th>

                        <th className="px-6 py-4 font-semibold">
                          Age
                        </th>

                        <th className="px-6 py-4 font-semibold">
                          Date & Time
                        </th>

                        <th className="px-6 py-4 font-semibold">
                          Reason
                        </th>

                        <th className="px-6 py-4 font-semibold">
                          Status
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {appointments.map((appointment) => (
                        <tr
                          key={appointment.id}
                          className="transition hover:bg-slate-50"
                        >
                          <td className="px-6 py-4 text-sm font-semibold text-cyan-700">
                            {appointment.id}
                          </td>

                          <td className="px-6 py-4 text-sm font-semibold text-slate-800">
                            {appointment.patient}
                          </td>

                          <td className="px-6 py-4 text-sm text-slate-600">
                            {appointment.age}
                          </td>

                          <td className="px-6 py-4 text-sm text-slate-600">
                            <p>{appointment.date}</p>

                            <p className="mt-1 text-xs text-slate-400">
                              {appointment.time}
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
              </div>

              {/* FOOTER */}
              <footer className="mt-8 pb-4 text-center text-sm text-slate-400">
                © 2026 MediCare Healthcare Administration Console. All
                rights reserved.
              </footer>

            </>
          )}

          {/* ===================================== */}
          {/* MY APPOINTMENTS */}
          {/* ===================================== */}

          {activeMenu === "My Appointments" && (
            <DoctorAppointments />
          )}

          {/* ===================================== */}
          {/* MY PATIENTS */}
          {/* ===================================== */}

          {activeMenu === "My Patients" && (
            <DoctorPatients />
          )}

          {/* ===================================== */}
          {/* MY PROFILE */}
          {/* ===================================== */}

          {activeMenu === "My Profile" && (
            <DoctorProfile />
          )}

          {/* ===================================== */}
          {/* AVAILABILITY */}
          {/* ===================================== */}

          {activeMenu === "Availability" && (
            <DoctorAvailability />
          )}

        </div>
      </main>
    </div>
  );
}

export default DoctorDashboard;