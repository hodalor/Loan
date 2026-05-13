import React from "react";

const gatewaySelectors = [
  {
    title: "Collection Gateway",
    reason:
      "Loan collection and extension charges can use a different provider from disbursement, so this selector was split out instead of keeping one shared gateway field.",
  },
  {
    title: "Disbursement Gateway",
    reason:
      "Loan payout is a separate business flow. Bridge uses MTC for payout, so admins need an independent selector here.",
  },
  {
    title: "Bridge Credential Labels",
    reason:
      "The config screen now shows Bridge-friendly naming such as API Username and API Password so the person configuring the system knows exactly what to enter.",
  },
];

const architectureSections = [
  {
    title: "Why Bridge was implemented this way",
    points: [
      "The Bridge pay-bill documentation was reviewed first, but pay-bill is product and utility oriented, not the cleanest core path for loan disbursement and loan repayment.",
      "For loan disbursement, the code uses Bridge `/make_payment` with `trans_type: \"MTC\"` because that matches money transfer from company to customer.",
      "For loan collection and extension repayment, the code uses Bridge `/make_payment` with `trans_type: \"CTM\"` because that matches customer mobile money collection.",
      "Bridge replies asynchronously, so the implementation stores pending state first and waits for webhook confirmation before marking success.",
    ],
  },
  {
    title: "How callback routing works",
    points: [
      "The `BRIDGE_CALLBACK_URL` value can now be a public backend base URL such as `https://api.example.com`.",
      "Each Bridge flow appends its own endpoint automatically: disbursement uses `/loans/bridge/webhook`, portal repayment uses `/users/portal/bridge/webhook`, and the legacy fallback route uses `/loans/bridge/legacy-repayment-webhook`.",
      "If you still prefer a fully explicit endpoint URL, the code also accepts that and keeps it as-is.",
    ],
  },
];

const touchedFiles = [
  {
    group: "Backend configuration",
    items: [
      {
        path: "backend/src/config/index.js",
        why: "Added Bridge environment variables so the backend can read the base URL, credentials, service ID, currency, and callback configuration.",
      },
      {
        path: "backend/.env.example",
        why: "Added the Bridge credentials that must exist in deployment environments and documented how the callback base URL should be set.",
      },
      {
        path: "backend/.env",
        why: "Added the same Bridge guidance comment in the live local environment file so setup is not missed during testing.",
      },
      {
        path: "backend/src/app/models/systemConfig/index.js",
        why: "Added separate `collectionGateway` and `disbursementGateway` fields and included Bridge in implemented channels.",
      },
      {
        path: "backend/src/app/services/systemConfig/index.js",
        why: "Normalizes the new gateway fields and keeps old saved config compatible with the newer split-gateway structure.",
      },
    ],
  },
  {
    group: "Backend disbursement",
    items: [
      {
        path: "backend/src/app/services/payout/index.js",
        why: "Added Bridge payout request logic, operator-to-network mapping, callback URL resolution, and pending callback handling for MTC disbursement.",
      },
      {
        path: "backend/src/app/routes/loan/bridgeWebhook.js",
        why: "Finalizes disbursement after Bridge sends the payout callback and updates the loan and customer state.",
      },
      {
        path: "backend/src/app/routes/loan/grantLoan.js",
        why: "Handles the difference between immediate success and callback-based pending disbursement so the response is accurate.",
      },
      {
        path: "backend/src/app/routes/loan/retryDisbursement.js",
        why: "Allows retries to succeed even when Bridge accepts the request and finishes later through webhook confirmation.",
      },
      {
        path: "backend/src/app/handlers/loanHandlers/disburseLoans.js",
        why: "Carries pending-state information through batch disbursement operations.",
      },
      {
        path: "backend/src/server.js",
        why: "Improves the socket callback message so admins know some Bridge disbursements are waiting for webhook completion.",
      },
    ],
  },
  {
    group: "Backend collection",
    items: [
      {
        path: "backend/src/app/routes/user/customerAuth.js",
        why: "Added Bridge collection initialization, provider-aware verification, callback URL resolution, and webhook finalization for portal repayment and extensions.",
      },
      {
        path: "backend/src/app/models/gatewayTransactions/index.js",
        why: "Used to persist pending Bridge repayment transactions until the webhook confirms the final result.",
      },
      {
        path: "backend/src/app/routes/loan/repaymen.js",
        why: "Added Bridge fallback support to the old legacy repayment route, including pending transaction storage and a legacy Bridge webhook.",
      },
    ],
  },
  {
    group: "Admin UI",
    items: [
      {
        path: "frontend/src/libs/systemConfig.js",
        why: "Updated frontend defaults and storage helpers to understand the new split gateway settings and Bridge support.",
      },
      {
        path: "frontend/src/main/system management/Config/index.js",
        why: "Added Bridge to both selectors, exposed separate collection and disbursement choices, and improved the Bridge credential labels in the config UI.",
      },
      {
        path: "frontend/src/config/navigation.js",
        why: "Added this new Docs submenu under System Management.",
      },
      {
        path: "frontend/src/main/index.js",
        why: "Registered the route for the System Docs page so it can open from the sidebar.",
      },
      {
        path: "frontend/src/main/system management/Docs/index.js",
        why: "This page documents the Bridge architecture, touched files, callback behavior, and the reason behind each code block and UI change.",
      },
    ],
  },
  {
    group: "Customer web app",
    items: [
      {
        path: "web-app/src/api/application.js",
        why: "Changed payment verification to use a provider-neutral endpoint instead of a Paystack-only route.",
      },
      {
        path: "web-app/src/App.js",
        why: "Updated the pending payment experience so Bridge phone prompts work without requiring a checkout window.",
      },
    ],
  },
];

