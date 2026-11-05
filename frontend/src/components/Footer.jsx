import { HeartPulse } from "lucide-react";

function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-300">
      <div className="max-w-7xl mx-auto px-6 pt-16 pb-10">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-12">

          {/* BRAND INFORMATION */}
          <div>
            <a href="#home" className="flex items-center gap-2 mb-6">
              <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center">
                <HeartPulse size={26} className="text-white" />
              </div>

              <span className="text-2xl font-bold text-white">
                Medi<span className="text-blue-500">Care</span>
              </span>
            </a>

            <p className="text-gray-400 leading-relaxed text-sm mb-6">
              Your trusted healthcare administration platform.
              Connecting patients with healthcare professionals
              through a simple and accessible digital experience.
            </p>

            <p className="text-blue-400 font-medium text-sm">
              The Healthcare Administration Console
            </p>
          </div>

          {/* QUICK LINKS */}
          <div>
            <h3 className="text-white font-bold text-lg mb-6">
              Quick Links
            </h3>

            <ul className="space-y-4 text-sm">
              <li><a href="#home" className="hover:text-blue-400 transition">Home</a></li>
              <li><a href="#about" className="hover:text-blue-400 transition">About Us</a></li>
              <li><a href="#services" className="hover:text-blue-400 transition">Specialities</a></li>
              <li><a href="#doctors" className="hover:text-blue-400 transition">Our Doctors</a></li>
              <li><a href="#medical-team" className="hover:text-blue-400 transition">Medical Team</a></li>
              <li><a href="#contact" className="hover:text-blue-400 transition">Contact Us</a></li>
            </ul>
          </div>

          {/* HEALTHCARE SERVICES */}
          <div>
            <h3 className="text-white font-bold text-lg mb-6">
              Our Services
            </h3>

            <ul className="space-y-4 text-sm">
              <li><a href="#healthcare-services" className="hover:text-blue-400 transition">OPD Services</a></li>
              <li><a href="#healthcare-services" className="hover:text-blue-400 transition">Emergency Care</a></li>
              <li><a href="#healthcare-services" className="hover:text-blue-400 transition">Nursing Services</a></li>
              <li><a href="#healthcare-services" className="hover:text-blue-400 transition">Pharmacy</a></li>
              <li><a href="#healthcare-services" className="hover:text-blue-400 transition">Laboratory</a></li>
              <li><a href="#healthcare-services" className="hover:text-blue-400 transition">Health Checkups</a></li>
            </ul>
          </div>

          {/* CONTACT INFORMATION */}
          <div>
            <h3 className="text-white font-bold text-lg mb-6">
              Get In Touch
            </h3>

            <div className="space-y-5 text-sm">
              <div>
                <p className="text-gray-500 mb-1">Email</p>
                <p className="text-gray-300">contact@medicare.com</p>
              </div>

              <div>
                <p className="text-gray-500 mb-1">Phone</p>
                <p className="text-gray-300">+91 XXXXX XXXXX</p>
              </div>

              <div>
                <p className="text-gray-500 mb-1">Working Hours</p>
                <p className="text-gray-300">Monday – Saturday</p>
                <p className="text-gray-300">9:00 AM – 6:00 PM</p>
              </div>
            </div>
          </div>

        </div>

        {/* FOOTER BOTTOM */}
        <div className="border-t border-gray-800 mt-14 pt-8 flex flex-col md:flex-row items-center justify-between gap-5">
          <p className="text-sm text-gray-500 text-center">
            © {new Date().getFullYear()} MediCare. All Rights Reserved.
          </p>

          <div className="flex items-center gap-6 text-sm">
            <a href="#faq" className="hover:text-blue-400 transition">
              FAQs
            </a>

            <a href="#contact" className="hover:text-blue-400 transition">
              Support
            </a>

            <a href="#home" className="hover:text-blue-400 transition">
              Back to Top ↑
            </a>
          </div>
        </div>

        <p className="text-center text-xs text-gray-600 mt-8">
          Designed and developed with care for better healthcare experiences.
        </p>
      </div>
    </footer>
  );
}

export default Footer;
