
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Heart,
  Brain,
  Bone,
  ScanFace,
  Baby,
  Stethoscope,
  Venus,
  Eye,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  UserRound,
  GraduationCap,
  BriefcaseMedical,
  IndianRupee,
  ShieldCheck,
  CheckCircle2,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";

import api from "../services/api";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const services = {
  cardiology: {
    name: "Cardiology",
    subtitle: "Heart & Cardiovascular Care",
    icon: Heart,
    color: "bg-red-50 text-red-600",
    description:
      "Our cardiology department focuses on the prevention, diagnosis and treatment of heart and cardiovascular conditions. Explore specialist care from experienced medical professionals dedicated to supporting your heart health.",
    conditions: [
      "High Blood Pressure",
      "Heart Disease",
      "Chest Pain",
      "Irregular Heartbeat",
      "Coronary Artery Disease",
      "Cardiovascular Conditions",
    ],
    facilities: [
      "Cardiovascular health consultations",
      "Heart health assessments",
      "Blood pressure evaluation",
      "Preventive heart care guidance",
      "Personalized treatment recommendations",
    ],
    benefits: [
      "Consultation with cardiology specialists",
      "Personalized heart health guidance",
      "Focus on early diagnosis and prevention",
      "Continuity of care and follow-up",
    ],
  },

  neurology: {
    name: "Neurology",
    subtitle: "Brain & Nervous System Care",
    icon: Brain,
    color: "bg-purple-50 text-purple-600",
    description:
      "Our neurology department provides consultations and care for conditions affecting the brain, spinal cord and nervous system. Our specialists focus on understanding neurological symptoms and recommending appropriate care.",
    conditions: [
      "Migraine and Headaches",
      "Epilepsy",
      "Stroke-related Conditions",
      "Nerve Disorders",
      "Memory-related Conditions",
      "Neurological Pain",
    ],
    facilities: [
      "Neurological consultations",
      "Neurological symptom evaluation",
      "Headache assessment",
      "Nerve health consultations",
      "Treatment and follow-up guidance",
    ],
    benefits: [
      "Specialist neurological consultations",
      "Individualized care recommendations",
      "Evaluation of neurological symptoms",
      "Ongoing consultation support",
    ],
  },

  orthopedics: {
    name: "Orthopedics",
    subtitle: "Bone, Joint & Muscle Care",
    icon: Bone,
    color: "bg-orange-50 text-orange-600",
    description:
      "Our orthopedics department focuses on conditions affecting bones, joints, muscles and the musculoskeletal system. Consult healthcare professionals for injuries, joint discomfort and mobility-related concerns.",
    conditions: [
      "Joint Pain",
      "Arthritis",
      "Bone Fractures",
      "Back Pain",
      "Sports Injuries",
      "Muscle and Ligament Injuries",
    ],
    facilities: [
      "Orthopedic consultations",
      "Joint and bone health assessments",
      "Injury evaluation",
      "Mobility-related consultations",
      "Recovery and rehabilitation guidance",
    ],
    benefits: [
      "Consultations with orthopedic specialists",
      "Personalized musculoskeletal care",
      "Support for injury evaluation",
      "Guidance for recovery and mobility",
    ],
  },

  dermatology: {
    name: "Dermatology",
    subtitle: "Skin, Hair & Nail Care",
    icon: ScanFace,
    color: "bg-pink-50 text-pink-600",
    description:
      "Our dermatology department provides consultations for skin, hair and nail conditions. Connect with dermatology specialists to understand your concerns and explore appropriate treatment options.",
    conditions: [
      "Acne",
      "Eczema",
      "Skin Allergies",
      "Hair Loss",
      "Psoriasis",
      "Skin Infections",
    ],
    facilities: [
      "Skin health consultations",
      "Acne assessment",
      "Hair and scalp consultations",
      "Skin condition evaluation",
      "Personalized skincare guidance",
    ],
    benefits: [
      "Specialist skin consultations",
      "Individualized skincare recommendations",
      "Evaluation of skin and hair concerns",
      "Follow-up consultation support",
    ],
  },

  pediatrics: {
    name: "Pediatrics",
    subtitle: "Child & Infant Healthcare",
    icon: Baby,
    color: "bg-blue-50 text-blue-600",
    description:
      "Our pediatrics department focuses on the healthcare needs of infants, children and adolescents. We support families with consultations, growth-related guidance and preventive child healthcare.",
    conditions: [
      "Childhood Infections",
      "Fever in Children",
      "Nutritional Concerns",
      "Growth and Development Concerns",
      "Childhood Allergies",
      "Preventive Healthcare",
    ],
    facilities: [
      "Pediatric consultations",
      "Child growth assessments",
      "Nutritional guidance",
      "Childhood illness evaluation",
      "Preventive healthcare consultations",
    ],
    benefits: [
      "Care focused on children's needs",
      "Growth and development guidance",
      "Family-focused consultations",
      "Preventive health recommendations",
    ],
  },

  "general-medicine": {
    name: "General Medicine",
    subtitle: "Primary & General Healthcare",
    icon: Stethoscope,
    color: "bg-green-50 text-green-600",
    description:
      "Our general medicine department provides primary healthcare consultations, evaluation of common illnesses and guidance for maintaining overall health. It is a starting point for many everyday healthcare concerns.",
    conditions: [
      "Fever",
      "Common Infections",
      "Diabetes",
      "High Blood Pressure",
      "Digestive Problems",
      "General Health Concerns",
    ],
    facilities: [
      "General health consultations",
      "Common illness evaluation",
      "Blood pressure and health assessments",
      "Preventive healthcare guidance",
      "Chronic condition consultation",
    ],
    benefits: [
      "Convenient primary healthcare consultations",
      "Overall health assessment",
      "Personalized healthcare guidance",
      "Referral guidance when specialist care is needed",
    ],
  },

  gynecology: {
    name: "Gynecology",
    subtitle: "Women's Healthcare",
    icon: Venus,
    color: "bg-rose-50 text-rose-600",
    description:
      "Our gynecology department focuses on women's reproductive and reproductive health concerns. Consult healthcare professionals for menstrual health, reproductive wellness and preventive care.",
    conditions: [
      "Menstrual Health Concerns",
      "PCOS",
      "Reproductive Health Concerns",
      "Menopause-related Concerns",
      "Hormonal Imbalances",
      "Women's Preventive Healthcare",
    ],
    facilities: [
      "Gynecological consultations",
      "Menstrual health assessments",
      "Reproductive health guidance",
      "Women's wellness consultations",
      "Preventive healthcare guidance",
    ],
    benefits: [
      "Specialist women's healthcare consultations",
      "Personalized reproductive health guidance",
      "Preventive health support",
      "Confidential consultation experience",
    ],
  },

  ophthalmology: {
    name: "Ophthalmology",
    subtitle: "Eye & Vision Care",
    icon: Eye,
    color: "bg-cyan-50 text-cyan-600",
    description:
      "Our ophthalmology department focuses on eye health and vision-related conditions. Consult eye care specialists to discuss vision concerns, eye discomfort and preventive eye healthcare.",
    conditions: [
      "Vision Problems",
      "Cataracts",
      "Glaucoma",
      "Dry Eyes",
      "Eye Infections",
      "Eye Allergies",
    ],
    facilities: [
      "Eye health consultations",
      "Vision-related assessments",
      "Eye condition evaluation",
      "Preventive eye care guidance",
      "Follow-up consultations",
    ],
    benefits: [
      "Consultations with eye care specialists",
      "Personalized vision care guidance",
      "Evaluation of eye health concerns",
      "Preventive eye healthcare support",
    ],
  },
};

