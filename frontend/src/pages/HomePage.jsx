import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import Hero from "../sections/Hero";
import StatsCounter from "../sections/StatsCounter";
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

  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Load public platform statistics
  useEffect(() => {
    let isMounted = true;

    const loadPublicStats = async () => {
      try {
        setStatsLoading(true);
        const response = await api.get("/public/stats");
        if (isMounted && response.data) {
          setStats(response.data);
        }
      } catch (err) {
        // Non-blocking: fallback to empty counts if API is still deploying
        if (isMounted) {
          setStats({
            activeDoctorsCount: 0,
            activeSpecializationsCount: 0,
            completedAppointmentsCount: 0,
            registeredPatientsCount: 0,
          });
        }
      } finally {
        if (isMounted) setStatsLoading(false);
      }
    };

    loadPublicStats();
    return () => {
      isMounted = false;
    };
  }, []);

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
        <StatsCounter stats={stats} loading={statsLoading} />
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
