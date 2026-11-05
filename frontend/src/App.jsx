
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Hero from "./sections/Hero";
import About from "./sections/About";       
import Specialities from "./sections/Specialities"; 
import Doctors from "./sections/Doctors";
import HealthcareServices from "./sections/HealthcareServices";
import WhyChooseUs from "./sections/WhyChooseUs";
import MedicalTeam from "./sections/MedicalTeam";
import HowItWorks from "./sections/HowItWorks";
import Testimonials from "./sections/Testimonials";
import FAQ from "./sections/FAQ";
import Contact from "./sections/Contact";

import './App.css'
function App() {
  return (
    <div className="min-h-screen bg-white text-slate-800">

      <Navbar />

      <main>
        <Hero />

        {/* ABOUT MEDICARE SECTION */}
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

export default App;