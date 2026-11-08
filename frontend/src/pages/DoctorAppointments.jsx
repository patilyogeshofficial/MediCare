import { useMemo, useState } from "react";
import {
  CalendarDays,
  Search,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  UserRound,
  X,
  Stethoscope,
} from "lucide-react";
import toast from "react-hot-toast";

const initialAppointments = [
  {
    id: "APT101",
    patient: "Rahul Sharma",
    age: 32,
    gender: "Male",
    phone: "+91 9876543210",
    date: "2026-11-07",
    time: "10:30 AM",
    reason: "General Checkup",
    status: "Confirmed",
  },
  {
    id: "APT102",
    patient: "Priya Deshmukh",
    age: 27,
    gender: "Female",
    phone: "+91 9876543211",
    date: "2026-11-07",
    time: "11:00 AM",
    reason: "Headache",
    status: "Pending",
  },
  {
    id: "APT103",
    patient: "Rohan More",
    age: 45,
    gender: "Male",
    phone: "+91 9876543212",
    date: "2026-11-08",
    time: "12:30 PM",
    reason: "Regular Follow-up",
    status: "Completed",
  },
  {
    id: "APT104",
    patient: "Neha Patil",
    age: 29,
    gender: "Female",
    phone: "+91 9876543213",
    date: "2026-11-08",
    time: "02:00 PM",
    reason: "Fever",
    status: "Confirmed",
  },
  {
    id: "APT105",
    patient: "Amit Joshi",
    age: 38,
    gender: "Male",
    phone: "+91 9876543214",
    date: "2026-11-09",
    time: "09:30 AM",
    reason: "Blood Pressure Check",
    status: "Pending",
  },
  {
    id: "APT106",
    patient: "Sneha Kulkarni",
    age: 25,
    gender: "Female",
    phone: "+91 9876543215",
    date: "2026-11-09",
    time: "11:30 AM",
    reason: "General Consultation",
    status: "Cancelled",
  },
];

