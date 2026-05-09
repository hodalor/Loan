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
  const dob = customer?.pesonalInfo?.dob || "";
  const age = dob ? new Date().getFullYear() - new Date(dob).getFullYear() : "-";
  const livePhoto = loan?.facialRecog || "";
  const idFront = customer?.IDinfo?.idFront || "";
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
              if (!livePhoto) return;
              setImageToView(livePhoto);
              setmodalTitle("imgContent");
            }}
            className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm disabled:cursor-not-allowed disabled:opacity-70"
            disabled={!livePhoto}
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-slate-900">Living photo</span>
              <StatusBadge tone={livePhoto ? "success" : "neutral"}>
                {livePhoto ? "Available" : "Missing"}
              </StatusBadge>
            </div>
            {livePhoto ? (
              <img
                src={livePhoto}
                alt="Live verification selfie"
                className="h-28 w-full rounded-2xl object-cover"
              />
            ) : (
              <div className="flex h-28 items-center justify-center rounded-2xl bg-slate-100 text-sm text-slate-500">
                No image
              </div>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              if (!idFront) return;
              setImageToView(idFront);
              setmodalTitle("imgContent");
            }}
            className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm disabled:cursor-not-allowed disabled:opacity-70"
            disabled={!idFront}
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-slate-900">ID card picture</span>
              <StatusBadge tone={idFront ? "success" : "neutral"}>
                {idFront ? "Available" : "Missing"}
              </StatusBadge>
            </div>
            {idFront ? (
              <img src={idFront} alt="ID card front" className="h-28 w-full rounded-2xl object-cover" />
            ) : (
              <div className="flex h-28 items-center justify-center rounded-2xl bg-slate-100 text-sm text-slate-500">
                No image
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
