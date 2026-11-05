import { useEffect, useState } from "react";
import { HeartPulse, Menu, X } from "lucide-react";

const navLinks = [
  { name: "Home", href: "#home" },
  { name: "About", href: "#about" },
  { name: "Specialities", href: "#services" },
  { name: "Find a Doctor", href: "#doctors" },
  { name: "Contact", href: "#contact" },
];

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");

  // Detect the currently visible homepage section
  useEffect(() => {
    const sections = navLinks
      .map((link) => document.querySelector(link.href))
      .filter(Boolean);

    const observer = new IntersectionObserver(
      () => {
        const visibleSections = sections
          .map((section) => ({
            id: section.id,
            top: section.getBoundingClientRect().top,
          }))
          .filter((section) => section.top < window.innerHeight * 0.5)
          .sort((a, b) => b.top - a.top);

        if (visibleSections.length > 0) {
          setActiveSection(visibleSections[0].id);
        } else {
          setActiveSection("home");
        }
      },
      {
        rootMargin: "-15% 0px -65% 0px",
        threshold: [0, 0.1, 0.25, 0.5],
      }
    );

    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  // Close mobile menu when Escape is pressed
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  // Close menu after navigation
  const handleNavigation = (href) => {
    setMenuOpen(false);
    setActiveSection(href.substring(1));
  };

  const getLinkClasses = (href) => {
    const isActive = activeSection === href.substring(1);

    return `relative rounded-sm text-sm font-semibold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-600 ${
      isActive
        ? "text-cyan-700"
        : "text-slate-600 hover:text-cyan-600"
    }`;
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white">

      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-6">

        {/* BRAND LOGO */}
        <a
          href="#home"
          onClick={() => handleNavigation("#home")}
          aria-label="MediCare - Home"
          className="flex items-center gap-3 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-600"
        >
          <div className="rounded-xl bg-cyan-600 p-3 text-white">
            <HeartPulse size={26} aria-hidden="true" />
          </div>

          <div>
            <span className="block text-2xl font-extrabold text-slate-900">
              Medi<span className="text-cyan-600">Care</span>
            </span>

            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Healthcare Administration Console
            </p>
          </div>
        </a>

        {/* DESKTOP NAVIGATION */}
        <nav
          aria-label="Main navigation"
          className="hidden items-center gap-8 lg:flex"
        >
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={() => handleNavigation(link.href)}
              aria-current={
                activeSection === link.href.substring(1)
                  ? "location"
                  : undefined
              }
              className={getLinkClasses(link.href)}
            >
              {link.name}

              {activeSection === link.href.substring(1) && (
                <span
                  aria-hidden="true"
                  className="absolute -bottom-2 left-0 h-0.5 w-full rounded-full bg-cyan-600"
                />
              )}
            </a>
          ))}
        </nav>

        {/* DESKTOP BUTTONS */}
        <div className="hidden items-center gap-4 lg:flex">
          <a
            href="#login"
            className="rounded-sm font-semibold text-slate-700 transition hover:text-cyan-600 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-600"
          >
            Login
          </a>

          <a
            href="#doctors"
            className="rounded-xl bg-cyan-600 px-5 py-3 font-semibold text-white transition hover:bg-cyan-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-700"
          >
            Book Appointment
          </a>
        </div>

        {/* MOBILE MENU BUTTON */}
        <button
          type="button"
          className="rounded-lg p-2 text-slate-700 transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600 lg:hidden"
          onClick={() => setMenuOpen((previous) => !previous)}
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
        >
          {menuOpen ? (
            <X size={26} aria-hidden="true" />
          ) : (
            <Menu size={26} aria-hidden="true" />
          )}
        </button>

      </div>

      {/* MOBILE NAVIGATION */}
      {menuOpen && (
        <nav
          id="mobile-navigation"
          aria-label="Mobile navigation"
          className="flex flex-col gap-4 border-t border-slate-100 bg-white p-6 lg:hidden"
        >
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={() => handleNavigation(link.href)}
              aria-current={
                activeSection === link.href.substring(1)
                  ? "location"
                  : undefined
              }
              className={`rounded-lg px-3 py-2 font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600 ${
                activeSection === link.href.substring(1)
                  ? "bg-cyan-50 text-cyan-700"
                  : "text-slate-700 hover:bg-slate-50 hover:text-cyan-600"
              }`}
            >
              {link.name}
            </a>
          ))}

          <a
            href="#login"
            onClick={() => setMenuOpen(false)}
            className="rounded-lg px-3 py-2 font-semibold text-cyan-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600"
          >
            Login
          </a>

          <a
            href="#doctors"
            onClick={() => setMenuOpen(false)}
            className="rounded-xl bg-cyan-600 px-5 py-3 text-center font-semibold text-white transition hover:bg-cyan-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-700"
          >
            Book Appointment
          </a>
        </nav>
      )}

    </header>
  );
}

export default Navbar;