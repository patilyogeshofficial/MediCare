import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
  FileText,
  AlertTriangle,
  ExternalLink,
  Activity,
  UserCheck,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api";
import { createNotificationStream } from "../services/notificationStream";

function DoctorNotifications() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("ALL");
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);

  // Close dropdown on Escape or clicking outside; restore focus to trigger button
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Format backend notification into frontend structure
  const mapNotification = (n) => ({
    id: n.notificationId,
    title: n.title,
    message: n.message,
    time: n.createdAt,
    type: n.type || "GENERAL",
    category: n.category || "GENERAL",
    priority: n.priority || "NORMAL",
    actionUrl: n.actionUrl || "/doctor/dashboard",
    unread: !n.isRead,
  });

  // Fetch notifications
  const fetchNotifications = useCallback(async (showLoader = false) => {
    try {
      if (showLoader) setLoading(true);

      const [notificationsResponse, countResponse] = await Promise.all([
        api.get("/notifications/my"),
        api.get("/notifications/unread-count"),
      ]);

      const records = Array.isArray(notificationsResponse.data)
        ? notificationsResponse.data
        : [];

      setNotifications(records.map(mapNotification));
      setUnreadCount(Number(countResponse.data) || 0);
    } catch (error) {
      console.error("Doctor notification fetch error:", error);
    } finally {
      if (showLoader) setLoading(false);
    }
  }, []);

  // Initial fetch and Real-Time SSE Setup
  useEffect(() => {
    fetchNotifications(true);

    // Subscribe to real-time Server-Sent Events stream
    const unsubscribe = createNotificationStream(
      "/notifications/stream",
      (incomingNotification) => {
        const mapped = mapNotification(incomingNotification);

        setNotifications((prev) => {
          // Prevent duplicates
          if (prev.some((item) => item.id === mapped.id)) {
            return prev;
          }
          return [mapped, ...prev];
        });

        setUnreadCount((prev) => prev + 1);

        // Notify doctor with toast alert
        toast(
          `${mapped.title}: ${mapped.message.slice(0, 75)}${
            mapped.message.length > 75 ? "..." : ""
          }`,
          {
            icon: mapped.priority === "URGENT" ? "⚠️" : "🔔",
            duration: 4500,
          }
        );
      },
      () => {},
      () => {
        // Fallback: poll if SSE drops
        fetchNotifications(false);
      }
    );

    // Fallback polling every 30s
    const pollInterval = setInterval(() => {
      fetchNotifications(false);
    }, 30000);

    return () => {
      if (unsubscribe) unsubscribe();
      clearInterval(pollInterval);
    };
  }, [fetchNotifications]);

  // Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return "";

    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Select notification icon and styling
  const getNotificationVisuals = (type, category, priority) => {
    const t = (type || "").toUpperCase();

    if (t.includes("CANCELLED") || t.includes("REJECTED")) {
      return {
        icon: XCircle,
        style: "bg-red-50 text-red-600 border border-red-100",
      };
    }
    if (t.includes("CONFIRMED") || t.includes("APPROVED")) {
      return {
        icon: CheckCircle,
        style: "bg-emerald-50 text-emerald-600 border border-emerald-100",
      };
    }
    if (t.includes("REMINDER")) {
      return {
        icon: Clock,
        style: "bg-amber-50 text-amber-600 border border-amber-100",
      };
    }
    if (t.includes("PRESCRIPTION")) {
      return {
        icon: FileText,
        style: "bg-violet-50 text-violet-600 border border-violet-100",
      };
    }
    if (t.includes("EHR") || t.includes("DOCUMENT") || t.includes("CLINICAL") || category === "MEDICAL_RECORD") {
      return {
        icon: Activity,
        style: "bg-teal-50 text-teal-600 border border-teal-100",
      };
    }
    if (t.includes("DOCTOR") || t.includes("USER") || category === "ACCOUNT") {
      return {
        icon: UserCheck,
        style: "bg-blue-50 text-blue-600 border border-blue-100",
      };
    }
    return {
      icon: CalendarDays,
      style: "bg-cyan-50 text-cyan-600 border border-cyan-100",
    };
  };

  // Mark individual notification as read
  const markAsRead = async (id, e) => {
    if (e) e.stopPropagation();

    const notif = notifications.find((item) => item.id === id);
    if (!notif || !notif.unread || actionLoading) return;

    try {
      setActionLoading(true);
      await api.patch(`/notifications/${id}/read`);

      setNotifications((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, unread: false } : item
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

  // Archive / Soft-delete notification
  const handleArchive = async (id, e) => {
    if (e) e.stopPropagation();
    if (actionLoading) return;

    try {
      setActionLoading(true);
      await api.delete(`/notifications/${id}`);

      const removed = notifications.find((item) => item.id === id);
      setNotifications((prev) => prev.filter((item) => item.id !== id));
      if (removed && removed.unread) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      toast.success("Notification archived.");
    } catch (error) {
      console.error("Archive notification error:", error);
      toast.error("Unable to archive notification.");
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

  // Clear (soft delete) all notifications
  const clearAllNotifications = async () => {
    if (notifications.length === 0 || actionLoading) return;

    if (!window.confirm("Archive all notifications?")) {
      return;
    }

    try {
      setActionLoading(true);
      await api.delete("/notifications/clear-all");

      setNotifications([]);
      setUnreadCount(0);
      toast.success("All notifications archived.");
    } catch (error) {
      console.error("Clear notifications error:", error);
      toast.error("Unable to clear notifications.");
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered notifications based on active tab
  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      if (activeTab === "UNREAD") return item.unread;
      if (activeTab === "APPOINTMENT") return item.category === "APPOINTMENT";
      if (activeTab === "CLINICAL") return item.category === "MEDICAL_RECORD" || item.category === "PRESCRIPTION";
      return true;
    });
  }, [notifications, activeTab]);

  // Escape key handler to close notification dropdown (WCAG 2.1.2)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <div className="relative">
      {/* NOTIFICATION TRIGGER BUTTON */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-cyan-700 focus-visible:ring-2 focus-visible:ring-cyan-600 focus-visible:outline-none"
        aria-label="Doctor Notifications"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <Bell size={21} aria-hidden="true" />

        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* NOTIFICATION DROPDOWN / CENTER */}
      {isOpen && (
        <>
          {/* MOBILE OVERLAY */}
          <div
            className="fixed inset-0 z-40 bg-black/20 sm:hidden"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          <div
            ref={dropdownRef}
            role="region"
            aria-label="Notification Center"
            className="absolute right-0 z-50 mt-3 w-[calc(100vw-2rem)] max-w-[430px] overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl sm:w-[430px]"
          >
            {/* HEADER */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 p-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-slate-900 sm:text-base">
                    Notification Center
                  </h3>
                  {unreadCount > 0 ? (
                    <span className="rounded-full bg-cyan-100 px-2 py-0.5 text-xs font-bold text-cyan-800">
                      {unreadCount} Unread
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                      All Caught Up
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-slate-500">
                  Real-time practice alerts and appointment updates.
                </p>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-200/60 hover:text-slate-700"
                aria-label="Close notification center"
              >
                <X size={18} />
              </button>
            </div>

            {/* FILTER TABS */}
            <div className="flex border-b border-slate-100 bg-white px-2 py-1.5 text-xs">
              {[
                { id: "ALL", label: "All" },
                { id: "UNREAD", label: `Unread (${unreadCount})` },
                { id: "APPOINTMENT", label: "Appointments" },
                { id: "CLINICAL", label: "Clinical" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 rounded-lg px-2 py-1.5 font-semibold transition ${
                    activeTab === tab.id
                      ? "bg-cyan-50 font-bold text-cyan-800"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* BULK ACTIONS BAR */}
            {notifications.length > 0 && (
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/40 px-4 py-2 text-xs">
                <button
                  onClick={markAllAsRead}
                  disabled={unreadCount === 0 || actionLoading}
                  className="flex items-center gap-1.5 font-bold text-cyan-700 transition hover:text-cyan-900 disabled:cursor-not-allowed disabled:text-slate-400"
                >
                  <CheckCheck size={14} />
                  Mark all as read
                </button>

                <button
                  onClick={clearAllNotifications}
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 font-medium text-slate-500 transition hover:text-red-600 disabled:cursor-not-allowed"
                >
                  <Trash2 size={13} />
                  Clear all
                </button>
              </div>
            )}

            {/* NOTIFICATION ITEMS LIST */}
            <div className="max-h-[min(52vh,420px)] overflow-y-auto divide-y divide-slate-100">
              {loading ? (
                <div className="flex items-center justify-center py-12" role="status" aria-live="polite">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-200 border-t-cyan-700" aria-hidden="true" />
                  <span className="ml-2.5 text-xs font-medium text-slate-500">
                    Loading notifications...
                  </span>
                </div>
              ) : filteredNotifications.length > 0 ? (
                filteredNotifications.map((notif) => {
                  const { icon: Icon, style } = getNotificationVisuals(
                    notif.type,
                    notif.category,
                    notif.priority
                  );

                  return (
                    <div
                      key={notif.id}
                      onClick={() => {
                        if (notif.unread) markAsRead(notif.id);
                      }}
                      className={`group relative flex items-start gap-3 p-3.5 transition hover:bg-slate-50/80 cursor-pointer ${
                        notif.unread ? "bg-cyan-50/30" : "bg-white"
                      }`}
                    >
                      {/* ICON */}
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${style}`}
                      >
                        <Icon size={18} />
                      </div>

                      {/* CONTENT */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-1.5">
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-extrabold text-slate-900 sm:text-sm">
                              {notif.title}
                            </h4>
                            {notif.priority === "URGENT" && (
                              <span className="rounded bg-red-100 px-1.5 py-0.2 text-[9px] font-extrabold text-red-700">
                                URGENT
                              </span>
                            )}
                            {notif.priority === "IMPORTANT" && (
                              <span className="rounded bg-amber-100 px-1.5 py-0.2 text-[9px] font-bold text-amber-800">
                                Important
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            {notif.unread && (
                              <span className="h-2 w-2 rounded-full bg-cyan-600" />
                            )}
                            <button
                              onClick={(e) => handleArchive(notif.id, e)}
                              className="rounded p-1 text-slate-300 opacity-0 transition group-hover:opacity-100 hover:bg-slate-100 hover:text-red-500"
                              title="Archive notification"
                              aria-label="Archive notification"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        <p className="mt-1 text-xs leading-relaxed text-slate-600">
                          {notif.message}
                        </p>

                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-[10px] font-medium text-slate-400">
                            {formatTime(notif.time)}
                          </span>

                          {notif.actionUrl && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (notif.unread) markAsRead(notif.id);
                                setIsOpen(false);
                                navigate(notif.actionUrl);
                              }}
                              className="flex items-center gap-1 text-[11px] font-bold text-cyan-700 hover:text-cyan-900"
                            >
                              Open
                              <ExternalLink size={11} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="px-6 py-12 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                    <BellRing size={22} />
                  </div>
                  <h4 className="mt-3 text-sm font-bold text-slate-700">
                    {activeTab === "UNREAD" ? "No unread alerts" : "No notifications"}
                  </h4>
                  <p className="mt-1 text-xs text-slate-400">
                    {activeTab === "UNREAD"
                      ? "You're all caught up with your practice!"
                      : "New patient appointments and alerts will appear here."}
                  </p>
                </div>
              )}
            </div>

            {/* FOOTER */}
            <div className="border-t border-slate-100 bg-slate-50 px-4 py-2.5 text-center">
              <span className="text-[11px] font-medium text-slate-400">
                MediCare Plus Doctor Portal • Real-Time Alert System
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default DoctorNotifications;
