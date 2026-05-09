import React from "react";
import { GlobalContext } from "../../../libs/context/globalContext";

export default function ImgModalContent() {
  const { imageToView, setImageToView, setmodalTitle } = React.useContext(GlobalContext);
  const [zoomLevel, setZoomLevel] = React.useState(1);

  React.useEffect(() => {
    setZoomLevel(1);
  }, [imageToView]);

  const handleClose = () => {
    setmodalTitle("");
    setImageToView("");
  };

  const handleZoomIn = () => {
    setZoomLevel((current) => Math.min(current + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel((current) => Math.max(current - 0.25, 0.5));
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Image preview</h3>
          <p className="text-sm text-slate-500">Use the controls to zoom in, zoom out, or close.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleZoomOut}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-lg font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            aria-label="Zoom out"
          >
            -
          </button>
          <button
            type="button"
            onClick={handleZoomIn}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-lg font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            aria-label="Zoom in"
          >
            +
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-lg font-semibold text-rose-600 transition hover:border-rose-300 hover:bg-rose-100"
            aria-label="Close image preview"
          >
            x
          </button>
        </div>
      </div>

      {imageToView === "" ? (
        <div className="p-6 text-sm text-slate-500">Invalid image url</div>
      ) : (
        <div className="flex max-h-[75vh] items-center justify-center overflow-auto bg-slate-950/95 p-4">
          <img
            src={imageToView}
            alt="Preview"
            className="max-w-full rounded-2xl object-contain shadow-2xl transition-transform duration-200"
            style={{
              maxHeight: "70vh",
              transform: `scale(${zoomLevel})`,
              transformOrigin: "center center",
            }}
          />
        </div>
      )}
    </div>
  );
}
