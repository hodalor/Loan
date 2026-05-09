import React from "react";

const toneClasses = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  error: "border-rose-200 bg-rose-50 text-rose-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  info: "border-blue-200 bg-blue-50 text-blue-800",
};

const iconClasses = {
  success: "fa fa-check-circle",
  error: "fa fa-times-circle",
  warning: "fa fa-exclamation-triangle",
  info: "fa fa-info-circle",
};

export default function AppToast({
  open = false,
  message = "",
  type = "info",
  onClose,
  autoHideDuration = 5000,
  positionClassName = "top-4 right-4",
}) {
  React.useEffect(() => {
    if (!open || typeof onClose !== "function") return undefined;

    const timer = window.setTimeout(() => {
      onClose();
    }, autoHideDuration);

    return () => window.clearTimeout(timer);
  }, [autoHideDuration, onClose, open]);

  if (!open) return null;

  const tone = toneClasses[type] || toneClasses.info;
  const icon = iconClasses[type] || iconClasses.info;

  return (
    <div className={`pointer-events-none fixed z-[1600] ${positionClassName}`}>
      <div
        className={`pointer-events-auto flex min-w-[280px] max-w-md items-start gap-3 rounded-2xl border px-4 py-3 shadow-[0_20px_50px_rgba(15,23,42,0.14)] ${tone}`}
        role="alert"
      >
        <i className={`${icon} mt-0.5 text-sm`} />
        <div className="flex-1 text-sm font-medium">{message}</div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-7 w-7 items-center justify-center rounded-full text-current/70 transition hover:bg-black/5 hover:text-current"
          aria-label="Close notification"
        >
          <i className="fa fa-times text-xs" />
        </button>
      </div>
    </div>
  );
}
