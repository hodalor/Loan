import React from "react";
import { GlobalContext } from "../../libs/context/globalContext";

export default function UploadFile() {
  const { _handleOnChange, inputs } = React.useContext(GlobalContext);

  const handleChange = (file) => {
    _handleOnChange({
      field: "image",
      value: file,
    });
  };

  return (
    <label className="flex min-h-[108px] w-full cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center transition hover:border-blue-400 hover:bg-blue-50/60">
      <span className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V7m0 0-3.5 3.5M12 7l3.5 3.5" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15.5A3.5 3.5 0 0 0 8.5 19h7a3.5 3.5 0 1 0 .6-6.95A5 5 0 0 0 6.1 10.5 3 3 0 0 0 5 15.5Z" />
        </svg>
      </span>
      <span className="text-sm font-semibold text-slate-700">
        {inputs.image !== null ? inputs.image.name : "Upload record proof"}
      </span>
      <span className="mt-1 text-xs text-slate-500">PNG, JPG, PDF, or screenshot proof</span>
      <input hidden type="file" onChange={(img) => handleChange(img.target.files[0])} />
    </label>
  );
}
