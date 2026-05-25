import React from "react";

const DISMISS_KEY = "speed-cash-admin-install-dismissed";
const INSTALLED_KEY = "speed-cash-admin-installed";

const isIosDevice = () => {
  const userAgent = window.navigator.userAgent.toLowerCase();
  const isTouchMac =
    window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1;
  return /iphone|ipad|ipod/.test(userAgent) || isTouchMac;
};

const isSafariBrowser = () => {
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /safari/.test(userAgent) && !/chrome|chromium|android|crios|fxios|edg/.test(userAgent);
};

const isStandaloneMode = () =>
  window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;

const getInstallHelp = () => {
  if (isIosDevice()) {
    return {
      title: "Install on iPhone or iPad",
      steps: [
        "Tap the Share button in Safari.",
        "Choose Add to Home Screen.",
        "Tap Add to install SPEED CASH on your device.",
      ],
    };
  }

  if (isSafariBrowser()) {
    return {
      title: "Install on Mac",
      steps: [
        "Open this site in Safari.",
        "Use File or Share and choose Add to Dock.",
        "Open SPEED CASH from your Dock like a desktop app.",
      ],
    };
  }

  return {
    title: "Install on this device",
    steps: [
      "Open the browser install option.",
      "In Chrome or Edge, use the install icon in the address bar or the browser menu.",
      "Confirm the install to pin SPEED CASH for faster access.",
    ],
  };
};

export default function InstallAppPrompt() {
  const [deferredPrompt, setDeferredPrompt] = React.useState(null);
  const [dismissed, setDismissed] = React.useState(() => {
    if (typeof window === "undefined") return true;
    return (
      window.localStorage.getItem(DISMISS_KEY) === "1" ||
      window.localStorage.getItem(INSTALLED_KEY) === "1" ||
      isStandaloneMode()
    );
  });
  const [showHelp, setShowHelp] = React.useState(false);
  const [isInstalled, setIsInstalled] = React.useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(INSTALLED_KEY) === "1" || isStandaloneMode();
  });

  React.useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const standaloneMedia = window.matchMedia("(display-mode: standalone)");

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      if (
        window.localStorage.getItem(INSTALLED_KEY) === "1" ||
        isStandaloneMode()
      ) {
        return;
      }
      setDeferredPrompt(event);
      setDismissed(false);
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setDismissed(true);
      setDeferredPrompt(null);
      setShowHelp(false);
      window.localStorage.setItem(INSTALLED_KEY, "1");
      window.localStorage.removeItem(DISMISS_KEY);
    };

    const handleDisplayModeChange = (event) => {
      if (!event.matches) return;
      setIsInstalled(true);
      setDismissed(true);
      setDeferredPrompt(null);
      setShowHelp(false);
      window.localStorage.setItem(INSTALLED_KEY, "1");
      window.localStorage.removeItem(DISMISS_KEY);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);
    standaloneMedia.addEventListener("change", handleDisplayModeChange);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
      standaloneMedia.removeEventListener("change", handleDisplayModeChange);
    };
  }, []);

  const hidePrompt = () => {
    setDismissed(true);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(DISMISS_KEY, "1");
    }
  };

  const handleInstall = async () => {
    if (!deferredPrompt) {
      setShowHelp(true);
      return;
    }

    deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice.catch(() => null);

    if (choiceResult?.outcome === "accepted") {
      setDismissed(true);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(INSTALLED_KEY, "1");
        window.localStorage.removeItem(DISMISS_KEY);
      }
    }

    setDeferredPrompt(null);
  };

  if (dismissed || isInstalled) {
    return null;
  }

  const installHelp = getInstallHelp();

  return (
    <>
      <div className="fixed inset-x-4 bottom-4 z-[1200] mx-auto w-auto max-w-[320px] sm:left-auto sm:right-4 sm:top-4 sm:bottom-auto sm:mx-0 sm:w-full sm:max-w-sm">
        <div className="rounded-[22px] border border-emerald-200 bg-white/95 p-3 shadow-[0_20px_48px_rgba(15,23,42,0.18)] backdrop-blur sm:rounded-[24px] sm:p-4 sm:shadow-[0_24px_60px_rgba(15,23,42,0.2)]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
                Install App
              </p>
              <h3 className="mt-1 text-sm font-semibold text-slate-900 sm:text-base">
                SPEED CASH Admin
              </h3>
              <p className="mt-1 text-xs text-slate-600 sm:text-sm">
                Add the admin app to this device for faster access.
              </p>
            </div>
            <button
              type="button"
              onClick={hidePrompt}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700 sm:h-9 sm:w-9"
              aria-label="Dismiss install prompt"
            >
              <i className="fa fa-times" aria-hidden="true" />
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2 sm:mt-4">
            <button
              type="button"
              onClick={handleInstall}
              className="inline-flex min-h-[38px] flex-1 items-center justify-center rounded-2xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 sm:min-h-[42px] sm:px-4 sm:text-sm"
            >
              {deferredPrompt ? "Install now" : "How to install"}
            </button>
            <button
              type="button"
              onClick={() => setShowHelp(true)}
              className="inline-flex min-h-[38px] flex-1 items-center justify-center rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 sm:min-h-[42px] sm:px-4 sm:text-sm"
            >
              Install guide
            </button>
          </div>
        </div>
      </div>

      {showHelp ? (
        <div className="fixed inset-0 z-[1250] flex items-center justify-center bg-slate-950/55 px-4 py-6">
          <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
                  Install Guide
                </p>
                <h3 className="mt-1 text-lg font-semibold text-slate-900">
                  {installHelp.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHelp(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
                aria-label="Close install guide"
              >
                <i className="fa fa-times" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {installHelp.steps.map((step) => (
                <div
                  key={step}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
                >
                  {step}
                </div>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              {deferredPrompt ? (
                <button
                  type="button"
                  onClick={handleInstall}
                  className="inline-flex min-h-[42px] items-center justify-center rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  Install now
                </button>
              ) : null}
              <button
                type="button"
                onClick={hidePrompt}
                className="inline-flex min-h-[42px] items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
