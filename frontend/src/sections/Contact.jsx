import { MapPin, Phone, Mail, Clock, Send } from "lucide-react";

function Contact() {
  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Contact form UI is ready. Backend integration is coming soon!");
  };

  return (
    <section id="contact" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-blue-600 font-semibold uppercase tracking-wider text-sm">
            Get In Touch
          </span>

          <h2 className="text-4xl font-bold text-gray-900 mt-3 mb-5">
            Contact MediCare
          </h2>

          <p className="text-gray-600 leading-relaxed">
            Have questions or need assistance? Our team is here to help
            you with your healthcare enquiries.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-10">
          {/* Contact Information */}
          <div className="lg:col-span-2 bg-blue-600 rounded-3xl p-8 md:p-10 text-white">
            <h3 className="text-2xl font-bold mb-4">Let's Talk</h3>

            <p className="text-blue-100 leading-relaxed mb-10">
              Get in touch with our team for appointments, general
              enquiries and healthcare assistance.
            </p>

            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                  <MapPin size={22} />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Our Location</h4>
                  <p className="text-blue-100 text-sm">
                    Hospital Address, City, State, India
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                  <Phone size={22} />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Phone Number</h4>
                  <p className="text-blue-100 text-sm">+91 XXXXX XXXXX</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                  <Mail size={22} />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Email Address</h4>
                  <p className="text-blue-100 text-sm">
                    contact@medicare.com
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                  <Clock size={22} />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Working Hours</h4>
                  <p className="text-blue-100 text-sm">Monday – Saturday</p>
                  <p className="text-blue-100 text-sm">9:00 AM – 6:00 PM</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-3 bg-gray-50 rounded-3xl p-8 md:p-10">
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Send Us a Message
            </h3>

            <p className="text-gray-600 text-sm mb-8">
              Fill out the form below and our team will get back to you.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="Enter your phone number"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    placeholder="Enter subject"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Your Message
                </label>
                <textarea
                  rows="5"
                  placeholder="Write your message here..."
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition resize-none"
                />
              </div>

              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-blue-100"
              >
                Send Message
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Contact;
