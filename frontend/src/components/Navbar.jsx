import { useState } from "react";
import { HeartPulse, Menu, X } from "lucide-react";

const navLinks = [
  { name: "Home", href: "#home" },
  { name: "About", href: "#about" },
  { name: "Services", href: "#services" },
  { name: "Find a Doctor", href: "#doctors" },
  { name: "Contact", href: "#contact" },
];

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white">

      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-6">

        {/* BRAND LOGO */}
        <a href="#home" className="flex items-center gap-3">
          <div className="rounded-xl bg-cyan-600 p-3 text-white">
            <HeartPulse size={26} />
          </div>

          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              Medi<span className="text-cyan-600">Care</span>
            </h1>

            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Healthcare Administration Console
            </p>
          </div>
        </a>

        {/* DESKTOP NAVIGATION */}
        <nav className="hidden items-center gap-8 lg:flex">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-sm font-semibold text-slate-600 transition hover:text-cyan-600"
            >
              {link.name}
            </a>
          ))}
        </nav>

        {/* DESKTOP BUTTONS */}
        <div className="hidden items-center gap-4 lg:flex">
          <a href="#login" className="font-semibold hover:text-cyan-600">
            Login
          </a>

          <a
            href="#doctors"
            className="rounded-xl bg-cyan-600 px-5 py-3 font-semibold text-white transition hover:bg-cyan-700"
          >
            Book Appointment
          </a>
        </div>

        {/* MOBILE MENU BUTTON */}
        <button
          type="button"
          className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 lg:hidden"
          onClick={() => setMenuOpen((previous) => !previous)}
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={26} /> : <Menu size={26} />}
        </button>

      </div>

      {/* MOBILE NAVIGATION */}
      {menuOpen && (
        <nav className="flex flex-col gap-4 border-t border-slate-100 bg-white p-6 lg:hidden">

          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="font-semibold text-slate-700 hover:text-cyan-600"
            >
              {link.name}
            </a>
          ))}

          <a
            href="#login"
            onClick={() => setMenuOpen(false)}
            className="font-semibold text-cyan-700"
          >
            Login
          </a>

          <a
            href="#doctors"
            onClick={() => setMenuOpen(false)}
            className="rounded-xl bg-cyan-600 px-5 py-3 text-center font-semibold text-white"
          >
            Book Appointment
          </a>

        </nav>
      )}

    </header>
  );
}

export default Navbar;