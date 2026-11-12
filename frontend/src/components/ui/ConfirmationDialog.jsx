import { AlertTriangle, AlertCircle, Info, Loader2 } from "lucide-react";
import AccessibleModal from "./AccessibleModal";

/**
 * Accessible Confirmation Dialog for Destructive / Significant Actions
 */
export default function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger", // 'danger', 'warning', 'info'
  isLoading = false,
}) {
  const iconConfig = {
    danger: {
      icon: AlertTriangle,
      color: "text-rose-600 bg-rose-50 border-rose-100",
      buttonColor: "bg-rose-600 hover:bg-rose-700 text-white focus-visible:ring-rose-500",
    },
    warning: {
      icon: AlertCircle,
      color: "text-amber-600 bg-amber-50 border-amber-100",
      buttonColor: "bg-amber-600 hover:bg-amber-700 text-white focus-visible:ring-amber-500",
    },
    info: {
      icon: Info,
      color: "text-cyan-600 bg-cyan-50 border-cyan-100",
      buttonColor: "bg-cyan-600 hover:bg-cyan-700 text-white focus-visible:ring-cyan-500",
    },
  }[variant] || {
    icon: AlertTriangle,
    color: "text-rose-600 bg-rose-50 border-rose-100",
    buttonColor: "bg-rose-600 hover:bg-rose-700 text-white focus-visible:ring-rose-500",
  };

  const Icon = iconConfig.icon;

  return (
    <AccessibleModal
      isOpen={isOpen}
      onClose={isLoading ? () => {} : onClose}
      maxWidth="max-w-md"
      showCloseButton={!isLoading}
    >
      <div className="flex flex-col items-center text-center">
        <div className={`flex h-14 w-14 items-center justify-center rounded-2xl border ${iconConfig.color} mb-4`}>
          <Icon size={28} />
        </div>

        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        <p className="mt-2 text-xs leading-relaxed text-slate-500 font-medium">
          {message}
        </p>

        <div className="mt-6 flex w-full gap-3 sm:flex-row-reverse">
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-xs font-bold transition shadow-sm active:scale-95 disabled:opacity-50 ${iconConfig.buttonColor}`}
          >
            {isLoading && <Loader2 size={14} className="animate-spin" />}
            {isLoading ? "Processing..." : confirmText}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 px-4 text-xs font-bold text-slate-700 hover:bg-slate-50 transition active:scale-95 disabled:opacity-50"
          >
            {cancelText}
          </button>
        </div>
      </div>
    </AccessibleModal>
  );
}
