import {
  Stethoscope,
  HeartHandshake,
  UserRound,
  Pill,
  Microscope,
  ShieldCheck,
} from "lucide-react";

function MedicalTeam() {
  const members = [
    {
      icon: Stethoscope,
      title: "Doctors",
      description:
        "Experienced medical professionals dedicated to diagnosis, treatment and patient care.",
      number: "01",
    },
    {
      icon: HeartHandshake,
      title: "Nursing Staff",
      description:
        "Compassionate nurses providing continuous support, attention and quality patient care.",
      number: "02",
    },
    {
      icon: UserRound,
      title: "Receptionists",
      description:
        "Friendly front-desk professionals helping patients with appointments and enquiries.",
      number: "03",
    },
    {
      icon: Pill,
      title: "Pharmacists",
      description:
        "Qualified professionals ensuring accurate medication dispensing and pharmacy support.",
      number: "04",
    },
    {
      icon: Microscope,
      title: "Lab Technicians",
      description:
        "Skilled technicians supporting accurate diagnostic testing and laboratory services.",
      number: "05",
    },
    {
      icon: ShieldCheck,
      title: "Hospital Administrators",
      description:
        "Dedicated administrators coordinating hospital operations and ensuring smooth services.",
      number: "06",
    },
  ];

  return (
    <section id="medical-team" className="bg-white py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6">

        {/* SECTION HEADING */}
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-cyan-600">
            Our People
          </span>

          <h2 className="mt-4 text-balance text-3xl font-extrabold text-slate-900 sm:text-4xl">
            Meet Our Medical Team
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-pretty leading-7 text-slate-600">
            Behind every successful healthcare experience is a dedicated team.
            Our professionals work together to deliver compassionate and
            reliable healthcare services.
          </p>
        </div>

        {/* MEDICAL TEAM GRID */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => {
            const Icon = member.icon;

            return (
              <div
                key={member.number}
                className="group rounded-2xl border border-slate-100 bg-slate-50 p-8 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-200 hover:bg-white hover:shadow-xl motion-reduce:transform-none motion-reduce:transition-none"
              >
                <div className="mb-7 flex items-center justify-between">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700 transition-all duration-300 group-hover:bg-cyan-600 group-hover:text-white motion-reduce:transition-none">
                    <Icon size={30} aria-hidden="true" />
                  </div>

                  <span
                    aria-hidden="true"
                    className="text-4xl font-bold text-slate-200"
                  >
                    {member.number}
                  </span>
                </div>

                <h3 className="mb-3 text-xl font-bold text-slate-900">
                  {member.title}
                </h3>

                <p className="text-pretty text-sm leading-relaxed text-slate-600">
                  {member.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* BOTTOM MESSAGE */}
        <div className="mt-14 text-center">
          <p className="text-balance font-medium text-slate-600">
            One Team. One Mission. Better Healthcare for Everyone.
          </p>
        </div>

      </div>
    </section>
  );
}

export default MedicalTeam;