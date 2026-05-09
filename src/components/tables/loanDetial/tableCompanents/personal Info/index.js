import React from "react";
import { GlobalContext } from "../../../../../libs/context/globalContext";

export default function PersonalInfo() {
  const { loan, customers } = React.useContext(GlobalContext);
  let customer = customers.find((item) => item.userId === loan.userId);

  let contacts = customer === undefined ? [] : customer.contacts;
  var totalContacts = contacts.length;

  return (
    <div>
      <div className="card">
        <div className="card-body">
          <div className="row">
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
              Personal information
            </div>
          </div>
          <div className="row">
            <div
              className=" col-2 border"
              style={{ backgroundColor: "#f2f6fc" }}
            >
              Name
            </div>
            <div className=" col-2 border" style={{}}>
              {customer === undefined
                ? ""
                : customer.IDinfo.firstName +
                  " " +
                  customer.IDinfo.middleName +
                  " " +
                  customer.IDinfo.lastName}
            </div>
            <div
              className=" col-2 border"
              style={{ backgroundColor: "#f2f6fc" }}
            >
              ID Number
            </div>
            <div className=" col-2 border" style={{}}>
              {customer === undefined ? "" : customer.IDinfo.gCardNumber}
            </div>
            <div
              className=" col-2 border"
              style={{ backgroundColor: "#f2f6fc" }}
            >
              ID Type
            </div>
            <div className=" col-2 border" style={{}}>
              GHANA CARD
            </div>
          </div>
          <div className="row">
            <div
              className=" col-2 border"
              style={{ backgroundColor: "#f2f6fc" }}
            >
              Gender
            </div>
            <div className=" col-2 border" style={{}}>
              {customer === undefined ? "" : customer.IDinfo.gender}
            </div>
            <div
              className=" col-2 border"
              style={{ backgroundColor: "#f2f6fc" }}
            >
              Education
            </div>
            <div className=" col-2 border" style={{}}>
              {customer === undefined
                ? ""
                : customer.pesonalInfo.educationalLevel}
            </div>
            <div
              className=" col-2 border"
              style={{ backgroundColor: "#f2f6fc" }}
            >
              Marital Status
            </div>
            <div className=" col-2 border" style={{}}>
              {customer === undefined ? "" : customer.pesonalInfo.maritalStatus}
            </div>
          </div>
          <div className="row">
            <div
              className=" col-2 border"
              style={{ backgroundColor: "#f2f6fc" }}
            >
              Area Name
            </div>
            <div className=" col-10 border" style={{ height: "2rem" }}>
              {customer === undefined ? "" : customer.pesonalInfo.areaName}
            </div>
          </div>
          <div className="row">
            <div
              className=" col-2 border"
              style={{ backgroundColor: "#f2f6fc", height: "2rem" }}
            >
              LandmarK
            </div>
            <div className=" col-10 border" style={{}}>
              {customer === undefined ? "" : customer.pesonalInfo.landMark}
            </div>
          </div>
          <div className="row">
            <div
              className=" col-2 border"
              style={{ backgroundColor: "#f2f6fc" }}
            >
              GPS information when submit order
            </div>
            <div className=" col-10 border" style={{}}></div>
          </div>
          <div className="row">
            <div
              className=" col-2 border"
              style={{ backgroundColor: "#f2f6fc" }}
            >
              Digital Address
            </div>
            <div className=" col-2 border" style={{}}>
              {customer === undefined ? "" : customer.pesonalInfo.dAddress}
            </div>
            <div
              className=" col-2 border"
              style={{ backgroundColor: "#f2f6fc" }}
            >
              Time Of Residence(years)
            </div>
            <div className=" col-2 border" style={{}}>
              {customer === undefined ? "" : customer.pesonalInfo.residenceTime}
            </div>
            <div
              className=" col-2 border"
              style={{ backgroundColor: "#f2f6fc" }}
            >
              Application Phone Number
            </div>
            <div className=" col-2 border" style={{}}>
              {customer === undefined ? "" : customer.phone}
            </div>
          </div>
          <div className="row">
            <div
              className=" col-2 border"
              style={{ backgroundColor: "#f2f6fc" }}
            >
              Total Phone Book
            </div>
            <div className=" col-2 border" style={{}}>
              {totalContacts} contacts found
            </div>
            <div
              className=" col-2 border"
              style={{ backgroundColor: "#f2f6fc" }}
            >
              Altenative Number
            </div>
            <div className=" col-2 border" style={{}}>
              {customer === undefined ? "" : customer.pesonalInfo.bUPphone}
            </div>
            <div
              className=" col-2 border"
              style={{ backgroundColor: "#f2f6fc" }}
            >
              Main Source Of Income
            </div>
            <div className=" col-2 border" style={{}}>
              {customer === undefined ? "" : customer.pesonalInfo.incomeSource}
            </div>
          </div>
          <div className="row">
            <div
              className=" col-2 border"
              style={{ backgroundColor: "#f2f6fc" }}
            >
              Date Of Birth
            </div>
            <div className=" col-2 border" style={{}}>
              {new Date(
                customer === undefined ? "" : customer.pesonalInfo.dob
              ).toLocaleDateString()}
            </div>
            <div
              className=" col-2 border"
              style={{ backgroundColor: "#f2f6fc" }}
            >
              Number Dependent
            </div>
            <div className=" col-2 border" style={{}}>
              {customer === undefined ? "" : customer.pesonalInfo.relativesINOC}
            </div>
            <div
              className=" col-2 border"
              style={{ backgroundColor: "#f2f6fc" }}
            >
              Work
            </div>
            <div className=" col-2 border" style={{}}>
              {customer === undefined ? "" : customer.workInfo.workContent}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
