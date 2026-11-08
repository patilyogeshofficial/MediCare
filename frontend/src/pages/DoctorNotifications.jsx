import { useState } from "react";
import {
  Bell,
  CalendarDays,
  CheckCircle,
  XCircle,
  Clock,
  CheckCheck,
  Trash2,
  X,
  BellRing,
} from "lucide-react";

const initialNotifications = [
  {
    id: 1,
    title: "New Appointment Request",
    message: "Rahul Sharma has requested an appointment with you.",
    time: "5 minutes ago",
    type: "appointment",
    unread: true,
  },
  {
    id: 2,
    title: "Appointment Confirmed",
    message: "Priya Deshmukh's appointment has been confirmed.",
    time: "30 minutes ago",
    type: "confirmed",
    unread: true,
  },
  {
    id: 3,
    title: "Appointment Cancelled",
    message: "Rohan More has cancelled his appointment.",
    time: "2 hours ago",
    type: "cancelled",
    unread: true,
  },
  {
    id: 4,
    title: "Upcoming Appointment",
    message: "You have an appointment with Neha Patil at 2:00 PM.",
    time: "4 hours ago",
    type: "reminder",
    unread: false,
  },
  {
    id: 5,
    title: "Appointment Completed",
    message: "Your consultation with Amit Joshi is marked completed.",
    time: "Yesterday",
    type: "confirmed",
    unread: false,
  },
];

function DoctorNotifications() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);

  const unreadCount = notifications.filter(
    (notification) => notification.unread
  ).length;

  const getNotificationIcon = (type) => {
    switch (type) {
      case "appointment":
        return {
          icon: CalendarDays,
          style: "bg-cyan-50 text-cyan-600",
        };

      case "confirmed":
        return {
          icon: CheckCircle,
          style: "bg-green-50 text-green-600",
        };

      case "cancelled":
        return {
          icon: XCircle,
          style: "bg-red-50 text-red-600",
        };

      case "reminder":
        return {
          icon: Clock,
          style: "bg-orange-50 text-orange-600",
        };

      default:
        return {
          icon: Bell,
          style: "bg-slate-50 text-slate-600",
        };
    }
  };

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id
          ? { ...notification, unread: false }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notification) => ({
        ...notification,
        unread: false,
      }))
    );
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  return (
    <div className="relative">
      {/* NOTIFICATION BUTTON */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative rounded-full p-2 text-slate-500 transition hover:bg-slate-100"
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <Bell size={21} />

        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* NOTIFICATION DROPDOWN */}
      {isOpen && (
        <>
          {/* MOBILE OVERLAY */}
          <div
            className="fixed inset-0 z-40 bg-black/10 sm:hidden"
            onClick={() => setIsOpen(false)}
          />

          <div className="absolute right-0 z-50 mt-4 w-[calc(100vw-2rem)] max-w-[400px] overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl sm:w-[400px]">

            {/* HEADER */}
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">
                    Notifications
                  </h3>

                  {unreadCount > 0 && (
                    <span className="rounded-full bg-cyan-50 px-2 py-0.5 text-xs font-bold text-cyan-700">
                      {unreadCount} New
                    </span>
                  )}
                </div>

                <p className="mt-1 text-xs text-slate-400">
                  Stay updated with your activities.
                </p>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100"
                aria-label="Close notifications"
              >
                <X size={19} />
              </button>
            </div>

            {/* ACTIONS */}
            {notifications.length > 0 && (
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
                <button
                  onClick={markAllAsRead}
                  disabled={unreadCount === 0}
                  className="flex items-center gap-1.5 text-xs font-semibold text-cyan-700 transition hover:text-cyan-800 disabled:cursor-not-allowed disabled:text-slate-400"
                >
                  <CheckCheck size={15} />
                  Mark all as read
                </button>

                <button
                  onClick={clearAllNotifications}
                  className="flex items-center gap-1.5 text-xs font-semibold text-red-500 transition hover:text-red-600"
                >
                  <Trash2 size={14} />
                  Clear all
                </button>
              </div>
            )}

            {/* NOTIFICATION LIST */}
            <div className="max-h-[420px] overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.map((notification) => {
                  const { icon: Icon, style } = getNotificationIcon(
                    notification.type
                  );

                  return (
                    <button
                      key={notification.id}
                      onClick={() => markAsRead(notification.id)}
                      className={`flex w-full gap-3 border-b border-slate-50 p-4 text-left transition hover:bg-slate-50 ${
                        notification.unread ? "bg-cyan-50/40" : "bg-white"
                      }`}
                    >
                      {/* ICON */}
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${style}`}
                      >
                        <Icon size={19} />
                      </div>

                      {/* CONTENT */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-bold text-slate-800">
                            {notification.title}
                          </h4>

                          {notification.unread && (
                            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-cyan-600" />
                          )}
                        </div>

                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          {notification.message}
                        </p>

                        <p className="mt-2 text-[11px] font-medium text-slate-400">
                          {notification.time}
                        </p>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="px-6 py-12 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-50 text-slate-400">
                    <BellRing size={25} />
                  </div>

                  <h4 className="mt-4 text-sm font-bold text-slate-700">
                    No notifications
                  </h4>

                  <p className="mt-1 text-xs text-slate-400">
                    You're all caught up!
                  </p>
                </div>
              )}
            </div>

            {/* FOOTER */}
            <div className="border-t border-slate-100 bg-slate-50 px-5 py-3 text-center">
              <p className="text-xs text-slate-400">
                MediCare Doctor Portal
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default DoctorNotifications;