import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  FileText,
  HeartPulse,
  UserRound,
} from "lucide-react";
import toast from "react-hot-toast";

// Get today's date
function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function AppointmentBooking() {
  const location = useLocation();

  // Doctor states
  const [doctors, setDoctors] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(true);

  // Appointment form state
  const [formData, setFormData] = useState({
    doctor: location.state?.doctorId
      ? String(location.state.doctorId)
      : "",
    appointmentDate: "",
    appointmentTime: "",
    reason: "",
  });

  // Fetch doctors from backend
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await api.get("/doctors");
        setDoctors(response.data);
      } catch (error) {
        console.error("Failed to fetch doctors:", error);
        toast.error("Unable to load doctors.");
      } finally {
        setDoctorsLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  // Handle form changes
  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // Handle appointment submission
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSubmitting(true);

      const appointmentData = {
        doctorId: Number(formData.doctor),
        appointmentDate: formData.appointmentDate,
        appointmentTime: formData.appointmentTime,
        reason: formData.reason.trim(),
      };

      const response = await api.post(
        "/appointments",
        appointmentData
      );

      toast.success("Appointment booked successfully!");

      console.log("Created appointment:", response.data);

      navigate("/patient/dashboard");
    } catch (error) {
      console.error("Appointment booking failed:", error);

      toast.error(
        error.response?.data?.message ||
        "Unable to book appointment. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* HEADER */}
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="rounded-xl bg-cyan-600 p-2.5 text-white">
              <HeartPulse size={25} />
            </div>

            <span className="text-2xl font-extrabold text-slate-900">
              Medi<span className="text-cyan-600">Care</span>
            </span>
          </Link>

          <Link
            to="/patient/dashboard"
            className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-cyan-600"
          >
            <ArrowLeft size={17} />
            Back to Dashboard
          </Link>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="mx-auto max-w-3xl px-5 py-12">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700">
            <CalendarDays size={28} />
          </div>

          <h1 className="text-3xl font-extrabold text-slate-900">
            Book an Appointment
          </h1>

          <p className="mt-2 text-slate-500">
            Schedule your consultation with our healthcare professionals.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* DOCTOR */}
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <UserRound size={17} />
                Select Doctor
              </label>

              <select
                name="doctor"
                value={formData.doctor}
                onChange={handleChange}
                required
                disabled={doctorsLoading}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              >
                <option value="">
                  {doctorsLoading ? "Loading doctors..." : "Choose a doctor"}
                </option>

                {doctors.map((doctor) => (
                  <option
                    key={doctor.doctorId}
                    value={String(doctor.doctorId)}
                  >
                    {doctor.fullName} - {doctor.specializationName}
                  </option>
                ))}
              </select>
            </div>

            {/* DATE */}
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <CalendarDays size={17} />
                Appointment Date
              </label>

              <input
                type="date"
                name="appointmentDate"
                value={formData.appointmentDate}
                onChange={handleChange}
                min={getTodayDate()}
                required
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              />
            </div>

            {/* TIME */}
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Clock size={17} />
                Preferred Time
              </label>

              <select
                name="appointmentTime"
                value={formData.appointmentTime}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              >
                <option value="">Select a time</option>
                <option value="09:00">09:00 AM</option>
                <option value="10:00">10:00 AM</option>
                <option value="11:00">11:00 AM</option>
                <option value="12:00">12:00 PM</option>
                <option value="14:00">02:00 PM</option>
                <option value="15:00">03:00 PM</option>
                <option value="16:00">04:00 PM</option>
              </select>
            </div>

            {/* REASON */}
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <FileText size={17} />
                Reason for Appointment
              </label>

              <textarea
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                rows={4}
                required
                placeholder="Briefly describe your reason for consultation..."
                className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              />
            </div>

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={submitting || doctorsLoading}
              className="w-full rounded-xl bg-cyan-600 px-5 py-4 font-bold text-white transition hover:bg-cyan-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Booking Appointment..." : "Book Appointment"}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-xs text-slate-400">
          Your appointment request will be handled securely by MediCare.
        </p>
      </main>
    </div>
  );
}

export default AppointmentBooking;