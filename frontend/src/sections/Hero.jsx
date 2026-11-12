import {
  HeartPulse,
  ArrowRight,
  CalendarCheck,
  Stethoscope,
  ShieldCheck,
  Clock,
  PhoneCall,
  MapPin,
  CheckCircle2,
} from "lucide-react";
import { Link } from "react-router-dom";

function Hero() {
  const handleScrollToSection = (sectionId) => (event) => {
    event.preventDefault();
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
      window.history.replaceState(null, "", `#${sectionId}`);
    }
  };

  return (
    <section
      id="home"
      className="relative scroll-mt-20 overflow-hidden bg-gradient-to-br from-cyan-50 via-white to-sky-100/70 pb-16 pt-12 lg:pb-24 lg:pt-20"
    >
      {/* BACKGROUND DECORATIVE ELEMENTS */}
      <div
        className="pointer-events-none absolute -top-40 right-0 h-96 w-96 rounded-full bg-cyan-200/40 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-0 left-0 h-96 w-96 rounded-full bg-blue-200/30 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 lg:grid-cols-12">
        {/* LEFT CONTENT COLUMN */}
        <div className="lg:col-span-7">
          {/* VERIFIED HEALTHCARE PILL */}
          <div className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-cyan-200 bg-white/90 px-4 py-2 text-xs font-bold text-cyan-800 shadow-sm backdrop-blur-sm">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
            Connected Healthcare Administration
          </div>

          <h1 className="text-balance text-4xl font-black leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Smarter Care,{" "}
            <span className="bg-gradient-to-r from-cyan-600 to-blue-700 bg-clip-text text-transparent">
              Better Connections.
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
            MediCare Plus is the modern Healthcare Administration Console. Connect with verified
            medical specialists, manage appointments with real-time slot holds, and access comprehensive
            electronic health records in one unified platform.
          </p>

          {/* CALL TO ACTION BUTTONS */}
          <div className="mt-8 flex flex-col sm:flex-row sm:items-center gap-3.5">
            <Link
              to="/patient/appointments/book"
              className="inline-flex items-center justify-center gap-2.5 rounded-2xl bg-cyan-600 px-7 py-4 text-sm font-bold text-white shadow-lg shadow-cyan-600/25 transition duration-200 hover:-translate-y-0.5 hover:bg-cyan-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600 text-center"
            >
              <CalendarCheck size={19} aria-hidden="true" />
              Book Consultation
              <ArrowRight size={17} aria-hidden="true" />
            </Link>

            <a
              href="#doctors"
              onClick={handleScrollToSection("doctors")}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white/80 px-6 py-4 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600 text-center"
            >
              <Stethoscope size={18} className="text-cyan-600" aria-hidden="true" />
              Meet Specialists
            </a>
          </div>

          {/* REAL CONTACT BADGE */}
          <div className="mt-10 flex flex-wrap items-center gap-6 border-t border-slate-200/80 pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700">
                <PhoneCall size={18} aria-hidden="true" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Hospital Desk
                </p>
                <a
                  href="tel:+918010729955"
                  className="text-sm font-extrabold text-slate-900 transition hover:text-cyan-600"
                >
                  +91 8010729955
                </a>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                <MapPin size={18} aria-hidden="true" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Campus Location
                </p>
                <p className="text-sm font-semibold text-slate-800">
                  Deccan, Pune, India
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800">
              <CheckCircle2 size={16} className="text-emerald-600" aria-hidden="true" />
              24/7 Emergency Support
            </div>
          </div>
        </div>

        {/* RIGHT VISUAL COLUMN */}
        <div className="relative lg:col-span-5">
          <div className="rounded-3xl bg-gradient-to-br from-cyan-600 via-cyan-700 to-blue-800 p-8 text-white shadow-2xl shadow-cyan-900/20 sm:p-10">
            <div className="flex items-center justify-between">
              <div>
                <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold text-cyan-100 backdrop-blur-sm">
                  MediCare Plus
                </span>
                <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">
                  The Healthcare Administration Console
                </h2>
              </div>
              <div className="rounded-2xl bg-white/15 p-3 text-white backdrop-blur-sm">
                <HeartPulse size={40} aria-hidden="true" />
              </div>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-cyan-50">
              Complete healthcare management platform connecting patients, licensed doctors,
              and hospital administrators with seamless consultation records.
            </p>

            {/* KEY PILLARS */}
            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-3 rounded-2xl bg-white/10 p-3.5 backdrop-blur-sm">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/20 text-white">
                  <ShieldCheck size={20} aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Verified Prescriptions</h3>
                  <p className="text-xs text-cyan-100">Tamper-proof digital medical receipts</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl bg-white/10 p-3.5 backdrop-blur-sm">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/20 text-white">
                  <Clock size={20} aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Dynamic Availability</h3>
                  <p className="text-xs text-cyan-100">Zero double-booking conflict schedule</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl bg-white/10 p-3.5 backdrop-blur-sm">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/20 text-white">
                  <Stethoscope size={20} aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Multi-Disciplinary Care</h3>
                  <p className="text-xs text-cyan-100">Cardiology, Neurology, Pediatrics & more</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
