import { useMemo, useState } from "react";
import {
  Users,
  UserRound,
  Search,
  Eye,
  X,
  Phone,
  Mail,
  CalendarDays,
  UserCheck,
  Filter,
  Clock,
  MapPin,
} from "lucide-react";

const initialPatients = [
  {
    id: "PAT001",
    name: "Rahul Sharma",
    age: 32,
    gender: "Male",
    phone: "+91 9876543210",
    email: "rahul@example.com",
    bloodGroup: "B+",
    lastVisit: "05 Nov 2026",
    totalAppointments: 8,
    condition: "General Checkup",
    address: "Pune, Maharashtra",
  },
  {
    id: "PAT002",
    name: "Priya Deshmukh",
    age: 27,
    gender: "Female",
    phone: "+91 9876543211",
    email: "priya@example.com",
    bloodGroup: "O+",
    lastVisit: "04 Nov 2026",
    totalAppointments: 5,
    condition: "Migraine",
    address: "Pimpri, Maharashtra",
  },
  {
    id: "PAT003",
    name: "Rohan More",
    age: 45,
    gender: "Male",
    phone: "+91 9876543212",
    email: "rohan@example.com",
    bloodGroup: "A+",
    lastVisit: "02 Nov 2026",
    totalAppointments: 12,
    condition: "Regular Follow-up",
    address: "Nashik, Maharashtra",
  },
  {
    id: "PAT004",
    name: "Neha Patil",
    age: 29,
    gender: "Female",
    phone: "+91 9876543213",
    email: "neha@example.com",
    bloodGroup: "AB+",
    lastVisit: "01 Nov 2026",
    totalAppointments: 3,
    condition: "Fever",
    address: "Dhule, Maharashtra",
  },
  {
    id: "PAT005",
    name: "Amit Joshi",
    age: 38,
    gender: "Male",
    phone: "+91 9876543214",
    email: "amit@example.com",
    bloodGroup: "O-",
    lastVisit: "30 Oct 2026",
    totalAppointments: 6,
    condition: "Blood Pressure",
    address: "Jalgaon, Maharashtra",
  },
  {
    id: "PAT006",
    name: "Sneha Kulkarni",
    age: 25,
    gender: "Female",
    phone: "+91 9876543215",
    email: "sneha@example.com",
    bloodGroup: "B-",
    lastVisit: "28 Oct 2026",
    totalAppointments: 4,
    condition: "General Consultation",
    address: "Mumbai, Maharashtra",
  },
];

