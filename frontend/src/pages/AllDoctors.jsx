
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Stethoscope,
  UserRound,
  CalendarDays,
  ArrowRight,
  Search,
  LoaderCircle,
} from "lucide-react";
import api from "../services/api";
import toast from "react-hot-toast";

function AllDoctors() {
  const navigate = useNavigate();

  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/doctors");

      const doctorList = Array.isArray(response.data)
        ? response.data
        : [];

      setDoctors(doctorList);
      setFilteredDoctors(doctorList);
    } catch (err) {
      console.error("Error fetching doctors:", err);
      setError("Unable to load doctors. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const search = searchTerm.trim().toLowerCase();

    const results = doctors.filter((doctor) => {
      const name = doctor.fullName || "";
      const specialization = doctor.specializationName || "";

      return (
        name.toLowerCase().includes(search) ||
        specialization.toLowerCase().includes(search)
      );
    });

    setFilteredDoctors(results);
  }, [searchTerm, doctors]);

  const handleBookAppointment = (doctorId) => {
    navigate("/patient/appointments/book", {
      state: { doctorId },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-r from-cyan-700 to-cyan-600 px-4 py-16 text-center text-white">
        <div className="mx-auto max-w-4xl">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-white/20 p-4">
              <Stethoscope size={36} />
            </div>
          </div>

          <h1 className="mb-4 text-3xl font-bold sm:text-4xl">
            Find the Right Doctor for You
          </h1>

          <p className="mx-auto max-w-2xl text-blue-50">
            Explore our medical specialists and book an appointment
            with the right healthcare professional.
          </p>
        </div>
      </section>

      {/* Doctors Section */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Our Doctors
            </h2>
            <p className="mt-1 text-gray-500">
              Find experienced healthcare professionals.
            </p>
          </div>

          <div className="relative w-full sm:max-w-sm">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={19}
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or speciality..."
              className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-64 items-center justify-center">
            <LoaderCircle className="animate-spin text-cyan-600" size={36} />
            <span className="ml-3 text-gray-600">Loading doctors...</span>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="mb-4 text-red-600">{error}</p>
            <button
              onClick={fetchDoctors}
              className="rounded-lg bg-cyan-600 px-5 py-2 text-white hover:bg-cyan-700"
            >
              Try Again
            </button>
          </div>
        ) : filteredDoctors.length === 0 ? (
          <div className="rounded-xl bg-white p-10 text-center shadow-sm">
            <UserRound className="mx-auto mb-3 text-gray-400" size={40} />
            <h3 className="text-lg font-semibold text-gray-700">
              No doctors found
            </h3>
            <p className="mt-2 text-gray-500">
              Try another name or speciality.
            </p>
          </div>
        ) : (
          <>
            <p className="mb-5 text-sm text-gray-500">
              Showing {filteredDoctors.length} doctor
              {filteredDoctors.length !== 1 ? "s" : ""}
            </p>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredDoctors.map((doctor) => (
                <div
                  key={doctor.doctorId}
                  className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="flex items-center gap-4 border-b border-gray-100 p-6">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-cyan-50 text-cyan-600">
                      <UserRound size={32} />
                    </div>

                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-bold text-gray-800">
                        {doctor.fullName || "Doctor"}
                      </h3>
                      <p className="mt-1 text-sm font-medium text-cyan-600">
                        {doctor.specializationName || "General Specialist"}
                      </p>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="mb-5 flex items-center gap-2 text-sm text-gray-500">
                      <Stethoscope size={17} />
                      <span>Healthcare Professional</span>
                    </div>

                    <button
                      onClick={() =>
                        handleBookAppointment(doctor.doctorId)
                      }
                      disabled={!doctor.doctorId}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-3 font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <CalendarDays size={18} />
                      Book Appointment
                      <ArrowRight size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

export default AllDoctors;
