
import { useEffect, useMemo, useState } from "react";
import {
  Search,
  RefreshCw,
  Eye,
  Mail,
  MailOpen,
  UserRound,
  CalendarDays,
  Phone,
  Trash2,
  X,
  MessageSquare,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api";

// Format date and time
const formatDateTime = (dateTime) => {
  if (!dateTime) return "Not available";

  const parsed = new Date(dateTime);

  if (Number.isNaN(parsed.getTime())) return dateTime;

  return parsed.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

function AdminContactMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [selectedMessage, setSelectedMessage] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [markingReadId, setMarkingReadId] = useState(null);

  // Fetch contact messages
  const fetchMessages = async (showLoader = true) => {
    if (showLoader) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const response = await api.get("/contact-messages");

      const messageData = response.data || [];

      const sortedMessages = [...messageData].sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
      );

      setMessages(sortedMessages);

      // Refresh currently selected message
      if (selectedMessage) {
        const updatedSelected = sortedMessages.find(
          (item) =>
            Number(item.messageId) ===
            Number(selectedMessage.messageId)
        );

        setSelectedMessage(updatedSelected || null);
      }
    } catch (error) {
      console.error("Contact messages loading error:", error);

      toast.error(
        error.response?.data?.message ||
          "Unable to load contact messages."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial fetch and automatic refresh
  useEffect(() => {
    fetchMessages();

    const interval = setInterval(() => {
      fetchMessages(false);
    }, 30000);

    return () => clearInterval(interval);

    // Initial fetch and polling only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Search and filter messages
  const filteredMessages = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return messages.filter((message) => {
      const matchesSearch = [
        message.messageId,
        message.name,
        message.email,
        message.phone,
        message.subject,
        message.message,
      ].some((value) =>
        String(value || "").toLowerCase().includes(search)
      );

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "READ" && message.isRead) ||
        (statusFilter === "UNREAD" && !message.isRead);

      return matchesSearch && matchesStatus;
    });
  }, [messages, searchTerm, statusFilter]);

  // Message statistics
  const messageCounts = useMemo(() => {
    return {
      total: messages.length,
      unread: messages.filter((item) => !item.isRead).length,
      read: messages.filter((item) => item.isRead).length,
    };
  }, [messages]);

  // Open message and mark it as read
  const handleViewMessage = async (message) => {
    if (message.isRead) {
      setSelectedMessage(message);
      return;
    }

    setMarkingReadId(message.messageId);

    try {
      const response = await api.patch(
        `/contact-messages/${message.messageId}/read`
      );

      const updatedMessage = response.data;

      setMessages((previous) =>
        previous.map((item) =>
          Number(item.messageId) === Number(message.messageId)
            ? updatedMessage
            : item
        )
      );

      setSelectedMessage(updatedMessage);

      toast.success("Message marked as read.");
    } catch (error) {
      console.error("Mark message as read error:", error);

      toast.error(
        error.response?.data?.message ||
          "Unable to mark message as read."
      );
    } finally {
      setMarkingReadId(null);
    }
  };

  // Delete contact message
  const handleDelete = async (message) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the message from ${message.name}? This action cannot be undone.`
    );

    if (!confirmed) return;

    setDeletingId(message.messageId);

    try {
      await api.delete(
        `/contact-messages/${message.messageId}`
      );

      setMessages((previous) =>
        previous.filter(
          (item) =>
            Number(item.messageId) !== Number(message.messageId)
        )
      );

      if (
        Number(selectedMessage?.messageId) ===
        Number(message.messageId)
      ) {
        setSelectedMessage(null);
      }

      toast.success("Contact message deleted successfully.");
    } catch (error) {
      console.error("Contact message delete error:", error);

      toast.error(
        error.response?.data?.message ||
          "Unable to delete contact message."
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">

      {/* PAGE INTRO */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Contact Messages
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            View and manage messages submitted through the website.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchMessages(false)}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-cyan-500 hover:text-cyan-700 disabled:opacity-50"
        >
          <RefreshCw
            size={17}
            className={refreshing ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid gap-4 sm:grid-cols-3">

        {[
          {
            label: "Total Messages",
            value: messageCounts.total,
            icon: MessageSquare,
            color: "bg-cyan-50 text-cyan-600",
          },
          {
            label: "Unread Messages",
            value: messageCounts.unread,
            icon: Mail,
            color: "bg-orange-50 text-orange-600",
          },
          {
            label: "Read Messages",
            value: messageCounts.read,
            icon: MailOpen,
            color: "bg-green-50 text-green-600",
          },
        ].map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    {item.label}
                  </p>

                  <p className="mt-2 text-2xl font-extrabold text-slate-900">
                    {loading ? "..." : item.value}
                  </p>
                </div>

                <div className={`rounded-xl p-3 ${item.color}`}>
                  <Icon size={22} />
                </div>
              </div>
            </div>
          );
        })}

      </div>

      {/* SEARCH AND FILTER */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">

        <div className="flex flex-col gap-4 md:flex-row">

          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search name, email, subject or message..."
              className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-cyan-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Messages</option>
            <option value="UNREAD">Unread</option>
            <option value="READ">Read</option>
          </select>

        </div>

        <p className="mt-3 text-xs text-slate-500">
          Showing {filteredMessages.length} of {messages.length} messages
        </p>
      </div>

      {/* CONTACT MESSAGES TABLE */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">

        <div className="border-b border-slate-100 p-5">
          <h3 className="font-bold text-slate-900">
            All Contact Messages
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Messages received from website visitors.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-left">

            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-4">Message ID</th>
                <th className="px-5 py-4">Sender</th>
                <th className="px-5 py-4">Subject</th>
                <th className="px-5 py-4">Received</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">

              {loading ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-5 py-12 text-center text-sm text-slate-500"
                  >
                    Loading contact messages...
                  </td>
                </tr>
              ) : filteredMessages.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-5 py-12 text-center text-sm text-slate-500"
                  >
                    No contact messages found.
                  </td>
                </tr>
              ) : (
                filteredMessages.map((message) => (
                  <tr
                    key={message.messageId}
                    className={`transition hover:bg-slate-50 ${
                      !message.isRead ? "bg-cyan-50/30" : ""
                    }`}
                  >

                    <td className="px-5 py-4 text-sm font-bold text-cyan-700">
                      #{message.messageId}
                    </td>

                    <td className="px-5 py-4">
                      <p className={`text-sm text-slate-800 ${
                        !message.isRead ? "font-bold" : "font-semibold"
                      }`}>
                        {message.name}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {message.email}
                      </p>
                    </td>

                    <td className="max-w-xs px-5 py-4">
                      <p className="truncate text-sm font-medium text-slate-700">
                        {message.subject || "No subject"}
                      </p>

                      <p className="mt-1 truncate text-xs text-slate-400">
                        {message.message}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {formatDateTime(message.createdAt)}
                    </td>

                    <td className="px-5 py-4">
                      {message.isRead ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
                          <CheckCircle size={13} />
                          Read
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700">
                          <AlertCircle size={13} />
                          Unread
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">

                        <button
                          type="button"
                          title="View message"
                          disabled={markingReadId === message.messageId}
                          onClick={() => handleViewMessage(message)}
                          className="rounded-lg bg-cyan-50 p-2 text-cyan-700 transition hover:bg-cyan-100 disabled:opacity-50"
                        >
                          <Eye size={17} />
                        </button>

                        <button
                          type="button"
                          title="Delete message"
                          disabled={deletingId === message.messageId}
                          onClick={() => handleDelete(message)}
                          className="rounded-lg bg-red-50 p-2 text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                        >
                          <Trash2 size={17} />
                        </button>

                      </div>
                    </td>

                  </tr>
                ))
              )}

            </tbody>
          </table>
        </div>
      </div>

      {/* MESSAGE DETAILS MODAL */}
      {selectedMessage && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-slate-900/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedMessage(null);
            }
          }}
        >
          <div className="my-auto w-full max-w-xl rounded-2xl bg-white shadow-2xl">

            {/* MODAL HEADER */}
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Message Details
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Message #{selectedMessage.messageId}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedMessage(null)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Close message details"
              >
                <X size={20} />
              </button>
            </div>

            {/* MODAL BODY */}
            <div className="space-y-5 p-5">

              <div className="grid gap-4 sm:grid-cols-2">

                <div className="rounded-xl bg-slate-50 p-4">
                  <UserRound className="mb-2 text-cyan-600" size={20} />

                  <p className="text-xs text-slate-500">
                    Sender Name
                  </p>

                  <p className="mt-1 font-semibold text-slate-800">
                    {selectedMessage.name}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <Mail className="mb-2 text-cyan-600" size={20} />

                  <p className="text-xs text-slate-500">
                    Email Address
                  </p>

                  <a
                    href={`mailto:${selectedMessage.email}`}
                    className="mt-1 block break-all font-semibold text-cyan-700 hover:underline"
                  >
                    {selectedMessage.email}
                  </a>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <Phone className="mb-2 text-cyan-600" size={20} />

                  <p className="text-xs text-slate-500">
                    Phone Number
                  </p>

                  <p className="mt-1 font-semibold text-slate-800">
                    {selectedMessage.phone || "Not provided"}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <CalendarDays className="mb-2 text-cyan-600" size={20} />

                  <p className="text-xs text-slate-500">
                    Received On
                  </p>

                  <p className="mt-1 font-semibold text-slate-800">
                    {formatDateTime(selectedMessage.createdAt)}
                  </p>
                </div>

              </div>

              <div>
                <p className="mb-2 text-sm font-semibold text-slate-700">
                  Subject
                </p>

                <div className="rounded-xl bg-slate-50 p-4 text-sm font-medium text-slate-800">
                  {selectedMessage.subject || "No subject provided"}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold text-slate-700">
                  Message
                </p>

                <div className="max-h-60 overflow-y-auto whitespace-pre-wrap break-words rounded-xl bg-slate-50 p-4 text-sm leading-7 text-slate-600">
                  {selectedMessage.message}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {selectedMessage.isRead ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
                    <CheckCircle size={14} />
                    Read
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700">
                    <AlertCircle size={14} />
                    Unread
                  </span>
                )}
              </div>

            </div>

            {/* MODAL FOOTER */}
            <div className="flex flex-col-reverse justify-between gap-3 border-t border-slate-100 p-5 sm:flex-row">

              <button
                type="button"
                onClick={() => handleDelete(selectedMessage)}
                disabled={deletingId === selectedMessage.messageId}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
              >
                <Trash2 size={16} />
                Delete Message
              </button>

              <button
                type="button"
                onClick={() => setSelectedMessage(null)}
                className="rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-700"
              >
                Close
              </button>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default AdminContactMessages;
