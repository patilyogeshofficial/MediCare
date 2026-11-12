import { useState, useEffect, useMemo, useId } from "react";
import {
  BarChart3,
  TrendingUp,
  PieChart,
  Users,
  Stethoscope,
  CalendarDays,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Download,
  Filter,
  RefreshCw,
  AlertCircle,
  Calendar,
  DollarSign,
  Activity,
  Award,
  ChevronRight,
  Search,
  ArrowUpRight,
  Sparkles,
  Info,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api";

const FILTER_PRESETS = [
  { id: "TODAY", label: "Today" },
  { id: "LAST_7_DAYS", label: "Last 7 Days" },
  { id: "LAST_30_DAYS", label: "Last 30 Days" },
  { id: "THIS_MONTH", label: "This Month" },
  { id: "ALL_TIME", label: "All Time" },
  { id: "CUSTOM", label: "Custom Range" },
];

const STATUS_COLORS = {
  CONFIRMED: { bg: "bg-emerald-500", text: "text-emerald-700", light: "bg-emerald-50", stroke: "#10b981" },
  PENDING: { bg: "bg-amber-500", text: "text-amber-700", light: "bg-amber-50", stroke: "#f59e0b" },
  COMPLETED: { bg: "bg-cyan-500", text: "text-cyan-700", light: "bg-cyan-50", stroke: "#06b6d4" },
  CANCELLED: { bg: "bg-rose-500", text: "text-rose-700", light: "bg-rose-50", stroke: "#f43f5e" },
  REJECTED: { bg: "bg-slate-500", text: "text-slate-700", light: "bg-slate-100", stroke: "#64748b" },
};

export default function AdminAnalytics() {
  const [selectedFilter, setSelectedFilter] = useState("LAST_30_DAYS");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [activeTab, setActiveTab] = useState("overview"); // 'overview', 'doctors', 'specializations', 'patients', 'reports'

  // Reports state & server-side pagination
  const [selectedReport, setSelectedReport] = useState("appointments"); // 'appointments', 'patients', 'doctors', 'specializations'
  const [reportData, setReportData] = useState([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportSearch, setReportSearch] = useState("");
  const [exporting, setExporting] = useState(false);

  // Pagination states
  const [reportPage, setReportPage] = useState(0);
  const [reportPageSize, setReportPageSize] = useState(20);
  const [totalReportElements, setTotalReportElements] = useState(0);
  const [totalReportPages, setTotalReportPages] = useState(1);

  // SVG Unique Gradient IDs
  const trendGradientId = useId();

  // Fetch Dashboard Analytics
  const fetchAnalytics = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const params = { filter: selectedFilter };
      if (selectedFilter === "CUSTOM") {
        if (!customStartDate || !customEndDate) {
          toast.error("Please select both start and end dates for custom filter.");
          setLoading(false);
          setRefreshing(false);
          return;
        }
        params.startDate = customStartDate;
        params.endDate = customEndDate;
      }

      const res = await api.get("/admin/analytics/dashboard", { params });
      setAnalyticsData(res.data);
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
      toast.error(err.response?.data?.message || "Failed to load analytics data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (selectedFilter !== "CUSTOM") {
      fetchAnalytics();
    }
  }, [selectedFilter]);

  // Fetch Detailed Report with Server-Side Pagination
  const fetchReportData = async () => {
    setReportLoading(true);
    try {
      const params = {
        filter: selectedFilter,
        page: reportPage,
        size: reportPageSize,
      };
      if (selectedFilter === "CUSTOM" && customStartDate && customEndDate) {
        params.startDate = customStartDate;
        params.endDate = customEndDate;
      }

      let endpoint = `/admin/analytics/reports/${selectedReport}`;
      const res = await api.get(endpoint, { params });

      if (res.data && res.data.content) {
        // Paginated response
        setReportData(res.data.content);
        setTotalReportElements(res.data.totalElements || 0);
        setTotalReportPages(res.data.totalPages || 1);
      } else if (Array.isArray(res.data)) {
        // List response
        setReportData(res.data);
        setTotalReportElements(res.data.length);
        setTotalReportPages(1);
      } else {
        setReportData([]);
        setTotalReportElements(0);
        setTotalReportPages(1);
      }
    } catch (err) {
      console.error("Failed to load report data:", err);
      toast.error("Unable to load report data.");
    } finally {
      setReportLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "reports") {
      fetchReportData();
    }
  }, [activeTab, selectedReport, selectedFilter, reportPage, reportPageSize]);

  // Reset page when report category or filter changes
  useEffect(() => {
    setReportPage(0);
  }, [selectedReport, selectedFilter]);

  // Export CSV Handler
  const handleExportCsv = async (reportType = selectedReport) => {
    setExporting(true);
    const toastId = toast.loading(`Preparing ${reportType.toUpperCase()} CSV export...`);
    try {
      const params = { filter: selectedFilter };
      if (selectedFilter === "CUSTOM" && customStartDate && customEndDate) {
        params.startDate = customStartDate;
        params.endDate = customEndDate;
      }

      const res = await api.get(`/admin/analytics/export/${reportType}`, {
        params,
        responseType: "blob",
      });

      const blob = new Blob([res.data], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const dateStr = new Date().toISOString().split("T")[0];
      link.href = url;
      link.setAttribute("download", `medicare_${reportType}_report_${dateStr}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success(`${reportType.toUpperCase()} CSV exported successfully!`, { id: toastId });
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Failed to export report CSV.", { id: toastId });
    } finally {
      setExporting(false);
    }
  };

  const overview = analyticsData?.overview || {};

  // Formatted currency helper
  const formatCurrency = (val) => {
    const num = Number(val || 0);
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  // Filtered report items based on search term for active page
  const filteredReportData = useMemo(() => {
    if (!reportSearch.trim()) return reportData;
    const q = reportSearch.toLowerCase();
    return reportData.filter((item) =>
      Object.values(item).some((val) => String(val || "").toLowerCase().includes(q))
    );
  }, [reportData, reportSearch]);

  return (
    <div className="space-y-8 pb-12">
      {/* 1. HEADER & CONTROL BAR */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-500/20">
              <BarChart3 size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                Admin Analytics & Reports
              </h1>
              <p className="text-sm font-medium text-slate-500">
                Database-derived metrics, clinical activity, and administrative intelligence
              </p>
            </div>
          </div>
        </div>

        {/* CONTROLS */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => fetchAnalytics(true)}
            disabled={loading || refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-50 active:scale-95 disabled:opacity-50"
            title="Refresh analytics data"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin text-cyan-600" : "text-slate-500"} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>

          {/* EXPORT DROPDOWN */}
          <div className="relative inline-block text-left">
            <button
              type="button"
              onClick={() => handleExportCsv(selectedReport)}
              disabled={exporting}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-cyan-600/20 transition hover:bg-cyan-700 active:scale-95 disabled:opacity-50"
            >
              <Download size={14} />
              {exporting ? "Exporting..." : `Export ${selectedReport.toUpperCase()} CSV`}
            </button>
          </div>
        </div>
      </div>

      {/* 2. DATE-RANGE FILTER SELECTOR */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            <Filter size={15} className="text-cyan-600" />
            <span>Time Horizon:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {FILTER_PRESETS.map((preset) => {
              const isActive = selectedFilter === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setSelectedFilter(preset.id)}
                  aria-pressed={isActive}
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600 ${
                    isActive
                      ? "bg-cyan-600 text-white shadow-xs shadow-cyan-600/20"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* CUSTOM DATE RANGE PICKER INPUTS */}
        {selectedFilter === "CUSTOM" && (
          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
            <div className="flex items-center gap-2">
              <label htmlFor="analytics-custom-start" className="text-xs font-bold text-slate-500">
                From:
              </label>
              <input
                id="analytics-custom-start"
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-800 focus:border-cyan-500 focus:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600"
              />
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="analytics-custom-end" className="text-xs font-bold text-slate-500">
                To:
              </label>
              <input
                id="analytics-custom-end"
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-800 focus:border-cyan-500 focus:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600"
              />
            </div>
            <button
              type="button"
              onClick={() => fetchAnalytics(false)}
              className="rounded-xl bg-slate-900 px-4 py-1.5 text-xs font-bold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600"
            >
              Apply Filter
            </button>
            {analyticsData?.startDate && (
              <span className="text-xs font-medium text-slate-400">
                Active Range: {analyticsData.startDate} to {analyticsData.endDate}
              </span>
            )}
          </div>
        )}
      </div>

      {/* 3. TRANSPARENCY NOTICE - FINANCIAL / OPERATIONAL DISCLAIMER */}
      <div className="flex items-start gap-3.5 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50/90 to-orange-50/50 p-4 text-amber-900">
        <Info size={20} className="mt-0.5 shrink-0 text-amber-600" />
        <div className="text-xs leading-relaxed">
          <p className="font-bold text-amber-950">
            Financial Transparency & Operational Notice:
          </p>
          <p className="mt-0.5 text-amber-800">
            MediCare Plus does not have an integrated payment gateway or verified payment transaction records.
            Values labeled as <span className="font-bold">Estimated Consultation Value</span> are derived from published doctor fee schedules.
            Actual collected revenue tracking is unavailable.
          </p>
        </div>
      </div>

      {/* 4. OVERVIEW STAT CARDS - DISTINCT ALL-TIME VS PERIOD LABELS */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Patients (All-time) */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Registered Patients
            </span>
            <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
              <Users size={20} />
            </div>
          </div>
          <p className="mt-3 text-3xl font-black text-slate-900">
            {loading ? "..." : Number(overview.totalPatients || 0).toLocaleString("en-IN")}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
            <span>All-Time Patient Registry</span>
          </div>
        </div>

        {/* Card 2: Doctors (All-time) */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Doctors
            </span>
            <div className="rounded-xl bg-cyan-50 p-2.5 text-cyan-600">
              <Stethoscope size={20} />
            </div>
          </div>
          <p className="mt-3 text-3xl font-black text-slate-900">
            {loading ? "..." : Number(overview.totalDoctors || 0).toLocaleString("en-IN")}
          </p>
          <div className="mt-2 flex items-center gap-2 text-xs font-semibold">
            <span className="text-emerald-600">
              {loading ? "..." : overview.activeDoctors} Active
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-400">
              {loading ? "..." : overview.inactiveDoctors} Inactive
            </span>
          </div>
        </div>

        {/* Card 3: Appointments (Selected Period) */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Appointments
            </span>
            <div className="rounded-xl bg-purple-50 p-2.5 text-purple-600">
              <CalendarDays size={20} />
            </div>
          </div>
          <p className="mt-3 text-3xl font-black text-slate-900">
            {loading ? "..." : Number(overview.totalAppointments || 0).toLocaleString("en-IN")}
          </p>
          <div className="mt-2 flex items-center gap-2 text-xs font-semibold">
            <span className="text-emerald-600">{overview.completedAppointments || 0} Completed</span>
            <span className="text-slate-300">•</span>
            <span className="text-amber-600">{overview.pendingAppointments || 0} Pending</span>
          </div>
        </div>

        {/* Card 4: Prescriptions (Selected Period) */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Prescriptions Issued
            </span>
            <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
              <FileText size={20} />
            </div>
          </div>
          <p className="mt-3 text-3xl font-black text-slate-900">
            {loading ? "..." : Number(overview.totalPrescriptions || 0).toLocaleString("en-IN")}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
            <CheckCircle size={13} />
            <span>Issued in Selected Period</span>
          </div>
        </div>
      </div>

      {/* 5. SECONDARY METRICS: OPERATIONAL & ESTIMATED CONSULTATION VALUE */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Completed Value */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Estimated Completed Value
          </span>
          <p className="mt-2 text-2xl font-black text-emerald-600">
            {loading ? "..." : formatCurrency(overview.completedConsultationsValue)}
          </p>
          <p className="mt-1 text-[11px] font-medium text-slate-400">
            From {overview.completedAppointments || 0} completed consultations in period
          </p>
        </div>

        {/* Estimated Value (Booked) */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Estimated Booked Value
          </span>
          <p className="mt-2 text-2xl font-black text-cyan-700">
            {loading ? "..." : formatCurrency(overview.estimatedConsultationValue)}
          </p>
          <p className="mt-1 text-[11px] font-medium text-slate-400">
            Confirmed + Completed consultations in period
          </p>
        </div>

        {/* Average Consultation Fee */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Avg. Consultation Fee
          </span>
          <p className="mt-2 text-2xl font-black text-slate-800">
            {loading ? "..." : formatCurrency(overview.averageDoctorFee)}
          </p>
          <p className="mt-1 text-[11px] font-medium text-slate-400">
            Across registered medical specialists
          </p>
        </div>

        {/* Cancelled & Rejected Appointments */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Cancelled & Rejected Appointments
          </span>
          <p className="mt-2 text-2xl font-black text-rose-600">
            {loading
              ? "..."
              : Number(
                  (overview.cancelledAppointments || 0) + (overview.rejectedAppointments || 0)
                ).toLocaleString("en-IN")}
          </p>
          <p className="mt-1 text-[11px] font-medium text-slate-400">
            {overview.cancelledAppointments || 0} Cancelled • {overview.rejectedAppointments || 0} Rejected in period
          </p>
        </div>
      </div>

      {/* 6. TAB NAVIGATION */}
      <div className="border-b border-slate-200">
        <nav role="tablist" aria-label="Analytics sections" className="-mb-px flex flex-wrap gap-2 sm:gap-6">
          {[
            { id: "overview", label: "Appointment Analytics", icon: Activity },
            { id: "doctors", label: "Doctor Performance", icon: Stethoscope },
            { id: "specializations", label: "Specializations", icon: Award },
            { id: "patients", label: "Patient Demographics", icon: Users },
            { id: "reports", label: "Reports & CSV Export", icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`group inline-flex items-center gap-2 border-b-2 py-3 px-1 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600 ${
                  isActive
                    ? "border-cyan-600 text-cyan-600"
                    : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
                }`}
              >
                <Icon size={17} className={isActive ? "text-cyan-600" : "text-slate-400 group-hover:text-slate-500"} aria-hidden="true" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* 7. TAB CONTENT SECTIONS */}

      {/* TAB 1: APPOINTMENT ANALYTICS & TRENDS */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Appointment Trend Chart (2 Cols) */}
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xs lg:col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Daily Appointment Volume (in Selected Period)
                  </h3>
                  <p className="text-xs font-medium text-slate-500">
                    Daily scheduled, completed and cancelled consultations
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs font-semibold">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-cyan-500" />
                    <span className="text-slate-600">Total</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    <span className="text-slate-600">Completed</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                    <span className="text-slate-600">Cancelled</span>
                  </div>
                </div>
              </div>

              {/* SVG Trend Graph */}
              <div className="mt-6 h-64 w-full">
                {analyticsData?.appointmentTrends?.length > 0 ? (
                  <TrendAreaChart data={analyticsData.appointmentTrends} gradientId={trendGradientId} />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs font-semibold text-slate-400">
                    No appointment trend records available for this horizon.
                  </div>
                )}
              </div>
            </div>

            {/* Appointment Status Breakdown (1 Col Donut) */}
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xs">
              <h3 className="text-base font-extrabold text-slate-900">
                Status Distribution (in Selected Period)
              </h3>
              <p className="text-xs font-medium text-slate-500">
                Breakdown of {overview.totalAppointments || 0} total bookings
              </p>

              <div className="mt-4 flex flex-col items-center">
                <DonutChart data={analyticsData?.appointmentStatusBreakdown || []} total={overview.totalAppointments || 0} />
              </div>

              {/* Status List */}
              <div className="mt-6 space-y-2.5">
                {(analyticsData?.appointmentStatusBreakdown || []).map((item) => {
                  const style = STATUS_COLORS[item.status] || STATUS_COLORS.REJECTED;
                  return (
                    <div
                      key={item.status}
                      className="flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-2 text-xs font-semibold"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${style.bg}`} />
                        <span className="text-slate-700">{item.status}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-900">{item.count}</span>
                        <span className="w-10 text-right text-slate-400">{item.percentage}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DOCTOR PERFORMANCE & WORKLOAD */}
      {activeTab === "doctors" && (
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xs">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Doctor Workload & Completion (in Selected Period)
              </h3>
              <p className="text-xs font-medium text-slate-500">
                Individual consultation volume, completion rates, and estimated value generated
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleExportCsv("doctors")}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              <Download size={13} />
              Export Doctor Workload CSV
            </button>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="pb-3 pl-2">Doctor Name</th>
                  <th className="pb-3">Specialization</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-center">Fee</th>
                  <th className="pb-3 text-center">Total Bookings</th>
                  <th className="pb-3 text-center">Completed</th>
                  <th className="pb-3 text-center">Cancelled</th>
                  <th className="pb-3 text-center">Completion Rate</th>
                  <th className="pb-3 text-right pr-2">Est. Completed Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {(analyticsData?.doctorWorkloads || []).length === 0 ? (
                  <tr>
                    <td colSpan="9" className="py-8 text-center text-slate-400">
                      No doctor records found.
                    </td>
                  </tr>
                ) : (
                  (analyticsData?.doctorWorkloads || []).map((doc) => (
                    <tr key={doc.doctorId} className="transition hover:bg-slate-50/80">
                      <td className="py-3.5 pl-2 font-bold text-slate-900">
                        {doc.doctorName}
                        <span className="block text-[10px] font-normal text-slate-400">
                          Lic: {doc.licenseNumber || "N/A"}
                        </span>
                      </td>
                      <td className="py-3.5 font-medium text-slate-600">
                        {doc.specializationName}
                      </td>
                      <td className="py-3.5">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            doc.active
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {doc.active ? "ACTIVE" : "INACTIVE"}
                        </span>
                      </td>
                      <td className="py-3.5 text-center font-semibold text-slate-800">
                        {formatCurrency(doc.consultationFee)}
                      </td>
                      <td className="py-3.5 text-center font-extrabold text-slate-900">
                        {doc.totalAppointments}
                      </td>
                      <td className="py-3.5 text-center font-semibold text-emerald-600">
                        {doc.completedAppointments}
                      </td>
                      <td className="py-3.5 text-center font-semibold text-rose-600">
                        {doc.cancelledAppointments}
                      </td>
                      <td className="py-3.5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="h-2 w-16 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-cyan-600"
                              style={{ width: `${Math.min(100, doc.completionRate)}%` }}
                            />
                          </div>
                          <span className="w-9 font-bold text-slate-700">{doc.completionRate}%</span>
                        </div>
                      </td>
                      <td className="py-3.5 pr-2 text-right font-black text-slate-900">
                        {formatCurrency(doc.estimatedValue)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SPECIALIZATIONS */}
      {activeTab === "specializations" && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Top Booked Specializations */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xs">
            <h3 className="text-base font-extrabold text-slate-900">
              Specialization Utilization (in Selected Period)
            </h3>
            <p className="text-xs font-medium text-slate-500">
              Distribution of consultations across clinical disciplines
            </p>

            <div className="mt-6 space-y-4">
              {(analyticsData?.specializationAnalytics || []).length === 0 ? (
                <p className="py-8 text-center text-xs text-slate-400">
                  No specialization data available.
                </p>
              ) : (
                (analyticsData?.specializationAnalytics || []).map((spec) => (
                  <div key={spec.specializationId} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-800">{spec.specializationName}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-400 font-normal">{spec.doctorCount} Doctors</span>
                        <span className="text-cyan-700">{spec.appointmentCount} Bookings ({spec.percentageOfTotal}%)</span>
                      </div>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600"
                        style={{ width: `${Math.min(100, Math.max(spec.percentageOfTotal, 2))}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Specialization Breakdown Table */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Specialization Department Roster
                </h3>
                <p className="text-xs font-medium text-slate-500">
                  Clinical department details
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleExportCsv("specializations")}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                <Download size={13} />
                Export CSV
              </button>
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="pb-2.5">Department</th>
                    <th className="pb-2.5 text-center">Doctors</th>
                    <th className="pb-2.5 text-center">Appointments</th>
                    <th className="pb-2.5 text-center">Completed</th>
                    <th className="pb-2.5 text-right">Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(analyticsData?.specializationAnalytics || []).map((spec) => (
                    <tr key={spec.specializationId} className="hover:bg-slate-50">
                      <td className="py-3 font-bold text-slate-800">{spec.specializationName}</td>
                      <td className="py-3 text-center font-semibold text-slate-700">{spec.doctorCount}</td>
                      <td className="py-3 text-center font-extrabold text-slate-900">{spec.appointmentCount}</td>
                      <td className="py-3 text-center font-semibold text-emerald-600">{spec.completedCount}</td>
                      <td className="py-3 text-right font-bold text-cyan-700">{spec.percentageOfTotal}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PATIENT DEMOGRAPHICS (AGGREGATE DATABASE CALCULATIONS) */}
      {activeTab === "patients" && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Gender Distribution */}
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xs">
              <h3 className="text-base font-extrabold text-slate-900">
                Gender Demographics
              </h3>
              <p className="text-xs font-medium text-slate-500">
                Aggregated distribution across registered patients
              </p>

              <div className="mt-5 space-y-3">
                {(analyticsData?.patientAnalytics?.genderDistribution || []).map((item) => (
                  <div key={item.category} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span>{item.category}</span>
                      <span>{item.count} ({item.percentage}%)</span>
                    </div>
                    <div
                      role="progressbar"
                      aria-valuenow={item.count}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${item.category}: ${item.count} patients (${item.percentage}%)`}
                      className="h-2 w-full overflow-hidden rounded-full bg-slate-100"
                    >
                      <div
                        className="h-full rounded-full bg-blue-500"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Blood Group Distribution */}
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xs">
              <h3 className="text-base font-extrabold text-slate-900">
                Blood Group Breakdown
              </h3>
              <p className="text-xs font-medium text-slate-500">
                Aggregated patient blood profiles
              </p>

              <div className="mt-5 grid grid-cols-2 gap-2.5">
                {(analyticsData?.patientAnalytics?.bloodGroupDistribution || []).map((bg) => (
                  <div
                    key={bg.category}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/80 p-3"
                  >
                    <div>
                      <p className="text-xs font-extrabold text-slate-900">{bg.category}</p>
                      <p className="text-[10px] text-slate-400">{bg.percentage}%</p>
                    </div>
                    <span className="rounded-lg bg-white px-2 py-1 text-xs font-black text-rose-600 shadow-xs">
                      {bg.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Age Cohort Distribution */}
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xs">
              <h3 className="text-base font-extrabold text-slate-900">
                Age Brackets
              </h3>
              <p className="text-xs font-medium text-slate-500">
                PostgreSQL database-aggregated age cohorts
              </p>

              <div className="mt-5 space-y-3">
                {(analyticsData?.patientAnalytics?.ageDistribution || []).map((cohort) => (
                  <div key={cohort.category} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span>{cohort.category}</span>
                      <span>{cohort.count} ({cohort.percentage}%)</span>
                    </div>
                    <div
                      role="progressbar"
                      aria-valuenow={cohort.count}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${cohort.category}: ${cohort.count} patients (${cohort.percentage}%)`}
                      className="h-2 w-full overflow-hidden rounded-full bg-slate-100"
                    >
                      <div
                        className="h-full rounded-full bg-purple-500"
                        style={{ width: `${cohort.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: REPORTS & DATA EXPORT WITH SERVER-SIDE PAGINATION */}
      {activeTab === "reports" && (
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xs space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-black text-slate-900">
                Administrative Report Center
              </h3>
              <p className="text-xs font-medium text-slate-500">
                Server-paginated administrative datasets with privacy-safe export
              </p>
            </div>

            {/* Report Category Selector */}
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: "appointments", label: "Appointments" },
                { id: "patients", label: "Patient Registry" },
                { id: "doctors", label: "Doctor Performance" },
                { id: "specializations", label: "Specializations" },
              ].map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedReport(r.id)}
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                    selectedReport === r.id
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* SEARCH & EXPORT ACTION BAR */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={reportSearch}
                onChange={(e) => setReportSearch(e.target.value)}
                placeholder={`Search on current page of ${selectedReport}...`}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-cyan-500 focus:bg-white focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={() => handleExportCsv(selectedReport)}
              disabled={exporting || totalReportElements === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-cyan-700 active:scale-95 disabled:opacity-50"
            >
              <Download size={14} />
              {exporting ? "Generating CSV..." : `Download ${selectedReport.toUpperCase()} CSV (${totalReportElements})`}
            </button>
          </div>

          {/* TABULAR REPORT PREVIEW */}
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            {reportLoading ? (
              <div className="py-12 text-center text-xs font-semibold text-slate-400">
                Loading report records from database...
              </div>
            ) : filteredReportData.length === 0 ? (
              <div className="py-12 text-center text-xs font-semibold text-slate-400">
                No matching records found for this report and filter criteria.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                {/* APPOINTMENTS REPORT TABLE */}
                {selectedReport === "appointments" && (
                  <>
                    <thead className="bg-slate-50">
                      <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        <th className="py-3 px-4">ID</th>
                        <th className="py-3 px-4">Date & Time</th>
                        <th className="py-3 px-4">Patient</th>
                        <th className="py-3 px-4">Doctor</th>
                        <th className="py-3 px-4">Department</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Queue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredReportData.map((item) => (
                        <tr key={item.appointmentId} className="hover:bg-slate-50/80">
                          <td className="py-3 px-4 font-bold text-cyan-700">#{item.appointmentId}</td>
                          <td className="py-3 px-4 text-slate-600">
                            {item.appointmentDate} <span className="text-slate-400">at {item.appointmentTime}</span>
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-900">{item.patientName}</td>
                          <td className="py-3 px-4 text-slate-700">{item.doctorName}</td>
                          <td className="py-3 px-4 text-slate-500">{item.specialization}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                item.status === "CONFIRMED"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : item.status === "COMPLETED"
                                  ? "bg-cyan-50 text-cyan-700"
                                  : item.status === "CANCELLED"
                                  ? "bg-rose-50 text-rose-700"
                                  : item.status === "PENDING"
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-700">
                            {item.queueNumber ? `#${item.queueNumber}` : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </>
                )}

                {/* PATIENTS REPORT TABLE */}
                {selectedReport === "patients" && (
                  <>
                    <thead className="bg-slate-50">
                      <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        <th className="py-3 px-4">Patient ID</th>
                        <th className="py-3 px-4">Name</th>
                        <th className="py-3 px-4">Email</th>
                        <th className="py-3 px-4">Phone</th>
                        <th className="py-3 px-4">Gender</th>
                        <th className="py-3 px-4">Blood Group</th>
                        <th className="py-3 px-4">Age</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredReportData.map((item) => (
                        <tr key={item.patientId} className="hover:bg-slate-50/80">
                          <td className="py-3 px-4 font-bold text-cyan-700">P-{item.patientId}</td>
                          <td className="py-3 px-4 font-bold text-slate-900">{item.fullName}</td>
                          <td className="py-3 px-4 text-slate-600">{item.email}</td>
                          <td className="py-3 px-4 text-slate-600">{item.phone || "N/A"}</td>
                          <td className="py-3 px-4 text-slate-600">{item.gender || "Unnoted"}</td>
                          <td className="py-3 px-4 font-bold text-rose-600">{item.bloodGroup || "N/A"}</td>
                          <td className="py-3 px-4 text-slate-700">{item.age != null ? `${item.age} yrs` : "-"}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                item.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {item.active ? "ACTIVE" : "INACTIVE"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </>
                )}

                {/* DOCTORS REPORT TABLE */}
                {selectedReport === "doctors" && (
                  <>
                    <thead className="bg-slate-50">
                      <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        <th className="py-3 px-4">Doctor</th>
                        <th className="py-3 px-4">Department</th>
                        <th className="py-3 px-4">License</th>
                        <th className="py-3 px-4">Fee</th>
                        <th className="py-3 px-4 text-center">Bookings</th>
                        <th className="py-3 px-4 text-center">Completed</th>
                        <th className="py-3 px-4 text-center">Rate</th>
                        <th className="py-3 px-4 text-right">Est. Completed Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredReportData.map((item) => (
                        <tr key={item.doctorId} className="hover:bg-slate-50/80">
                          <td className="py-3 px-4 font-bold text-slate-900">{item.fullName}</td>
                          <td className="py-3 px-4 text-slate-600">{item.specialization}</td>
                          <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{item.licenseNumber}</td>
                          <td className="py-3 px-4 font-semibold text-slate-800">{formatCurrency(item.consultationFee)}</td>
                          <td className="py-3 px-4 text-center font-bold text-slate-900">{item.totalAppointments}</td>
                          <td className="py-3 px-4 text-center font-bold text-emerald-600">{item.completedAppointments}</td>
                          <td className="py-3 px-4 text-center font-bold text-cyan-700">{item.completionRate}%</td>
                          <td className="py-3 px-4 text-right font-black text-slate-900">{formatCurrency(item.estimatedValue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </>
                )}

                {/* SPECIALIZATIONS REPORT TABLE */}
                {selectedReport === "specializations" && (
                  <>
                    <thead className="bg-slate-50">
                      <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        <th className="py-3 px-4">Specialization</th>
                        <th className="py-3 px-4 text-center">Doctors</th>
                        <th className="py-3 px-4 text-center">Active</th>
                        <th className="py-3 px-4 text-center">Appointments</th>
                        <th className="py-3 px-4 text-center">Completed</th>
                        <th className="py-3 px-4 text-right">Share (%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredReportData.map((item) => (
                        <tr key={item.specializationId} className="hover:bg-slate-50/80">
                          <td className="py-3 px-4 font-bold text-slate-900">{item.specializationName}</td>
                          <td className="py-3 px-4 text-center font-semibold text-slate-700">{item.doctorCount}</td>
                          <td className="py-3 px-4 text-center font-semibold text-emerald-600">{item.activeDoctorCount}</td>
                          <td className="py-3 px-4 text-center font-extrabold text-slate-900">{item.totalAppointments}</td>
                          <td className="py-3 px-4 text-center font-bold text-cyan-700">{item.completedAppointments}</td>
                          <td className="py-3 px-4 text-right font-black text-blue-600">{item.appointmentShare}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </>
                )}
              </table>
            )}
          </div>

          {/* SERVER-SIDE PAGINATION CONTROLS */}
          {(selectedReport === "appointments" || selectedReport === "patients") && (
            <div className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between text-xs font-semibold text-slate-500">
              <div className="flex flex-wrap items-center gap-3">
                <span>
                  Showing {totalReportElements === 0 ? 0 : reportPage * reportPageSize + 1} to{" "}
                  {Math.min((reportPage + 1) * reportPageSize, totalReportElements)} of{" "}
                  {totalReportElements.toLocaleString("en-IN")} records
                </span>
                <div className="flex items-center gap-1.5">
                  <label className="text-slate-400">Page size:</label>
                  <select
                    value={reportPageSize}
                    onChange={(e) => {
                      setReportPageSize(Number(e.target.value));
                      setReportPage(0);
                    }}
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-700 focus:outline-none"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={reportPage === 0 || reportLoading}
                  onClick={() => setReportPage((prev) => Math.max(0, prev - 1))}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-bold text-slate-700 shadow-xs hover:bg-slate-50 disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="px-2">
                  Page {reportPage + 1} of {Math.max(1, totalReportPages)}
                </span>
                <button
                  type="button"
                  disabled={reportPage + 1 >= totalReportPages || reportLoading}
                  onClick={() => setReportPage((prev) => prev + 1)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-bold text-slate-700 shadow-xs hover:bg-slate-50 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Responsive SVG Trend Area Chart
 */
function TrendAreaChart({ data, gradientId }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  if (!data || data.length === 0) return null;

  const width = 800;
  const height = 220;
  const paddingX = 40;
  const paddingY = 25;

  const maxVal = Math.max(...data.map((d) => Math.max(d.total, d.completed, d.cancelled, 1)), 5);

  const scaleX = (i) => paddingX + (i * (width - 2 * paddingX)) / Math.max(data.length - 1, 1);
  const scaleY = (val) => height - paddingY - (val * (height - 2 * paddingY)) / maxVal;

  const totalPoints = data.map((d, i) => `${scaleX(i)},${scaleY(d.total)}`).join(" ");
  const completedPoints = data.map((d, i) => `${scaleX(i)},${scaleY(d.completed)}`).join(" ");
  const cancelledPoints = data.map((d, i) => `${scaleX(i)},${scaleY(d.cancelled)}`).join(" ");

  const areaPolygon = `${scaleX(0)},${scaleY(0)} ${totalPoints} ${scaleX(data.length - 1)},${scaleY(0)}`;

  return (
    <div className="relative h-full w-full">
      <svg
        role="img"
        aria-label="Daily appointment volume trend chart showing scheduled, completed, and cancelled consultations over time"
        viewBox={`0 0 ${width} ${height}`}
        className="h-full w-full overflow-visible"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
          const y = height - paddingY - pct * (height - 2 * paddingY);
          return (
            <line
              key={idx}
              x1={paddingX}
              y1={y}
              x2={width - paddingX}
              y2={y}
              stroke="#f1f5f9"
              strokeDasharray="4 4"
            />
          );
        })}

        <polygon points={areaPolygon} fill={`url(#${gradientId})`} />

        <polyline
          fill="none"
          stroke="#06b6d4"
          strokeWidth="2.5"
          points={totalPoints}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <polyline
          fill="none"
          stroke="#10b981"
          strokeWidth="2"
          strokeDasharray="3 3"
          points={completedPoints}
          strokeLinecap="round"
        />
        <polyline
          fill="none"
          stroke="#f43f5e"
          strokeWidth="1.5"
          strokeDasharray="2 2"
          points={cancelledPoints}
          strokeLinecap="round"
        />

        {data.map((d, i) => {
          const cx = scaleX(i);
          const cy = scaleY(d.total);
          const isHovered = hoveredIndex === i;

          return (
            <g
              key={i}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <circle
                cx={cx}
                cy={cy}
                r={isHovered ? 6 : 3.5}
                fill="#ffffff"
                stroke="#06b6d4"
                strokeWidth={isHovered ? 3 : 2}
                className="transition-all duration-150"
              />
            </g>
          );
        })}
      </svg>

      {hoveredIndex !== null && data[hoveredIndex] && (
        <div
          className="pointer-events-none absolute -top-12 z-20 -translate-x-1/2 rounded-xl bg-slate-900 px-3 py-1.5 text-[11px] font-bold text-white shadow-xl"
          style={{
            left: `${(scaleX(hoveredIndex) / width) * 100}%`,
          }}
        >
          <div className="text-slate-300 font-normal">{data[hoveredIndex].date} ({data[hoveredIndex].label})</div>
          <div className="flex gap-2.5 mt-0.5">
            <span className="text-cyan-400">Total: {data[hoveredIndex].total}</span>
            <span className="text-emerald-400">Done: {data[hoveredIndex].completed}</span>
            <span className="text-rose-400">Canc: {data[hoveredIndex].cancelled}</span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Responsive SVG Donut Chart
 */
function DonutChart({ data, total }) {
  const [hoveredSegment, setHoveredSegment] = useState(null);

  const radius = 68;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius;

  let cumulativeAngle = 0;

  return (
    <div className="relative flex h-52 w-52 items-center justify-center">
      <svg
        role="img"
        aria-label={`Donut chart showing appointment status distribution across ${total} total bookings`}
        viewBox="0 0 180 180"
        className="h-full w-full -rotate-90 transform overflow-visible"
      >
        <circle
          cx="90"
          cy="90"
          r={radius}
          fill="transparent"
          stroke="#f1f5f9"
          strokeWidth={strokeWidth}
        />

        {data.map((item) => {
          const strokeDashoffset = circumference - (item.percentage / 100) * circumference;
          const rotation = cumulativeAngle;
          cumulativeAngle += (item.percentage / 100) * 360;

          const colorConfig = STATUS_COLORS[item.status] || STATUS_COLORS.REJECTED;
          const isHovered = hoveredSegment === item.status;

          return (
            <circle
              key={item.status}
              cx="90"
              cy="90"
              r={radius}
              fill="transparent"
              stroke={colorConfig.stroke}
              strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              transform={`rotate(${rotation} 90 90)`}
              className="cursor-pointer transition-all duration-200"
              onMouseEnter={() => setHoveredSegment(item.status)}
              onMouseLeave={() => setHoveredSegment(null)}
            />
          );
        })}
      </svg>

      <div className="pointer-events-none absolute flex flex-col items-center justify-center text-center">
        <span className="text-2xl font-black text-slate-900">
          {hoveredSegment
            ? data.find((d) => d.status === hoveredSegment)?.count || 0
            : total}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {hoveredSegment || "Total Bookings"}
        </span>
      </div>
    </div>
  );
}
