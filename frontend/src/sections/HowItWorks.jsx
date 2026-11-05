import {
  UserRound,
  Stethoscope,
  CalendarCheck,
  HeartPulse,
  ArrowRight,
} from "lucide-react";

function HowItWorks() {
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

  return (
    <section id="how-it-works" className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-blue-600 font-semibold uppercase tracking-wider text-sm">
            Simple Process
          </span>

          <h2 className="text-4xl font-bold text-gray-900 mt-3 mb-5">
            How MediCare Works
          </h2>

          <p className="text-gray-600 leading-relaxed">
            Getting quality healthcare should be simple. Follow these four
            easy steps to begin your healthcare journey with MediCare.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step) => {
            const Icon = step.icon;

            return (
              <div key={step.number} className="relative text-center group">
                <div className="w-20 h-20 mx-auto mb-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                  <Icon size={34} />
                </div>

                <span className="text-sm font-bold text-blue-600">
                  STEP {step.number}
                </span>

                <h3 className="text-xl font-bold text-gray-900 mt-3 mb-3">
                  {step.title}
                </h3>

                <p className="text-gray-600 text-sm leading-relaxed max-w-xs mx-auto">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-16 text-center">
          <button
            onClick={() =>
              window.scrollTo({ top: 0, behavior: "smooth" })
            }
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-full font-semibold transition-all duration-300 shadow-lg shadow-blue-100"
          >
            Get Started
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;
