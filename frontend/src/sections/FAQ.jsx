import { ArrowRight } from "lucide-react";

function FAQ() {
  const faqs = [
    {
      question: "How can I book an appointment?",
      answer:
        "You can create an account on MediCare, explore available doctors and request an appointment by selecting your preferred doctor, date and time.",
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
      question: "Does MediCare provide emergency services?",
      answer:
        "MediCare showcases emergency care as one of its planned healthcare services. For a real medical emergency, contact your local emergency services or visit the nearest emergency department.",
    },
    {
      question: "Can I cancel or reschedule an appointment?",
      answer:
        "Appointment cancellation and rescheduling options will be available through the patient portal as the appointment management functionality is developed.",
    },
    {
      question: "How can I access my medical records?",
      answer:
        "Registered patients will be able to access their available medical information through their secure patient dashboard once the medical records module is implemented.",
    },
  ];

  return (
    <section id="faq" className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-blue-600 font-semibold uppercase tracking-wider text-sm">
            Got Questions?
          </span>

          <h2 className="text-4xl font-bold text-gray-900 mt-3 mb-5">
            Frequently Asked Questions
          </h2>

          <p className="text-gray-600 leading-relaxed">
            Find answers to common questions about MediCare, appointments,
            healthcare services and patient support.
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <details
              key={index}
              className="group bg-white rounded-xl border border-gray-200 hover:border-blue-200 transition-all duration-300"
            >
              <summary className="flex items-center justify-between gap-4 p-6 cursor-pointer list-none">
                <h3 className="text-base md:text-lg font-semibold text-gray-900">
                  {faq.question}
                </h3>

                <span className="text-blue-600 text-2xl font-light transition-transform duration-300 group-open:rotate-45">
                  +
                </span>
              </summary>

              <div className="px-6 pb-6">
                <p className="text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
                  {faq.answer}
                </p>
              </div>
            </details>
          ))}
        </div>

        <div className="text-center mt-14">
          <h3 className="text-xl font-bold text-gray-900 mb-3">
            Still Have Questions?
          </h3>

          <p className="text-gray-600 mb-6">
            Our team is here to help you with your healthcare enquiries.
          </p>

          <a
            href="#contact"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-full font-semibold transition-all duration-300"
          >
            Contact Us
            <ArrowRight size={18} />
          </a>
        </div>
      </div>
    </section>
  );
}

export default FAQ;
