import React from "react";
import { GlobalContext } from "../../../../../libs/context/globalContext";
import MyModal from "../../../../modals";
import ImgModalContent from "../../../../modals/imgContent";

export default function IdentityInfo() {
  const { loan, customers, modalTitle, setmodalTitle, setImageToView } =
    React.useContext(GlobalContext);

  let customer = customers.find((item) => item.userId === loan.userId);

  let dob = customer === undefined ? "" : customer.pesonalInfo.dob;

  let age = new Date().getFullYear() - new Date(dob).getFullYear();

  return (
    <div>
      <div className="card">
        <div className="card-body">
          <div className="row" style={{ paddingTop: "none" }}>
            <div
              className="col"
              style={{
                backgroundColor: "#79bbff",
                height: "2.5rem",
                display: "flex",
                alignItems: "center",
                color: "white ",
              }}
            >
              Identity information and OCR verification
            </div>
          </div>
          <div className="row">
            <div
              className=" col-2 border"
              style={{ backgroundColor: "#f2f6fc" }}
            >
              OCR
            </div>
            <div className=" col-2 border" style={{}}></div>
            <div
              className=" col-2 border"
              style={{ backgroundColor: "#f2f6fc" }}
            >
              OCR ID Number
            </div>
            <div className=" col-2 border" style={{}}>
              {customer === undefined ? "" : customer.IDinfo.gCardNumber}
            </div>

            <div
              className=" col-2 border"
              style={{ backgroundColor: "#f2f6fc" }}
            >
              Age
            </div>
            <div className=" col-2 border" style={{}}>
              {age}
            </div>
          </div>
          <div className="row">
            <div
              className=" col-2 border"
              style={{ backgroundColor: "#f2f6fc" }}
            >
              Province
            </div>
            <div className=" col-2 border" style={{}}>
              {customer === undefined ? "" : customer.pesonalInfo.areaName}
            </div>
            <div
              className=" col-2 border"
              style={{ backgroundColor: "#f2f6fc" }}
            >
              OCR Similarity
            </div>
            <div className=" col-2 border" style={{}}></div>
          </div>
          <div className="row">
            <div
              className=" col-2 border"
              style={{ backgroundColor: "#f2f6fc" }}
            >
              Live Photo
            </div>
            <div className=" col-2">
              <img
                src={loan.facialRecog}
                alt="Live verification selfie"
                width={100}
                height={100}
                type="button"
                role="button"
                onClick={() => {
                  setImageToView(loan.facialRecog);
                  setmodalTitle("imgContent");
                }}
              />
            </div>
            <div
              className=" col-2 border"
              style={{ backgroundColor: "#f2f6fc" }}
            >
              ID Card Picture
            </div>
            <div className=" col-2 border" style={{}}>
              <img
                src={customer === undefined ? "" : customer.IDinfo.idFront}
                alt="ID card front"
                width={100}
                height={100}
                type="button"
                role="button"
                onClick={() => {
                  setImageToView(customer.IDinfo.idFront);
                  setmodalTitle("imgContent");
                }}
              />
            </div>
            <div
              className=" col-2 border"
              style={{ backgroundColor: "#f2f6fc" }}
            >
              givive Picture
            </div>
            <div className=" col-2 border" style={{}}>
              <img src="avatar.png" alt="Customer avatar" width="100" height="100" />
            </div>
          </div>
        </div>
      </div>
      {modalTitle === "imgContent" ? (
        <MyModal>
          <ImgModalContent />
        </MyModal>
      ) : null}
    </div>
  );
}
