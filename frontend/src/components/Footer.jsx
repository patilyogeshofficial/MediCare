
import { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { HeartPulse } from "lucide-react";

function Footer() {
  const navigate = useNavigate();
  const location = useLocation();

  const linkClass =
    "rounded-sm text-slate-300 transition-colors duration-200 hover:text-cyan-400 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-400";

  // Scroll to Home Page sections after navigation.
  useEffect(() => {
    if (location.pathname !== "/" || !location.hash) return;

    const targetId = decodeURIComponent(location.hash.slice(1));

    const frameId = requestAnimationFrame(() => {
      document.getElementById(targetId)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });

    return () => cancelAnimationFrame(frameId);
  }, [location.pathname, location.hash]);

  // Navigate to a Home Page section.
  const handleScroll = (event, targetId) => {
    event.preventDefault();

    if (location.pathname !== "/") {
      navigate(`/#${targetId}`);
      return;
    }

    document.getElementById(targetId)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });

    navigate(`/#${targetId}`, { replace: true });
  };

  const sectionLink = (targetId) => ({
    href: `/#${targetId}`,
    onClick: (event) => handleScroll(event, targetId),
    className: linkClass,
  });

  // Individual healthcare service pages.
  const healthcareServices = [
    { name: "Outpatient Department", slug: "outpatient" },
    { name: "Emergency Care", slug: "emergency-care" },
    { name: "Nursing Services", slug: "nursing" },
    { name: "Pharmacy Services", slug: "pharmacy" },
    { name: "Laboratory & Diagnostics", slug: "laboratory" },
    { name: "Inpatient Care", slug: "inpatient" },
    { name: "Health Checkups", slug: "health-checkups" },
    { name: "Medical Records", slug: "medical-records" },
  ];

  return (
    <footer className="bg-slate-950 text-slate-300">
      <div className="mx-auto max-w-7xl px-6 pb-10 pt-16">

        {/* FOOTER GRID */}
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">

          {/* BRAND INFORMATION */}
          <div>
            <a
              href="/#home"
              onClick={(event) => handleScroll(event, "home")}
              aria-label="MediCare Plus - Back to Home"
              className="mb-6 inline-flex items-center gap-2 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-400"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-600">
                <HeartPulse
                  size={26}
                  className="text-white"
                  aria-hidden="true"
                />
              </div>

              <span className="text-2xl font-bold text-white">
                Medi<span className="text-cyan-400">Care</span>{" "}
                <span className="text-teal-400 font-black">Plus</span>
              </span>
            </a>

            <p className="mb-4 text-sm leading-7 text-slate-400">
              Smarter Care. Better Connections. Connecting patients with healthcare
              professionals through a modern, accessible administration console.
            </p>

            <p className="text-sm font-semibold text-cyan-400">
              The Healthcare Administration Console
            </p>
          </div>

          {/* QUICK LINKS */}
          <div>
            <h3 className="mb-6 text-lg font-bold text-white">
              Quick Links
            </h3>

            <ul className="space-y-4 text-sm">
              <li><a {...sectionLink("home")}>Home</a></li>
              <li><a {...sectionLink("about")}>About Us</a></li>
              <li><a {...sectionLink("services")}>Specialities</a></li>
              <li><a {...sectionLink("doctors")}>Our Doctors</a></li>
              <li>
                <Link to="/doctors" className={linkClass}>
                  Medical Team
                </Link>
              </li>
              <li>
                <Link to="/verify-prescription" className={linkClass}>
                  Verify Prescription
                </Link>
              </li>
              <li><a {...sectionLink("contact")}>Contact Us</a></li>
            </ul>
          </div>

          {/* HEALTHCARE SERVICES */}
          <div>
            <h3 className="mb-6 text-lg font-bold text-white">
              Our Services
            </h3>

            <ul className="space-y-4 text-sm">
              {healthcareServices.map((service) => (
                <li key={service.slug}>
                  <Link
                    to={`/healthcare-services/${service.slug}`}
                    className={linkClass}
                  >
                    {service.name}
                  </Link>
                </li>
              ))}
            </ul>

            <Link
              to="/healthcare-services"
              className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-cyan-400 transition hover:text-cyan-300"
            >
              Explore All Services →
            </Link>
          </div>

          {/* CONTACT INFORMATION */}
          <div>
            <h3 className="mb-6 text-lg font-bold text-white">
              Get In Touch
            </h3>

            <div className="space-y-5 text-sm">
              <div>
                <p className="mb-1 text-slate-500">Email</p>
                <a
                  href="mailto:contact@medicare.com"
                  className={`${linkClass} break-all`}
                >
                  contact@medicare.com
                </a>
              </div>

              <div>
                <p className="mb-1 text-slate-500">Phone</p>
                <a
                  href="tel:+918010729955"
                  className={linkClass}
                >
                  +91 8010729955
                </a>
              </div>

              <div>
                <p className="mb-1 text-slate-500">Working Hours</p>
                <p className="text-slate-300">Monday – Saturday</p>
                <p className="text-slate-300">9:00 AM – 6:00 PM</p>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER BOTTOM */}
        <div className="mt-14 flex flex-col items-center justify-between gap-5 border-t border-slate-800 pt-8 md:flex-row">

          <p className="text-center text-sm text-slate-500">
            © {new Date().getFullYear()} MediCare Plus. All Rights Reserved.
          </p>

          <nav aria-label="Footer navigation">
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
              <a {...sectionLink("faq")}>FAQs</a>
              <a {...sectionLink("contact")}>Support</a>
              <a {...sectionLink("home")}>Back to Top ↑</a>
            </div>
          </nav>
        </div>

        {/* FOOTER CREDIT */}
        <p className="mt-8 text-center text-xs text-slate-600">
          Designed and developed with care for better healthcare experiences.
        </p>
      </div>
    </footer>
  );
}

export default Footer;
