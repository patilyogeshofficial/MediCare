
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { doctors } from "../data/doctors";

function Doctors() {
  return (
    <section
      id="doctors"
      className="scroll-mt-20 bg-white py-20 lg:py-28"
    >
      <div className="mx-auto max-w-7xl px-6">

        {/* SECTION HEADING */}
        <div className="mb-14 text-center">
          <p className="font-bold uppercase tracking-widest text-cyan-600">
            Meet Our Specialists
          </p>

          <h2 className="mt-4 text-balance text-3xl font-extrabold text-slate-900 sm:text-4xl">
            Meet Our Experienced Doctors
          </h2>

          <p className="mx-auto mt-5 max-w-2xl leading-7 text-slate-600">
            Connect with qualified healthcare professionals dedicated
            to providing attentive and patient-focused care.
          </p>
        </div>

        {/* DOCTORS GRID */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {doctors.map((doctor) => (
            <div
              key={doctor.name}
              className="group overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition duration-300 hover:-translate-y-2 hover:shadow-xl"
            >

              {/* DOCTOR IMAGE */}
              <div className="h-64 overflow-hidden bg-cyan-50">
                <img
                  src={doctor.image}
                  alt={`Dr. ${doctor.name}`}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-105"
                />
              </div>

              {/* DOCTOR DETAILS */}
              <div className="p-6">
                <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-700">
                  {doctor.specialty}
                </span>

                <h3 className="mt-4 text-lg font-extrabold text-slate-900">
                  {doctor.name}
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  {doctor.qualification}
                </p>

                <p className="mt-3 text-sm font-semibold text-slate-600">
                  {doctor.experience}
                </p>

                {/* CONSULTATION FEE */}
                <div className="mt-5 border-t border-slate-100 pt-4">
                  <p className="text-xs text-slate-500">
                    Consultation Fee
                  </p>

                  <p className="text-xl font-extrabold text-cyan-700">
                    ₹{doctor.fee}
                  </p>
                </div>

                {/* BOOK APPOINTMENT */}
                <Link
                  to="/doctors"
                  className="mt-5 block rounded-xl bg-cyan-600 py-3 text-center text-sm font-bold text-white transition hover:bg-cyan-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-700"
                >
                  Book Appointment
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* BOTTOM CTA */}
        <div className="mt-12 text-center">
          <Link
            to="/doctors"
            className="inline-flex items-center gap-2 rounded-xl border border-cyan-600 px-7 py-4 font-bold text-cyan-700 transition hover:bg-cyan-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-700"
          >
            View All Doctors
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>

      </div>
    </section>
  );
}

export default Doctors;
