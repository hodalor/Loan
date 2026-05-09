import React from "react";

export function DetailSectionCard({ title, subtitle, children, contentClassName = "" }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="bg-sky-400 px-5 py-4 text-white">
        <h3 className="text-base font-semibold">{title}</h3>
        {subtitle ? <p className="mt-1 text-sm text-sky-50">{subtitle}</p> : null}
      </div>
      <div className={`p-4 md:p-5 ${contentClassName}`.trim()}>{children}</div>
    </div>
  );
}

export function DetailSectionHint({ text }) {
  return (
    <div className="mb-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
      {text}
    </div>
  );
}

export function DetailMatrix({ rows = [] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200">
      <table className="min-w-full table-fixed border-collapse">
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={`detail-row-${rowIndex}`} className="border-b border-slate-200 last:border-b-0">
              {row.map((cell, cellIndex) => {
                const isLabel = cell?.type === "label";
                const Tag = isLabel ? "th" : "td";

                return (
                  <Tag
                    key={`detail-cell-${rowIndex}-${cellIndex}`}
                    colSpan={cell?.colSpan || 1}
                    className={`px-4 py-3 text-left align-top text-sm ${
                      isLabel
                        ? "bg-slate-100 font-semibold text-slate-700"
                        : "bg-white text-slate-900"
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
      ? "bg-emerald-100 text-emerald-700"
      : tone === "danger"
      ? "bg-rose-100 text-rose-700"
      : tone === "warning"
      ? "bg-amber-100 text-amber-700"
      : "bg-slate-100 text-slate-700";

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${toneClass}`}>
      {children}
    </span>
  );
}
