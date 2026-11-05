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
    <section id="medical-team" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-blue-600 font-semibold uppercase tracking-wider text-sm">
            Our People
          </span>

          <h2 className="text-4xl font-bold text-gray-900 mt-3 mb-5">
            Meet Our Medical Team
          </h2>

          <p className="text-gray-600 leading-relaxed">
            Behind every successful healthcare experience is a dedicated team.
            Our professionals work together to deliver compassionate and
            reliable healthcare services.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {members.map((member) => {
            const Icon = member.icon;

            return (
              <div
                key={member.number}
                className="group p-8 rounded-2xl border border-gray-100 bg-gray-50 hover:bg-white hover:border-blue-200 hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-7">
                  <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                    <Icon size={30} />
                  </div>

                  <span className="text-4xl font-bold text-gray-200">
                    {member.number}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {member.title}
                </h3>

                <p className="text-gray-600 leading-relaxed text-sm">
                  {member.description}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-14 text-center">
          <p className="text-gray-600">
            One Team. One Mission. Better Healthcare for Everyone.
          </p>
        </div>
      </div>
    </section>
  );
}

export default MedicalTeam;