const codeReasons = [
  {
    title: "Pending-state logic",
    snippet:
      "if (payoutResult.success) {\n  status = 'success';\n} else if (payoutResult.pending) {\n  status = 'pending';\n} else {\n  status = 'failed';\n}",
    why:
      "Bridge often accepts the request first and confirms later. This code prevents the system from wrongly marking accepted disbursements as failures.",
  },
  {
    title: "Provider-aware verification",
    snippet:
      "const verification = transaction.provider === 'bridge'\n  ? await verifyBridgeCharge(transaction, webhookEvent)\n  : await verifyPaystackCharge(reference);",
    why:
      "The customer web app can now support multiple gateways cleanly without hardcoding Paystack-only verification rules.",
  },
  {
    title: "Route-specific callback URLs",
    snippet:
      "const callbackUrl = resolveBridgeCallbackUrl(\n  req,\n  config.bridgeCallbackUrl || systemConfig.callbackUrl,\n  '/users/portal/bridge/webhook'\n);",
    why:
      "One public backend domain can safely serve several Bridge webhook flows without forcing the admin to manage different callback values manually.",
  },
];

const setupChecklist = [
  "Set `BRIDGE_API_USERNAME`, `BRIDGE_API_PASSWORD`, and `BRIDGE_SERVICE_ID` in the backend environment.",
  "Set `BRIDGE_CALLBACK_URL` to the public backend domain, for example `https://your-api-domain.com`.",
  "Choose `Bridge` in `Collection Gateway` if customer repayments should use Bridge CTM.",
  "Choose `Bridge` in `Disbursement Gateway` if loan payouts should use Bridge MTC.",
  "Make sure your public backend domain is reachable by Bridge webhook callbacks.",
];

export default function SystemDocs() {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white px-6 py-6 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-600">
              System Management
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-slate-900">
              Bridge Payment Integration Docs
            </h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              This page explains how Bridge was implemented for loan disbursement and
              collection, which files were touched, what UI was changed, and why each
              code path exists.
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Verified in admin build, web-app build, and backend module loading.
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {architectureSections.map((section) => (
          <article
            key={section.title}
            className="rounded-3xl border border-slate-200 bg-white px-6 py-6 shadow-sm"
          >
            <h4 className="text-lg font-semibold text-slate-900">{section.title}</h4>
            <div className="mt-4 space-y-3">
              {section.points.map((point) => (
                <div
                  key={point}
                  className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600"
                >
                  {point}
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white px-6 py-6 shadow-sm">
        <h4 className="text-lg font-semibold text-slate-900">Admin UI written for Bridge</h4>
        <div className="mt-4 grid gap-4 xl:grid-cols-3">
          {gatewaySelectors.map((item) => (
            <article
              key={item.title}
              className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4"
            >
              <h5 className="text-sm font-semibold text-slate-900">{item.title}</h5>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.reason}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white px-6 py-6 shadow-sm">
        <h4 className="text-lg font-semibold text-slate-900">Files touched and why</h4>
        <div className="mt-5 space-y-5">
          {touchedFiles.map((section) => (
            <div key={section.group}>
              <h5 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                {section.group}
              </h5>
              <div className="mt-3 grid gap-3">
                {section.items.map((item) => (
                  <div
                    key={item.path}
                    className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4"
                  >
                    <p className="font-mono text-xs text-cyan-700">{item.path}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{item.why}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        {codeReasons.map((item) => (
          <article
            key={item.title}
            className="rounded-3xl border border-slate-200 bg-white px-6 py-6 shadow-sm"
          >
            <h4 className="text-lg font-semibold text-slate-900">{item.title}</h4>
            <pre className="mt-4 overflow-x-auto rounded-2xl bg-slate-950 p-4 text-xs leading-6 text-slate-100">
              <code>{item.snippet}</code>
            </pre>
            <p className="mt-4 text-sm leading-6 text-slate-600">{item.why}</p>
          </article>
        ))}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white px-6 py-6 shadow-sm">
        <h4 className="text-lg font-semibold text-slate-900">Setup checklist</h4>
        <div className="mt-4 grid gap-3 xl:grid-cols-2">
          {setupChecklist.map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600"
            >
              {item}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
