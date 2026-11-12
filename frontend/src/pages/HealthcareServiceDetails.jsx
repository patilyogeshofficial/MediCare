
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { services } from "../data/services";

function HealthcareServiceDetails() {
  const { serviceSlug } = useParams();

  const service = services.find(
    (item) => item.slug === serviceSlug
  );

  // SERVICE NOT FOUND
  if (!service) {
    return (
      <>
        <Navbar />

        <main className="flex min-h-[65vh] flex-col items-center justify-center px-6 text-center">
          <h1 className="text-3xl font-extrabold text-slate-900">
            Service Not Found
          </h1>

          <p className="mt-3 text-slate-600">
            The healthcare service you are looking for does not exist.
          </p>

          <Link
            to="/healthcare-services"
            className="mt-6 rounded-xl bg-cyan-600 px-6 py-3 font-bold text-white transition hover:bg-cyan-700"
          >
            Explore All Services
          </Link>
        </main>

        <Footer />
      </>
    );
  }

  const Icon = service.icon;

  return (
    <>
      <Navbar />

      <main id="main-content" tabIndex="-1" className="min-h-screen bg-slate-50">

        {/* HERO SECTION */}
        <section className="bg-gradient-to-r from-cyan-700 to-blue-700 px-6 py-20 text-white lg:py-28">
          <div className="mx-auto max-w-5xl">

            <Link
              to="/healthcare-services"
              className="mb-10 inline-flex items-center gap-2 text-sm font-semibold text-cyan-100 transition hover:text-white"
            >
              <ArrowLeft size={17} />
              All Healthcare Services
            </Link>

            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15">
              <Icon size={34} aria-hidden="true" />
            </div>

            <p className="mt-8 font-bold uppercase tracking-widest text-cyan-100">
              MediCare Plus Healthcare Services
            </p>

            <h1 className="mt-4 text-4xl font-extrabold sm:text-5xl">
              {service.title}
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-8 text-cyan-50">
              {service.description}
            </p>

          </div>
        </section>

        {/* SERVICE INFORMATION */}
        <section className="px-6 py-16 lg:py-20">
          <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2">

            {/* ABOUT SERVICE */}
            <div>
              <p className="font-bold uppercase tracking-widest text-cyan-600">
                About This Service
              </p>

              <h2 className="mt-4 text-3xl font-extrabold text-slate-900">
                Supporting Your Healthcare Needs
              </h2>

              <p className="mt-6 leading-8 text-slate-600">
                {service.overview}
              </p>

              <Link
                to="/doctors"
                className="mt-8 inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-6 py-3 font-bold text-white transition hover:bg-cyan-700"
              >
                Find a Doctor
                <ArrowRight size={18} />
              </Link>
            </div>

            {/* SERVICE FEATURES */}
            <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">

              <div className="flex items-center gap-3">
                <div className={`rounded-xl p-3 ${service.color}`}>
                  <Icon size={26} aria-hidden="true" />
                </div>

                <h2 className="text-2xl font-bold text-slate-900">
                  What This Service Includes
                </h2>
              </div>

              <div className="mt-8 space-y-5">
                {service.features.map((feature) => (
                  <div
                    key={feature}
                    className="flex items-start gap-3"
                  >
                    <CheckCircle2
                      size={21}
                      className="mt-0.5 shrink-0 text-cyan-600"
                      aria-hidden="true"
                    />

                    <p className="text-slate-700">
                      {feature}
                    </p>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </section>

        {/* BOTTOM CTA */}
        <section className="px-6 pb-16">
          <div className="mx-auto max-w-6xl rounded-3xl bg-gradient-to-r from-cyan-600 to-blue-700 p-8 text-center text-white sm:p-12">

            <h2 className="text-2xl font-extrabold sm:text-3xl">
              Explore More Healthcare Services
            </h2>

            <p className="mx-auto mt-4 max-w-2xl leading-7 text-cyan-50">
              Discover more healthcare services offered by MediCare Plus
              and find the support that suits your healthcare needs.
            </p>

            <Link
              to="/healthcare-services"
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-7 py-4 font-bold text-cyan-700 shadow-md transition hover:-translate-y-1 hover:bg-cyan-50 hover:shadow-lg"
            >
              Explore All Services
              <ArrowRight size={18} aria-hidden="true" />
            </Link>

          </div>
        </section>

      </main>

      <Footer />
    </>
  );
}

export default HealthcareServiceDetails;
