
import {
  UserRound,
  Stethoscope,
  CalendarCheck,
  HeartPulse,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function HowItWorks() {
  const { user, isAuthenticated } = useAuth();

  const steps = [
    {
      number: "01",
      icon: UserRound,
      title: "Create Your Account",
      description:
        "Register with MediCare to access your personal healthcare dashboard.",
    },
    {
      number: "02",
      icon: Stethoscope,
      title: "Find a Doctor",
      description:
        "Explore medical specialities and choose a suitable healthcare professional.",
    },
    {
      number: "03",
      icon: CalendarCheck,
      title: "Book Appointment",
      description:
        "Select your preferred date and time to request an appointment.",
    },
    {
      number: "04",
      icon: HeartPulse,
      title: "Get Quality Care",
      description:
        "Visit the hospital and receive professional and compassionate care.",
    },
  ];

  const getStartedPath = () => {
    if (!isAuthenticated) return "/register";

    switch (user?.role) {
      case "ADMIN":
        return "/admin/dashboard";
      case "DOCTOR":
        return "/doctor/dashboard";
      case "PATIENT":
        return "/patient/dashboard";
      default:
        return "/login";
    }
  };

  return (
    <section
      id="how-it-works"
      className="scroll-mt-20 bg-slate-50 py-20 lg:py-28"
    >
      <div className="mx-auto max-w-7xl px-6">

        {/* SECTION HEADING */}
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-cyan-600">
            Simple Process
          </span>

          <h2 className="mt-4 text-balance text-3xl font-extrabold text-slate-900 sm:text-4xl">
            How MediCare Works
          </h2>

          <p className="mx-auto mt-5 max-w-2xl leading-7 text-slate-600">
            Getting quality healthcare should be simple. Follow these four
            easy steps to begin your healthcare journey with MediCare.
          </p>
        </div>

        {/* STEPS GRID */}
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => {
            const Icon = step.icon;

            return (
              <div
                key={step.number}
                className="group relative text-center transition-transform duration-300 hover:-translate-y-2 motion-reduce:transform-none motion-reduce:transition-none"
              >
                {/* STEP ICON */}
                <div className="mx-auto mb-7 flex h-20 w-20 items-center justify-center rounded-full bg-cyan-100 text-cyan-700 transition-all duration-300 group-hover:bg-cyan-600 group-hover:text-white motion-reduce:transition-none">
                  <Icon size={34} aria-hidden="true" />
                </div>

                {/* STEP NUMBER */}
                <span className="text-sm font-bold tracking-wider text-cyan-700">
                  STEP {step.number}
                </span>

                {/* STEP TITLE */}
                <h3 className="mt-3 text-xl font-bold text-slate-900">
                  {step.title}
                </h3>

                {/* STEP DESCRIPTION */}
                <p className="mx-auto mt-3 max-w-xs text-sm leading-7 text-slate-600">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* BOTTOM CTA */}
        <div className="mt-16 text-center">
          <Link
            to={getStartedPath()}
            className="inline-flex items-center gap-2 rounded-full bg-cyan-600 px-8 py-4 font-bold text-white shadow-lg shadow-cyan-100 transition duration-300 hover:-translate-y-1 hover:bg-cyan-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-700 motion-reduce:transform-none motion-reduce:transition-none"
          >
            Get Started
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>

      </div>
    </section>
  );
}

export default HowItWorks;
