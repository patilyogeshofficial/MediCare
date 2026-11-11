
import { useEffect, useState } from "react";
import {
  Clock,
  CalendarDays,
  CheckCircle,
  XCircle,
  Save,
  RotateCcw,
  Coffee,
  Info,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api";

const initialAvailability = [
  {
    day: "Monday",
    enabled: true,
    startTime: "09:00",
    endTime: "17:00",
    breakStart: "13:00",
    breakEnd: "14:00",
  },
  {
    day: "Tuesday",
    enabled: true,
    startTime: "09:00",
    endTime: "17:00",
    breakStart: "13:00",
    breakEnd: "14:00",
  },
  {
    day: "Wednesday",
    enabled: true,
    startTime: "09:00",
    endTime: "17:00",
    breakStart: "13:00",
    breakEnd: "14:00",
  },
  {
    day: "Thursday",
    enabled: true,
    startTime: "09:00",
    endTime: "17:00",
    breakStart: "13:00",
    breakEnd: "14:00",
  },
  {
    day: "Friday",
    enabled: true,
    startTime: "09:00",
    endTime: "17:00",
    breakStart: "13:00",
    breakEnd: "14:00",
  },
  {
    day: "Saturday",
    enabled: true,
    startTime: "09:00",
    endTime: "14:00",
    breakStart: "12:00",
    breakEnd: "12:30",
  },
  {
    day: "Sunday",
    enabled: false,
    startTime: "09:00",
    endTime: "17:00",
    breakStart: "13:00",
    breakEnd: "14:00",
  },
];

const toTimeInput = (time) => {
  return time ? String(time).slice(0, 5) : "";
};

const mapBackendAvailability = (records) => {
  return initialAvailability.map((defaultDay) => {
    const savedDay = records.find(
      (record) =>
        record.dayOfWeek?.toUpperCase() ===
        defaultDay.day.toUpperCase()
    );

    if (!savedDay) {
      return { ...defaultDay };
    }

    return {
      day: defaultDay.day,
      enabled: savedDay.available,
      startTime:
        toTimeInput(savedDay.startTime) || defaultDay.startTime,
      endTime:
        toTimeInput(savedDay.endTime) || defaultDay.endTime,
      breakStart:
        toTimeInput(savedDay.breakStart) || defaultDay.breakStart,
      breakEnd:
        toTimeInput(savedDay.breakEnd) || defaultDay.breakEnd,
    };
  });
};

function DoctorAvailability({ isDeactivated = false }) {
  const [availability, setAvailability] = useState(initialAvailability);
  const [savedAvailability, setSavedAvailability] =
    useState(initialAvailability);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load availability from backend
  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        setLoading(true);

        const response = await api.get("/doctor-availability/my");

        const backendRecords = Array.isArray(response.data)
          ? response.data
          : [];

        const mappedAvailability =
          mapBackendAvailability(backendRecords);

        setAvailability(mappedAvailability);
        setSavedAvailability(mappedAvailability);
      } catch (error) {
        console.error("Availability loading error:", error);

        toast.error(
          error.response?.data?.message ||
            "Failed to load availability."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
  }, []);

  // Toggle availability
  const handleToggle = (index) => {
    if (isDeactivated) {
      toast.error("Action not permitted: Your doctor profile is deactivated by the administrator.");
      return;
    }

    setAvailability((prev) =>
      prev.map((item, i) =>
        i === index
          ? { ...item, enabled: !item.enabled }
          : item
      )
    );
  };

  // Update time fields
  const handleTimeChange = (index, field, value) => {
    if (isDeactivated) {
      return;
    }

    setAvailability((prev) =>
      prev.map((item, i) =>
        i === index
          ? { ...item, [field]: value }
          : item
      )
    );
  };

  // Validate and save availability
  const handleSave = async () => {
    if (isDeactivated) {
      toast.error("Action not permitted: Your doctor profile is deactivated by the administrator.");
      return;
    }

    const enabledDays = availability.filter(
      (day) => day.enabled
    );

    if (enabledDays.length === 0) {
      toast.error("Please select at least one working day.");
      return;
    }

    const invalidDay = enabledDays.find((day) => {
      const hasBreakStart = Boolean(day.breakStart);
      const hasBreakEnd = Boolean(day.breakEnd);

      return (
        !day.startTime ||
        !day.endTime ||
        day.startTime >= day.endTime ||
        hasBreakStart !== hasBreakEnd ||
        (hasBreakStart &&
          (
            day.breakStart < day.startTime ||
            day.breakEnd > day.endTime ||
            day.breakStart >= day.breakEnd
          ))
      );
    });

    if (invalidDay) {
      toast.error(
        `Please check the timings for ${invalidDay.day}.`
      );
      return;
    }

    const payload = availability.map((day) => ({
      dayOfWeek: day.day.toUpperCase(),
      available: day.enabled,
      startTime: day.startTime
        ? `${day.startTime}:00`
        : null,
      endTime: day.endTime
        ? `${day.endTime}:00`
        : null,
      breakStart: day.breakStart
        ? `${day.breakStart}:00`
        : null,
      breakEnd: day.breakEnd
        ? `${day.breakEnd}:00`
        : null,
    }));

    try {
      setSaving(true);

      const response = await api.put(
        "/doctor-availability/my",
        payload
      );

      const savedRecords = Array.isArray(response.data)
        ? response.data
        : [];

      const updatedAvailability =
        mapBackendAvailability(savedRecords);

      setAvailability(updatedAvailability);
      setSavedAvailability(updatedAvailability);

      toast.success("Availability saved successfully!");
    } catch (error) {
      console.error("Availability saving error:", error);

      toast.error(
        error.response?.data?.message ||
          "Failed to save availability."
      );
    } finally {
      setSaving(false);
    }
  };

  // Reset to last saved schedule
  const handleReset = () => {
    if (isDeactivated) {
      toast.error("Action not permitted: Your doctor profile is deactivated by the administrator.");
      return;
    }

    setAvailability(
      savedAvailability.map((day) => ({ ...day }))
    );

    toast.success("Changes have been reset.");
  };

  // Summary calculations
  const activeDays = availability.filter(
    (day) => day.enabled
  ).length;

  const totalHours = availability
    .filter((day) => day.enabled)
    .reduce((total, day) => {
      if (!day.startTime || !day.endTime) {
        return total;
      }

      const start = day.startTime.split(":").map(Number);
      const end = day.endTime.split(":").map(Number);

      const workingMinutes =
        end[0] * 60 +
        end[1] -
        (start[0] * 60 + start[1]);

      let breakMinutes = 0;

      if (day.breakStart && day.breakEnd) {
        const breakStart = day.breakStart
          .split(":")
          .map(Number);

        const breakEnd = day.breakEnd
          .split(":")
          .map(Number);

        breakMinutes =
          breakEnd[0] * 60 +
          breakEnd[1] -
          (breakStart[0] * 60 + breakStart[1]);
      }

      return total + Math.max(
        0,
        workingMinutes - breakMinutes
      );
    }, 0);

  const hours = Math.floor(totalHours / 60);
  const minutes = totalHours % 60;

  return (
    <div>
      {/* PAGE HEADER */}
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-slate-900">
          Availability
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Manage your weekly working hours and consultation timings.
        </p>
      </div>

      {isDeactivated && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="font-semibold">Schedule Locked</p>
          <p className="mt-0.5 text-xs text-amber-700">
            Your profile is currently deactivated. Modifying working hours and saving availability is disabled.
          </p>
        </div>
      )}

      {/* SUMMARY CARDS */}
      <div className="grid gap-5 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="inline-flex rounded-xl bg-cyan-50 p-3 text-cyan-600">
            <CalendarDays size={23} />
          </div>

          <p className="mt-4 text-sm font-medium text-slate-500">
            Working Days
          </p>

          <h3 className="mt-1 text-3xl font-extrabold text-slate-900">
            {activeDays}
            <span className="ml-1 text-base font-medium text-slate-400">
              / 7
            </span>
          </h3>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="inline-flex rounded-xl bg-green-50 p-3 text-green-600">
            <Clock size={23} />
          </div>

          <p className="mt-4 text-sm font-medium text-slate-500">
            Weekly Consultation Hours
          </p>

          <h3 className="mt-1 text-3xl font-extrabold text-slate-900">
            {hours}
            <span className="ml-1 text-base font-medium text-slate-400">
              hrs {minutes > 0 ? `${minutes} min` : ""}
            </span>
          </h3>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="inline-flex rounded-xl bg-purple-50 p-3 text-purple-600">
            <Coffee size={23} />
          </div>

          <p className="mt-4 text-sm font-medium text-slate-500">
            Break Schedule
          </p>

          <h3 className="mt-1 text-2xl font-extrabold text-slate-900">
            Daily Break
          </h3>

          <p className="mt-1 text-xs text-slate-400">
            Customizable for each day
          </p>
        </div>
      </div>

      {/* AVAILABILITY SETTINGS */}
      <div className="mt-8 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-6">
          <h2 className="text-lg font-bold text-slate-900">
            Weekly Schedule
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Set your consultation hours for each day of the week.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-100 border-t-cyan-600" />
            <span className="ml-3 text-sm text-slate-500">
              Loading your availability...
            </span>
          </div>
        ) : (
          <>
            <div className="divide-y divide-slate-100">
              {availability.map((day, index) => (
                <div
                  key={day.day}
                  className={`p-5 transition sm:p-6 ${
                    day.enabled
                      ? "bg-white"
                      : "bg-slate-50/70"
                  }`}
                >
                  {/* DAY HEADER */}
                  <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        disabled={isDeactivated}
                        onClick={() => handleToggle(index)}
                        role="switch"
                        aria-checked={day.enabled}
                        aria-label={`Enable ${day.day}`}
                        className={`relative h-6 w-11 rounded-full transition disabled:cursor-not-allowed disabled:opacity-50 ${
                          day.enabled
                            ? "bg-cyan-600"
                            : "bg-slate-300"
                        }`}
                      >
                        <span
                          className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                            day.enabled ? "left-6" : "left-1"
                          }`}
                        />
                      </button>

                      <div>
                        <h3 className="font-bold text-slate-800">
                          {day.day}
                        </h3>

                        <p className="mt-1 text-xs text-slate-400">
                          {day.enabled
                            ? "Available for appointments"
                            : "Day off"}
                        </p>
                      </div>
                    </div>

                    <div>
                      {day.enabled ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
                          <CheckCircle size={14} />
                          Available
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500">
                          <XCircle size={14} />
                          Unavailable
                        </span>
                      )}
                    </div>
                  </div>

                  {/* TIME SETTINGS */}
                  {day.enabled && (
                    <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                      <div>
                        <label
                          htmlFor={`start-${index}`}
                          className="mb-2 block text-xs font-semibold text-slate-500"
                        >
                          Start Time
                        </label>

                        <input
                          id={`start-${index}`}
                          type="time"
                          value={day.startTime}
                          onChange={(e) =>
                            handleTimeChange(
                              index,
                              "startTime",
                              e.target.value
                            )
                          }
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor={`end-${index}`}
                          className="mb-2 block text-xs font-semibold text-slate-500"
                        >
                          End Time
                        </label>

                        <input
                          id={`end-${index}`}
                          type="time"
                          value={day.endTime}
                          onChange={(e) =>
                            handleTimeChange(
                              index,
                              "endTime",
                              e.target.value
                            )
                          }
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor={`break-start-${index}`}
                          className="mb-2 block text-xs font-semibold text-slate-500"
                        >
                          Break Start
                        </label>

                        <input
                          id={`break-start-${index}`}
                          type="time"
                          value={day.breakStart}
                          onChange={(e) =>
                            handleTimeChange(
                              index,
                              "breakStart",
                              e.target.value
                            )
                          }
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor={`break-end-${index}`}
                          className="mb-2 block text-xs font-semibold text-slate-500"
                        >
                          Break End
                        </label>

                        <input
                          id={`break-end-${index}`}
                          type="time"
                          value={day.breakEnd}
                          onChange={(e) =>
                            handleTimeChange(
                              index,
                              "breakEnd",
                              e.target.value
                            )
                          }
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex flex-col justify-between gap-4 border-t border-slate-100 bg-slate-50/50 p-5 sm:flex-row sm:items-center sm:px-6">
              <p className="flex items-center gap-2 text-xs text-slate-500">
                <Info size={16} className="shrink-0 text-cyan-600" />
                Your availability is saved securely to the server.
              </p>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={isDeactivated || saving}
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RotateCcw size={16} />
                  Reset Changes
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isDeactivated || saving}
                  className="flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Save size={17} />
                  {saving ? "Saving..." : "Save Availability"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* INFORMATION CARD */}
      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-5">
        <Info size={20} className="mt-0.5 shrink-0 text-blue-600" />

        <div>
          <h3 className="text-sm font-bold text-blue-900">
            Availability Information
          </h3>

          <p className="mt-1 text-sm leading-6 text-blue-800">
            Your availability settings determine when patients can
            request appointments with you. Make sure your working
            hours and break timings are accurate. Changes are saved
            to your account and remain available when you log in again.
          </p>
        </div>
      </div>
    </div>
  );
}

export default DoctorAvailability;
