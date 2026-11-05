import {
  Award,
  HeartHandshake,
  Building2,
  CalendarCheck2,
  HandHeart,
  Users,
} from "lucide-react";

function WhyChooseUs() {
  const features = [
    {
      title: "Experienced Healthcare Professionals",
      description:
        "Connect with qualified doctors and dedicated medical professionals across multiple specialities.",
      icon: Award,
      color: "bg-blue-50 text-blue-600",
    },
    {
      title: "Patient-Centered Care",
      description:
        "A healthcare experience designed around patient needs, comfort and convenience.",
      icon: HeartHandshake,
      color: "bg-pink-50 text-pink-600",
    },
    {
      title: "Modern Medical Facilities",
      description:
        "Organized healthcare services supported by modern medical facilities and technology.",
      icon: Building2,
      color: "bg-purple-50 text-purple-600",
    },
    {
      title: "Easy Appointment Booking",
      description:
        "Find doctors, explore specialities and manage appointments conveniently.",
      icon: CalendarCheck2,
      color: "bg-green-50 text-green-600",
    },
    {
      title: "Dedicated Nursing Support",
      description:
        "Compassionate nursing professionals focused on patient assistance and care.",
      icon: HandHeart,
      color: "bg-orange-50 text-orange-600",
    },
    {
      title: "Comprehensive Healthcare",
      description:
        "Access multiple healthcare departments and services through one platform.",
      icon: Users,
      color: "bg-cyan-50 text-cyan-600",
    },
  ];

  return (
    <section id="why-choose-us" className="bg-white py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6">

        {/* SECTION HEADING */}
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <p className="font-bold uppercase tracking-widest text-cyan-600">
            Why Choose Us
          </p>

          <h2 className="mt-4 text-balance text-3xl font-extrabold text-slate-900 sm:text-4xl">
            Why Patients Choose MediCare
          </h2>

          <p className="mt-5 leading-7 text-slate-600">
            We are committed to making healthcare more accessible,
            organized and patient-focused through quality services
            and dedicated medical professionals.
          </p>
        </div>

        {/* FEATURES GRID */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <div
                key={feature.title}
                className="group rounded-2xl border border-slate-100 bg-white p-8 shadow-sm transition duration-300 hover:-translate-y-2 hover:border-cyan-200 hover:shadow-xl"
              >
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-2xl ${feature.color}`}
                >
                  <Icon size={30} aria-hidden="true" />
                </div>

                <h3 className="mt-6 text-xl font-bold text-slate-900">
                  {feature.title}
                </h3>

                <p className="mt-4 text-sm leading-7 text-slate-600">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* BOTTOM CTA */}
        <div className="mt-14 rounded-3xl bg-gradient-to-r from-cyan-600 to-blue-700 px-8 py-12 text-center text-white sm:px-14">
          <h3 className="text-balance text-2xl font-extrabold sm:text-3xl">
            Your Wellbeing Is Our Priority
          </h3>

          <p className="mx-auto mt-4 max-w-2xl leading-7 text-cyan-50">
            Take the next step towards a more convenient healthcare
            experience with MediCare.
          </p>

          <a
            href="#doctors"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-7 py-4 font-bold text-cyan-700 transition hover:bg-cyan-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            Explore Our Doctors →
          </a>
        </div>

      </div>
    </section>
  );
}

export default WhyChooseUs;