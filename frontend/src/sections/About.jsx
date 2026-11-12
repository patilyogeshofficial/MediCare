
import { HeartPulse, Check } from "lucide-react";

function About() {
  const highlights = [
    "Patient-focused approach",
    "Qualified healthcare professionals",
    "Organized healthcare services",
    "Convenient appointment management",
  ];

  const handleLearnMore = (event) => {
    event.preventDefault();

    const targetSection = document.getElementById(
      "healthcare-services"
    );

    if (targetSection) {
      targetSection.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

      window.history.replaceState(
        null,
        "",
        "#healthcare-services"
      );
    }
  };

  return (
    <section
      id="about"
      className="scroll-mt-20 bg-white py-20 lg:py-28"
    >
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 lg:grid-cols-2">

        {/* LEFT CONTENT */}
        <div>
          <p className="mb-4 font-bold uppercase tracking-widest text-cyan-600">
            About MediCare Plus
          </p>

          <h2 className="text-balance text-3xl font-extrabold leading-tight text-slate-900 sm:text-4xl lg:text-5xl">
            Smarter Care.
            <span className="text-cyan-600">
              {" "}Better Connections.
            </span>
          </h2>

          <p className="mt-6 leading-8 text-slate-600">
            MediCare Plus is the Healthcare Administration Console designed
            to make healthcare management more accessible, organized, and
            connected for patients, doctors, and administrators.
          </p>

          <p className="mt-4 leading-8 text-slate-600">
            From finding qualified doctors to managing appointments
            and healthcare services, we aim to simplify the healthcare
            journey for patients and medical professionals.
          </p>

          {/* MISSION & VISION */}
          <div className="mt-8 grid gap-5 sm:grid-cols-2">

            <div className="rounded-2xl bg-cyan-50 p-5">
              <h3 className="text-lg font-bold text-cyan-700">
                Our Mission
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                To make quality healthcare accessible and simplify
                the way patients connect with medical professionals.
              </p>
            </div>

            <div className="rounded-2xl bg-blue-50 p-5">
              <h3 className="text-lg font-bold text-blue-700">
                Our Vision
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                To create a connected healthcare environment
                focused on better patient experiences.
              </p>
            </div>

          </div>

          {/* LEARN MORE BUTTON */}
          <a
            href="#healthcare-services"
            onClick={handleLearnMore}
            className="mt-8 inline-flex items-center justify-center rounded-xl bg-cyan-700 px-6 py-4 font-bold text-white transition hover:bg-cyan-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-700"
          >
            Learn More About Us →
          </a>
        </div>

        {/* RIGHT CONTENT */}
        <div className="relative">

          <div className="rounded-3xl bg-gradient-to-br from-cyan-100 to-blue-100 p-8 sm:p-12">

            <div className="rounded-2xl bg-white p-8 shadow-xl">

              <div
                className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-600 text-white"
              >
                <HeartPulse
                  size={32}
                  aria-hidden="true"
                />
              </div>

              <h3 className="text-2xl font-extrabold text-slate-900">
                Healthcare With Care & Compassion
              </h3>

              <p className="mt-4 leading-7 text-slate-600">
                Every patient deserves attention, respect and
                a healthcare experience built around their needs.
              </p>

              {/* KEY HIGHLIGHTS */}
              <div className="mt-8 space-y-4">

                {highlights.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
                      <Check
                        size={17}
                        aria-hidden="true"
                      />
                    </span>

                    <span className="text-sm font-semibold text-slate-700">
                      {item}
                    </span>
                  </div>
                ))}

              </div>

            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

export default About;
