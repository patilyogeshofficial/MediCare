import { Inbox } from "lucide-react";

/**
 * Accessible Empty State Component with semantic structure
 */
export default function EmptyState({
  icon: Icon = Inbox,
  title = "No records found",
  description = "There are no items to display at this time.",
  actionText = null,
  onAction = null,
  actionIcon: ActionIcon = null,
}) {
  return (
    <div
      className="flex flex-col items-center justify-center py-12 px-4 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50"
      role="status"
      aria-live="polite"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-xs border border-slate-100 text-slate-400 mb-3.5">
        <Icon size={24} aria-hidden="true" />
      </div>

      <h4 className="text-sm font-bold text-slate-800">{title}</h4>
      <p className="mt-1 text-xs text-slate-500 font-medium max-w-sm">
        {description}
      </p>

      {actionText && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-cyan-700 transition active:scale-95"
        >
          {ActionIcon && <ActionIcon size={14} aria-hidden="true" />}
          {actionText}
        </button>
      )}
    </div>
  );
}
