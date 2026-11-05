import { MapPin, Phone, Mail, Clock, Send } from "lucide-react";
import toast from "react-hot-toast";

function Contact() {
  const handleSubmit = (e) => {
    e.preventDefault();

    toast.success(
      "Contact form UI is ready! Backend integration is coming soon."
    );

    e.target.reset();
  };

  return (
    <section id="contact" className="bg-white py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6">

        {/* SECTION HEADING */}
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-cyan-600">
            Get In Touch
          </span>

          <h2 className="mt-4 text-balance text-3xl font-extrabold text-slate-900 sm:text-4xl">
            Contact MediCare
          </h2>

          <p className="mx-auto mt-5 max-w-2xl leading-7 text-slate-600">
            Have questions or need assistance? Our team is here to help
            you with your healthcare enquiries.
          </p>
        </div>

        {/* CONTACT GRID */}
        <div className="grid gap-10 lg:grid-cols-5">

          {/* CONTACT INFORMATION */}
          <div className="rounded-3xl bg-gradient-to-br from-cyan-600 to-blue-700 p-8 text-white md:p-10 lg:col-span-2">

            <h3 className="text-2xl font-extrabold">
              Let's Talk
            </h3>

            <p className="mb-10 mt-4 leading-7 text-cyan-50">
              Get in touch with our team for appointments, general
              enquiries and healthcare assistance.
            </p>

            <div className="space-y-8">

              {/* LOCATION */}
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15">
                  <MapPin size={22} aria-hidden="true" />
                </div>

                <div>
                  <h4 className="mb-1 font-bold">
                    Our Location
                  </h4>

                  <p className="text-sm leading-6 text-cyan-50">
                    Hospital Address, City, State, India
                  </p>
                </div>
              </div>

              {/* PHONE */}
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15">
                  <Phone size={22} aria-hidden="true" />
                </div>

                <div>
                  <h4 className="mb-1 font-bold">
                    Phone Number
                  </h4>

                  <p className="text-sm text-cyan-50">
                    +91 XXXXX XXXXX
                  </p>
                </div>
              </div>

              {/* EMAIL */}
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15">
                  <Mail size={22} aria-hidden="true" />
                </div>

                <div>
                  <h4 className="mb-1 font-bold">
                    Email Address
                  </h4>

                  <p className="break-all text-sm text-cyan-50">
                    contact@medicare.com
                  </p>
                </div>
              </div>

              {/* WORKING HOURS */}
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15">
                  <Clock size={22} aria-hidden="true" />
                </div>

                <div>
                  <h4 className="mb-1 font-bold">
                    Working Hours
                  </h4>

                  <p className="text-sm text-cyan-50">
                    Monday – Saturday
                  </p>

                  <p className="text-sm text-cyan-50">
                    9:00 AM – 6:00 PM
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* CONTACT FORM */}
          <div className="rounded-3xl bg-slate-50 p-8 md:p-10 lg:col-span-3">

            <h3 className="text-2xl font-extrabold text-slate-900">
              Send Us a Message
            </h3>

            <p className="mb-8 mt-3 text-sm leading-6 text-slate-600">
              Fill out the form below and our team will get back to you.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* NAME AND EMAIL */}
              <div className="grid gap-6 md:grid-cols-2">

                <div>
                  <label
                    htmlFor="contact-name"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Full Name
                  </label>

                  <input
                    id="contact-name"
                    name="name"
                    type="text"
                    placeholder="Enter your full name"
                    autoComplete="name"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="contact-email"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Email Address
                  </label>

                  <input
                    id="contact-email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    autoComplete="email"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
                  />
                </div>

              </div>

              {/* PHONE AND SUBJECT */}
              <div className="grid gap-6 md:grid-cols-2">

                <div>
                  <label
                    htmlFor="contact-phone"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Phone Number
                  </label>

                  <input
                    id="contact-phone"
                    name="phone"
                    type="tel"
                    placeholder="Enter your phone number"
                    autoComplete="tel"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="contact-subject"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Subject
                  </label>

                  <input
                    id="contact-subject"
                    name="subject"
                    type="text"
                    placeholder="Enter subject"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
                  />
                </div>

              </div>

              {/* MESSAGE */}
              <div>
                <label
                  htmlFor="contact-message"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Your Message
                </label>

                <textarea
                  id="contact-message"
                  name="message"
                  rows="5"
                  placeholder="Write your message here..."
                  required
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
                />
              </div>

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-8 py-4 font-bold text-white shadow-lg shadow-cyan-100 transition duration-300 hover:-translate-y-1 hover:bg-cyan-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-700 motion-reduce:transform-none motion-reduce:transition-none"
              >
                Send Message
                <Send size={18} aria-hidden="true" />
              </button>

            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Contact;