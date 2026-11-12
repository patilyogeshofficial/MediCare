import { useEffect, useState } from "react";
import {
  Heart,
  Brain,
  Bone,
  ScanFace,
  Baby,
  Stethoscope,
  Venus,
  Eye,
  Activity,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { Link } from "react-router-dom";
import api from "../services/api";

const getIconForSpecialization = (name) => {
  const normalized = String(name || "").toLowerCase();
  if (normalized.includes("cardio")) return { icon: Heart, color: "bg-red-50 text-red-600" };
  if (normalized.includes("neuro")) return { icon: Brain, color: "bg-purple-50 text-purple-600" };
  if (normalized.includes("ortho")) return { icon: Bone, color: "bg-orange-50 text-orange-600" };
  if (normalized.includes("derma") || normalized.includes("skin")) return { icon: ScanFace, color: "bg-pink-50 text-pink-600" };
  if (normalized.includes("pedia") || normalized.includes("child")) return { icon: Baby, color: "bg-blue-50 text-blue-600" };
  if (normalized.includes("gynec") || normalized.includes("women")) return { icon: Venus, color: "bg-rose-50 text-rose-600" };
  if (normalized.includes("ophthal") || normalized.includes("eye")) return { icon: Eye, color: "bg-cyan-50 text-cyan-600" };
  if (normalized.includes("general") || normalized.includes("physician")) return { icon: Stethoscope, color: "bg-emerald-50 text-emerald-600" };
  return { icon: Activity, color: "bg-sky-50 text-sky-600" };
};

function Specialities({ initialSpecialities = null }) {
  const [specialitiesList, setSpecialitiesList] = useState(initialSpecialities || []);
  const [loading, setLoading] = useState(!initialSpecialities);

  useEffect(() => {
    if (initialSpecialities && initialSpecialities.length > 0) {
      setSpecialitiesList(initialSpecialities);
      setLoading(false);
      return;
    }

    let isMounted = true;
    const fetchSpecializations = async () => {
      try {
        setLoading(true);
        const response = await api.get("/specializations");
        if (isMounted) {
          setSpecialitiesList(Array.isArray(response.data) ? response.data : []);
        }
      } catch (err) {
        console.error("Failed to load specializations on homepage:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchSpecializations();
    return () => {
      isMounted = false;
    };
  }, [initialSpecialities]);

  return (
    <section
      id="services"
      className="scroll-mt-20 bg-slate-50 py-20 lg:py-28"
    >
      <div className="mx-auto max-w-7xl px-6">
        {/* SECTION HEADING */}
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-700">
            Medical Departments
          </span>

          <h2 className="mt-3 text-balance text-3xl font-black text-slate-900 sm:text-4xl">
            Explore Clinical Specialities
          </h2>

          <p className="mt-4 text-base leading-relaxed text-slate-600">
            Comprehensive hospital departments with specialized doctors ready for outpatient and consultation appointments.
          </p>
        </div>

        {/* LOADING SKELETON */}
        {loading && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
              <div
                key={item}
                className="h-44 animate-pulse rounded-2xl border border-slate-200 bg-white p-7"
              />
            ))}
          </div>
        )}

        {/* SPECIALITIES GRID */}
        {!loading && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {specialitiesList.map((item) => {
              const { icon: Icon, color } = getIconForSpecialization(item.specializationName || item.name);
              const name = item.specializationName || item.name;
              const description =
                item.description ||
                `Specialized clinical consultations and medical care in ${name}.`;

              return (
                <div
                  key={item.specializationId || item.specialization_id || name}
                  className="group flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-cyan-200 hover:shadow-xl hover:shadow-cyan-900/5"
                >
                  <div>
                    <div
                      className={`flex h-14 w-14 items-center justify-center rounded-2xl ${color}`}
                    >
                      <Icon size={28} aria-hidden="true" />
                    </div>

                    <h3 className="mt-6 text-xl font-bold text-slate-900 group-hover:text-cyan-700 transition">
                      {name}
                    </h3>

                    <p className="mt-2.5 text-sm leading-relaxed text-slate-600">
                      {description}
                    </p>
                  </div>

                  <Link
                    to="/doctors"
                    className="mt-6 inline-flex items-center gap-2 text-xs font-bold text-cyan-700 transition hover:gap-3"
                  >
                    View Doctors
                    <ArrowRight size={15} aria-hidden="true" />
                  </Link>
                </div>
              );
            })}
          </div>
        )}

        {/* BOTTOM ACTION */}
        <div className="mt-14 text-center">
          <Link
            to="/patient/appointments/book"
            className="inline-flex items-center gap-2 rounded-2xl bg-cyan-600 px-8 py-4 text-sm font-bold text-white shadow-md transition hover:bg-cyan-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600"
          >
            Book An Appointment Across Any Department
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default Specialities;
