import React from "react";
import { Link, useLocation } from "react-router-dom";
import { GlobalContext } from "../../libs/context/globalContext";
import { readSystemConfig } from "../../libs/systemConfig";
import { getVisibleNavigation } from "../../config/navigation";
import { resolveMediaUrl } from "../../libs/mediaUrl";

const isActivePath = (pathname, item) => {
  if (item.exact) return pathname === item.path;
  return item.path === "/" ? pathname === "/" : pathname.startsWith(item.path);
};

export default function Aside({ isOpen, onClose }) {
  const { user } = React.useContext(GlobalContext);
  const location = useLocation();

  const navItems = React.useMemo(
    () => getVisibleNavigation(user?.role || "", user?.permissions || []),
    [user?.permissions, user?.role]
  );

  const [branding, setBranding] = React.useState(() =>
    readSystemConfig().portalContent || {}
  );
  const [openGroup, setOpenGroup] = React.useState("");

  React.useEffect(() => {
    const activeGroup = navItems.find((item) =>
      item.children?.some((child) => isActivePath(location.pathname, child))
    );

    if (activeGroup?.key) {
      setOpenGroup(activeGroup.key);
    }
  }, [location.pathname, navItems]);

  React.useEffect(() => {
    const syncBranding = () => {
      setBranding(readSystemConfig().portalContent || {});
    };

    window.addEventListener("pathway-system-config-updated", syncBranding);
    window.addEventListener("storage", syncBranding);

    return () => {
      window.removeEventListener("pathway-system-config-updated", syncBranding);
      window.removeEventListener("storage", syncBranding);
    };
  }, []);

  const defaultLogoSrc = `${process.env.PUBLIC_URL}/speedcash-icon.png`;
  const resolvedLogoSrc = resolveMediaUrl(branding.logoUrl);
  const [logoLoadFailed, setLogoLoadFailed] = React.useState(false);

  React.useEffect(() => {
    setLogoLoadFailed(false);
  }, [resolvedLogoSrc]);

  const logoSrc = !logoLoadFailed && resolvedLogoSrc ? resolvedLogoSrc : defaultLogoSrc;
  const appName = branding.appName?.trim() || "SPEED CASH";
  const tagline = branding.tagline?.trim() || "Loan operations";

  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-slate-950/40 transition lg:hidden ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-slate-950 text-slate-100 transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-3 border-b border-slate-800/70 px-4 py-3.5">
          <img
            src={logoSrc}
            alt={appName}
            className="h-9 w-9 rounded-xl bg-white object-cover p-1"
            onError={() => setLogoLoadFailed(true)}
          />
          <div>
            <p className="text-sm font-semibold tracking-wide text-slate-200">
              {appName.toUpperCase()}
            </p>
            <p className="text-xs text-slate-500">{tagline}</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
          {navItems.map((item) => {
            const active =
              item.path && isActivePath(location.pathname, item)
                ? true
                : item.children?.some((child) =>
                    isActivePath(location.pathname, child)
                  );

            if (!item.children) {
              return (
                <Link
                  key={item.key}
                  to={item.path}
                  onClick={onClose}
                  className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition ${
                    active
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                      : "text-slate-300 hover:bg-slate-900 hover:text-white"
                  }`}
                >
                  <i className={`${item.icon} text-sm`} />
                  <span>{item.label}</span>
                </Link>
              );
            }

            return (
              <div
                key={item.key}
                className="border-b border-slate-900/60 py-1 last:border-b-0"
              >
                <button
                  type="button"
                  onClick={() =>
                    setOpenGroup((current) => (current === item.key ? "" : item.key))
                  }
                  className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-medium transition ${
                    active ? "text-white" : "text-slate-300 hover:text-white"
                  }`}
                >
                  <i className={`${item.icon} text-sm`} />
                  <span className="flex-1">{item.label}</span>
                  <span
                    className={`text-base leading-none text-slate-400 transition-transform duration-200 ${
                      openGroup === item.key ? "rotate-90 text-white" : ""
                    }`}
                  >
                    &gt;
                  </span>
                </button>

                <div
                  className={`grid transition-all duration-200 ease-out ${
                    openGroup === item.key
                      ? "grid-rows-[1fr] opacity-100"
                      : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="space-y-1 pb-2 pl-10 pr-1 pt-1">
                      {item.children.map((child) => {
                        const childActive = isActivePath(location.pathname, child);

                        return (
                          <Link
                            key={child.path}
                            to={child.path}
                            onClick={onClose}
                            className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
                              childActive
                                ? "bg-blue-600/15 text-white"
                                : "text-slate-400 hover:bg-slate-900 hover:text-white"
                            }`}
                          >
                            {child.icon ? (
                              <i className={`${child.icon} text-sm`} />
                            ) : (
                              <span className="h-2 w-2 rounded-full bg-current opacity-70" />
                            )}
                            <span>{child.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
