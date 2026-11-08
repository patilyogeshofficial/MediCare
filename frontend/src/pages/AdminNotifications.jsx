
import { useCallback, useEffect, useMemo, useState } from "react";
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
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api";

function AdminNotifications() {
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

  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Mark notification as read
  const handleMarkAsRead = async (notificationId) => {
    try {
      setMarkingId(notificationId);

      await api.patch(
        `/admin/notifications/${notificationId}/read`
      );

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

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    const unreadNotifications = notifications.filter(
      (notification) => !notification.isRead
    );

    if (unreadNotifications.length === 0) {
      toast("No unread notifications.");
      return;
    }

    try {
      await Promise.all(
        unreadNotifications.map((notification) =>
          api.patch(
            `/admin/notifications/${notification.notificationId}/read`
          )
        )
      );

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

      await fetchNotifications();
      toast.error("Some notifications could not be updated.");
    }
  };

  // Notification category
  const getCategory = (type) => {
    switch (type) {
      case "NEW_APPOINTMENT":
      case "APPOINTMENT_BOOKED":
      case "APPOINTMENT_CONFIRMED":
      case "APPOINTMENT_REJECTED":
      case "APPOINTMENT_CANCELLED":
      case "APPOINTMENT_COMPLETED":
        return "APPOINTMENT";

      case "NEW_CONTACT_MESSAGE":
        return "CONTACT";

      case "NEW_PRESCRIPTION":
      case "PRESCRIPTION_CREATED":
        return "PRESCRIPTION";

      default:
        return "OTHER";
    }
  };

  const getNotificationIcon = (type) => {
    switch (getCategory(type)) {
      case "APPOINTMENT":
        return CalendarDays;
      case "CONTACT":
        return Mail;
      case "PRESCRIPTION":
        return FileText;
      default:
        return Bell;
    }
  };

  const getNotificationStyle = (type) => {
    switch (getCategory(type)) {
      case "APPOINTMENT":
        return "bg-blue-50 text-blue-600";
      case "CONTACT":
        return "bg-purple-50 text-purple-600";
      case "PRESCRIPTION":
        return "bg-cyan-50 text-cyan-700";
      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  // Date formatting
  const formatDate = (date) => {
    if (!date) return "Date unavailable";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Date unavailable";
    }

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
      const category = getCategory(notification.type);

      const matchesFilter =
        activeFilter === "ALL" ||
        (activeFilter === "UNREAD" && !notification.isRead) ||
        category === activeFilter;

      const matchesSearch =
        !search ||
        [
          notification.title,
          notification.message,
          notification.type,
          notification.notificationId,
          notification.appointmentId,
          notification.prescriptionId,
        ].some((value) =>
          String(value ?? "").toLowerCase().includes(search)
        );

      return matchesFilter && matchesSearch;
    });
  }, [notifications, activeFilter, searchTerm]);

  const filterOptions = [
    { label: "All", value: "ALL" },
    { label: "Unread", value: "UNREAD" },
    { label: "Appointments", value: "APPOINTMENT" },
    { label: "Messages", value: "CONTACT" },
    { label: "Prescriptions", value: "PRESCRIPTION" },
  ];

  const handleNotificationClick = (notification) => {
    setSelectedNotification(notification);

    if (!notification.isRead) {
      handleMarkAsRead(notification.notificationId);
    }
  };

  return (
    <div className="space-y-6">

      {/* PAGE HEADER */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Notifications
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Stay updated with your hospital activities.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => fetchNotifications(true)}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-cyan-300 hover:text-cyan-700 disabled:opacity-50"
          >
            <RefreshCw
              size={17}
              className={refreshing ? "animate-spin" : ""}
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
            className="flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CheckCheck size={17} />
            Mark all as read
          </button>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Total Notifications
              </p>
              <h3 className="mt-2 text-3xl font-extrabold text-slate-900">
                {notifications.length}
              </h3>
            </div>
            <div className="rounded-xl bg-cyan-50 p-3 text-cyan-600">
              <Bell size={24} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Unread Notifications
              </p>
              <h3 className="mt-2 text-3xl font-extrabold text-orange-600">
                {unreadCount}
              </h3>
            </div>
            <div className="rounded-xl bg-orange-50 p-3 text-orange-600">
              <Inbox size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* FILTERS AND SEARCH */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">

          <div className="flex flex-wrap gap-2">
            {filterOptions.map((filter) => (
              <button
                type="button"
                key={filter.value}
                onClick={() => setActiveFilter(filter.value)}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  activeFilter === filter.value
                    ? "bg-cyan-600 text-white"
                    : "bg-slate-50 text-slate-600 hover:bg-cyan-50 hover:text-cyan-700"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="relative w-full lg:w-72">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search notifications..."
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-cyan-500"
            />
          </div>
        </div>
      </div>

      {/* NOTIFICATION LIST */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">

        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Notification History
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {filteredNotifications.length} notification(s) found
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-sm text-slate-500">
            <RefreshCw size={25} className="mx-auto mb-3 animate-spin text-cyan-600" />
            Loading notifications...
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <Inbox size={30} />
            </div>

            <h3 className="font-bold text-slate-800">
              No notifications found
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              New hospital activity notifications will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredNotifications.map((notification) => {
              const Icon = getNotificationIcon(notification.type);

              return (
                <div
                  key={notification.notificationId}
                  className={`flex flex-col gap-4 p-5 transition hover:bg-slate-50 sm:flex-row sm:items-start ${
                    !notification.isRead ? "bg-cyan-50/30" : ""
                  }`}
                >
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${getNotificationStyle(
                      notification.type
                    )}`}
                  >
                    <Icon size={22} />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleNotificationClick(notification)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold text-slate-800">
                        {notification.title}
                      </h4>

                      {!notification.isRead && (
                        <span className="rounded-full bg-cyan-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-cyan-700">
                          New
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      {notification.message}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock size={13} />
                        {formatDate(notification.createdAt)}
                      </span>

                      {notification.appointmentId && (
                        <span>
                          Appointment #{notification.appointmentId}
                        </span>
                      )}

                      {notification.prescriptionId && (
                        <span>
                          Prescription #{notification.prescriptionId}
                        </span>
                      )}
                    </div>
                  </button>

                  <div className="flex shrink-0 items-center gap-2">
                    {!notification.isRead ? (
                      <button
                        type="button"
                        onClick={() =>
                          handleMarkAsRead(notification.notificationId)
                        }
                        disabled={markingId === notification.notificationId}
                        className="flex items-center gap-2 rounded-lg border border-cyan-200 px-3 py-2 text-xs font-semibold text-cyan-700 transition hover:bg-cyan-50 disabled:opacity-50"
                      >
                        <Check size={15} />
                        Mark read
                      </button>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-semibold text-green-600">
                        <CheckCheck size={15} />
                        Read
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* NOTIFICATION DETAILS MODAL */}
      {selectedNotification && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4"
          onClick={() => setSelectedNotification(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className={`rounded-xl p-3 ${getNotificationStyle(
                    selectedNotification.type
                  )}`}
                >
                  {(() => {
                    const Icon = getNotificationIcon(selectedNotification.type);
                    return <Icon size={22} />;
                  })()}
                </div>

                <div>
                  <h3 className="font-bold text-slate-900">
                    {selectedNotification.title}
                  </h3>
                  <p className="mt-1 text-xs text-slate-400">
                    Notification #{selectedNotification.notificationId}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedNotification(null)}
                className="rounded-lg px-3 py-1 text-xl text-slate-400 hover:bg-slate-100"
                aria-label="Close notification details"
              >
                ×
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <p className="text-xs font-bold uppercase text-slate-400">
                  Message
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {selectedNotification.message}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase text-slate-400">
                  Notification Type
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-700">
                  {selectedNotification.type}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase text-slate-400">
                  Received
                </p>
                <p className="mt-1 text-sm text-slate-700">
                  {formatDate(selectedNotification.createdAt)}
                </p>
              </div>

              {selectedNotification.appointmentId && (
                <p className="text-sm text-slate-700">
                  Appointment ID: #{selectedNotification.appointmentId}
                </p>
              )}

              {selectedNotification.prescriptionId && (
                <p className="text-sm text-slate-700">
                  Prescription ID: #{selectedNotification.prescriptionId}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSelectedNotification(null)}
              className="mt-7 w-full rounded-xl bg-cyan-600 py-3 text-sm font-bold text-white transition hover:bg-cyan-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminNotifications;
