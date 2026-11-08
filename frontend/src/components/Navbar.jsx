
import { useEffect, useRef, useState } from "react";
import { HeartPulse, Menu, X } from "lucide-react";
import {
  Link,
  useNavigate,
  useLocation,
} from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

const navLinks = [
  { name: "Home", href: "#home" },
  { name: "About", href: "#about" },
  { name: "Specialities", href: "#services" },
  { name: "Find a Doctor", href: "#doctors" },
  { name: "Contact", href: "#contact" },
];

function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const menuRef = useRef(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");

  // Get dashboard path according to user role
  const getDashboardPath = () => {
    switch (user?.role) {
      case "ADMIN":
        return "/admin/dashboard";

      case "DOCTOR":
        return "/doctor/dashboard";

      case "PATIENT":
        return "/patient/dashboard";

      default:
        return "/";
    }
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    setMenuOpen(false);

    toast.success("Logged out successfully!");

    navigate("/");
  };

  // Handle homepage section navigation
  const handleNavigation = (event, href) => {
    event.preventDefault();

    setMenuOpen(false);

    const targetId = href.substring(1);

    // Navigate to homepage first if currently on another route
    if (location.pathname !== "/") {
      navigate(`/${href}`);
      return;
    }

    // Find the target section
    const targetSection = document.getElementById(targetId);

    if (targetSection) {
      targetSection.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

      window.history.replaceState(null, "", href);

      setActiveSection(targetId);
    }
  };

  // Handle navigation to homepage section from another route
  useEffect(() => {
    if (location.pathname !== "/" || !location.hash) {
      return;
    }

    const targetId = location.hash.substring(1);

    const scrollToSection = () => {
      const targetSection = document.getElementById(targetId);

      if (targetSection) {
        targetSection.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });

        setActiveSection(targetId);
      }
    };

    // Allow homepage content to render before scrolling
    const frameId = requestAnimationFrame(scrollToSection);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [location.pathname, location.hash]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        menuOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handleOutsideClick);

    return () => {
      document.removeEventListener("pointerdown", handleOutsideClick);
    };
  }, [menuOpen]);

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

  // Detect currently active homepage section
  useEffect(() => {
    if (location.pathname !== "/") {
      return;
    }

    const sections = navLinks
      .map((link) =>
        document.getElementById(link.href.substring(1))
      )
      .filter(Boolean);

    if (sections.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleSections = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (a, b) =>
              Math.abs(a.boundingClientRect.top - 120) -
              Math.abs(b.boundingClientRect.top - 120)
          );

        if (visibleSections.length > 0) {
          setActiveSection(visibleSections[0].target.id);
        }
      },
      {
        rootMargin: "-100px 0px -65% 0px",
        threshold: [0, 0.1, 0.25, 0.5],
      }
    );

    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, [location.pathname]);

  // Desktop navigation link styling
  const getLinkClasses = (href) => {
    const isActive = activeSection === href.substring(1);

    return `relative rounded-sm text-sm font-semibold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-600 ${
      isActive
        ? "text-cyan-700"
        : "text-slate-600 hover:text-cyan-600"
    }`;
  };

  return (
    <header
      ref={menuRef}
      className="sticky top-0 z-50 border-b border-slate-100 bg-white"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-6">

        {/* BRAND LOGO */}
        <a
          href="#home"
          onClick={(event) => handleNavigation(event, "#home")}
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
              onClick={(event) =>
                handleNavigation(event, link.href)
              }
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
          {isAuthenticated ? (
            <>
              <Link
                to={getDashboardPath()}
                className="rounded-sm font-semibold text-slate-700 transition hover:text-cyan-600"
              >
                Dashboard
              </Link>

              {user?.role === "PATIENT" && (
                <Link
                  to="/patient/appointments/book"
                  className="rounded-xl bg-cyan-600 px-5 py-3 font-semibold text-white transition hover:bg-cyan-700"
                >
                  Book Appointment
                </Link>
              )}

              <button
                type="button"
                onClick={handleLogout}
                className="rounded-xl border border-red-200 px-5 py-3 font-semibold text-red-600 transition hover:bg-red-50"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="font-semibold text-slate-700 transition hover:text-cyan-600"
              >
                Login
              </Link>

              <Link
                to="/patient/appointments/book"
                className="rounded-xl bg-cyan-600 px-5 py-3 font-semibold text-white transition hover:bg-cyan-700"
              >
                Book Appointment
              </Link>
            </>
          )}
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
              onClick={(event) =>
                handleNavigation(event, link.href)
              }
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

          {/* MOBILE AUTHENTICATION BUTTONS */}
          {isAuthenticated ? (
            <>
              <Link
                to={getDashboardPath()}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-2 font-semibold text-cyan-700 hover:bg-cyan-50"
              >
                Dashboard
              </Link>

              {user?.role === "PATIENT" && (
                <Link
                  to="/patient/appointments/book"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl bg-cyan-600 px-5 py-3 text-center font-semibold text-white transition hover:bg-cyan-700"
                >
                  Book Appointment
                </Link>
              )}

              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg border border-red-200 px-3 py-2 text-left font-semibold text-red-600 hover:bg-red-50"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-2 font-semibold text-cyan-700 hover:bg-cyan-50"
              >
                Login
              </Link>

              <Link
                to="/patient/appointments/book"
                onClick={() => setMenuOpen(false)}
                className="rounded-xl bg-cyan-600 px-5 py-3 text-center font-semibold text-white transition hover:bg-cyan-700"
              >
                Book Appointment
              </Link>
            </>
          )}
        </nav>
      )}
    </header>
  );
}

export default Navbar;
