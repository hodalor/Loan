import React from "react";
import { readSystemConfig } from "../../libs/systemConfig";

export default function Footer() {
  const [branding, setBranding] = React.useState(() =>
    readSystemConfig().portalContent || {}
  );

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

  const appName = branding.appName?.trim() || "SPEED CASH";
  const footerText = branding.footerText?.trim() || "All rights reserved.";
  const footerVersion = branding.footerVersion?.trim() || "1.5.0";
  const logoUrl =
    branding.logoUrl?.trim() || `${process.env.PUBLIC_URL}/speedcash-icon.png`;

  return (
    <footer className="border-t border-slate-200 bg-white px-4 py-4 text-sm text-slate-500 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <img
            src={logoUrl}
            alt={appName}
            className="h-8 w-8 rounded-lg bg-white object-cover p-1"
          />
          <p>
            Copyright © {new Date().getFullYear()} <strong>{appName}</strong>.{" "}
            {footerText}
          </p>
        </div>
        <div>
          <span className="font-semibold text-slate-700">Version</span>{" "}
          {footerVersion}
        </div>
      </div>
    </footer>
  );
}
