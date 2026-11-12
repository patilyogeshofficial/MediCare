
import { ArrowRight } from "lucide-react";

function FAQ() {
  const faqs = [
    {
      question: "How can I book an appointment?",
      answer:
        "You can create an account on MediCare Plus, explore available doctors and request an appointment by selecting your preferred doctor, date and time.",
    },
    {
      question: "Can I choose my preferred doctor?",
      answer:
        "Yes. You can explore doctors based on their medical specialities and select a doctor according to your healthcare requirements.",
    },
    {
      question: "What should I bring for my appointment?",
      answer:
        "Please bring your identification document, previous medical reports, prescription records and any relevant health information.",
    },
    {
      question: "Does MediCare Plus provide emergency services?",
      answer:
        "MediCare Plus provides information about healthcare services, including emergency care. For a medical emergency, contact your local emergency services or visit the nearest emergency department.",
    },
    {
      question: "Can I cancel or reschedule an appointment?",
      answer:
        "You can manage your appointments through your patient dashboard. For assistance with cancellations or rescheduling, please contact our support team.",
    },
    {
      question: "How can I access my medical records?",
      answer:
        "Registered patients can access their available medical information through their secure patient dashboard.",
    },
  ];

  const handleContactClick = (event) => {
    event.preventDefault();

    const contactSection = document.getElementById("contact");

    if (contactSection) {
      contactSection.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

      window.history.replaceState(null, "", "#contact");
    }
  };

  return (
    <section
      id="faq"
      className="scroll-mt-20 bg-slate-50 py-20 lg:py-28"
    >
      <div className="mx-auto max-w-7xl px-6">

        {/* SECTION HEADING */}
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-cyan-600">
            Got Questions?
          </span>

          <h2 className="mt-4 text-balance text-3xl font-extrabold text-slate-900 sm:text-4xl">
            Frequently Asked Questions
          </h2>

          <p className="mx-auto mt-5 max-w-2xl leading-7 text-slate-600">
            Find answers to common questions about MediCare Plus, appointments,
            healthcare services and patient support.
          </p>
        </div>

        {/* FAQ ACCORDION */}
        <div className="mx-auto max-w-4xl space-y-4">
          {faqs.map((faq) => (
            <details
              key={faq.question}
              className="group rounded-xl border border-slate-200 bg-white transition-all duration-300 hover:border-cyan-200 hover:shadow-sm motion-reduce:transition-none"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-xl p-6 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600 [&::-webkit-details-marker]:hidden">
                <h3 className="text-base font-semibold text-slate-900 md:text-lg">
                  {faq.question}
                </h3>

                <span
                  aria-hidden="true"
                  className="shrink-0 text-2xl font-light text-cyan-600 transition-transform duration-300 group-open:rotate-45 motion-reduce:transition-none"
                >
                  +
                </span>
              </summary>

              <div className="px-6 pb-6">
                <p className="border-t border-slate-100 pt-4 text-sm leading-7 text-slate-600">
                  {faq.answer}
                </p>
              </div>
            </details>
          ))}
        </div>

        {/* BOTTOM CTA */}
        <div className="mt-14 text-center">
          <h3 className="text-balance text-xl font-bold text-slate-900">
            Still Have Questions?
          </h3>

          <p className="mt-3 text-slate-600">
            Our team is here to help you with your healthcare enquiries.
          </p>

          <a
            href="#contact"
            onClick={handleContactClick}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-cyan-600 px-8 py-4 font-bold text-white transition-all duration-300 hover:-translate-y-1 hover:bg-cyan-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-700 motion-reduce:transform-none motion-reduce:transition-none"
          >
            Contact Us
            <ArrowRight size={18} aria-hidden="true" />
          </a>
        </div>

      </div>
    </section>
  );
}

export default FAQ;