function DoctorAppointments() {
  const [appointments, setAppointments] = useState(initialAppointments);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("");
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const stats = [
    {
      title: "Total Appointments",
      value: appointments.length,
      icon: CalendarDays,
      color: "bg-cyan-50 text-cyan-600",
    },
    {
      title: "Confirmed",
      value: appointments.filter((a) => a.status === "Confirmed").length,
      icon: CheckCircle,
      color: "bg-green-50 text-green-600",
    },
    {
      title: "Pending",
      value: appointments.filter((a) => a.status === "Pending").length,
      icon: Clock,
      color: "bg-orange-50 text-orange-600",
    },
    {
      title: "Cancelled",
      value: appointments.filter((a) => a.status === "Cancelled").length,
      icon: XCircle,
      color: "bg-red-50 text-red-600",
    },
  ];

  const filteredAppointments = useMemo(() => {
    return appointments.filter((appointment) => {
      const matchesSearch =
        appointment.patient.toLowerCase().includes(search.toLowerCase()) ||
        appointment.id.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "All" || appointment.status === statusFilter;

      const matchesDate =
        !dateFilter || appointment.date === dateFilter;

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [appointments, search, statusFilter, dateFilter]);

  const updateStatus = (id, newStatus) => {
    setAppointments((previous) =>
      previous.map((appointment) =>
        appointment.id === id
          ? { ...appointment, status: newStatus }
          : appointment
      )
    );

    setSelectedAppointment(null);
    toast.success(`Appointment ${newStatus.toLowerCase()} successfully!`);
  };

  const getStatusStyle = (status) => {
    const styles = {
      Confirmed: "bg-green-50 text-green-700",
      Pending: "bg-orange-50 text-orange-700",
      Completed: "bg-blue-50 text-blue-700",
      Cancelled: "bg-red-50 text-red-700",
      Rejected: "bg-red-50 text-red-700",
    };

    return styles[status] || "bg-slate-50 text-slate-600";
  };

  const formatDate = (date) =>
    new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  return (
    <div>
      {/* PAGE INTRO */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            My Appointments
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            View and manage your patient appointments.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600">
          <CalendarDays className="mr-2 inline" size={17} />
          Appointment Management
        </div>
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
            </div>
          );
        })}
      </div>

      {/* APPOINTMENTS TABLE */}
      <div className="mt-8 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-6">
          <h2 className="text-lg font-bold text-slate-900">
            Appointment Records
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Search, filter and manage your appointments.
          </p>
        </div>

        {/* FILTERS */}
        <div className="flex flex-col gap-3 border-b border-slate-100 p-5 lg:flex-row">
          <div className="relative flex-1">
            <Search
              size={19}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              placeholder="Search patient or appointment ID..."
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
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-8 text-sm outline-none focus:border-cyan-500 sm:w-48"
            >
              <option value="All">All Status</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-600 outline-none focus:border-cyan-500"
          />
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-left">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4 font-semibold">Appointment ID</th>
                <th className="px-6 py-4 font-semibold">Patient</th>
                <th className="px-6 py-4 font-semibold">Date & Time</th>
                <th className="px-6 py-4 font-semibold">Reason</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 text-center font-semibold">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredAppointments.map((appointment) => (
                <tr
                  key={appointment.id}
                  className="transition hover:bg-slate-50"
                >
                  <td className="px-6 py-4 text-sm font-semibold text-cyan-700">
                    #{appointment.id}
                  </td>

                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-slate-800">
                      {appointment.patient}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {appointment.age} years · {appointment.gender}
                    </p>
                  </td>

                  <td className="px-6 py-4 text-sm text-slate-600">
                    <p>{formatDate(appointment.date)}</p>
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

                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => setSelectedAppointment(appointment)}
                        title="View details"
                        className="rounded-lg bg-blue-50 p-2 text-blue-600 transition hover:bg-blue-100"
                      >
                        <Eye size={17} />
                      </button>

                      {appointment.status === "Pending" && (
                        <>
                          <button
                            onClick={() =>
                              updateStatus(appointment.id, "Confirmed")
                            }
                            title="Accept appointment"
                            className="rounded-lg bg-green-50 p-2 text-green-600 transition hover:bg-green-100"
                          >
                            <CheckCircle size={17} />
                          </button>

                          <button
                            onClick={() =>
                              updateStatus(appointment.id, "Rejected")
                            }
                            title="Reject appointment"
                            className="rounded-lg bg-red-50 p-2 text-red-600 transition hover:bg-red-100"
                          >
                            <XCircle size={17} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {filteredAppointments.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-16 text-center">
                    <CalendarDays
                      size={40}
                      className="mx-auto text-slate-300"
                    />
                    <p className="mt-3 font-semibold text-slate-600">
                      No appointments found
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      Try changing your search or filters.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-100 px-6 py-4 text-sm text-slate-500">
          Showing {filteredAppointments.length} of {appointments.length} appointments
        </div>
      </div>

      {/* APPOINTMENT DETAILS MODAL */}
      {selectedAppointment && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 p-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Appointment Details
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  #{selectedAppointment.id}
                </p>
              </div>

              <button
                onClick={() => setSelectedAppointment(null)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Close details"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5 p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-cyan-50 p-3 text-cyan-600">
                  <UserRound size={24} />
                </div>
                <div>
                  <p className="font-bold text-slate-800">
                    {selectedAppointment.patient}
                  </p>
                  <p className="text-sm text-slate-500">
                    {selectedAppointment.age} years · {selectedAppointment.gender}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-400">Appointment Date</p>
                  <p className="mt-1 text-sm font-semibold text-slate-700">
                    {formatDate(selectedAppointment.date)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">Appointment Time</p>
                  <p className="mt-1 text-sm font-semibold text-slate-700">
                    {selectedAppointment.time}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">Contact Number</p>
                  <p className="mt-1 text-sm font-semibold text-slate-700">
                    {selectedAppointment.phone}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">Status</p>
                  <span
                    className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(
                      selectedAppointment.status
                    )}`}
                  >
                    {selectedAppointment.status}
                  </span>
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-slate-700">
                  <Stethoscope size={18} />
                  <p className="text-sm font-semibold">Consultation Reason</p>
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  {selectedAppointment.reason}
                </p>
              </div>

              {selectedAppointment.status === "Pending" && (
                <div className="flex gap-3">
                  <button
                    onClick={() =>
                      updateStatus(selectedAppointment.id, "Confirmed")
                    }
                    className="flex-1 rounded-xl bg-green-600 py-3 text-sm font-semibold text-white transition hover:bg-green-700"
                  >
                    Accept Appointment
                  </button>

                  <button
                    onClick={() =>
                      updateStatus(selectedAppointment.id, "Rejected")
                    }
                    className="flex-1 rounded-xl bg-red-600 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DoctorAppointments;