import React from "react";

export default function LoanListContent() {
  return (
    <div
      style={{
        width: 900,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: "90%",
          borderBottomWidth: 0.3,
          borderBottom: "solid",
          borderBottomColor: "grey",
          marginBottom: 1,
          fontWeight: "bold",
          fontSize: 13,
        }}
      >
        Loan Details
      </div>
      <div
        style={{
          display: "flex",
          alignSelf: "flex-start",
          marginTop: 5,
          padding: 3,
          width: "100%",
        }}
      >
        <div className="row">
          <div className="col-md-3 mt-3">
            <div
              className="color-palette-set"
              style={{
                margin: 2,
                padding: 2,
                fontSize: 14,
                borderRadius: 2,
              }}
            >
              <div className=" color-palette pl-2 pr-2">
                <span>Order Id</span>
              </div>
              <div className="bg-light disabled color-palette pl-2 pr-2">
                <span>65784</span>
              </div>
            </div>
          </div>
          <div className="col-md-3 mt-3">
            <div
              className="color-palette-set"
              style={{ margin: 2, padding: 2, fontSize: 14, borderRadius: 2 }}
            >
              <div className="bg-light color-palette pl-2 pr-2">
                <span>User Id</span>
              </div>
              <div className="bg-light disabled color-palette pl-2 pr-2">
                <span>65784</span>
              </div>
            </div>
          </div>
          <div className="col-md-3 mt-3">
            <div
              className="color-palette-set"
              style={{ margin: 2, padding: 2, fontSize: 14, borderRadius: 2 }}
            >
              <div className="bg-light color-palette pl-2 pr-2">
                <span>User Name</span>
              </div>
              <div className="bg-light disabled color-palette pl-2 pr-2">
                <span>Prince hodallor</span>
              </div>
            </div>
          </div>
          <div className="col-md-3 mt-3">
            <div
              className="color-palette-set"
              style={{ margin: 2, padding: 2, fontSize: 14, borderRadius: 2 }}
            >
              <div className="bg-light color-palette pl-2 pr-2">
                <span>Phone Number</span>
              </div>
              <div className="bg-light disabled color-palette pl-2 pr-2">
                <span>754684987</span>
              </div>
            </div>
          </div>
          <div className="col-md-3 mt-3">
            <div
              className="color-palette-set"
              style={{ margin: 2, padding: 2, fontSize: 14, borderRadius: 2 }}
            >
              <div className="bg-light color-palette pl-2 pr-2">
                <span>Registeration Date</span>
              </div>
              <div className="bg-light disabled color-palette pl-2 pr-2">
                <span>53755866</span>
              </div>
            </div>
          </div>
          <div className="col-md-3 mt-3">
            <div
              className="color-palette-set"
              style={{ margin: 2, padding: 2, fontSize: 14, borderRadius: 2 }}
            >
              <div className="bg-light color-palette pl-2 pr-2">
                <span>ID Number</span>
              </div>
              <div className="bg-light disabled color-palette pl-2 pr-2">
                <span>64576588678</span>
              </div>
            </div>
          </div>
          <div className="col-md-3 mt-3">
            <div
              className="color-palette-set"
              style={{ margin: 2, padding: 2, fontSize: 14, borderRadius: 2 }}
            >
              <div className="bg-light color-palette pl-2 pr-2">
                <span>Loan Status</span>
              </div>
              <div className="bg-light disabled color-palette pl-2 pr-2">
                <span>Granted</span>
              </div>
            </div>
          </div>
          <div className="col-md-3 mt-3">
            <div
              className="color-palette-set"
              style={{ margin: 2, padding: 2, fontSize: 14, borderRadius: 2 }}
            >
              <div className="bg-light color-palette pl-2 pr-2">
                <span>Gender</span>
              </div>
              <div className="bg-light disabled color-palette pl-2 pr-2">
                <span>Female</span>
              </div>
            </div>
          </div>
          <div className="col-md-3 mt-3">
            <div
              className="color-palette-set"
              style={{ margin: 2, padding: 2, fontSize: 14, borderRadius: 2 }}
            >
              <div className="bg-light color-palette pl-2 pr-2">
                <span>Educational Level</span>
              </div>
              <div className="bg-light disabled color-palette pl-2 pr-2">
                <span>SHS</span>
              </div>
            </div>
          </div>
          <div className="col-md-3 mt-3">
            <div
              className="color-palette-set"
              style={{ margin: 2, padding: 2, fontSize: 14, borderRadius: 2 }}
            >
              <div className="bg-light color-palette pl-2 pr-2">
                <span>Age</span>
              </div>
              <div className="bg-light disabled color-palette pl-2 pr-2">
                <span>34</span>
              </div>
            </div>
          </div>
          <div className="col-md-3 mt-3">
            <div
              className="color-palette-set"
              style={{ margin: 2, padding: 2, fontSize: 14, borderRadius: 2 }}
            >
              <div className="bg-light color-palette pl-2 pr-2">
                <span>User Level</span>
              </div>
              <div className="bg-light disabled color-palette pl-2 pr-2">
                <span>4</span>
              </div>
            </div>
          </div>
          <div className="col-md-3 mt-3">
            <div
              className="color-palette-set"
              style={{ margin: 2, padding: 2, fontSize: 14, borderRadius: 2 }}
            >
              <div className="bg-light color-palette pl-2 pr-2">
                <span>Number Of Settled Loans</span>
              </div>
              <div className="bg-light disabled color-palette pl-2 pr-2">
                <span>2</span>
              </div>
            </div>
          </div>
          <div className="col-md-3 mt-3">
            <div
              className="color-palette-set"
              style={{ margin: 2, padding: 2, fontSize: 14, borderRadius: 2 }}
            >
              <div className="bg-light color-palette pl-2 pr-2">
                <span>Re-Payment Amount</span>
              </div>
              <div className="bg-light disabled color-palette pl-2 pr-2">
                <span>120</span>
              </div>
            </div>
          </div>
          <div className="col-md-3 mt-3">
            <div
              className="color-palette-set"
              style={{ margin: 2, padding: 2, fontSize: 14, borderRadius: 2 }}
            >
              <div className="bg-light color-palette pl-2 pr-2">
                <span>Loan Amount</span>
              </div>
              <div className="bg-light disabled color-palette pl-2 pr-2">
                <span>100</span>
              </div>
            </div>
          </div> 
          <div className="col-md-3 mt-3">
            <div
              className="color-palette-set"
              style={{ margin: 2, padding: 2, fontSize: 14, borderRadius: 2 }}
            >
              <div className="bg-light color-palette pl-2 pr-2">
                <span>Loan Duration</span>
              </div>
              <div className="bg-light disabled color-palette pl-2 pr-2">
                <span>12</span>
              </div>
            </div>
          </div>
          <div className="col-md-3 mt-3">
            <div
              className="color-palette-set"
              style={{ margin: 2, padding: 2, fontSize: 14, borderRadius: 2 }}
            >
              <div className="bg-light color-palette pl-2 pr-2">
                <span>Interest</span>
              </div>
              <div className="bg-light disabled color-palette pl-2 pr-2">
                <span>20</span>
              </div>
            </div>
          </div>
          <div className="col-md-3 mt-3">
            <div
              className="color-palette-set"
              style={{ margin: 2, padding: 2, fontSize: 14, borderRadius: 2 }}
            >
              <div className="bg-light color-palette pl-2 pr-2">
                <span>Reject Code</span>
              </div>
              <div className="bg-light disabled color-palette pl-2 pr-2">
                <span>23445</span>
              </div>
            </div>
          </div>
          <div className="col-md-3 mt-3">
            <div
              className="color-palette-set"
              style={{ margin: 2, padding: 2, fontSize: 14, borderRadius: 2 }}
            >
              <div className="bg-light color-palette pl-2 pr-2">
                <span>Overdue Days</span>
              </div>
              <div className="bg-light disabled color-palette pl-2 pr-2">
                <span>0</span>
              </div>
            </div>
          </div>
          <div className="col-md-3 mt-3">
            <div
              className="color-palette-set"
              style={{ margin: 2, padding: 2, fontSize: 14, borderRadius: 2 }}
            >
              <div className="bg-light color-palette pl-2 pr-2">
                <span>Date Of Application</span>
              </div>
              <div className="bg-light disabled color-palette pl-2 pr-2">
                <span>54757346</span>
              </div>
            </div>
          </div>
          <div className="col-md-3 mt-3">
            <div
              className="color-palette-set"
              style={{ margin: 2, padding: 2, fontSize: 14, borderRadius: 2 }}
            >
              <div className="bg-light color-palette pl-2 pr-2">
                <span>Date Of Disbursement</span>
              </div>
              <div className="bg-light disabled color-palette pl-2 pr-2">
                <span>43643645</span>
              </div>
            </div>
          </div>
          <div className="col-md-3 mt-3">
            <div
              className="color-palette-set"
              style={{ margin: 2, padding: 2, fontSize: 14, borderRadius: 2 }}
            >
              <div className="bg-light color-palette pl-2 pr-2">
                <span>Re-Payment Date</span>
              </div>
              <div className="bg-light disabled color-palette pl-2 pr-2">
                <span>547878</span>
              </div>
            </div>
          </div>
          <div className="col-md-3 mt-3">
            <div
              className="color-palette-set"
              style={{ margin: 2, padding: 2, fontSize: 14, borderRadius: 2 }}
            >
              <div className="bg-light color-palette pl-2 pr-2">
                <span>Last Re-Payment Date</span>
              </div>
              <div className="bg-light disabled color-palette pl-2 pr-2">
                <span>876365</span>
              </div>
            </div>
          </div>
          <div className="col-md-3 mt-3">
            <div
              className="color-palette-set"
              style={{ margin: 2, padding: 2, fontSize: 14, borderRadius: 2 }}
            >
              <div className="bg-light color-palette pl-2 pr-2">
                <span>Total Out-Standing</span>
              </div>
              <div className="bg-light disabled color-palette pl-2 pr-2">
                <span>45</span>
              </div>
            </div>
          </div>
          <div className="col-md-3 mt-3">
            <div
              className="color-palette-set"
              style={{ margin: 2, padding: 2, fontSize: 14, borderRadius: 2 }}
            >
              <div className="bg-light color-palette pl-2 pr-2">
                <span>Re-Payment Of Principal</span>
              </div>
              <div className="bg-light disabled color-palette pl-2 pr-2">
                <span>yes</span>
              </div>
            </div>
          </div>
          <div className="col-md-3 mt-3">
            <div
              className="color-palette-set"
              style={{ margin: 2, padding: 2, fontSize: 14, borderRadius: 2 }}
            >
              <div className="bg-light color-palette pl-2 pr-2">
                <span>Pending Interest</span>
              </div>
              <div className="bg-light disabled color-palette pl-2 pr-2">
                <span>3</span>
              </div>
            </div>
          </div>
          <div className="col-md-3 mt-3">
            <div
              className="color-palette-set"
              style={{ margin: 2, padding: 2, fontSize: 14, borderRadius: 2 }}
            >
              <div className="bg-light color-palette pl-2 pr-2">
                <span>Total Paid</span>
              </div>
              <div className="bg-light disabled color-palette pl-2 pr-2">
                <span>9786</span>
              </div>
            </div>
          </div>
          <div className="col-md-3 mt-3">
            <div
              className="color-palette-set"
              style={{ margin: 2, padding: 2, fontSize: 14, borderRadius: 2 }}
            >
              <div className="bg-light color-palette pl-2 pr-2">
                <span>Penalty Interest</span>
              </div>
              <div className="bg-light disabled color-palette pl-2 pr-2">
                <span>3454</span>
              </div>
            </div>
          </div>
          <div className="col-md-3 mt-3">
            <div
              className="color-palette-set"
              style={{ margin: 2, padding: 2, fontSize: 14, borderRadius: 2 }}
            >
              <div className="bg-light color-palette pl-2 pr-2">
                <span>Reduction Amount</span>
              </div>
              <div className="bg-light disabled color-palette pl-2 pr-2">
                <span>0</span>
              </div>
            </div>
          </div>
          <div className="col-md-3 mt-3">
            <div
              className="color-palette-set"
              style={{ margin: 2, padding: 2, fontSize: 14, borderRadius: 2 }}
            >
              <div className="bg-light color-palette pl-2 pr-2">
                <span>Collection Date</span>
              </div>
              <div className="bg-light disabled color-palette pl-2 pr-2">
                <span>45656</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
