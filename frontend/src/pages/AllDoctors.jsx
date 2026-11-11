
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Stethoscope,
  UserRound,
  CalendarDays,
  ArrowRight,
  Search,
  LoaderCircle,
  GraduationCap,
  BriefcaseMedical,
  IndianRupee,
  Filter,
  RefreshCw,
  X,
  ShieldCheck,
} from "lucide-react";

import api from "../services/api";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function AllDoctors() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [doctors, setDoctors] = useState([]);
  const [specializations, setSpecializations] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecialization, setSelectedSpecialization] =
    useState("ALL");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch doctors and specializations independently from backend
  const fetchDoctors = async () => {
    try {
      setLoading(true);
      setError("");

      const [doctorsResponse, specializationsResponse] =
        await Promise.all([
          api.get("/doctors"),
          api.get("/specializations"),
        ]);

      const rawDoctors = Array.isArray(doctorsResponse.data)
        ? doctorsResponse.data
        : [];
      const activeDoctors = rawDoctors.filter((doc) => doc.isActive !== false);

      setDoctors(activeDoctors);

      setSpecializations(
        Array.isArray(specializationsResponse.data)
          ? specializationsResponse.data
          : []
      );
    } catch (err) {
      console.error("Error fetching doctor data:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load doctors and specializations. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Load data when page opens
  useEffect(() => {
    fetchDoctors();
  }, []);

  // Search and specialization filtering
  const filteredDoctors = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return doctors.filter((doctor) => {
      const name = (doctor.fullName || "").toLowerCase();

      const specialization = (
        doctor.specializationName || ""
      ).toLowerCase();

      const qualification = (
        doctor.qualification || ""
      ).toLowerCase();

      const matchesSearch =
        name.includes(search) ||
        specialization.includes(search) ||
        qualification.includes(search);

      const matchesSpecialization =
        selectedSpecialization === "ALL" ||
        doctor.specializationName === selectedSpecialization;

      return matchesSearch && matchesSpecialization;
    });
  }, [doctors, searchTerm, selectedSpecialization]);

  // Clear search and filters
  const clearFilters = () => {
    setSearchTerm("");
    setSelectedSpecialization("ALL");
  };

  // Appointment booking with role validation
  const handleBookAppointment = (doctorId) => {
    if (!isAuthenticated) {
      toast("Please log in as a patient to book an appointment.", {
        icon: "🔐",
      });

      navigate("/login", {
        state: {
          from: "/patient/appointments/book",
        },
      });

      return;
    }

    if (user?.role !== "PATIENT") {
      toast.error(
        "Only patient accounts can book appointments."
      );
      return;
    }

    navigate("/patient/appointments/book", {
      state: { doctorId },
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-br from-cyan-800 via-cyan-700 to-blue-700 px-5 py-16 text-white sm:py-20">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/5" />

        <div className="absolute -bottom-28 -left-20 h-80 w-80 rounded-full bg-white/5" />

        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 shadow-lg backdrop-blur-sm">
            <Stethoscope size={34} />
          </div>

          <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-cyan-100">
            Our Medical Specialists
          </p>

          <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl lg:text-5xl">
            Find the Right Doctor for You
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-cyan-50 sm:text-base">
            Explore our medical specialists and book an appointment
            with the right healthcare professional for your needs.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-5 text-sm text-cyan-50">
            <span className="flex items-center gap-2">
              <ShieldCheck size={18} />
              Qualified Professionals
            </span>

            <span className="flex items-center gap-2">
              <CalendarDays size={18} />
              Easy Appointment Booking
            </span>
          </div>
        </div>
      </section>

      {/* DOCTORS SECTION */}
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">

        {/* SECTION HEADING */}
        <div className="mb-8">
          <p className="text-sm font-bold uppercase tracking-widest text-cyan-600">
            Meet Our Specialists
          </p>

          <h2 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl">
            Our Doctors
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500 sm:text-base">
            Find experienced healthcare professionals dedicated to
            providing quality patient care.
          </p>
        </div>

        {/* SEARCH AND FILTERS */}
        <div className="mb-8 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6">
          <div className="grid gap-4 md:grid-cols-2">

            {/* SEARCH */}
            <div>
              <label
                htmlFor="doctor-search"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Search Doctors
              </label>

              <div className="relative">
                <Search
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="doctor-search"
                  type="search"
                  value={searchTerm}
                  onChange={(event) =>
                    setSearchTerm(event.target.value)
                  }
                  placeholder="Search by name, specialization or qualification..."
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                />
              </div>
            </div>

            {/* SPECIALIZATION FILTER */}
            <div>
              <label
                htmlFor="specialization-filter"
                className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700"
              >
                <Filter size={17} />
                Filter by Specialization
              </label>

              <select
                id="specialization-filter"
                value={selectedSpecialization}
                onChange={(event) =>
                  setSelectedSpecialization(event.target.value)
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              >
                <option value="ALL">
                  All Specializations
                </option>

                {specializations.map((specialization) => (
                  <option
                    key={specialization.specializationId}
                    value={specialization.specializationName}
                  >
                    {specialization.specializationName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* FILTER SUMMARY */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <p className="text-sm text-slate-500">
              {loading
                ? "Finding available doctors..."
                : `Showing ${filteredDoctors.length} of ${doctors.length} doctors`}
            </p>

            {(searchTerm ||
              selectedSpecialization !== "ALL") && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-700 transition hover:text-cyan-800"
              >
                <X size={16} />
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* LOADING STATE */}
        {loading && (
          <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl bg-white">
            <LoaderCircle
              size={38}
              className="animate-spin text-cyan-600"
            />

            <p className="mt-4 text-sm font-medium text-slate-500">
              Loading our doctors...
            </p>
          </div>
        )}

        {/* ERROR STATE */}
        {!loading && error && (
          <div className="rounded-2xl border border-red-100 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500">
              <Stethoscope size={28} />
            </div>

            <h3 className="mt-4 text-lg font-bold text-slate-800">
              Unable to Load Doctors
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              {error}
            </p>

            <button
              type="button"
              onClick={fetchDoctors}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700"
            >
              <RefreshCw size={17} />
              Try Again
            </button>
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && !error && filteredDoctors.length === 0 && (
          <div className="rounded-2xl border border-slate-100 bg-white px-5 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-cyan-50 text-cyan-600">
              <UserRound size={32} />
            </div>

            <h3 className="mt-5 text-xl font-bold text-slate-800">
              No Doctors Found
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              We couldn't find any doctors matching your search.
              Try changing your search or specialization filter.
            </p>

            <button
              type="button"
              onClick={clearFilters}
              className="mt-6 inline-flex items-center gap-2 rounded-xl border border-cyan-600 px-5 py-3 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-50"
            >
              <RefreshCw size={16} />
              Reset Filters
            </button>
          </div>
        )}

        {/* DOCTOR CARDS */}
        {!loading && !error && filteredDoctors.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredDoctors.map((doctor) => (
              <article
                key={doctor.doctorId}
                className="group overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                {/* CARD HEADER */}
                <div className="relative flex items-center gap-4 border-b border-slate-100 bg-gradient-to-br from-cyan-50 to-white p-6">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-cyan-600 text-white shadow-sm">
                    <UserRound size={34} />
                  </div>

                  <div className="min-w-0">
                    <h3 className="truncate text-lg font-extrabold text-slate-900">
                      {doctor.fullName || "Doctor"}
                    </h3>

                    <span className="mt-2 inline-block rounded-full bg-cyan-100 px-3 py-1 text-xs font-bold text-cyan-800">
                      {doctor.specializationName ||
                        "General Specialist"}
                    </span>
                  </div>
                </div>

                {/* DOCTOR DETAILS */}
                <div className="p-6">
                  <div className="space-y-4">

                    {/* QUALIFICATION */}
                    <div className="flex items-start gap-3">
                      <GraduationCap
                        size={19}
                        className="mt-0.5 shrink-0 text-cyan-600"
                      />

                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-400">
                          Qualification
                        </p>

                        <p className="mt-1 break-words text-sm font-semibold text-slate-700">
                          {doctor.qualification || "Not specified"}
                        </p>
                      </div>
                    </div>

                    {/* EXPERIENCE */}
                    <div className="flex items-start gap-3">
                      <BriefcaseMedical
                        size={18}
                        className="mt-0.5 shrink-0 text-cyan-600"
                      />

                      <div>
                        <p className="text-xs font-medium text-slate-400">
                          Experience
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-700">
                          {doctor.experienceYears ?? 0}{" "}
                          {Number(doctor.experienceYears) === 1
                            ? "Year"
                            : "Years"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* CONSULTATION FEE */}
                  <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-5">
                    <div>
                      <p className="text-xs font-medium text-slate-400">
                        Consultation Fee
                      </p>

                      <p className="mt-1 text-2xl font-extrabold text-cyan-700">
                        {doctor.consultationFee != null
                          ? `₹${Number(
                              doctor.consultationFee
                            ).toLocaleString("en-IN")}`
                          : "Not specified"}
                      </p>
                    </div>

                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-50 text-cyan-600">
                      <IndianRupee size={20} />
                    </div>
                  </div>

                  {/* BOOK APPOINTMENT */}
                  <button
                    type="button"
                    onClick={() =>
                      handleBookAppointment(doctor.doctorId)
                    }
                    disabled={!doctor.doctorId}
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-3 font-bold text-white transition duration-200 hover:bg-cyan-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <CalendarDays size={18} />
                    Book Appointment

                    <ArrowRight
                      size={18}
                      className="transition group-hover:translate-x-1"
                    />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default AllDoctors;
