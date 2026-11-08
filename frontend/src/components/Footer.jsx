
import { HeartPulse } from "lucide-react";

function Footer() {
  const linkClass =
    "transition-colors duration-200 hover:text-cyan-400 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-400 rounded-sm";

  const handleScroll = (event, targetId) => {
    event.preventDefault();

    const target = document.getElementById(targetId);

    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

      window.history.replaceState(null, "", `#${targetId}`);
    }
  };

  const sectionLink = (targetId) => ({
    href: `#${targetId}`,
    onClick: (event) => handleScroll(event, targetId),
    className: linkClass,
  });

  return (
    <footer className="bg-slate-950 text-slate-300">
      <div className="mx-auto max-w-7xl px-6 pb-10 pt-16">

        {/* FOOTER GRID */}
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">

          {/* BRAND INFORMATION */}
          <div>
            <a
              href="#home"
              onClick={(event) => handleScroll(event, "home")}
              aria-label="MediCare - Back to Home"
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
                Medi<span className="text-cyan-400">Care</span>
              </span>
            </a>

            <p className="mb-6 text-sm leading-7 text-slate-400">
              Your trusted healthcare administration platform.
              Connecting patients with healthcare professionals
              through a simple and accessible digital experience.
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
              <li><a {...sectionLink("medical-team")}>Medical Team</a></li>
              <li><a {...sectionLink("contact")}>Contact Us</a></li>
            </ul>
          </div>

          {/* HEALTHCARE SERVICES */}
          <div>
            <h3 className="mb-6 text-lg font-bold text-white">
              Our Services
            </h3>

            <ul className="space-y-4 text-sm">
              <li>
                <a {...sectionLink("healthcare-services")}>OPD Services</a>
              </li>
              <li>
                <a {...sectionLink("healthcare-services")}>Emergency Care</a>
              </li>
              <li>
                <a {...sectionLink("healthcare-services")}>Nursing Services</a>
              </li>
              <li>
                <a {...sectionLink("healthcare-services")}>Pharmacy</a>
              </li>
              <li>
                <a {...sectionLink("healthcare-services")}>Laboratory</a>
              </li>
              <li>
                <a {...sectionLink("healthcare-services")}>Health Checkups</a>
              </li>
            </ul>
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
                  className={`${linkClass} break-all text-slate-300`}
                >
                  contact@medicare.com
                </a>
              </div>

              <div>
                <p className="mb-1 text-slate-500">Phone</p>
                <a
                  href="tel:+918010729955"
                  className={`${linkClass} text-slate-300`}
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
            © {new Date().getFullYear()} MediCare. All Rights Reserved.
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
