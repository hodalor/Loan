import React from "react";
import { GlobalContext } from "../../../libs/context/globalContext";

class LoanDetailsErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error("Loan details render error", error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

export class LoanDetailSectionBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error(`Loan detail section failed: ${this.props.title || "Unknown section"}`, error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="card">
          <div className="card-body">
            <div className="rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
              <div className="font-semibold">
                {this.props.title || "This section"} could not be displayed.
              </div>
              <div className="mt-1 text-amber-700">
                The rest of the page is still available while this section is being fixed.
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function LoanDetailsPageShell({ children, emptyRedirect = "/order-list" }) {
  const { loan, bootstrapLoading, _routeToPage } = React.useContext(GlobalContext);
  const hasSelectedLoan = Boolean(loan?.ID || loan?.userId);

  const fallbackCard = (
    <div className="Container">
      <div className="card">
        <div className="card-body" style={{ padding: "2rem", textAlign: "center" }}>
          <h3 style={{ marginBottom: "0.75rem" }}>Unable to display loan details</h3>
          <p style={{ marginBottom: "1rem", color: "#64748b" }}>
            This loan record is missing some data needed by the details screen.
          </p>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "0.75rem",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => _routeToPage(emptyRedirect)}
            >
              Open Case List
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => window.location.reload()}
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (bootstrapLoading) {
    return (
      <div className="Container">
        <div className="card">
          <div className="card-body" style={{ padding: "2rem", textAlign: "center" }}>
            Loading loan details...
          </div>
        </div>
      </div>
    );
  }

  if (!hasSelectedLoan) {
    return (
      <div className="Container">
        <div className="card">
          <div className="card-body" style={{ padding: "2rem", textAlign: "center" }}>
            <h3 style={{ marginBottom: "0.75rem" }}>No loan selected</h3>
            <p style={{ marginBottom: "1rem", color: "#64748b" }}>
              Open this page from a loan row first so the system knows which loan to display.
            </p>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "0.75rem",
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => _routeToPage(emptyRedirect)}
              >
                Open Case List
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => _routeToPage("/dashboard")}
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <LoanDetailsErrorBoundary fallback={fallbackCard}>{children}</LoanDetailsErrorBoundary>;
}
