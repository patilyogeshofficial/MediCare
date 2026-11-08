
import {
  Heart,
  Brain,
  Bone,
  ScanFace,
  Baby,
  Stethoscope,
  Venus,
  Eye,
  ArrowRight,
} from "lucide-react";

const specialities = [
  {
    name: "Cardiology",
    description:
      "Specialized care for heart health and cardiovascular conditions.",
    icon: Heart,
    color: "bg-red-50 text-red-600",
  },
  {
    name: "Neurology",
    description:
      "Expert care for brain, spine and nervous system conditions.",
    icon: Brain,
    color: "bg-purple-50 text-purple-600",
  },
  {
    name: "Orthopedics",
    description:
      "Treatment and care for bones, joints and muscles.",
    icon: Bone,
    color: "bg-orange-50 text-orange-600",
  },
  {
    name: "Dermatology",
    description:
      "Professional care for skin, hair and nail conditions.",
    icon: ScanFace,
    color: "bg-pink-50 text-pink-600",
  },
  {
    name: "Pediatrics",
    description:
      "Dedicated healthcare for infants, children and adolescents.",
    icon: Baby,
    color: "bg-blue-50 text-blue-600",
  },
  {
    name: "General Medicine",
    description:
      "Primary healthcare, diagnosis and preventive care.",
    icon: Stethoscope,
    color: "bg-green-50 text-green-600",
  },
  {
    name: "Gynecology",
    description:
      "Healthcare services focused on women's reproductive health.",
    icon: Venus,
    color: "bg-rose-50 text-rose-600",
  },
  {
    name: "Ophthalmology",
    description:
      "Specialized medical care for eye health and vision.",
    icon: Eye,
    color: "bg-cyan-50 text-cyan-600",
  },
];

function Specialities() {
  // Navigate to the doctors section
  const handleExploreDoctors = (event) => {
    event.preventDefault();

    const doctorsSection = document.getElementById("doctors");

    if (doctorsSection) {
      doctorsSection.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

      window.history.replaceState(null, "", "#doctors");
    }
  };

  return (
    <section
      id="services"
      className="scroll-mt-20 bg-slate-50 py-20 lg:py-28"
    >
      <div className="mx-auto max-w-7xl px-6">

        {/* SECTION HEADING */}
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <p className="font-bold uppercase tracking-widest text-cyan-600">
            Our Departments
          </p>

          <h2 className="mt-4 text-balance text-3xl font-extrabold text-slate-900 sm:text-4xl">
            Explore Our Medical Specialities
          </h2>

          <p className="mt-5 leading-7 text-slate-600">
            Access specialized healthcare services with experienced
            medical professionals across multiple departments.
          </p>
        </div>

        {/* SPECIALITIES GRID */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {specialities.map((speciality) => {
            const Icon = speciality.icon;

            return (
              <div
                key={speciality.name}
                className="group rounded-2xl border border-slate-100 bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-2 hover:border-cyan-200 hover:shadow-xl"
              >
                {/* SPECIALITY ICON */}
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl ${speciality.color}`}
                >
                  <Icon size={28} aria-hidden="true" />
                </div>

                {/* SPECIALITY NAME */}
                <h3 className="mt-6 text-xl font-bold text-slate-900">
                  {speciality.name}
                </h3>

                {/* DESCRIPTION */}
                <p className="mt-3 min-h-16 text-sm leading-6 text-slate-600">
                  {speciality.description}
                </p>

                {/* EXPLORE DEPARTMENT */}
                <a
                  href="#doctors"
                  onClick={handleExploreDoctors}
                  className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-cyan-700 transition group-hover:gap-3 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-700"
                >
                  Explore Department
                  <ArrowRight size={16} aria-hidden="true" />
                </a>
              </div>
            );
          })}
        </div>

        {/* BOTTOM CTA */}
        <div className="mt-12 text-center">
          <a
            href="#doctors"
            onClick={handleExploreDoctors}
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-7 py-4 font-bold text-white transition hover:bg-cyan-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-700"
          >
            Explore All Specialities
            <ArrowRight size={18} aria-hidden="true" />
          </a>
        </div>

      </div>
    </section>
  );
}

export default Specialities;
