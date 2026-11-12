import {
  CheckCircle,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";

/**
 * WCAG 2.2 Level AA Status Badge Component
 * Pairs accessible colors with semantic SVG icons and clear descriptive labels
 * so that state is never communicated through color alone.
 */
export default function StatusBadge({ status, size = "md", customLabel = null }) {
  const norm = String(status || "").trim().toUpperCase();

  const configs = {
    CONFIRMED: {
      label: "Confirmed",
      icon: CheckCircle,
      classes: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
    },
    PENDING: {
      label: "Pending",
      icon: Clock,
      classes: "bg-amber-50 text-amber-700 border-amber-200/60",
    },
    COMPLETED: {
      label: "Completed",
      icon: CheckCircle2,
      classes: "bg-cyan-50 text-cyan-700 border-cyan-200/60",
    },
    CANCELLED: {
      label: "Cancelled",
      icon: XCircle,
      classes: "bg-rose-50 text-rose-700 border-rose-200/60",
    },
    REJECTED: {
      label: "Rejected",
      icon: XCircle,
      classes: "bg-slate-100 text-slate-700 border-slate-200/60",
    },
    ACTIVE: {
      label: "Active",
      icon: CheckCircle,
      classes: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
    },
    INACTIVE: {
      label: "Inactive",
      icon: AlertCircle,
      classes: "bg-slate-100 text-slate-600 border-slate-200/60",
    },
    VERIFIED: {
      label: "Verified",
      icon: ShieldCheck,
      classes: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
    },
    TAMPERED: {
      label: "Tampered / Invalid",
      icon: ShieldAlert,
      classes: "bg-rose-50 text-rose-700 border-rose-200/60",
    },
    URGENT: {
      label: "Urgent",
      icon: AlertCircle,
      classes: "bg-rose-50 text-rose-700 border-rose-200/60 font-black",
    },
    IMPORTANT: {
      label: "Important",
      icon: Clock,
      classes: "bg-amber-50 text-amber-700 border-amber-200/60",
    },
    NORMAL: {
      label: "Normal",
      icon: CheckCircle,
      classes: "bg-slate-50 text-slate-600 border-slate-200/60",
    },
  };

  const current = configs[norm] || {
    label: norm || "Unknown",
    icon: AlertCircle,
    classes: "bg-slate-100 text-slate-700 border-slate-200",
  };

  const Icon = current.icon;
  const label = customLabel || current.label;

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px] gap-1",
    md: "px-2.5 py-1 text-xs gap-1.5",
    lg: "px-3 py-1.5 text-xs font-bold gap-2",
  }[size] || "px-2.5 py-1 text-xs gap-1.5";

  const iconSize = size === "sm" ? 11 : size === "lg" ? 14 : 12;

  return (
    <span
      className={`inline-flex items-center font-bold rounded-full border ${current.classes} ${sizeClasses}`}
      role="status"
    >
      <Icon size={iconSize} className="shrink-0" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}
