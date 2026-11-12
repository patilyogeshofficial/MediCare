/**
 * WCAG 2.2 Accessible Skeleton Loader
 * Includes aria-busy="true" and hidden screen reader notice.
 */
export default function SkeletonLoader({
  lines = 3,
  type = "card", // 'card', 'table', 'text'
  className = "",
}) {
  if (type === "card") {
    return (
      <div
        className={`rounded-2xl border border-slate-100 bg-white p-5 shadow-xs animate-pulse ${className}`}
        role="status"
        aria-busy="true"
        aria-label="Loading content..."
      >
        <span className="sr-only">Loading content, please wait...</span>
        <div className="flex items-center justify-between">
          <div className="h-4 w-28 rounded-md bg-slate-200" />
          <div className="h-9 w-9 rounded-xl bg-slate-100" />
        </div>
        <div className="mt-4 h-8 w-20 rounded-md bg-slate-200" />
        <div className="mt-2 h-3.5 w-36 rounded-md bg-slate-100" />
      </div>
    );
  }

  if (type === "table") {
    return (
      <div
        className={`w-full divide-y divide-slate-100 animate-pulse ${className}`}
        role="status"
        aria-busy="true"
        aria-label="Loading table records..."
      >
        <span className="sr-only">Loading table records, please wait...</span>
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="flex items-center justify-between py-4 px-4 gap-4">
            <div className="h-4 w-16 rounded-md bg-slate-200" />
            <div className="h-4 w-32 rounded-md bg-slate-200" />
            <div className="h-4 w-28 rounded-md bg-slate-100 hidden sm:block" />
            <div className="h-4 w-20 rounded-md bg-slate-200" />
            <div className="h-6 w-16 rounded-full bg-slate-100" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className={`space-y-2.5 animate-pulse ${className}`}
      role="status"
      aria-busy="true"
      aria-label="Loading..."
    >
      <span className="sr-only">Loading...</span>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 rounded-md bg-slate-200"
          style={{ width: `${100 - i * 15}%` }}
        />
      ))}
    </div>
  );
}
