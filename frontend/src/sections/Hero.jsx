
import {
  HeartPulse,
  ArrowRight,
  CalendarCheck,
  Stethoscope,
  ShieldCheck,
  Clock,
  CheckCircle2,
} from "lucide-react";

import { Link } from "react-router-dom";

function Hero() {
  return (
    <section
      id="home"
      className="relative scroll-mt-20 overflow-hidden bg-gradient-to-br from-cyan-50 via-white to-sky-100"
    >
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:py-28">

        {/* LEFT CONTENT */}
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-cyan-700 shadow-sm">
            <span
              className="h-2 w-2 rounded-full bg-green-500"
              aria-hidden="true"
            />
            Your Health, Our Priority
          </div>

          <h1 className="text-balance text-4xl font-extrabold leading-tight text-slate-950 sm:text-5xl lg:text-6xl">
            Better Care Begins With{" "}
            <span className="text-cyan-600">
              A Healthier You.
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
            Experience quality healthcare with trusted medical
            professionals. Find the right specialist and take
            control of your healthcare journey with MediCare.
          </p>

          {/* CALL TO ACTION BUTTONS */}
          <div className="mt-9 flex flex-wrap gap-4">

            {/* BOOK APPOINTMENT */}
            <Link
              to="/patient/appointments/book"
              className="flex items-center gap-2 rounded-xl bg-cyan-600 px-6 py-4 font-bold text-white shadow-lg transition duration-300 hover:-translate-y-1 hover:bg-cyan-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-700"
            >
              <CalendarCheck size={20} aria-hidden="true" />

              Book Appointment

              <ArrowRight size={18} aria-hidden="true" />
            </Link>

            {/* EXPLORE SERVICES */}
            <a
              href="#services"
              onClick={(event) => {
                event.preventDefault();

                document.getElementById("services")?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });

                window.history.replaceState(
                  null,
                  "",
                  "#services"
                );
              }}
              className="rounded-xl border border-slate-300 bg-white px-6 py-4 font-bold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-600"
            >
              Explore Services
            </a>

          </div>

          {/* TRUST HIGHLIGHTS */}
          <div className="mt-10 flex flex-wrap gap-6 border-t border-slate-200 pt-7">

            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
              <CheckCircle2
                className="text-green-600"
                size={19}
                aria-hidden="true"
              />
              Patient-focused care
            </div>

            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
              <CheckCircle2
                className="text-green-600"
                size={19}
                aria-hidden="true"
              />
              Qualified professionals
            </div>

          </div>
        </div>

        {/* RIGHT CONTENT */}
        <div className="relative">

          <div className="rounded-3xl bg-gradient-to-br from-cyan-600 to-blue-700 p-8 text-white shadow-2xl sm:p-12">

            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-cyan-100">
                  Welcome to MediCare
                </p>

                <h2 className="mt-3 text-2xl font-extrabold sm:text-3xl">
                  Healthcare Made Simple.
                </h2>
              </div>

              <HeartPulse
                size={55}
                aria-hidden="true"
              />
            </div>

            <p className="mt-5 leading-7 text-cyan-50">
              Your wellbeing matters. Connect with healthcare
              professionals and manage your care journey
              through one convenient platform.
            </p>

            {/* FEATURE CARDS */}
            <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">

              <div className="rounded-2xl bg-white/15 p-5">
                <Stethoscope
                  size={30}
                  aria-hidden="true"
                />

                <h3 className="mt-4 font-bold">
                  Expert Doctors
                </h3>

                <p className="mt-2 text-sm text-cyan-100">
                  Find the right specialist for your needs.
                </p>
              </div>

              <div className="rounded-2xl bg-white/15 p-5">
                <ShieldCheck
                  size={30}
                  aria-hidden="true"
                />

                <h3 className="mt-4 font-bold">
                  Trusted Care
                </h3>

                <p className="mt-2 text-sm text-cyan-100">
                  Healthcare focused on your wellbeing.
                </p>
              </div>

            </div>
          </div>

          {/* BOTTOM INFORMATION CARD */}
          <div className="mt-5 flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-lg">

            <div className="rounded-xl bg-green-100 p-3 text-green-700">
              <Clock
                size={25}
                aria-hidden="true"
              />
            </div>

            <div>
              <h3 className="font-bold text-slate-800">
                Your Health Journey Starts Here
              </h3>

              <p className="text-sm text-slate-500">
                Simple, accessible healthcare.
              </p>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}

export default Hero;