function DoctorPatients() {
  const [patients] = useState(initialPatients);
  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState("All");
  const [selectedPatient, setSelectedPatient] = useState(null);

  const filteredPatients = useMemo(() => {
    return patients.filter((patient) => {
      const matchesSearch =
        patient.name.toLowerCase().includes(search.toLowerCase()) ||
        patient.id.toLowerCase().includes(search.toLowerCase());

      const matchesGender =
        genderFilter === "All" || patient.gender === genderFilter;

      return matchesSearch && matchesGender;
    });
  }, [patients, search, genderFilter]);

  const stats = [
    {
      title: "Total Patients",
      value: patients.length,
      icon: Users,
      color: "bg-cyan-50 text-cyan-600",
      description: "All assigned patients",
    },
    {
      title: "Male Patients",
      value: patients.filter((p) => p.gender === "Male").length,
      icon: UserRound,
      color: "bg-blue-50 text-blue-600",
      description: "Male patients",
    },
    {
      title: "Female Patients",
      value: patients.filter((p) => p.gender === "Female").length,
      icon: UserCheck,
      color: "bg-pink-50 text-pink-600",
      description: "Female patients",
    },
    {
      title: "Total Appointments",
      value: patients.reduce(
        (sum, patient) => sum + patient.totalAppointments,
        0
      ),
      icon: CalendarDays,
      color: "bg-purple-50 text-purple-600",
      description: "Across all patients",
    },
  ];

  return (
    <div>
      {/* PAGE INTRO */}
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-slate-900">
          My Patients
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          View and manage information about your assigned patients.
        </p>
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

              <p className="mt-1 text-xs text-slate-400">
                {stat.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* PATIENT RECORDS */}
      <div className="mt-8 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-6">
          <h2 className="text-lg font-bold text-slate-900">
            Patient Records
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Search and view your patient information.
          </p>
        </div>

        {/* SEARCH AND FILTER */}
        <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row">
          <div className="relative flex-1">
            <Search
              size={19}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              placeholder="Search by patient name or ID..."
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
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-8 text-sm outline-none focus:border-cyan-500 sm:w-48"
            >
              <option value="All">All Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
        </div>

        {/* PATIENT TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4 font-semibold">Patient</th>
                <th className="px-6 py-4 font-semibold">Patient ID</th>
                <th className="px-6 py-4 font-semibold">Age / Gender</th>
                <th className="px-6 py-4 font-semibold">Blood Group</th>
                <th className="px-6 py-4 font-semibold">Last Visit</th>
                <th className="px-6 py-4 font-semibold">Appointments</th>
                <th className="px-6 py-4 text-center font-semibold">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredPatients.map((patient) => (
                <tr
                  key={patient.id}
                  className="transition hover:bg-slate-50"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-50 font-bold text-cyan-700">
                        {patient.name.charAt(0)}
                      </div>

                      <span className="text-sm font-semibold text-slate-800">
                        {patient.name}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-sm font-semibold text-cyan-700">
                    {patient.id}
                  </td>

                  <td className="px-6 py-4 text-sm text-slate-600">
                    {patient.age} years
                    <p className="mt-1 text-xs text-slate-400">
                      {patient.gender}
                    </p>
                  </td>

                  <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                    {patient.bloodGroup}
                  </td>

                  <td className="px-6 py-4 text-sm text-slate-600">
                    {patient.lastVisit}
                  </td>

                  <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                    {patient.totalAppointments}
                  </td>

                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => setSelectedPatient(patient)}
                      title="View patient details"
                      className="rounded-lg bg-blue-50 p-2 text-blue-600 transition hover:bg-blue-100"
                    >
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))}

              {filteredPatients.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-16 text-center">
                    <Users
                      size={40}
                      className="mx-auto text-slate-300"
                    />
                    <p className="mt-3 font-semibold text-slate-600">
                      No patients found
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      Try changing your search or filter.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-100 px-6 py-4 text-sm text-slate-500">
          Showing {filteredPatients.length} of {patients.length} patients
        </div>
      </div>

      {/* PATIENT DETAILS MODAL */}
      {selectedPatient && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 p-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Patient Details
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedPatient.id}
                </p>
              </div>

              <button
                onClick={() => setSelectedPatient(null)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Close patient details"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-50 text-2xl font-bold text-cyan-700">
                  {selectedPatient.name.charAt(0)}
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {selectedPatient.name}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {selectedPatient.age} years · {selectedPatient.gender}
                  </p>
                </div>
              </div>

              <div className="mt-7 grid grid-cols-2 gap-5">
                <div>
                  <p className="text-xs text-slate-400">Blood Group</p>
                  <p className="mt-1 font-semibold text-slate-800">
                    {selectedPatient.bloodGroup}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">Last Visit</p>
                  <p className="mt-1 font-semibold text-slate-800">
                    {selectedPatient.lastVisit}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">
                    Total Appointments
                  </p>
                  <p className="mt-1 font-semibold text-slate-800">
                    {selectedPatient.totalAppointments}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">
                    Recent Consultation
                  </p>
                  <p className="mt-1 font-semibold text-slate-800">
                    {selectedPatient.condition}
                  </p>
                </div>
              </div>

              <div className="mt-7 space-y-4 border-t border-slate-100 pt-5">
                <div className="flex items-center gap-3">
                  <Phone size={18} className="text-cyan-600" />
                  <span className="text-sm text-slate-600">
                    {selectedPatient.phone}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <Mail size={18} className="text-cyan-600" />
                  <span className="break-all text-sm text-slate-600">
                    {selectedPatient.email}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <MapPin size={18} className="text-cyan-600" />
                  <span className="text-sm text-slate-600">
                    {selectedPatient.address}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <Clock size={18} className="text-cyan-600" />
                  <span className="text-sm text-slate-600">
                    {selectedPatient.totalAppointments} appointments recorded
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DoctorPatients;