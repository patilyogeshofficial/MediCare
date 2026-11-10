
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
    slug: "outpatient",
    title: "Outpatient Department",
    description:
      "Consult experienced doctors for diagnosis, treatment and routine medical consultations.",
    overview:
      "The Outpatient Department helps patients connect with doctors for consultations, medical evaluations and follow-up care without hospital admission.",
    icon: Stethoscope,
    color: "bg-blue-50 text-blue-600",
    features: [
      "Doctor consultations",
      "Medical evaluations",
      "Routine health consultations",
      "Follow-up appointments",
    ],
  },
  {
    slug: "emergency-care",
    title: "Emergency Care",
    description:
      "Emergency medical assistance and timely attention for urgent healthcare needs.",
    overview:
      "Emergency Care focuses on providing timely medical attention for urgent health situations and helping patients access appropriate medical assistance.",
    icon: Ambulance,
    color: "bg-red-50 text-red-600",
    features: [
      "Urgent medical assessment",
      "Emergency assistance",
      "Initial patient evaluation",
      "Coordination with medical professionals",
    ],
  },
  {
    slug: "nursing",
    title: "Nursing Services",
    description:
      "Professional nursing support and compassionate patient care.",
    overview:
      "Nursing Services support patients through essential care activities, assistance and coordination during their healthcare journey.",
    icon: Syringe,
    color: "bg-purple-50 text-purple-600",
    features: [
      "Patient assistance",
      "Routine nursing care",
      "Patient monitoring support",
      "Care coordination",
    ],
  },
  {
    slug: "pharmacy",
    title: "Pharmacy Services",
    description:
      "Prescription-based medicine services and organized medication records.",
    overview:
      "Pharmacy Services support prescription-based medication needs and help maintain organized medication information for patients.",
    icon: Pill,
    color: "bg-green-50 text-green-600",
    features: [
      "Prescription-based medicines",
      "Medication information",
      "Medication record organization",
      "Prescription coordination",
    ],
  },
  {
    slug: "laboratory",
    title: "Laboratory & Diagnostics",
    description:
      "Laboratory testing and diagnostic services to support medical evaluations.",
    overview:
      "Laboratory and Diagnostic Services support medical evaluations by providing testing and diagnostic information to healthcare professionals.",
    icon: Microscope,
    color: "bg-orange-50 text-orange-600",
    features: [
      "Laboratory testing",
      "Diagnostic evaluations",
      "Test information",
      "Support for medical assessments",
    ],
  },
  {
    slug: "inpatient",
    title: "Inpatient Care",
    description:
      "Organized hospital admission, ward facilities and patient care coordination.",
    overview:
      "Inpatient Care focuses on patients who require hospital admission, coordinated care and support during their stay.",
    icon: BedDouble,
    color: "bg-cyan-50 text-cyan-600",
    features: [
      "Hospital admission coordination",
      "Ward and stay coordination",
      "Patient care support",
      "Care coordination",
    ],
  },
  {
    slug: "health-checkups",
    title: "Health Checkups",
    description:
      "Preventive health assessments and routine wellness checkups.",
    overview:
      "Health Checkups encourage preventive healthcare through routine health assessments and wellness evaluations.",
    icon: HeartPulse,
    color: "bg-pink-50 text-pink-600",
    features: [
      "Routine health assessments",
      "Preventive health evaluations",
      "Wellness checkups",
      "General health monitoring",
    ],
  },
  {
    slug: "medical-records",
    title: "Medical Records",
    description:
      "Convenient organization and access to patient healthcare records.",
    overview:
      "Medical Records help organize important patient healthcare information, making medical history and related records easier to access.",
    icon: ClipboardList,
    color: "bg-indigo-50 text-indigo-600",
    features: [
      "Patient medical information",
      "Organized healthcare records",
      "Medical history access",
      "Prescription record information",
    ],
  },
];