function ServiceDetails() {
  const { serviceSlug } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const service = services[serviceSlug];

  // Fetch doctors
  useEffect(() => {
    if (!service) {
      setLoading(false);
      return;
    }

    const fetchDoctors = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/doctors");

        const list = Array.isArray(response.data) ? response.data : [];
        setDoctors(list.filter((doc) => doc.isActive !== false));
      } catch (err) {
        console.error("Unable to fetch service doctors:", err);

        setError(
          "Unable to load specialist information. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, [serviceSlug]);

  // Find doctors belonging to this specialization
  const relatedDoctors = useMemo(() => {
    if (!service) return [];

    return doctors.filter(
      (doctor) =>
        doctor.specializationName?.toLowerCase() ===
        service.name.toLowerCase()
    );
  }, [doctors, service]);

  // Appointment booking
  const handleBookAppointment = (doctorId) => {
    if (!isAuthenticated) {
      toast("Please log in as a patient to book an appointment.", {
        icon: "🔐",
      });

      navigate("/login", {
        state: {
          from: "/patient/appointments/book",
        },
      });

      return;
    }

    if (user?.role !== "PATIENT") {
      toast.error("Only patient accounts can book appointments.");
      return;
    }

    navigate("/patient/appointments/book", {
      state: { doctorId },
    });
  };

  // Invalid service route
  if (!service) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />

        <div className="flex min-h-[60vh] flex-col items-center justify-center px-5 text-center">
          <Stethoscope size={55} className="text-cyan-600" />

          <h1 className="mt-6 text-2xl font-bold text-slate-900">
            Service Not Found
          </h1>

          <p className="mt-3 text-slate-500">
            The healthcare service you are looking for does not exist.
          </p>

          <Link
            to="/"
            className="mt-6 rounded-xl bg-cyan-600 px-6 py-3 font-semibold text-white hover:bg-cyan-700"
          >
            Return Home
          </Link>
        </div>

        <Footer />
      </div>
    );
  }

  const Icon = service.icon;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-br from-cyan-800 via-cyan-700 to-blue-700 px-5 py-16 text-white sm:py-20">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/5" />

        <div className="relative mx-auto max-w-5xl">
          <Link
            to="/"
            className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-cyan-100 transition hover:text-white"
          >
            <ArrowLeft size={17} />
            Back to Home
          </Link>

          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-white/15 shadow-lg backdrop-blur-sm">
              <Icon size={42} />
            </div>

            <div>
              <p className="mb-2 text-sm font-bold uppercase tracking-[0.2em] text-cyan-100">
                MediCare Medical Department
              </p>

              <h1 className="text-3xl font-extrabold sm:text-4xl lg:text-5xl">
                {service.name}
              </h1>

              <p className="mt-3 text-lg font-medium text-cyan-100">
                {service.subtitle}
              </p>
            </div>
          </div>

          <p className="mt-8 max-w-3xl text-sm leading-8 text-cyan-50 sm:text-base">
            {service.description}
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href="#specialists"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-bold text-cyan-800 transition hover:bg-cyan-50"
            >
              Find Specialists
              <ArrowRight size={18} />
            </a>

            <a
              href="#conditions"
              className="inline-flex items-center gap-2 rounded-xl border border-white/40 px-6 py-3 font-bold text-white transition hover:bg-white/10"
            >
              Explore Services
            </a>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <main className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">

        {/* INTRODUCTION */}
        <section className="mb-16 grid items-center gap-8 lg:grid-cols-2">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-cyan-600">
              About This Department
            </p>

            <h2 className="mt-3 text-3xl font-extrabold leading-tight text-slate-900">
              Specialized Healthcare for Your Needs
            </h2>

            <p className="mt-5 text-sm leading-8 text-slate-600 sm:text-base">
              At MediCare, we help patients connect with healthcare
              professionals in {service.name.toLowerCase()}.
              Our platform makes it easier to explore specialists,
              understand available consultations and request
              appointments.
            </p>

            <div className="mt-6 flex items-start gap-3">
              <ShieldCheck
                size={22}
                className="mt-1 shrink-0 text-cyan-600"
              />

              <p className="text-sm leading-7 text-slate-600">
                Explore available specialists and select a
                healthcare professional based on your needs.
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm sm:p-10">
            <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${service.color}`}>
              <Icon size={34} />
            </div>

            <h3 className="mt-6 text-2xl font-bold text-slate-900">
              Your Health Matters
            </h3>

            <p className="mt-4 text-sm leading-7 text-slate-600">
              Get connected with relevant healthcare professionals
              and explore consultation options through MediCare.
            </p>

            <Link
              to="/doctors"
              className="mt-6 inline-flex items-center gap-2 font-bold text-cyan-700 hover:text-cyan-800"
            >
              Explore All Doctors
              <ArrowRight size={18} />
            </Link>
          </div>
        </section>

        {/* CONDITIONS */}
        <section id="conditions" className="mb-16 scroll-mt-24">
          <div className="mb-8 text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-cyan-600">
              Areas of Care
            </p>

            <h2 className="mt-3 text-3xl font-extrabold text-slate-900">
              Conditions We Cover
            </h2>

            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-500">
              Explore some of the common health concerns associated
              with our {service.name.toLowerCase()} department.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {service.conditions.map((condition) => (
              <div
                key={condition}
                className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-5 shadow-sm transition hover:border-cyan-200 hover:shadow-md"
              >
                <CheckCircle2
                  size={20}
                  className="shrink-0 text-cyan-600"
                />

                <span className="text-sm font-semibold text-slate-700">
                  {condition}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* FACILITIES */}
        <section className="mb-16 rounded-3xl bg-white p-7 shadow-sm sm:p-10">
          <div className="mb-8">
            <p className="text-sm font-bold uppercase tracking-widest text-cyan-600">
              Our Healthcare Services
            </p>

            <h2 className="mt-3 text-3xl font-extrabold text-slate-900">
              Services & Facilities
            </h2>

            <p className="mt-3 text-sm leading-7 text-slate-500">
              Explore the consultation and healthcare support
              available through this department.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {service.facilities.map((facility) => (
              <div
                key={facility}
                className="flex items-start gap-4 rounded-xl bg-slate-50 p-5"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700">
                  <CheckCircle2 size={21} />
                </div>

                <p className="pt-2 text-sm font-semibold leading-6 text-slate-700">
                  {facility}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* BENEFITS */}
        <section className="mb-16">
          <div className="mb-8 text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-cyan-600">
              Why Choose MediCare
            </p>

            <h2 className="mt-3 text-3xl font-extrabold text-slate-900">
              Your Healthcare Experience
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {service.benefits.map((benefit, index) => (
              <div
                key={benefit}
                className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-50 font-extrabold text-cyan-700">
                  {String(index + 1).padStart(2, "0")}
                </div>

                <p className="mt-5 text-sm font-semibold leading-7 text-slate-700">
                  {benefit}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* RELATED DOCTORS */}
        <section id="specialists" className="scroll-mt-24">
          <div className="mb-8">
            <p className="text-sm font-bold uppercase tracking-widest text-cyan-600">
              Medical Professionals
            </p>

            <h2 className="mt-3 text-3xl font-extrabold text-slate-900">
              Our {service.name} Specialists
            </h2>

            <p className="mt-3 text-sm leading-7 text-slate-500">
              Explore doctors currently available in this department.
            </p>
          </div>

          {/* LOADING */}
          {loading && (
            <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl bg-white">
              <LoaderCircle
                size={36}
                className="animate-spin text-cyan-600"
              />

              <p className="mt-4 text-sm text-slate-500">
                Loading specialists...
              </p>
            </div>
          )}

          {/* ERROR */}
          {!loading && error && (
            <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
              <p className="text-sm text-red-600">{error}</p>

              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-3 text-sm font-bold text-white hover:bg-cyan-700"
              >
                <RefreshCw size={16} />
                Try Again
              </button>
            </div>
          )}

          {/* NO RELATED DOCTORS */}
          {!loading && !error && relatedDoctors.length === 0 && (
            <div className="rounded-2xl border border-slate-100 bg-white px-5 py-12 text-center shadow-sm">
              <UserRound
                size={42}
                className="mx-auto text-cyan-600"
              />

              <h3 className="mt-4 text-xl font-bold text-slate-800">
                No Specialists Available
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                There are currently no doctors listed in this
                department. Please explore our other specialists.
              </p>

              <Link
                to="/doctors"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-6 py-3 text-sm font-bold text-white hover:bg-cyan-700"
              >
                Explore All Doctors
                <ArrowRight size={17} />
              </Link>
            </div>
          )}

          {/* DOCTOR CARDS */}
          {!loading && !error && relatedDoctors.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relatedDoctors.map((doctor) => (
                <article
                  key={doctor.doctorId}
                  className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="flex items-center gap-4 border-b border-slate-100 bg-cyan-50/60 p-6">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-cyan-600 text-white">
                      <UserRound size={30} />
                    </div>

                    <div className="min-w-0">
                      <h3 className="truncate font-bold text-slate-900">
                        {doctor.fullName}
                      </h3>

                      <p className="mt-1 text-xs font-semibold text-cyan-700">
                        {doctor.specializationName}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4 p-6">
                    <div className="flex items-start gap-3">
                      <GraduationCap
                        size={19}
                        className="shrink-0 text-cyan-600"
                      />

                      <div>
                        <p className="text-xs text-slate-400">
                          Qualification
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-700">
                          {doctor.qualification || "Not specified"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <BriefcaseMedical
                        size={18}
                        className="text-cyan-600"
                      />

                      <p className="text-sm text-slate-700">
                        <span className="font-semibold">
                          {doctor.experienceYears ?? 0} Years
                        </span>{" "}
                        Experience
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                      <span className="text-xs text-slate-400">
                        Consultation Fee
                      </span>

                      <span className="flex items-center font-extrabold text-cyan-700">
                        <IndianRupee size={16} />
                        {doctor.consultationFee != null
                          ? Number(
                              doctor.consultationFee
                            ).toLocaleString("en-IN")
                          : "N/A"}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        handleBookAppointment(doctor.doctorId)
                      }
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-cyan-700"
                    >
                      <CalendarDays size={17} />
                      Book Appointment
                      <ArrowRight size={17} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* BOTTOM CTA */}
        <section className="mt-16 rounded-3xl bg-gradient-to-r from-cyan-800 to-blue-700 px-6 py-12 text-center text-white sm:px-12">
          <h2 className="text-2xl font-extrabold sm:text-3xl">
            Take the Next Step Towards Better Health
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-cyan-50">
            Explore our medical specialists and find the right
            healthcare professional for your consultation.
          </p>

          <Link
            to="/doctors"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3 font-bold text-cyan-800 transition hover:bg-cyan-50"
          >
            Explore All Doctors
            <ArrowRight size={18} />
          </Link>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default ServiceDetails;
