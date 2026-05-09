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
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10">
      <div className="w-full max-w-sm rounded-[24px] border border-slate-800 bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.35)] sm:p-7">
        <div className="mb-6 flex items-center justify-center gap-3 text-center">
          <img
            src={`${process.env.PUBLIC_URL}/pathwaylogo.png`}
            alt="Pathway Loans"
            className="h-12 w-12 rounded-2xl object-cover"
          />
          <h2 className="text-[28px] font-semibold leading-none text-slate-900">
            Pathway Loans
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
            <div className="space-y-2 rounded-2xl border border-dashed border-slate-300 bg-white px-3 py-2.5">
              <input
                type="text"
                disabled={loader}
                className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white"
                placeholder="Enter code"
                value={captchaInput}
                onChange={(e) =>
                  _handleOnchange({
                    field: "captcha",
                    value: e.target.value,
                  })
                }
              />
              <div className="flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate text-lg font-semibold tracking-[0.3em] text-slate-900">
                  {captchaCode}
                </span>
                <button
                  type="button"
                  onClick={resetCaptcha}
                  className="shrink-0 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
                >
                  Reset
                </button>
                <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-center text-xs font-semibold text-slate-600">
                  {captchaExpiresIn}s
                </span>
              </div>
            </div>
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
              className="app-btn-primary min-w-[160px]"
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
