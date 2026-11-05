import {
  Stethoscope,
  Ambulance,
  Syringe,
  Pill,
  Microscope,
  BedDouble,
  HeartPulse,
  ClipboardList,
} from "lucide-react";

export const services = [
  {
    title: "Outpatient Department",
    description:
      "Consult experienced doctors for diagnosis, treatment and routine medical consultations.",
    icon: Stethoscope,
    color: "bg-blue-50 text-blue-600",
  },
  {
    title: "Emergency Care",
    description:
      "Emergency medical assistance and timely attention for urgent healthcare needs.",
    icon: Ambulance,
    color: "bg-red-50 text-red-600",
  },
  {
    title: "Nursing Services",
    description:
      "Professional nursing support and compassionate patient care.",
    icon: Syringe,
    color: "bg-purple-50 text-purple-600",
  },
  {
    title: "Pharmacy Services",
    description:
      "Prescription-based medicine services and organized medication records.",
    icon: Pill,
    color: "bg-green-50 text-green-600",
  },
  {
    title: "Laboratory & Diagnostics",
    description:
      "Laboratory testing and diagnostic services to support medical evaluations.",
    icon: Microscope,
    color: "bg-orange-50 text-orange-600",
  },
  {
    title: "Inpatient Care",
    description:
      "Organized hospital admission, ward facilities and patient care coordination.",
    icon: BedDouble,
    color: "bg-cyan-50 text-cyan-600",
  },
  {
    title: "Health Checkups",
    description:
      "Preventive health assessments and routine wellness checkups.",
    icon: HeartPulse,
    color: "bg-pink-50 text-pink-600",
  },
  {
    title: "Medical Records",
    description:
      "Convenient organization and management of patient healthcare records.",
    icon: ClipboardList,
    color: "bg-indigo-50 text-indigo-600",
  },
];