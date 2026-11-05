import { ArrowRight } from "lucide-react";
import { services } from "../data/services";

function HealthcareServices() {
  return (
    <section
      id="healthcare-services"
      className="bg-slate-50 py-20 lg:py-28"
    >
      <div className="mx-auto max-w-7xl px-6">

        {/* SECTION HEADING */}
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <p className="font-bold uppercase tracking-widest text-cyan-600">
            What We Offer
          </p>

          <h2 className="mt-4 text-3xl font-extrabold text-slate-900 sm:text-4xl">
            Comprehensive Healthcare Services
          </h2>

          <p className="mt-5 leading-7 text-slate-600">
            From preventive healthcare to specialized medical services,
            MediCare supports your healthcare journey at every step.
          </p>
        </div>

        {/* SERVICES GRID */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((service) => {
            const Icon = service.icon;

            return (
              <div
                key={service.title}
                className="group rounded-2xl border border-slate-100 bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-2 hover:border-cyan-200 hover:shadow-xl"
              >
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl ${service.color}`}
                >
                  <Icon size={28} />
                </div>

                <h3 className="mt-6 text-xl font-bold text-slate-900">
                  {service.title}
                </h3>

                <p className="mt-3 min-h-20 text-sm leading-6 text-slate-600">
                  {service.description}
                </p>

                <a
                  href="#contact"
                  className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-cyan-700 transition group-hover:gap-3"
                >
                  Learn More
                  <ArrowRight size={16} />
                </a>
              </div>
            );
          })}
        </div>

        {/* BOTTOM CTA */}
        <div className="mt-14 rounded-3xl bg-gradient-to-r from-cyan-600 to-blue-700 p-8 text-center text-white sm:p-12">
          <h3 className="text-2xl font-extrabold sm:text-3xl">
            Your Health Matters to Us
          </h3>

          <p className="mx-auto mt-4 max-w-2xl leading-7 text-cyan-50">
            Explore our healthcare services and connect with
            the right medical professionals for your needs.
          </p>

          <a
            href="#doctors"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-7 py-4 font-bold text-cyan-700 transition hover:bg-cyan-50"
          >
            Find a Doctor
            <ArrowRight size={18} />
          </a>
        </div>

      </div>
    </section>
  );
}

export default HealthcareServices;