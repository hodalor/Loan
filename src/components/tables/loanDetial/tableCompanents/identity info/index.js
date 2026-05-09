import React from "react";
import { GlobalContext } from "../../../../../libs/context/globalContext";
import MyModal from "../../../../modals";
import ImgModalContent from "../../../../modals/imgContent";
import {
  DetailMatrix,
  DetailSectionCard,
  DetailSectionHint,
  StatusBadge,
} from "../../DetailSectionCard";
import useResolvedLoanDetails from "../../useResolvedLoanDetails";

export default function IdentityInfo() {
  const { modalTitle, setmodalTitle, setImageToView } = React.useContext(GlobalContext);
  const { loan, customer, customerProfileLoading } = useResolvedLoanDetails();
  const [livePhotoFailed, setLivePhotoFailed] = React.useState(false);
  const [idFrontFailed, setIdFrontFailed] = React.useState(false);
  const dob = customer?.pesonalInfo?.dob || "";
  const age = dob ? new Date().getFullYear() - new Date(dob).getFullYear() : "-";
  const livePhoto = loan?.facialRecog || "";
  const idFront = customer?.IDinfo?.idFront || "";
  const canOpenLivePhoto = Boolean(livePhoto) && !livePhotoFailed;
  const canOpenIdFront = Boolean(idFront) && !idFrontFailed;

  React.useEffect(() => {
    setLivePhotoFailed(false);
  }, [livePhoto]);

  React.useEffect(() => {
    setIdFrontFailed(false);
  }, [idFront]);
  const matchingRows = [
    [
      { type: "label", content: "OCR name" },
      {
        content:
          [customer?.IDinfo?.firstName, customer?.IDinfo?.middleName, customer?.IDinfo?.lastName]
            .filter(Boolean)
            .join(" ") || "-",
      },
      { type: "label", content: "OCR ID number" },
      { content: customer?.IDinfo?.gCardNumber || "-" },
      { type: "label", content: "Age" },
      { content: age },
    ],
    [
      { type: "label", content: "Province" },
      { content: customer?.pesonalInfo?.areaName || "-" },
      { type: "label", content: "Area" },
      { content: customer?.pesonalInfo?.dAddress || "-" },
      { type: "label", content: "OCR similarity" },
      { content: "-" },
    ],
  ];

  return (
    <div>
      <DetailSectionCard
        title="Internal matching information"
        subtitle="Identity check, OCR data, and image verification for this customer."
      >
        <DetailSectionHint
          text={
            customerProfileLoading
              ? "Loading the full identity record and verification images."
              : "Tap any available image to open it in the preview modal."
          }
        />
        <DetailMatrix rows={matchingRows} />

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <button
            type="button"
            onClick={() => {
              if (!canOpenLivePhoto) return;
              setImageToView(livePhoto);
              setmodalTitle("imgContent");
            }}
            className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm disabled:cursor-not-allowed disabled:opacity-70"
            disabled={!canOpenLivePhoto}
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-slate-900">Living photo</span>
              <StatusBadge tone={livePhotoFailed ? "danger" : livePhoto ? "success" : "neutral"}>
                {livePhotoFailed ? "Failed" : livePhoto ? "Available" : "Missing"}
              </StatusBadge>
            </div>
            {canOpenLivePhoto ? (
              <img
                src={livePhoto}
                alt="Live verification selfie"
                className="h-28 w-full rounded-2xl object-cover"
                onError={() => setLivePhotoFailed(true)}
              />
            ) : (
              <div className="flex h-28 items-center justify-center rounded-2xl bg-slate-100 text-sm text-slate-500">
                {livePhotoFailed ? "Image failed to load" : "No image"}
              </div>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              if (!canOpenIdFront) return;
              setImageToView(idFront);
              setmodalTitle("imgContent");
            }}
            className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm disabled:cursor-not-allowed disabled:opacity-70"
            disabled={!canOpenIdFront}
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-slate-900">ID card picture</span>
              <StatusBadge tone={idFrontFailed ? "danger" : idFront ? "success" : "neutral"}>
                {idFrontFailed ? "Failed" : idFront ? "Available" : "Missing"}
              </StatusBadge>
            </div>
            {canOpenIdFront ? (
              <img
                src={idFront}
                alt="ID card front"
                className="h-28 w-full rounded-2xl object-cover"
                onError={() => setIdFrontFailed(true)}
              />
            ) : (
              <div className="flex h-28 items-center justify-center rounded-2xl bg-slate-100 text-sm text-slate-500">
                {idFrontFailed ? "Image failed to load" : "No image"}
              </div>
            )}
          </button>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-slate-900">ID genggam</span>
              <StatusBadge tone="danger">Failed</StatusBadge>
            </div>
            <div className="flex h-28 items-center justify-center rounded-2xl bg-slate-100 text-sm text-slate-500">
              Verification pending
            </div>
          </div>
        </div>
      </DetailSectionCard>
      {modalTitle === "imgContent" ? (
        <MyModal>
          <ImgModalContent />
        </MyModal>
      ) : null}
    </div>
  );
}
