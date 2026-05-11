import React from "react";
import { GlobalContext } from "../../libs/context/globalContext";

export default function MyModal(props) {
  const {
    openModal,
    setModal,
    addUserModal,
    setaddUserModal,
    assignModal,
    setAssignModal,
    setSelectedCases,
    modalTitle,
    setmodalTitle,
    setLoanDetailsModal,
    loanDetailsModals,
    callRecords,
    setCallRecordsModal,
    setImageToView,
  } = React.useContext(GlobalContext);

  const _renderModal = () => {
    if (modalTitle === "userDetailsM") return openModal;
    if (modalTitle === "addUserModal") return addUserModal;
    if (modalTitle === "assignModal") return assignModal;
    if (modalTitle === "preColContent") return true;
    if (modalTitle === "colContent") return true;
    if (modalTitle === "loanDetails") return loanDetailsModals;
    if (modalTitle === "callRecords") return callRecords;
    if (modalTitle === "imgContent") return true;
    if (modalTitle === "publicT") return true;

    if (modalTitle === "") return null;
  };

  const _closeModal = () => {
    if (modalTitle === "userDetailsM") {
      setmodalTitle("");
      setModal(false);
      return;
    }
    if (modalTitle === "addUserModal") {
      setmodalTitle("");
      setaddUserModal(false);
      return;
    }
    if (modalTitle === "assignModal") {
      setSelectedCases([]);
      setmodalTitle("");
      setAssignModal(false);
      return;
    }
    if (modalTitle === "loanDetails") {
      setmodalTitle("");
      setLoanDetailsModal(false);
      return;
    }
    if (modalTitle === "callRecords") {
      setmodalTitle("");
      setCallRecordsModal(false);
      return;
    }
    if (modalTitle === "preColContent") {
      setmodalTitle("");
      return;
    }
    if (modalTitle === "colContent") {
      setmodalTitle("");
      return;
    }
    if (modalTitle === "imgContent") {
      setmodalTitle("");
      setImageToView("");
      return;
    }
    if (modalTitle === "publicT") {
      setmodalTitle("");
      return;
    }
  };

  const isOpen = Boolean(_renderModal());
  const modalSizeClassName =
    modalTitle === "assignModal" || modalTitle === "preColContent" || modalTitle === "colContent"
      ? "max-w-[680px]"
      : modalTitle === "callRecords"
      ? "max-w-2xl"
      : modalTitle === "imgContent"
      ? "max-w-5xl"
      : "max-w-[880px]";

  return (
    isOpen ? (
      <div
        className="fixed inset-0 z-[1400] flex items-center justify-center bg-slate-900/50 p-4"
        onClick={_closeModal}
      >
        <div
          className={`max-h-[92vh] w-full ${modalSizeClassName} overflow-y-auto rounded-[24px] border border-slate-200 bg-white p-0 shadow-[0_24px_80px_rgba(15,23,42,0.18)]`}
          onClick={(event) => event.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
          {props.children}
        </div>
      </div>
    ) : null
  );
}
