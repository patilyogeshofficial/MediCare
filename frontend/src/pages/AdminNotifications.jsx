import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CalendarDays,
  Mail,
  FileText,
  Check,
  CheckCheck,
  RefreshCw,
  Search,
  Clock,
  Inbox,
  AlertCircle,
  Trash2,
  ExternalLink,
  ShieldAlert,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api";
import { createNotificationStream } from "../services/notificationStream";
import AccessibleModal from "../components/ui/AccessibleModal";

function AdminNotifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markingId, setMarkingId] = useState(null);
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedNotification, setSelectedNotification] = useState(null);

  // Fetch notifications and unread count
  const fetchNotifications = useCallback(async (showLoader = false) => {
    try {
      if (showLoader) {
        setRefreshing(true);
      }

      const [notificationsResponse, countResponse] = await Promise.all([
        api.get("/admin/notifications"),
        api.get("/admin/notifications/unread-count"),
      ]);

      setNotifications(notificationsResponse.data || []);
      setUnreadCount(Number(countResponse.data || 0));
    } catch (error) {
      console.error("Admin notifications error:", error);
      toast.error("Unable to load notifications.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial fetch and Real-Time SSE Listener
  useEffect(() => {
    fetchNotifications(true);

    // Subscribe to SSE stream for real-time administrator activity updates
    const unsubscribe = createNotificationStream(
      "/admin/notifications/stream",
      (incomingNotification) => {
        setNotifications((prev) => {
          if (prev.some((n) => n.notificationId === incomingNotification.notificationId)) {
            return prev;
          }
          return [incomingNotification, ...prev];
        });

        setUnreadCount((prev) => prev + 1);

        toast(
          `Admin Alert: ${incomingNotification.title}`,
          {
            icon: incomingNotification.priority === "URGENT" ? "⚠️" : "🔔",
            duration: 4000,
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
    const interval = setInterval(() => {
      fetchNotifications(false);
    }, 30000);

    return () => {
      if (unsubscribe) unsubscribe();
      clearInterval(interval);
    };
  }, [fetchNotifications]);

  // Mark notification as read
  const handleMarkAsRead = async (notificationId, e) => {
    if (e) e.stopPropagation();
    try {
      setMarkingId(notificationId);

      await api.patch(`/admin/notifications/${notificationId}/read`);

      setNotifications((previous) =>
        previous.map((notification) =>
          notification.notificationId === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      );

      setUnreadCount((previous) => Math.max(0, previous - 1));

      setSelectedNotification((previous) =>
        previous?.notificationId === notificationId
          ? { ...previous, isRead: true }
          : previous
      );

      toast.success("Notification marked as read.");
    } catch (error) {
      console.error("Mark notification as read error:", error);
      toast.error("Unable to update notification.");
    } finally {
      setMarkingId(null);
    }
  };

  // Archive / Soft delete individual notification
  const handleArchive = async (notificationId, e) => {
    if (e) e.stopPropagation();
    try {
      await api.delete(`/admin/notifications/${notificationId}`);

      const removed = notifications.find((n) => n.notificationId === notificationId);
      setNotifications((previous) =>
        previous.filter((n) => n.notificationId !== notificationId)
      );

      if (removed && !removed.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      if (selectedNotification?.notificationId === notificationId) {
        setSelectedNotification(null);
      }

      toast.success("Notification archived.");
    } catch (error) {
      console.error("Archive notification error:", error);
      toast.error("Unable to archive notification.");
    }
  };

  // Mark all notifications as read in a single API call
  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) {
      toast("No unread notifications.");
      return;
    }

    try {
      await api.patch("/admin/notifications/mark-all-read");

      setNotifications((previous) =>
        previous.map((notification) => ({
          ...notification,
          isRead: true,
        }))
      );

      setUnreadCount(0);

      setSelectedNotification((previous) =>
        previous ? { ...previous, isRead: true } : previous
      );

      toast.success("All notifications marked as read.");
    } catch (error) {
      console.error("Mark all notifications error:", error);
      toast.error("Failed to mark all notifications as read.");
    }
  };

  // Clear / archive all notifications
  const handleClearAll = async () => {
    if (notifications.length === 0) return;

    if (!window.confirm("Archive all hospital activity notifications?")) {
      return;
    }

    try {
      await api.delete("/admin/notifications/clear-all");
      setNotifications([]);
      setUnreadCount(0);
      setSelectedNotification(null);
      toast.success("All notifications archived.");
    } catch (error) {
      console.error("Clear notifications error:", error);
      toast.error("Unable to clear notifications.");
    }
  };

  // Notification category helper
  const getCategory = (n) => {
    if (n.category) return n.category.toUpperCase();
    const type = (n.type || "").toUpperCase();

    if (type.includes("APPOINTMENT") || type.includes("RESCHEDULE")) return "APPOINTMENT";
    if (type.includes("PRESCRIPTION")) return "PRESCRIPTION";
    if (type.includes("CONTACT")) return "CONTACT";
    if (type.includes("USER") || type.includes("DOCTOR") || type.includes("ACCOUNT")) return "ACCOUNT";
    return "GENERAL";
  };

  const getNotificationIcon = (n) => {
    const cat = getCategory(n);
    switch (cat) {
      case "APPOINTMENT":
        return CalendarDays;
      case "CONTACT":
        return Mail;
      case "PRESCRIPTION":
        return FileText;
      case "ACCOUNT":
        return Users;
      default:
        return Bell;
    }
  };

  const getNotificationStyle = (n) => {
    const cat = getCategory(n);
    switch (cat) {
      case "APPOINTMENT":
        return "bg-blue-50 text-blue-600 border border-blue-100";
      case "CONTACT":
        return "bg-purple-50 text-purple-600 border border-purple-100";
      case "PRESCRIPTION":
        return "bg-cyan-50 text-cyan-700 border border-cyan-100";
      case "ACCOUNT":
        return "bg-emerald-50 text-emerald-700 border border-emerald-100";
      default:
        return "bg-slate-100 text-slate-600 border border-slate-200";
    }
  };

  // Date formatting
  const formatDate = (date) => {
    if (!date) return "Date unavailable";
    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) return "Date unavailable";

    return parsedDate.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Filter and search notifications
  const filteredNotifications = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return notifications.filter((notification) => {
      const category = getCategory(notification);

      const matchesFilter =
        activeFilter === "ALL" ||
        (activeFilter === "UNREAD" && !notification.isRead) ||
        category === activeFilter;

      const matchesSearch =
        !search ||
        (notification.title || "").toLowerCase().includes(search) ||
        (notification.message || "").toLowerCase().includes(search) ||
        (notification.type || "").toLowerCase().includes(search);

      return matchesFilter && matchesSearch;
    });
  }, [notifications, activeFilter, searchTerm]);

  // Escape key handler to close detail modal (WCAG 2.1.2)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && selectedNotification) {
        setSelectedNotification(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedNotification]);

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-slate-900">
              Notification Center
            </h1>

            {unreadCount > 0 && (
              <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-bold text-cyan-800">
                {unreadCount} Unread
              </span>
            )}
          </div>

          <p className="mt-1 text-sm text-slate-500">
            Real-time event stream and hospital activity feed.
          </p>
        </div>

        {/* TOP ACTIONS */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => fetchNotifications(true)}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              size={14}
              className={refreshing ? "animate-spin" : ""}
            />
            Refresh
          </button>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-2 rounded-xl bg-cyan-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-cyan-700"
            >
              <CheckCheck size={15} />
              Mark all read
            </button>
          )}

          {notifications.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100"
            >
              <Trash2 size={14} />
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* FILTER & SEARCH TOOLBAR */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        {/* CATEGORY TABS */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: "ALL", label: `All (${notifications.length})` },
            { id: "UNREAD", label: `Unread (${unreadCount})` },
            { id: "APPOINTMENT", label: "Appointments" },
            { id: "PRESCRIPTION", label: "Prescriptions" },
            { id: "CONTACT", label: "Contact Messages" },
            { id: "ACCOUNT", label: "Accounts" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                activeFilter === tab.id
                  ? "bg-slate-900 font-bold text-white shadow-sm"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* SEARCH INPUT */}
        <div className="relative min-w-[240px]">
          <label htmlFor="admin-notif-search" className="sr-only">
            Search notifications
          </label>
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            id="admin-notif-search"
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search notifications..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-xs font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-cyan-600 focus:bg-white focus:ring-1 focus:ring-cyan-600"
          />
        </div>
      </div>

      {/* NOTIFICATIONS CONTAINER */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20" role="status" aria-live="polite">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-cyan-200 border-t-cyan-700" aria-hidden="true" />
            <span className="ml-3 text-sm font-semibold text-slate-600">
              Loading hospital notifications...
            </span>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="py-20 text-center">
            <Inbox size={42} className="mx-auto text-slate-300" />
            <h3 className="mt-3 text-base font-bold text-slate-700">
              No notifications found
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              {searchTerm
                ? "No notifications match your search terms."
                : "New hospital activity and alerts will appear here in real time."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredNotifications.map((notification) => {
              const Icon = getNotificationIcon(notification);
              const isUrgent = notification.priority === "URGENT";
              const isImportant = notification.priority === "IMPORTANT";

              return (
                <div
                  key={notification.notificationId}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedNotification(notification)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedNotification(notification);
                    }
                  }}
                  aria-label={`Notification: ${notification.title}. ${notification.isRead ? "Read" : "Unread"}`}
                  className={`group flex flex-col gap-4 p-4 transition hover:bg-slate-50/80 cursor-pointer sm:flex-row sm:items-start focus-visible:ring-2 focus-visible:ring-cyan-600 focus-visible:outline-none ${
                    !notification.isRead ? "bg-cyan-50/30" : "bg-white"
                  }`}
                >
                  {/* ICON */}
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${getNotificationStyle(
                      notification
                    )}`}
                  >
                    <Icon size={20} />
                  </div>

                  {/* BODY */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">
                        {notification.title}
                      </h4>

                      {!notification.isRead && (
                        <span className="rounded-full bg-cyan-100 px-2 py-0.5 text-[10px] font-bold text-cyan-800">
                          NEW
                        </span>
                      )}

                      {isUrgent && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-extrabold text-red-700">
                          URGENT
                        </span>
                      )}

                      {isImportant && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                          Important
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-xs leading-relaxed text-slate-600 sm:text-sm">
                      {notification.message}
                    </p>

                    <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-400">
                      <span className="flex items-center gap-1 font-medium text-slate-400">
                        <Clock size={13} />
                        {formatDate(notification.createdAt)}
                      </span>

                      {notification.appointmentId && (
                        <span className="font-semibold text-slate-500">
                          Appt #{notification.appointmentId}
                        </span>
                      )}

                      {notification.prescriptionId && (
                        <span className="font-semibold text-slate-500">
                          Rx #{notification.prescriptionId}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* ITEM ACTIONS */}
                  <div className="flex shrink-0 items-center gap-2">
                    {notification.actionUrl && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!notification.isRead) {
                            handleMarkAsRead(notification.notificationId);
                          }
                          navigate(notification.actionUrl);
                        }}
                        className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-cyan-700"
                        title="Go to page"
                      >
                        <ExternalLink size={13} />
                        <span className="hidden sm:inline">View</span>
                      </button>
                    )}

                    {!notification.isRead ? (
                      <button
                        type="button"
                        onClick={(e) =>
                          handleMarkAsRead(notification.notificationId, e)
                        }
                        disabled={markingId === notification.notificationId}
                        className="flex items-center gap-1 rounded-lg border border-cyan-200 bg-cyan-50 px-2.5 py-1.5 text-xs font-bold text-cyan-800 transition hover:bg-cyan-100 disabled:opacity-50"
                      >
                        <Check size={14} />
                        Mark Read
                      </button>
                    ) : (
                      <span className="flex items-center gap-1 px-1 text-xs font-semibold text-emerald-600">
                        <CheckCheck size={14} />
                        Read
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={(e) => handleArchive(notification.notificationId, e)}
                      className="rounded-lg p-1.5 text-slate-300 opacity-70 transition hover:bg-slate-100 hover:text-red-600"
                      title="Archive"
                      aria-label="Archive notification"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* NOTIFICATION DETAILS MODAL */}
      <AccessibleModal
        isOpen={Boolean(selectedNotification)}
        onClose={() => setSelectedNotification(null)}
        title={selectedNotification ? selectedNotification.title : ""}
        description={selectedNotification ? `Alert #${selectedNotification.notificationId} • ${getCategory(selectedNotification)}` : ""}
        maxWidth="max-w-lg"
      >
        {selectedNotification && (
          <div className="space-y-4">
            <div className="space-y-4 rounded-xl bg-slate-50 p-4 text-xs text-slate-700">
              <div>
                <p className="font-bold uppercase tracking-wider text-slate-400">
                  Message
                </p>
                <p className="mt-1 text-sm leading-relaxed font-medium text-slate-800">
                  {selectedNotification.message}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                <div>
                  <p className="font-bold uppercase text-slate-400">Event Type</p>
                  <p className="mt-0.5 font-semibold text-slate-800">
                    {selectedNotification.type}
                  </p>
                </div>

                <div>
                  <p className="font-bold uppercase text-slate-400">Priority</p>
                  <p className="mt-0.5 font-semibold text-slate-800">
                    {selectedNotification.priority || "NORMAL"}
                  </p>
                </div>

                <div>
                  <p className="font-bold uppercase text-slate-400">Timestamp</p>
                  <p className="mt-0.5 text-slate-800">
                    {formatDate(selectedNotification.createdAt)}
                  </p>
                </div>

                {selectedNotification.actionUrl && (
                  <div>
                    <p className="font-bold uppercase text-slate-400">Action Route</p>
                    <p className="mt-0.5 text-cyan-700 font-semibold truncate">
                      {selectedNotification.actionUrl}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              {selectedNotification.actionUrl && (
                <button
                  type="button"
                  onClick={() => {
                    const url = selectedNotification.actionUrl;
                    if (!selectedNotification.isRead) {
                      handleMarkAsRead(selectedNotification.notificationId);
                    }
                    setSelectedNotification(null);
                    navigate(url);
                  }}
                  className="flex items-center gap-1.5 rounded-xl bg-cyan-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-cyan-700 focus-visible:ring-2 focus-visible:ring-cyan-600 focus-visible:outline-none"
                >
                  <ExternalLink size={14} aria-hidden="true" />
                  Go to Action
                </button>
              )}

              <button
                type="button"
                onClick={() => setSelectedNotification(null)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-cyan-600 focus-visible:outline-none"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </AccessibleModal>
    </div>
  );
}

export default AdminNotifications;
