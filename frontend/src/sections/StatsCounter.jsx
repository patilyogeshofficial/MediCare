import { Activity, Stethoscope, Award, UsersRound, HeartPulse, CheckCircle2 } from "lucide-react";

function StatsCounter({ stats, loading }) {
  const statItems = [
    {
      label: "Active Medical Specialists",
      value: stats?.activeDoctorsCount ?? 0,
      suffix: "+",
      description: "Verified licensed doctors",
      icon: Stethoscope,
      iconBg: "bg-cyan-100 text-cyan-700",
    },
    {
      label: "Clinical Departments",
      value: stats?.activeSpecializationsCount ?? 0,
      suffix: "",
      description: "Specialized care units",
      icon: Award,
      iconBg: "bg-blue-100 text-blue-700",
    },
    {
      label: "Completed Consultations",
      value: stats?.completedAppointmentsCount ?? 0,
      suffix: "+",
      description: "Successful patient visits",
      icon: CheckCircle2,
      iconBg: "bg-emerald-100 text-emerald-700",
    },
    {
      label: "Registered Patients",
      value: stats?.registeredPatientsCount ?? 0,
      suffix: "+",
      description: "Trusting our healthcare console",
      icon: UsersRound,
      iconBg: "bg-purple-100 text-purple-700",
    },
  ];

  return (
    <section className="relative z-10 -mt-8 mx-auto max-w-7xl px-6">
      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Live Verified Hospital Activity
            </span>
          </div>

          <p className="text-xs text-slate-500">
            Real-time figures from MediCare Hospital Administration Database
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {statItems.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className="flex items-center gap-4 rounded-2xl bg-slate-50/70 p-4 transition-all hover:bg-slate-50 hover:shadow-sm"
              >
                <div
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${item.iconBg}`}
                >
                  <Icon size={26} aria-hidden="true" />
                </div>

                <div>
                  <div className="flex items-baseline gap-1">
                    {loading ? (
                      <span className="inline-block h-8 w-16 animate-pulse rounded-lg bg-slate-200" />
                    ) : (
                      <span className="text-3xl font-black text-slate-900">
                        {item.value}
                        <span className="text-cyan-600 font-extrabold">{item.suffix}</span>
                      </span>
                    )}
                  </div>

                  <p className="text-xs font-bold text-slate-800">
                    {item.label}
                  </p>

                  <p className="text-[11px] text-slate-500">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default StatsCounter;
