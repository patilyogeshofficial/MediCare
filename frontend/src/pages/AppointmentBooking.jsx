import { useEffect, useState, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  FileText,
  HeartPulse,
  UserRound,
  CheckCircle2,
  AlertCircle,
  Stethoscope,
  IndianRupee,
  ShieldCheck,
  Timer,
  ChevronRight,
  SunMedium,
  Sunset,
  Sunrise,
  AlertTriangle,
  XCircle,
  Info,
} from "lucide-react";
import toast from "react-hot-toast";

// Get formatted date string YYYY-MM-DD
function getFormattedDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Format date for human display
function formatDisplayDate(dateStr) {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Format 24-hr time string "HH:mm" to 12-hr format "hh:mm AM/PM"
function formatTime12(timeStr) {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${String(hour12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`;
}

function AppointmentBooking() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isDeactivated = Boolean(user && user.isActive === false);

  // Doctors list
  const [doctors, setDoctors] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(true);

  // Form state
  const [selectedDoctorId, setSelectedDoctorId] = useState(
    location.state?.doctorId ? String(location.state.doctorId) : ""
  );
  const [selectedDate, setSelectedDate] = useState(
    getFormattedDate(new Date())
  );
  const [selectedSlotTime, setSelectedSlotTime] = useState("");
  const [reason, setReason] = useState("");

  // Slots state
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState("");

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [bookingSuccessData, setBookingSuccessData] = useState(null);
  const [holdSecondsLeft, setHoldSecondsLeft] = useState(15 * 60);
  const [liveAnnouncement, setLiveAnnouncement] = useState("");

  // Fetch doctors
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await api.get("/doctors");
        const list = Array.isArray(response.data) ? response.data : [];
        setDoctors(list.filter((doc) => doc.isActive !== false));
      } catch (error) {
        console.error("Failed to fetch doctors:", error);
        toast.error("Unable to load doctors.");
      } finally {
        setDoctorsLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  // Fetch dynamic available slots whenever doctor or date changes
  useEffect(() => {
    if (!selectedDoctorId || !selectedDate) {
      setSlots([]);
      setSelectedSlotTime("");
      return;
    }

    const fetchSlots = async () => {
      try {
        setSlotsLoading(true);
        setSlotsError("");
        setSelectedSlotTime("");

        const response = await api.get("/appointments/available-slots", {
          params: {
            doctorId: selectedDoctorId,
            date: selectedDate,
          },
        });

        const list = Array.isArray(response.data) ? response.data : [];
        setSlots(list);
      } catch (error) {
        console.error("Failed to fetch slots:", error);
        setSlots([]);
        setSlotsError(
          error.response?.data?.message ||
            "Unable to load available slots for this date."
        );
      } finally {
        setSlotsLoading(false);
      }
    };

    fetchSlots();
  }, [selectedDoctorId, selectedDate]);

  // Hold Countdown timer & screen-reader milestone announcements when booking succeeded
  useEffect(() => {
    if (!bookingSuccessData) return;

    // Initial milestone announcement
    setLiveAnnouncement(
      "Appointment slot reserved under 15-minute temporary hold. Time remaining: 15 minutes."
    );

    const interval = setInterval(() => {
      setHoldSecondsLeft((prev) => {
        const next = prev <= 1 ? 0 : prev - 1;

        // Periodic milestone announcements for screen readers (WCAG 4.1.3 / 2.2.1)
        if (next === 600) {
          setLiveAnnouncement("10 minutes remaining on your temporary reservation hold.");
        } else if (next === 300) {
          setLiveAnnouncement("5 minutes remaining on your temporary reservation hold.");
        } else if (next === 120) {
          setLiveAnnouncement(
            "Warning: 2 minutes remaining on your reservation hold. The slot will be released if not confirmed."
          );
        } else if (next === 60) {
          setLiveAnnouncement("Warning: 1 minute remaining on your temporary reservation hold.");
        } else if (next === 30) {
          setLiveAnnouncement("Warning: 30 seconds remaining on your temporary reservation hold.");
        } else if (next === 0) {
          setLiveAnnouncement(
            "Your temporary reservation hold has expired. The slot is eligible to be released back to the general booking pool."
          );
          clearInterval(interval);
        }

        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [bookingSuccessData]);

  // Selected doctor object
  const selectedDoctor = useMemo(() => {
    return doctors.find((doc) => String(doc.doctorId) === String(selectedDoctorId));
  }, [doctors, selectedDoctorId]);

  // Quick dates (next 5 days)
  const quickDates = useMemo(() => {
    const list = [];
    const today = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      list.push({
        dateStr: getFormattedDate(d),
        dayName: i === 0 ? "Today" : i === 1 ? "Tomorrow" : d.toLocaleDateString("en-IN", { weekday: "short" }),
        display: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      });
    }
    return list;
  }, []);

  // Categorize slots by time of day
  const categorizedSlots = useMemo(() => {
    const morning = [];
    const afternoon = [];
    const evening = [];

    slots.forEach((slot) => {
      const hour = Number(slot.slotTime.split(":")[0]);
      if (hour < 12) {
        morning.push(slot);
      } else if (hour < 17) {
        afternoon.push(slot);
      } else {
        evening.push(slot);
      }
    });

    return { morning, afternoon, evening };
  }, [slots]);

  // Handle appointment submission
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isDeactivated) {
      toast.error("Your patient account has been deactivated by hospital administration. Booking is disabled.");
      return;
    }

    if (!selectedDoctorId) {
      toast.error("Please choose a doctor.");
      return;
    }
    if (!selectedDate) {
      toast.error("Please select an appointment date.");
      return;
    }
    if (!selectedSlotTime) {
      toast.error("Please select an available consultation slot.");
      return;
    }
    if (!reason.trim()) {
      toast.error("Please describe your reason for consultation.");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        doctorId: Number(selectedDoctorId),
        appointmentDate: selectedDate,
        appointmentTime: selectedSlotTime,
        reason: reason.trim(),
      };

      const response = await api.post("/appointments", payload);

      toast.success("Appointment slot held successfully!");
      setBookingSuccessData(response.data);
      setHoldSecondsLeft(15 * 60);
      setLiveAnnouncement(
        "Appointment slot reserved under 15-minute temporary hold. Time remaining: 15 minutes."
      );
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

  // Format seconds to mm:ss
  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* HEADER */}
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="rounded-xl bg-cyan-600 p-2.5 text-white shadow-sm shadow-cyan-200">
              <HeartPulse size={25} />
            </div>
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Medi<span className="text-cyan-600">Care</span>{" "}
              <span className="text-teal-600 font-black">Plus</span>
            </span>
          </Link>

          <Link
            to="/patient/dashboard"
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-cyan-600"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main id="main-content" tabIndex="-1" className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        {/* Title */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700">
            <CalendarDays size={28} />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900">
            Advanced Appointment Scheduling
          </h1>
          <p className="mt-2 text-sm text-slate-500 max-w-xl mx-auto">
            Choose your doctor, select a live consultation slot, and receive a guaranteed 15-minute pending reservation hold.
          </p>
        </div>

        {/* DEACTIVATED ACCOUNT ALERT */}
        {isDeactivated && (
          <div className="mb-8 rounded-2xl border-2 border-red-200 bg-red-50 p-5 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-red-100 p-2.5 text-red-600 shrink-0">
                <AlertTriangle size={24} />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-bold text-red-900">
                    Account Deactivated by Administrator
                  </h2>
                  <span className="rounded-full bg-red-200 px-2.5 py-0.5 text-xs font-bold text-red-800">
                    Booking Disabled
                  </span>
                </div>
                <p className="mt-1 text-sm text-red-700 leading-relaxed">
                  Your patient account has been marked inactive by hospital administration. While your account is inactive, you can view existing appointments and medical records on your dashboard, but you cannot reserve consultation slots or book new appointments.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* BOOKING SUCCESS CARD */}
        {bookingSuccessData ? (
          <div className="overflow-hidden rounded-2xl border border-green-200 bg-white shadow-lg">
            <div className="bg-gradient-to-r from-green-600 to-teal-600 p-8 text-white text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                <CheckCircle2 size={36} className="text-white" />
              </div>
              <h2 className="text-2xl font-black">
                Appointment Slot Reserved!
              </h2>
              <p className="mt-2 text-green-100 text-sm max-w-md mx-auto">
                Appointment #{bookingSuccessData.appointmentId} has been created and placed in PENDING hold.
              </p>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              {/* Screen-reader Live Region for Countdown Milestones (WCAG 4.1.3) */}
              <div role="status" aria-live="assertive" className="sr-only">
                {liveAnnouncement}
              </div>

              {/* Countdown Banner: 3 Accessible States */}
              {holdSecondsLeft === 0 ? (
                /* EXPIRED STATE */
                <div
                  role="alert"
                  className="rounded-2xl border border-rose-200 bg-rose-50/80 p-5 text-rose-950 shadow-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="rounded-xl bg-rose-100 p-2.5 text-rose-700 shrink-0 mt-0.5">
                        <XCircle size={26} aria-hidden="true" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-rose-950 text-base">
                          Temporary Reservation Hold Expired
                        </h3>
                        <p className="text-xs text-rose-800 mt-1 leading-relaxed">
                          The 15-minute temporary hold window has concluded. If your consultation has already been confirmed by clinic administration, your booking is safe and a queue number is assigned. If the appointment remained unconfirmed, this slot is now eligible to be released back into the scheduling pool for other patients.
                        </p>
                      </div>
                    </div>
                    <div className="sm:text-right shrink-0 border-t border-rose-200/80 pt-3 sm:border-0 sm:pt-0">
                      <span className="text-2xl font-mono font-black text-rose-700">00:00</span>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-rose-600">
                        Hold Expired
                      </p>
                    </div>
                  </div>
                </div>
              ) : holdSecondsLeft <= 120 ? (
                /* WARNING STATE (LESS THAN 2 MINUTES) */
                <div
                  role="alert"
                  className="rounded-2xl border-2 border-rose-300 bg-rose-50 p-5 text-rose-950 shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="rounded-xl bg-rose-200 p-2.5 text-rose-800 shrink-0 mt-0.5">
                        <AlertTriangle size={26} className="text-rose-700 animate-bounce" aria-hidden="true" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex rounded-full bg-rose-200 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-rose-800">
                            Expiring Soon
                          </span>
                          <h3 className="font-extrabold text-rose-950 text-base">
                            Hold Time Running Low
                          </h3>
                        </div>
                        <p className="text-xs text-rose-800 mt-1 leading-relaxed">
                          Less than 2 minutes remain on your temporary slot hold. If this appointment is not confirmed by clinic staff before expiration, the slot will be released back to the general booking pool.
                        </p>
                      </div>
                    </div>
                    <div className="sm:text-right shrink-0 border-t border-rose-200 pt-3 sm:border-0 sm:pt-0">
                      <span
                        className="text-3xl font-mono font-black text-rose-700"
                        aria-label={`${Math.floor(holdSecondsLeft / 60)} minutes and ${holdSecondsLeft % 60} seconds remaining`}
                      >
                        {formatTimer(holdSecondsLeft)}
                      </span>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-rose-600">
                        Remaining Hold
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                /* NORMAL ACTIVE HOLD STATE */
                <div
                  role="region"
                  aria-label="Reservation countdown timer"
                  className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950 shadow-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-amber-200/80 p-2.5 text-amber-800 shrink-0">
                        <Timer size={24} className="animate-pulse" aria-hidden="true" />
                      </div>
                      <div>
                        <h3 className="font-bold text-amber-950 text-sm">
                          15-Minute Temporary Slot Hold
                        </h3>
                        <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                          This slot is temporarily reserved exclusively for you while awaiting doctor/admin confirmation.
                        </p>
                      </div>
                    </div>
                    <div className="sm:text-right shrink-0 border-t border-amber-200/80 pt-3 sm:border-0 sm:pt-0">
                      <span
                        className="text-2xl font-mono font-extrabold text-amber-900"
                        aria-label={`${Math.floor(holdSecondsLeft / 60)} minutes and ${holdSecondsLeft % 60} seconds remaining on temporary hold`}
                      >
                        {formatTimer(holdSecondsLeft)}
                      </span>
                      <p className="text-[11px] font-semibold uppercase text-amber-700">
                        Hold Time Remaining
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl bg-slate-50 p-5 text-sm">
                <div>
                  <span className="text-xs font-semibold uppercase text-slate-400">Doctor</span>
                  <p className="font-bold text-slate-800 mt-0.5">
                    {selectedDoctor ? selectedDoctor.fullName : `Doctor #${bookingSuccessData.doctorId}`}
                  </p>
                  <p className="text-xs text-cyan-700 font-medium">
                    {selectedDoctor?.specializationName || "Specialist"}
                  </p>
                </div>

                <div>
                  <span className="text-xs font-semibold uppercase text-slate-400">Date & Time</span>
                  <p className="font-bold text-slate-800 mt-0.5">
                    {formatDisplayDate(bookingSuccessData.appointmentDate)}
                  </p>
                  <p className="text-xs text-slate-600 font-medium">
                    {formatTime12(bookingSuccessData.appointmentTime)}
                  </p>
                </div>

                <div>
                  <span className="text-xs font-semibold uppercase text-slate-400">Status</span>
                  <p className="mt-0.5">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-0.5 text-xs font-bold text-amber-800">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" aria-hidden="true"></span>
                      {bookingSuccessData.status || "PENDING"}
                    </span>
                  </p>
                </div>

                <div>
                  <span className="text-xs font-semibold uppercase text-slate-400">Queue Number</span>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Assigned upon confirmation
                  </p>
                </div>
              </div>

              {/* TIMING ADJUSTABILITY & CONCURRENCY POLICY NOTICE (WCAG 2.2 SC 2.2.1) */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-xs text-slate-600">
                <div className="flex items-start gap-2.5">
                  <Info size={16} className="text-cyan-700 shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <span className="font-bold text-slate-800">
                      Timing Adjustability Notice (WCAG 2.2 SC 2.2.1 Essential Exception)
                    </span>
                    <p className="mt-1 leading-relaxed text-slate-500">
                      To prevent concurrent double-booking of doctor consultations and ensure fair access across all patients, MediCare Plus enforces a 15-minute temporary reservation hold on newly submitted bookings. Because medical consultation slots represent a shared real-time healthcare resource, dynamic client-side hold extensions are not permitted without creating a new reservation.
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => navigate("/patient/dashboard")}
                  className="flex-1 rounded-xl bg-cyan-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-cyan-700 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600"
                >
                  {holdSecondsLeft === 0 ? "Check Status in Patient Dashboard" : "Go to Patient Dashboard"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBookingSuccessData(null);
                    setSelectedSlotTime("");
                    setReason("");
                    setHoldSecondsLeft(15 * 60);
                  }}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600"
                >
                  {holdSecondsLeft === 0 ? "Book a New Appointment" : "Book Another Appointment"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* BOOKING FORM */
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* STEP 1: SELECT DOCTOR */}
              <div>
                <label
                  htmlFor="booking-doctor-select"
                  className="mb-2.5 flex items-center gap-2 text-sm font-bold text-slate-800"
                >
                  <UserRound size={18} className="text-cyan-600" aria-hidden="true" />
                  1. Select Healthcare Specialist <span className="text-rose-500">*</span>
                </label>

                <select
                  id="booking-doctor-select"
                  name="doctor"
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  required
                  disabled={doctorsLoading}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-medium text-slate-800 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 focus-visible:ring-cyan-600"
                >
                  <option value="">
                    {doctorsLoading ? "Loading verified doctors..." : "Choose a doctor..."}
                  </option>
                  {doctors.map((doctor) => (
                    <option key={doctor.doctorId} value={String(doctor.doctorId)}>
                      {doctor.fullName} — {doctor.specializationName} (₹{doctor.consultationFee || 0})
                    </option>
                  ))}
                </select>

                {/* Selected Doctor Summary Card */}
                {selectedDoctor && (
                  <div className="mt-3 flex items-center justify-between rounded-xl bg-cyan-50/60 border border-cyan-100 p-4 text-xs sm:text-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-600 text-white font-bold" aria-hidden="true">
                        <Stethoscope size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{selectedDoctor.fullName}</p>
                        <p className="text-xs text-cyan-700 font-medium">
                          {selectedDoctor.specializationName} • {selectedDoctor.experienceYears || 0} yrs experience
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-500">Consultation Fee</span>
                      <p className="font-extrabold text-slate-900">₹{selectedDoctor.consultationFee || 0}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* STEP 2: SELECT DATE */}
              <div>
                <label
                  htmlFor="booking-date-input"
                  className="mb-2.5 flex items-center justify-between text-sm font-bold text-slate-800"
                >
                  <span className="flex items-center gap-2">
                    <CalendarDays size={18} className="text-cyan-600" aria-hidden="true" />
                    2. Select Consultation Date <span className="text-rose-500">*</span>
                  </span>
                  <span className="text-xs font-semibold text-cyan-700">
                    {formatDisplayDate(selectedDate)}
                  </span>
                </label>

                {/* Quick Date Chips */}
                <div className="mb-3 grid grid-cols-3 sm:grid-cols-6 gap-2" role="group" aria-label="Quick consultation dates">
                  {quickDates.map((item) => {
                    const isSelected = selectedDate === item.dateStr;
                    return (
                      <button
                        key={item.dateStr}
                        type="button"
                        onClick={() => setSelectedDate(item.dateStr)}
                        aria-pressed={isSelected}
                        aria-label={`${item.dayName}, ${item.display}`}
                        className={`flex flex-col items-center justify-center rounded-xl p-2.5 text-xs transition border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600 ${
                          isSelected
                            ? "border-cyan-600 bg-cyan-600 text-white shadow-sm font-bold"
                            : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:border-slate-300"
                        }`}
                      >
                        <span className={`text-[11px] ${isSelected ? "text-cyan-100" : "text-slate-500"}`}>
                          {item.dayName}
                        </span>
                        <span className="font-bold mt-0.5">{item.display}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Native Date Picker */}
                <div className="relative">
                  <input
                    id="booking-date-input"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={getFormattedDate(new Date())}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 focus-visible:ring-cyan-600"
                  />
                </div>
              </div>

              {/* STEP 3: DYNAMIC LIVE SLOTS */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-800">
                    <Clock size={18} className="text-cyan-600" aria-hidden="true" />
                    3. Select Available Time Slot <span className="text-rose-500">*</span>
                  </label>
                  {selectedSlotTime && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-cyan-100 px-3 py-1 text-xs font-bold text-cyan-800">
                      <CheckCircle2 size={13} aria-hidden="true" /> Selected: {formatTime12(selectedSlotTime)}
                    </span>
                  )}
                </div>

                {!selectedDoctorId ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-xs sm:text-sm text-slate-500">
                    Please select a doctor to load available consultation slots.
                  </div>
                ) : slotsLoading ? (
                  <div
                    role="status"
                    aria-live="polite"
                    className="rounded-xl border border-slate-100 bg-slate-50 p-8 text-center"
                  >
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-cyan-600 border-t-transparent" aria-hidden="true"></div>
                    <p className="mt-2 text-xs font-medium text-slate-500">
                      Fetching live availability and existing reservations...
                    </p>
                  </div>
                ) : slotsError ? (
                  <div
                    role="alert"
                    className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs sm:text-sm text-red-700 flex items-center gap-2"
                  >
                    <AlertCircle size={18} className="shrink-0" aria-hidden="true" />
                    {slotsError}
                  </div>
                ) : slots.length === 0 ? (
                  <div
                    role="status"
                    aria-live="polite"
                    className="rounded-xl border border-dashed border-amber-200 bg-amber-50/60 p-8 text-center"
                  >
                    <AlertCircle size={28} className="mx-auto text-amber-600 mb-2" aria-hidden="true" />
                    <p className="text-sm font-bold text-slate-800">
                      No consultation slots available
                    </p>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      The doctor is not scheduled for consultations on this day or all slots have passed. Please pick another date.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Morning Slots */}
                    {categorizedSlots.morning.length > 0 && (
                      <div>
                        <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                          <Sunrise size={14} className="text-amber-500" />
                          Morning Consultations (09:00 AM – 12:00 PM)
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                          {categorizedSlots.morning.map((slot) => {
                            const isSelected = selectedSlotTime === slot.slotTime;
                            const isAvail = slot.available;
                            return (
                              <button
                                key={slot.slotTime}
                                type="button"
                                disabled={!isAvail}
                                aria-pressed={isSelected}
                                aria-label={`${formatTime12(slot.slotTime)} - ${isSelected ? "Selected" : isAvail ? "Available" : slot.reason === "RESERVED_HOLD" ? "Held 15 minutes" : slot.reason === "BOOKED" ? "Booked" : "Unavailable"}`}
                                onClick={() => setSelectedSlotTime(slot.slotTime)}
                                className={`rounded-xl px-3 py-2.5 text-xs font-semibold transition border flex flex-col items-center justify-center gap-0.5 ${
                                  isSelected
                                    ? "border-cyan-600 bg-cyan-600 text-white shadow-sm ring-2 ring-cyan-200"
                                    : isAvail
                                    ? "border-slate-200 bg-white text-slate-800 hover:border-cyan-400 hover:bg-cyan-50/40"
                                    : slot.reason === "RESERVED_HOLD"
                                    ? "border-amber-200 bg-amber-50/70 text-amber-700 cursor-not-allowed opacity-80"
                                    : "border-slate-100 bg-slate-100 text-slate-400 cursor-not-allowed"
                                }`}
                              >
                                <span className="font-bold">{formatTime12(slot.slotTime)}</span>
                                <span className={`text-[10px] ${isSelected ? "text-cyan-100" : ""}`}>
                                  {isSelected
                                    ? "Selected"
                                    : isAvail
                                    ? "Available"
                                    : slot.reason === "RESERVED_HOLD"
                                    ? "Held (15m)"
                                    : slot.reason === "BOOKED"
                                    ? "Booked"
                                    : slot.reason === "DOCTOR_BREAK"
                                    ? "Break"
                                    : "Unavailable"}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Afternoon Slots */}
                    {categorizedSlots.afternoon.length > 0 && (
                      <div>
                        <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                          <SunMedium size={14} className="text-orange-500" />
                          Afternoon Consultations (12:00 PM – 05:00 PM)
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                          {categorizedSlots.afternoon.map((slot) => {
                            const isSelected = selectedSlotTime === slot.slotTime;
                            const isAvail = slot.available;
                            return (
                              <button
                                key={slot.slotTime}
                                type="button"
                                disabled={!isAvail}
                                aria-pressed={isSelected}
                                aria-label={`${formatTime12(slot.slotTime)} - ${isSelected ? "Selected" : isAvail ? "Available" : slot.reason === "RESERVED_HOLD" ? "Held 15 minutes" : slot.reason === "BOOKED" ? "Booked" : "Unavailable"}`}
                                onClick={() => setSelectedSlotTime(slot.slotTime)}
                                className={`rounded-xl px-3 py-2.5 text-xs font-semibold transition border flex flex-col items-center justify-center gap-0.5 ${
                                  isSelected
                                    ? "border-cyan-600 bg-cyan-600 text-white shadow-sm ring-2 ring-cyan-200"
                                    : isAvail
                                    ? "border-slate-200 bg-white text-slate-800 hover:border-cyan-400 hover:bg-cyan-50/40"
                                    : slot.reason === "RESERVED_HOLD"
                                    ? "border-amber-200 bg-amber-50/70 text-amber-700 cursor-not-allowed opacity-80"
                                    : "border-slate-100 bg-slate-100 text-slate-400 cursor-not-allowed"
                                }`}
                              >
                                <span className="font-bold">{formatTime12(slot.slotTime)}</span>
                                <span className={`text-[10px] ${isSelected ? "text-cyan-100" : ""}`}>
                                  {isSelected
                                    ? "Selected"
                                    : isAvail
                                    ? "Available"
                                    : slot.reason === "RESERVED_HOLD"
                                    ? "Held (15m)"
                                    : slot.reason === "BOOKED"
                                    ? "Booked"
                                    : slot.reason === "DOCTOR_BREAK"
                                    ? "Break"
                                    : "Unavailable"}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Evening Slots */}
                    {categorizedSlots.evening.length > 0 && (
                      <div>
                        <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                          <Sunset size={14} className="text-indigo-500" />
                          Evening Consultations (05:00 PM onwards)
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                          {categorizedSlots.evening.map((slot) => {
                            const isSelected = selectedSlotTime === slot.slotTime;
                            const isAvail = slot.available;
                            return (
                              <button
                                key={slot.slotTime}
                                type="button"
                                disabled={!isAvail}
                                aria-pressed={isSelected}
                                aria-label={`${formatTime12(slot.slotTime)} - ${isSelected ? "Selected" : isAvail ? "Available" : slot.reason === "RESERVED_HOLD" ? "Held 15 minutes" : slot.reason === "BOOKED" ? "Booked" : "Unavailable"}`}
                                onClick={() => setSelectedSlotTime(slot.slotTime)}
                                className={`rounded-xl px-3 py-2.5 text-xs font-semibold transition border flex flex-col items-center justify-center gap-0.5 ${
                                  isSelected
                                    ? "border-cyan-600 bg-cyan-600 text-white shadow-sm ring-2 ring-cyan-200"
                                    : isAvail
                                    ? "border-slate-200 bg-white text-slate-800 hover:border-cyan-400 hover:bg-cyan-50/40"
                                    : slot.reason === "RESERVED_HOLD"
                                    ? "border-amber-200 bg-amber-50/70 text-amber-700 cursor-not-allowed opacity-80"
                                    : "border-slate-100 bg-slate-100 text-slate-400 cursor-not-allowed"
                                }`}
                              >
                                <span className="font-bold">{formatTime12(slot.slotTime)}</span>
                                <span className={`text-[10px] ${isSelected ? "text-cyan-100" : ""}`}>
                                  {isSelected
                                    ? "Selected"
                                    : isAvail
                                    ? "Available"
                                    : slot.reason === "RESERVED_HOLD"
                                    ? "Held (15m)"
                                    : slot.reason === "BOOKED"
                                    ? "Booked"
                                    : slot.reason === "DOCTOR_BREAK"
                                    ? "Break"
                                    : "Unavailable"}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* STEP 4: REASON FOR CONSULTATION */}
              <div>
                <label
                  htmlFor="booking-reason-input"
                  className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-800"
                >
                  <FileText size={18} className="text-cyan-600" aria-hidden="true" />
                  4. Reason for Consultation <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="booking-reason-input"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  required
                  placeholder="Describe your symptoms, health concerns, or consultation goals..."
                  className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 focus-visible:ring-cyan-600"
                />
              </div>

              {/* PENDING HOLD SECURITY ADVISORY */}
              <div className="flex items-start gap-3 rounded-xl bg-slate-50 border border-slate-200 p-4 text-xs text-slate-600">
                <ShieldCheck size={20} className="text-cyan-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-800">Pending Hold & Queue Number Protection:</span>
                  <p className="mt-0.5">
                    Upon booking, your chosen slot is held under PENDING status for 15 minutes. Once confirmed by the doctor or clinic administration, a daily sequential queue number is assigned to your appointment.
                  </p>
                </div>
              </div>

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                disabled={submitting || isDeactivated || !selectedDoctorId || !selectedSlotTime || !reason.trim()}
                className={`w-full rounded-xl px-5 py-4 text-base font-extrabold shadow-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                  isDeactivated
                    ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                    : "bg-cyan-600 text-white hover:bg-cyan-700 focus-visible:outline-cyan-600"
                }`}
              >
                {isDeactivated ? "Account Deactivated — Booking Disabled" : submitting ? "Reserving Slot..." : "Confirm & Reserve Slot"}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

export default AppointmentBooking;
