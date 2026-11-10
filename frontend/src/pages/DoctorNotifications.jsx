
import { useEffect, useState, useCallback } from "react";
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
import toast from "react-hot-toast";
import api from "../services/api";

function DoctorNotifications() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Format backend notification into frontend structure
  const mapNotification = (notification) => ({
    id: notification.notificationId,
    title: notification.title,
    message: notification.message,
    time: notification.createdAt,
    type: notification.type,
    unread: !notification.isRead,
  });

  // Fetch notifications
  const fetchNotifications = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);

      const [notificationsResponse, countResponse] =
        await Promise.all([
          api.get("/notifications/my"),
          api.get("/notifications/unread-count"),
        ]);

      const records = Array.isArray(notificationsResponse.data)
        ? notificationsResponse.data
        : [];

      setNotifications(records.map(mapNotification));
      setUnreadCount(Number(countResponse.data) || 0);
    } catch (error) {
      console.error("Notification fetch error:", error);
      toast.error(
        error.response?.data?.message ||
          "Failed to load notifications."
      );
    } finally {
      if (showLoader) setLoading(false);
    }
  }, []);

  // Load notifications when component mounts
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return "";

    const date = new Date(timestamp);

    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Select notification icon
  const getNotificationIcon = (type) => {
    switch (type) {
      case "NEW_APPOINTMENT":
      case "APPOINTMENT_BOOKED":
      case "appointment":
        return {
          icon: CalendarDays,
          style: "bg-cyan-50 text-cyan-600",
        };

      case "APPOINTMENT_CONFIRMED":
      case "confirmed":
        return {
          icon: CheckCircle,
          style: "bg-green-50 text-green-600",
        };

      case "APPOINTMENT_CANCELLED":
      case "cancelled":
        return {
          icon: XCircle,
          style: "bg-red-50 text-red-600",
        };

      case "APPOINTMENT_REMINDER":
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

  // Mark individual notification as read
  const markAsRead = async (id) => {
    const notification = notifications.find(
      (item) => item.id === id
    );

    if (!notification || !notification.unread || actionLoading) {
      return;
    }

    try {
      setActionLoading(true);

      await api.patch(`/notifications/${id}/read`);

      setNotifications((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, unread: false }
            : item
        )
      );

      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Mark notification read error:", error);
      toast.error("Unable to mark notification as read.");
    } finally {
      setActionLoading(false);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (unreadCount === 0 || actionLoading) return;

    try {
      setActionLoading(true);

      await api.patch("/notifications/mark-all-read");

      setNotifications((prev) =>
        prev.map((item) => ({ ...item, unread: false }))
      );

      setUnreadCount(0);

      toast.success("All notifications marked as read.");
    } catch (error) {
      console.error("Mark all notifications error:", error);
      toast.error("Unable to update notifications.");
    } finally {
      setActionLoading(false);
    }
  };

  // Clear all notifications
  const clearAllNotifications = async () => {
    if (actionLoading) return;

    if (!window.confirm("Are you sure you want to clear all notifications?")) {
      return;
    }

    try {
      setActionLoading(true);

      await api.delete("/notifications/clear-all");

      setNotifications([]);
      setUnreadCount(0);

      toast.success("All notifications cleared.");
    } catch (error) {
      console.error("Clear notifications error:", error);
      toast.error("Unable to clear notifications.");
    } finally {
      setActionLoading(false);
    }
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
                  disabled={unreadCount === 0 || actionLoading}
                  className="flex items-center gap-1.5 text-xs font-semibold text-cyan-700 transition hover:text-cyan-800 disabled:cursor-not-allowed disabled:text-slate-400"
                >
                  <CheckCheck size={15} />
                  Mark all as read
                </button>

                <button
                  onClick={clearAllNotifications}
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 text-xs font-semibold text-red-500 transition hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2 size={14} />
                  Clear all
                </button>
              </div>
            )}

            {/* NOTIFICATION LIST */}
            <div className="max-h-[420px] overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-7 w-7 animate-spin rounded-full border-4 border-cyan-100 border-t-cyan-600" />
                  <span className="ml-3 text-xs text-slate-500">
                    Loading notifications...
                  </span>
                </div>
              ) : notifications.length > 0 ? (
                notifications.map((notification) => {
                  const { icon: Icon, style } = getNotificationIcon(
                    notification.type
                  );

                  return (
                    <button
                      key={notification.id}
                      onClick={() => markAsRead(notification.id)}
                      disabled={actionLoading}
                      className={`flex w-full gap-3 border-b border-slate-50 p-4 text-left transition hover:bg-slate-50 disabled:cursor-default ${
                        notification.unread
                          ? "bg-cyan-50/40"
                          : "bg-white"
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
                          {formatTime(notification.time)}
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
