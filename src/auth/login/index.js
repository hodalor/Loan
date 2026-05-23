import React from "react";
import DefaultLoader from "../../components/loaders/defaultLoader";
import AppToast from "../../components/feedback/AppToast";
import { AuthContext } from "../../libs/context/authContext";

export default function Login() {
  const {
    _logIn,
    _handleOnchange,
    inputs,
    loader,
    alerts,
    setAlerts,
    _handleRemember,
    remember,
    captchaCode,
    captchaInput,
    captchaExpiresIn,
    resetCaptcha,
  } = React.useContext(AuthContext);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-3 py-6 sm:px-4 sm:py-10">
      <div className="w-full max-w-sm rounded-[24px] border border-slate-800 bg-white p-4 shadow-[0_30px_80px_rgba(15,23,42,0.35)] sm:p-6 md:max-w-md md:p-7">
        <div className="mb-5 flex flex-col items-center justify-center gap-3 text-center sm:mb-6 sm:flex-row">
          <img
            src={`${process.env.PUBLIC_URL}/pathwaylogo.png`}
            alt="Pathway Loans"
            className="h-12 w-12 rounded-2xl object-cover sm:h-12 sm:w-12"
          />
          <h2 className="text-center text-[24px] font-semibold leading-tight text-slate-900 sm:text-[28px] sm:leading-none">
            SPEED CASH
          </h2>
        </div>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!loader) _logIn();
          }}
        >
          <div>
            <label className="app-label">User name</label>
            <input
              type="text"
              disabled={loader}
              className="app-input"
              placeholder="User name"
              value={inputs.userName}
              onChange={(e) =>
                _handleOnchange({
                  field: "userName",
                  value: e.target.value.toUpperCase(),
                })
              }
            />
          </div>

          <div>
            <label className="app-label">Password</label>
            <input
              type="password"
              disabled={loader}
              className="app-input"
              placeholder="Password"
              value={inputs.password}
              onChange={(e) =>
                _handleOnchange({ field: "pass", value: e.target.value })
              }
              onKeyUp={(e) => {
                if (e.key === "Enter") return _logIn();
              }}
            />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div className="mb-2 flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="mb-1 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                  Security code
                </p>
                <span className="block break-all font-mono text-base font-semibold tracking-[0.16em] text-slate-900 sm:text-xl sm:tracking-[0.3em]">
                  {captchaCode}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={resetCaptcha}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-900 bg-slate-900 text-sm text-white shadow-sm transition hover:border-black hover:bg-black"
                  aria-label="Reset captcha"
                  title="Reset captcha"
                >
                  <i className="fa fa-refresh" aria-hidden="true" />
                </button>
                <span className="shrink-0 text-xs font-semibold text-slate-500">
                  {captchaExpiresIn}s
                </span>
              </div>
            </div>
            <input
              type="text"
              disabled={loader}
              className="app-input py-2.5 text-sm"
              placeholder="Enter code"
              value={captchaInput}
              onChange={(e) =>
                _handleOnchange({
                  field: "captcha",
                  value: e.target.value,
                })
              }
            />
          </div>

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => _handleRemember(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              Remember me
            </label>

            <button
              type="submit"
              disabled={loader}
              className="app-btn-primary w-full sm:min-w-[160px] sm:w-auto"
            >
              {loader ? <DefaultLoader /> : "Sign In"}
            </button>
          </div>
        </form>
      </div>
      <AppToast
        open={alerts.open}
        message={alerts.msg}
        type={alerts.type}
        onClose={() =>
          setAlerts({
            open: false,
            msg: "",
            type: "",
          })
        }
      />
    </div>
  );
}
