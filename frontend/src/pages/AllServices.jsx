
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { services } from "../data/services";

function AllServices() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-slate-50">
        {/* HERO SECTION */}
        <section className="bg-gradient-to-r from-cyan-700 to-blue-700 px-6 py-20 text-center text-white lg:py-24">
          <div className="mx-auto max-w-4xl">
            <Link
              to="/"
              className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-cyan-100 transition hover:text-white"
            >
              <ArrowLeft size={17} />
              Back to Home
            </Link>

            <p className="font-bold uppercase tracking-widest text-cyan-100">
              What We Offer
            </p>

            <h1 className="mt-4 text-4xl font-extrabold sm:text-5xl">
              Our Healthcare Services
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-cyan-50">
              Explore our range of healthcare services designed to
              support your medical needs and make your healthcare
              journey more convenient.
            </p>
          </div>
        </section>

        {/* ALL SERVICES */}
        <section className="px-6 py-16 lg:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-extrabold text-slate-900">
                Explore Our Services
              </h2>

              <p className="mt-4 text-slate-600">
                Find the right healthcare service for your needs.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {services.map((service) => {
                const Icon = service.icon;

                return (
                  <div
                    key={service.slug}
                    className="group flex flex-col rounded-2xl border border-slate-100 bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-2 hover:border-cyan-200 hover:shadow-xl"
                  >
                    <div
                      className={`flex h-14 w-14 items-center justify-center rounded-2xl ${service.color}`}
                    >
                      <Icon size={28} aria-hidden="true" />
                    </div>

                    <h3 className="mt-6 text-xl font-bold text-slate-900">
                      {service.title}
                    </h3>

                    <p className="mt-3 flex-1 text-sm leading-7 text-slate-600">
                      {service.description}
                    </p>

                    <Link
                      to={`/healthcare-services/${service.slug}`}
                      className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-cyan-700 transition group-hover:gap-3"
                    >
                      Learn More
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* BOTTOM CTA */}
        <section className="px-6 pb-16">
          <div className="mx-auto max-w-7xl rounded-3xl bg-gradient-to-r from-cyan-600 to-blue-700 px-6 py-14 text-center text-white sm:px-12">
            <h2 className="text-2xl font-extrabold sm:text-3xl">
              Need Help Finding a Doctor?
            </h2>

            <p className="mx-auto mt-4 max-w-2xl leading-7 text-cyan-50">
              Explore our available doctors and find the right
              medical professional for your consultation.
            </p>

            <Link
              to="/doctors"
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-7 py-4 font-bold text-cyan-700 transition hover:bg-cyan-50"
            >
              Find a Doctor
              <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

export default AllServices;
