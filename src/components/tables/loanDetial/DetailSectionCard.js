import React from "react";

export function DetailSectionCard({ title, subtitle, children, contentClassName = "" }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-[var(--admin-border)] bg-white shadow-sm">
      <div className="bg-gradient-to-r from-[var(--admin-surface-dark)] to-[var(--admin-surface-dark-alt)] px-5 py-4 text-white">
        <h3 className="text-base font-semibold">{title}</h3>
        {subtitle ? <p className="mt-1 text-sm text-orange-100/90">{subtitle}</p> : null}
      </div>
      <div className={`p-4 md:p-5 ${contentClassName}`.trim()}>{children}</div>
    </div>
  );
}

export function DetailSectionHint({ text }) {
  return (
    <div className="mb-4 rounded-2xl bg-orange-50/70 px-4 py-3 text-sm text-[var(--admin-accent-ink)]">
      {text}
    </div>
  );
}

export function DetailMatrix({ rows = [] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-[var(--admin-border)]">
      <table className="min-w-full table-fixed border-collapse">
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr
              key={`detail-row-${rowIndex}`}
              className="border-b border-[var(--admin-border)] last:border-b-0"
            >
              {row.map((cell, cellIndex) => {
                const isLabel = cell?.type === "label";
                const Tag = isLabel ? "th" : "td";

                return (
                  <Tag
                    key={`detail-cell-${rowIndex}-${cellIndex}`}
                    colSpan={cell?.colSpan || 1}
                    className={`px-4 py-3 text-left align-top text-sm ${
                      isLabel
                        ? "bg-orange-50/70 font-semibold text-[var(--admin-surface-dark-alt)]"
                        : "bg-white text-[var(--admin-text)]"
                    } ${cell?.className || ""}`.trim()}
                  >
                    {cell?.content ?? "-"}
                  </Tag>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function StatusBadge({ tone = "neutral", children }) {
  const toneClass =
    tone === "success"
      ? "bg-orange-50 text-[var(--admin-accent-ink)]"
      : tone === "danger"
      ? "bg-rose-100 text-rose-700"
      : tone === "warning"
      ? "bg-[var(--admin-dark-soft)] text-[var(--admin-surface-dark-alt)]"
      : "bg-slate-100 text-slate-700";

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${toneClass}`}>
      {children}
    </span>
  );
}
