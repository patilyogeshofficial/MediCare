import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import Hero from "../sections/Hero";
import About from "../sections/About";
import Specialities from "../sections/Specialities";
import Doctors from "../sections/Doctors";
import HealthcareServices from "../sections/HealthcareServices";
import WhyChooseUs from "../sections/WhyChooseUs";
import MedicalTeam from "../sections/MedicalTeam";
import HowItWorks from "../sections/HowItWorks";
import Testimonials from "../sections/Testimonials";
import FAQ from "../sections/FAQ";
import Contact from "../sections/Contact";

function HomePage() {
  const { user, isAuthenticated } = useAuth();

  // Redirect authenticated users to their respective dashboards
  if (isAuthenticated) {
    switch (user?.role) {
      case "ADMIN":
        return <Navigate to="/admin/dashboard" replace />;

      case "DOCTOR":
        return <Navigate to="/doctor/dashboard" replace />;

      case "PATIENT":
        return <Navigate to="/patient/dashboard" replace />;

      default:
        break;
    }
  }

  // Public homepage for guests
  return (
    <div className="min-h-screen bg-white text-slate-800">
      <Navbar />

      <main>
        <Hero />
        <About />
        <Specialities />
        <Doctors />
        <HealthcareServices />
        <WhyChooseUs />
        <MedicalTeam />
        <HowItWorks />
        <Testimonials />
        <FAQ />
        <Contact />
      </main>

      <Footer />
    </div>
  );
}

export default HomePage;