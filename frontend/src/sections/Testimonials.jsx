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
    <section id="testimonials" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-blue-600 font-semibold uppercase tracking-wider text-sm">
            Patient Experiences
          </span>

          <h2 className="text-4xl font-bold text-gray-900 mt-3 mb-5">
            What Our Patients Say
          </h2>

          <p className="text-gray-600 leading-relaxed">
            Quality healthcare is built on trust, compassion and positive
            experiences. Discover what matters most in patient care.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {reviews.map((review) => (
            <div
              key={review.initials}
              className="p-8 rounded-2xl bg-gray-50 border border-gray-100 hover:bg-white hover:shadow-xl hover:border-blue-100 transition-all duration-300"
            >
              <Quote size={34} className="text-blue-200 mb-6" />

              <div className="flex gap-1 mb-5 text-amber-400">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} size={17} fill="currentColor" />
                ))}
              </div>

              <p className="text-gray-600 leading-relaxed mb-8">
                "{review.feedback}"
              </p>

              <div className="flex items-center gap-4 border-t border-gray-200 pt-6">
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center">
                  {review.initials}
                </div>

                <div>
                  <h3 className="font-bold text-gray-900">{review.name}</h3>
                  <p className="text-sm text-gray-500">
                    {review.age} years old • {review.role}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
          Illustrative testimonials for the MediCare demo homepage.
        </p>
      </div>
    </section>
  );
}

export default Testimonials;
