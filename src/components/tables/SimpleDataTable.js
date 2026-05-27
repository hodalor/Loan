import React from "react";
import DefaultLoader from "../loaders/defaultLoader";

export default function SimpleDataTable({
  columns = [],
  rows = [],
  emptyMessage = "No data available.",
  rowKey = "id",
  className = "",
  onRowClick,
  getRowClassName,
  tableClassName = "",
  dense = false,
  pagination = true,
  pageSize = 10,
  loading = false,
  loadingMessage = "Loading data...",
}) {
  const headCellClassName = dense ? "px-3 py-2.5" : "px-4 py-3";
  const bodyCellClassName = dense ? "px-3 py-2.5" : "px-4 py-3";
  const [currentPage, setCurrentPage] = React.useState(1);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));

  React.useEffect(() => {
    setCurrentPage(1);
  }, [pageSize, rows.length]);

  const paginatedRows = React.useMemo(() => {
    if (!pagination) return rows;

    const startIndex = (currentPage - 1) * pageSize;
    return rows.slice(startIndex, startIndex + pageSize);
  }, [currentPage, pageSize, pagination, rows]);

  const pageStart = rows.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const pageEnd = rows.length === 0 ? 0 : Math.min(currentPage * pageSize, rows.length);
  const showLoadingState = loading && rows.length === 0;

  return (
    <div
      className={`overflow-hidden rounded-3xl border border-[var(--admin-border)] bg-white shadow-sm ${className}`}
    >
      <div className="overflow-auto">
        <table className={`min-w-full ${tableClassName}`.trim()}>
          <thead className="bg-gradient-to-r from-orange-50 to-white">
            <tr className="text-left text-xs uppercase tracking-[0.16em] text-[var(--admin-text-muted)]">
              {columns.map((column) => (
                <th key={column.key} className={`${headCellClassName} font-semibold`}>
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--admin-border-soft)]">
            {showLoadingState ? (
              <tr>
                <td
                  colSpan={Math.max(columns.length, 1)}
                  className="px-4 py-10 text-center text-sm text-[var(--admin-text-muted)]"
                >
                  <div className="flex flex-col items-center justify-center gap-3">
                    <DefaultLoader />
                    <span>{loadingMessage}</span>
                  </div>
                </td>
              </tr>
            ) : paginatedRows.length > 0 ? (
              paginatedRows.map((row, index) => {
                const keyValue = row?.[rowKey] ?? `${index}`;
                const isClickable = typeof onRowClick === "function";
                const customRowClassName = getRowClassName ? getRowClassName(row, index) : "";

                return (
                  <tr
                    key={`${keyValue}-${index}`}
                    className={`align-top ${isClickable ? "cursor-pointer hover:bg-orange-50/60" : ""} ${customRowClassName}`}
                    onClick={isClickable ? () => onRowClick(row, index) : undefined}
                  >
                    {columns.map((column) => (
                      <td
                        key={`${keyValue}-${column.key}`}
                        className={`${bodyCellClassName} text-sm text-[var(--admin-text-soft)] ${
                          column.cellClassName || ""
                        }`}
                      >
                        {column.render
                          ? column.render(row, index)
                          : row?.[column.key] ?? "-"}
                      </td>
                    ))}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={Math.max(columns.length, 1)}
                  className="px-4 py-8 text-center text-sm text-[var(--admin-text-muted)]"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {pagination && rows.length > pageSize ? (
        <div className="flex flex-col gap-3 border-t border-[var(--admin-border)] bg-orange-50/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[var(--admin-text-muted)]">
            Showing {pageStart}-{pageEnd} of {rows.length}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-xl border border-[var(--admin-border)] bg-white px-3 py-1.5 text-sm font-semibold text-[var(--admin-surface-dark-alt)] transition hover:border-[var(--admin-accent-soft-strong)] hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            >
              Prev
            </button>
            <span className="rounded-xl bg-[var(--admin-dark-soft)] px-3 py-1.5 text-sm font-semibold text-[var(--admin-surface-dark-alt)]">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              className="rounded-xl border border-[var(--admin-border)] bg-white px-3 py-1.5 text-sm font-semibold text-[var(--admin-surface-dark-alt)] transition hover:border-[var(--admin-accent-soft-strong)] hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
