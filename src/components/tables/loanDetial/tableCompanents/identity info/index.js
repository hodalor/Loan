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
import { isLegacyMediaUrl, resolveMediaUrl } from "../../../../../libs/mediaUrl";
import useResolvedLoanDetails from "../../useResolvedLoanDetails";

function LegacyMediaNotice({ show = false }) {
  if (!show) return null;

  return (
    <div className="mt-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
      This image still points to a legacy `/upload` file. Re-upload it so it is saved in persistent storage.
    </div>
  );
}

export default function IdentityInfo() {
  const { modalTitle, setmodalTitle, setImageToView } = React.useContext(GlobalContext);
  const { loan, customer, customerProfileLoading } = useResolvedLoanDetails();
  const [livePhotoFailed, setLivePhotoFailed] = React.useState(false);
  const [idFrontFailed, setIdFrontFailed] = React.useState(false);
  const [idBackFailed, setIdBackFailed] = React.useState(false);
  const dob = customer?.pesonalInfo?.dob || "";
  const age = dob ? new Date().getFullYear() - new Date(dob).getFullYear() : "-";
  const livePhoto = resolveMediaUrl(customer?.userImage || loan?.facialRecog || "");
  const idFront = resolveMediaUrl(customer?.IDinfo?.idFront || "");
  const idBack = resolveMediaUrl(customer?.IDinfo?.idBack || "");
  const livePhotoLegacy =
    isLegacyMediaUrl(customer?.userImage || "") || isLegacyMediaUrl(loan?.facialRecog || "");
  const idFrontLegacy = isLegacyMediaUrl(customer?.IDinfo?.idFront || "");
  const idBackLegacy = isLegacyMediaUrl(customer?.IDinfo?.idBack || "");
  const canOpenLivePhoto = Boolean(livePhoto) && !livePhotoFailed;
  const canOpenIdFront = Boolean(idFront) && !idFrontFailed;
  const canOpenIdBack = Boolean(idBack) && !idBackFailed;

  React.useEffect(() => {
    setLivePhotoFailed(false);
  }, [livePhoto]);

  React.useEffect(() => {
    setIdFrontFailed(false);
  }, [idFront]);

  React.useEffect(() => {
    setIdBackFailed(false);
  }, [idBack]);
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
              : livePhotoLegacy || idFrontLegacy || idBackLegacy
              ? "Some identity images still use legacy /upload storage and should be re-uploaded."
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
              <StatusBadge
                tone={
                  livePhotoFailed
                    ? "danger"
                    : livePhotoLegacy
                    ? "warning"
                    : livePhoto
                    ? "success"
                    : "neutral"
                }
              >
                {livePhotoFailed
                  ? "Failed"
                  : livePhotoLegacy
                  ? "Legacy"
                  : livePhoto
                  ? "Available"
                  : "Missing"}
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
            <LegacyMediaNotice show={livePhotoLegacy} />
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
              <span className="text-sm font-semibold text-slate-900">ID front photo</span>
              <StatusBadge
                tone={
                  idFrontFailed
                    ? "danger"
                    : idFrontLegacy
                    ? "warning"
                    : idFront
                    ? "success"
                    : "neutral"
                }
              >
                {idFrontFailed
                  ? "Failed"
                  : idFrontLegacy
                  ? "Legacy"
                  : idFront
                  ? "Available"
                  : "Missing"}
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
            <LegacyMediaNotice show={idFrontLegacy} />
          </button>

          <button
            type="button"
            onClick={() => {
              if (!canOpenIdBack) return;
              setImageToView(idBack);
              setmodalTitle("imgContent");
            }}
            className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm disabled:cursor-not-allowed disabled:opacity-70"
            disabled={!canOpenIdBack}
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-slate-900">ID back photo</span>
              <StatusBadge
                tone={
                  idBackFailed
                    ? "danger"
                    : idBackLegacy
                    ? "warning"
                    : idBack
                    ? "success"
                    : "neutral"
                }
              >
                {idBackFailed
                  ? "Failed"
                  : idBackLegacy
                  ? "Legacy"
                  : idBack
                  ? "Available"
                  : "Missing"}
              </StatusBadge>
            </div>
            {canOpenIdBack ? (
              <img
                src={idBack}
                alt="ID card back"
                className="h-28 w-full rounded-2xl object-cover"
                onError={() => setIdBackFailed(true)}
              />
            ) : (
              <div className="flex h-28 items-center justify-center rounded-2xl bg-slate-100 text-sm text-slate-500">
                {idBackFailed ? "Image failed to load" : "No image"}
              </div>
            )}
            <LegacyMediaNotice show={idBackLegacy} />
          </button>
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
