import React from "react";
import { GlobalContext } from "../../libs/context/globalContext";
import useIdle from "../../hooks/useIdleTimer";

export default function TopBar({ onMenuToggle }) {
  const { _logout, inComingLoans, user } = React.useContext(GlobalContext);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const profileMenuRef = React.useRef(null);

  useIdle({ onIdle: _logout, idleTime: 5 });

  const showNotifications =
    user?.department === "management" || user?.role === "rv-team-lead";

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (!profileMenuRef.current?.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-20 border-b border-orange-100/80 bg-white/92 backdrop-blur">
      <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMenuToggle}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-orange-100 text-[#13213a] transition hover:bg-orange-50 lg:hidden"
          >
            <i className="fa fa-bars text-base" />
          </button>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-600">
              Operations Dashboard
            </p>
            <h1 className="mt-1 text-lg font-semibold text-[#122033]">
              Welcome back, {user?.firstName || user?.userName || "Team"}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-xl border border-orange-100 bg-orange-50/70 px-3 py-2 text-sm text-[#9a3412] md:flex">
            <i className="fa fa-clock-o text-sm" />
            <span>Auto logout after 5 minutes idle</span>
          </div>

          {showNotifications ? (
            <div className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-[#0f1a2e] text-white">
              <i className="fa fa-bell-o text-base" />
              <span className="absolute -right-1 -top-1 inline-flex min-h-[20px] min-w-[20px] items-center justify-center rounded-full bg-orange-500 px-1 text-[11px] font-bold text-white">
                {inComingLoans.length}
              </span>
            </div>
          ) : null}

          <div className="relative" ref={profileMenuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((current) => !current)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-orange-100 bg-white text-sm font-semibold text-[#13213a] transition hover:bg-orange-50"
            >
              <span className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-[#13213a] text-[13px] font-semibold text-white">
                {(user?.userName || "U").slice(0, 1)}
              </span>
            </button>

            <div
              className={`absolute right-0 top-[calc(100%+10px)] z-30 min-w-[220px] rounded-3xl border border-orange-100 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.12)] transition ${
                menuOpen
                  ? "pointer-events-auto translate-y-0 opacity-100"
                  : "pointer-events-none -translate-y-1 opacity-0"
              }`}
            >
              <div className="px-4 py-3">
                <p className="text-sm font-semibold text-[#122033]">
                  {user?.userName || "Unknown user"}
                </p>
                <p className="text-xs text-slate-500">{user?.role || ""}</p>
              </div>
              <div className="border-t border-orange-50" />
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  _logout();
                }}
                className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-[#13213a] transition hover:bg-orange-50"
              >
                <i className="fa fa-power-off text-sm text-rose-500" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
