
import { Quote, Star } from "lucide-react";

function Testimonials() {
  const reviews = [
    {
      name: "Aarav Mehta",
      age: 32,
      role: "Patient",
      initials: "AM",
      feedback:
        "The appointment process was simple and convenient. The staff made my hospital visit comfortable.",
    },
    {
      name: "Ananya Sharma",
      age: 27,
      role: "Patient",
      initials: "AS",
      feedback:
        "I appreciated the professional approach and the attention given to my concerns throughout my visit.",
    },
    {
      name: "Rohan Desai",
      age: 45,
      role: "Patient",
      initials: "RD",
      feedback:
        "The overall experience was smooth. The healthcare team was supportive and explained everything clearly.",
    },
  ];

  return (
    <section
      id="testimonials"
      className="scroll-mt-20 bg-white py-20 lg:py-28"
    >
      <div className="mx-auto max-w-7xl px-6">

        {/* SECTION HEADING */}
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-cyan-600">
            Patient Experiences
          </span>

          <h2 className="mt-4 text-balance text-3xl font-extrabold text-slate-900 sm:text-4xl">
            What Our Patients Say
          </h2>

          <p className="mx-auto mt-5 max-w-2xl leading-7 text-slate-600">
            Quality healthcare is built on trust, compassion and positive
            experiences. Discover what matters most in patient care.
          </p>
        </div>

        {/* TESTIMONIALS GRID */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {reviews.map((review) => (
            <article
              key={review.initials}
              className="group rounded-2xl border border-slate-100 bg-slate-50 p-8 transition-all duration-300 hover:-translate-y-2 hover:border-cyan-200 hover:bg-white hover:shadow-xl motion-reduce:transform-none motion-reduce:transition-none"
            >
              {/* QUOTE ICON */}
              <Quote
                size={34}
                aria-hidden="true"
                className="mb-6 text-cyan-200"
              />

              {/* STAR RATINGS */}
              <div
                className="mb-5 flex gap-1 text-amber-400"
                aria-label="Illustrative five-star rating"
              >
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={17}
                    fill="currentColor"
                    aria-hidden="true"
                  />
                ))}
              </div>

              {/* PATIENT FEEDBACK */}
              <blockquote className="mb-8 text-sm leading-7 text-slate-600">
                "{review.feedback}"
              </blockquote>

              {/* PATIENT DETAILS */}
              <div className="flex items-center gap-4 border-t border-slate-200 pt-6">
                <div
                  aria-hidden="true"
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-100 font-bold text-cyan-700"
                >
                  {review.initials}
                </div>

                <div>
                  <h3 className="font-bold text-slate-900">
                    {review.name}
                  </h3>

                  <p className="text-sm text-slate-500">
                    {review.age} years old • {review.role}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* DISCLAIMER */}
        <p className="mt-8 text-center text-xs text-slate-400">
          Illustrative testimonials and ratings for the MediCare demo homepage.
        </p>

      </div>
    </section>
  );
}

export default Testimonials;
