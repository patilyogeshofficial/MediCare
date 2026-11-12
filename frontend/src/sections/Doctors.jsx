import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Stethoscope,
  BriefcaseMedical,
  GraduationCap,
  IndianRupee,
  CalendarCheck,
  UserRound,
} from "lucide-react";
import api from "../services/api";

function Doctors({ initialDoctors = null }) {
  const [doctorsList, setDoctorsList] = useState(initialDoctors || []);
  const [loading, setLoading] = useState(!initialDoctors);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialDoctors && initialDoctors.length > 0) {
      setDoctorsList(initialDoctors);
      setLoading(false);
      return;
    }

    let isMounted = true;
    const fetchActiveDoctors = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await api.get("/doctors");
        const list = Array.isArray(response.data) ? response.data : [];
        if (isMounted) {
          // Strictly show only active doctors on the home page
          setDoctorsList(list.filter((doc) => doc.isActive !== false));
        }
      } catch (err) {
        if (isMounted) {
          console.error("Failed to fetch doctors on homepage:", err);
          setError("Unable to load active doctors.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchActiveDoctors();
    return () => {
      isMounted = false;
    };
  }, [initialDoctors]);

  const cleanDoctorName = (name) => {
    const raw = String(name || "").trim();
    if (!raw) return "Doctor";
    return /^dr\.?\s*/i.test(raw) ? raw : `Dr. ${raw}`;
  };

  return (
    <section
      id="doctors"
      className="scroll-mt-20 bg-white py-20 lg:py-28"
    >
      <div className="mx-auto max-w-7xl px-6">
        {/* SECTION HEADING */}
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-cyan-50 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-cyan-700">
            <Stethoscope size={15} />
            Verified Medical Specialists
          </div>

          <h2 className="mt-4 text-balance text-3xl font-black text-slate-900 sm:text-4xl">
            Meet Our Active Healthcare Specialists
          </h2>

          <p className="mt-4 text-base leading-relaxed text-slate-600">
            Consult with certified, active medical practitioners across our hospital departments.
          </p>
        </div>

        {/* LOADING SKELETON */}
        {loading && (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((skeleton) => (
              <div
                key={skeleton}
                className="overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
              >
                <div className="h-44 w-full animate-pulse rounded-xl bg-slate-100" />
                <div className="mt-4 h-4 w-24 animate-pulse rounded bg-slate-100" />
                <div className="mt-2 h-6 w-40 animate-pulse rounded bg-slate-200" />
                <div className="mt-2 h-4 w-32 animate-pulse rounded bg-slate-100" />
                <div className="mt-6 h-10 w-full animate-pulse rounded-xl bg-slate-100" />
              </div>
            ))}
          </div>
        )}

        {/* ERROR STATE */}
        {!loading && error && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-600">
            <p>{error}</p>
            <Link
              to="/doctors"
              className="mt-3 inline-block font-bold text-cyan-600 hover:underline"
            >
              Browse all specialists directory →
            </Link>
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && !error && doctorsList.length === 0 && (
          <div className="rounded-3xl border border-slate-100 bg-slate-50 p-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700">
              <UserRound size={28} />
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-800">
              Specialist Directory Updating
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              Our clinical roster is currently being synchronized. Please browse our comprehensive specialist directory.
            </p>
            <Link
              to="/doctors"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-cyan-700"
            >
              View All Doctors
              <ArrowRight size={16} />
            </Link>
          </div>
        )}

        {/* DOCTORS GRID */}
        {!loading && !error && doctorsList.length > 0 && (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {doctorsList.slice(0, 4).map((doctor) => (
              <div
                key={doctor.doctorId}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-cyan-200 hover:shadow-xl hover:shadow-cyan-900/5"
              >
                {/* DOCTOR CARD HEADER */}
                <div className="relative flex h-48 w-full items-center justify-center overflow-hidden bg-gradient-to-br from-cyan-600 to-blue-700 text-white">
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-white/30 bg-white/10 text-3xl font-black backdrop-blur-sm">
                    {doctor.fullName ? doctor.fullName.replace(/^dr\.?\s*/i, "").charAt(0).toUpperCase() : "D"}
                  </div>
                  <span className="absolute bottom-3 left-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-slate-900 shadow-sm backdrop-blur-sm">
                    {doctor.specializationName || "General Medicine"}
                  </span>
                </div>

                {/* DOCTOR DETAILS */}
                <div className="flex flex-1 flex-col justify-between p-6">
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900 group-hover:text-cyan-700 transition">
                      {cleanDoctorName(doctor.fullName)}
                    </h3>

                    <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                      <GraduationCap size={15} className="shrink-0 text-cyan-600" />
                      {doctor.qualification || "MBBS, MD"}
                    </p>

                    <p className="mt-2.5 flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                      <BriefcaseMedical size={15} className="shrink-0 text-cyan-600" />
                      {doctor.experienceYears ? `${doctor.experienceYears} Years Clinical Experience` : "Experienced Specialist"}
                    </p>
                  </div>

                  <div className="mt-6 border-t border-slate-100 pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          Consultation Fee
                        </span>
                        <p className="text-xl font-black text-cyan-700">
                          ₹{doctor.consultationFee ?? 0}
                        </p>
                      </div>

                      <Link
                        to="/patient/appointments/book"
                        state={{ doctorId: doctor.doctorId }}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-cyan-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600"
                      >
                        <CalendarCheck size={14} />
                        Book
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* BOTTOM CTA */}
        <div className="mt-14 text-center">
          <Link
            to="/doctors"
            className="inline-flex items-center gap-2 rounded-2xl border-2 border-cyan-600 bg-white px-8 py-3.5 text-sm font-bold text-cyan-700 shadow-sm transition duration-200 hover:bg-cyan-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600"
          >
            Explore Complete Specialist Directory
            <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default Doctors;
