import React from "react";

const DISMISS_KEY = "speed-cash-web-install-dismissed";
const INSTALLED_KEY = "speed-cash-web-installed";

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
        "Tap Add to install SPEED CASH on your phone.",
      ],
    };
  }

  if (isSafariBrowser()) {
    return {
      title: "Install on Mac",
      steps: [
        "Open this site in Safari.",
        "Use File or Share and choose Add to Dock.",
        "Launch SPEED CASH directly from your Dock.",
      ],
    };
  }

  return {
    title: "Install on this device",
    steps: [
      "Open the browser install option.",
      "In Chrome or Edge, use the install icon in the address bar or the browser menu.",
      "Confirm the install to keep SPEED CASH one tap away.",
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
      <section className="install-banner">
        <div>
          <p className="install-banner-kicker">Install App</p>
          <h2>Install SPEED CASH</h2>
          <p className="install-banner-copy">
            Add this app to your phone or computer for faster access.
          </p>
        </div>
        <div className="install-banner-actions">
          <button type="button" className="primary-btn install-btn" onClick={handleInstall}>
            {deferredPrompt ? "Install now" : "How to install"}
          </button>
          <button
            type="button"
            className="ghost-btn install-btn"
            onClick={() => setShowHelp(true)}
          >
            Install guide
          </button>
          <button type="button" className="dismiss-install-btn" onClick={hidePrompt}>
            Not now
          </button>
        </div>
      </section>

      {showHelp ? (
        <div className="install-modal-backdrop">
          <div className="install-modal">
            <div className="install-modal-head">
              <div>
                <p className="install-banner-kicker">Install Guide</p>
                <h3>{installHelp.title}</h3>
              </div>
              <button
                type="button"
                className="dismiss-install-icon"
                onClick={() => setShowHelp(false)}
                aria-label="Close install guide"
              >
                x
              </button>
            </div>

            <div className="install-steps">
              {installHelp.steps.map((step) => (
                <div key={step} className="install-step-card">
                  {step}
                </div>
              ))}
            </div>

            <div className="install-modal-actions">
              {deferredPrompt ? (
                <button type="button" className="primary-btn install-btn" onClick={handleInstall}>
                  Install now
                </button>
              ) : null}
              <button type="button" className="ghost-btn install-btn" onClick={hidePrompt}>
                Maybe later
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
