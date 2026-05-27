import React from "react";

const toneClasses = {
  success: "border-orange-200 bg-orange-50 text-orange-900",
  error: "border-rose-200 bg-rose-50 text-rose-800",
  warning: "border-orange-200 bg-orange-50 text-orange-900",
  info: "border-slate-800 bg-[#0f1a2e] text-white",
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
  positionClassName = "top-3 left-3 right-3 sm:top-4 sm:right-4 sm:left-auto",
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
        className={`pointer-events-auto flex w-full min-w-0 max-w-md items-start gap-3 rounded-2xl border px-4 py-3 shadow-[0_20px_50px_rgba(15,23,42,0.14)] sm:min-w-[280px] sm:w-auto ${tone}`}
        role="alert"
      >
        <i className={`${icon} mt-0.5 shrink-0 text-sm`} />
        <div className="min-w-0 flex-1 break-words text-sm font-medium leading-6">
          {message}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-current/70 transition hover:bg-black/5 hover:text-current"
          aria-label="Close notification"
        >
          <i className="fa fa-times text-xs" />
        </button>
      </div>
    </div>
  );
}
