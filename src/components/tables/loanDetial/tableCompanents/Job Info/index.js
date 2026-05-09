import React from "react";
import { GlobalContext } from "../../../../../libs/context/globalContext";

export default function JobInfo() {
  const { loan, customers } = React.useContext(GlobalContext);

  let customer = customers.find((item) => item.userId === loan.userId);

  return (
    <div>
      <div className="card">
        <div className="card-body">
          <div className="row">
            <div className="col" style={{backgroundColor:"#79bbff", height:"2.5rem", display:"flex", alignItems:"center", color:"white "}}>
            Job information
            </div>
          </div>
          <div className="row">
            <div className=" col-2 border" style={{ backgroundColor:"#f2f6fc"}}>
              Profession
            </div>
            <div className=" col-2 border" style={{}}>
              {customer === undefined ? "" : customer.workInfo.workContent}
            </div>
            <div className=" col-2 border" style={{backgroundColor:"#f2f6fc"}}>
              Company Name
            </div>
            <div className=" col-2 border" style={{}}>
            {customer === undefined ? "" : customer.workInfo.workUnit}
            </div>
            <div className=" col-2 border" style={{backgroundColor:"#f2f6fc"}}>
              Company Address
            </div>
            <div className=" col-2 border" style={{}}>
            {customer === undefined ? "" : customer.workInfo.workAddress}
            </div>
          </div>
          <div className="row">
            <div className=" col-2 border" style={{backgroundColor:"#f2f6fc",}}>
              Work Email
            </div>
            <div className=" col-2 border" style={{}}>
              {customer === undefined ? "" : customer.email}
            </div>
            <div className=" col-2 border" style={{backgroundColor:"#f2f6fc"}}>
              Monthly Income
            </div>
            <div className=" col-2 border" style={{}}>
             GHS {customer === undefined ? "" : customer.workInfo.currentIncome}
            </div>
            <div className=" col-2 border" style={{backgroundColor:"#f2f6fc"}}>
              Company City 
            </div>
            <div className=" col-2 border" style={{}}>
            {customer === undefined ? "" : customer.workInfo.companyAddress}
            </div>
          </div>
          <div className="row">
            <div className=" col-2 border" style={{backgroundColor:"#f2f6fc"}}>
              Company Industry
            </div>
            <div className=" col-2" style={{}}>
            {customer === undefined ? "" : customer.workInfo.industry}
            </div>
            <div className=" col-2 border" style={{backgroundColor:"#f2f6fc"}}>
              Nearest Landmark
            </div>
            <div className=" col-2 border" style={{}}>
            {customer === undefined ? "" : customer.workInfo.LNDmarkCompany}
            </div>
            <div className=" col-2 border" style={{backgroundColor:"#f2f6fc"}}>
              Work Certificate Photo
            </div>
            <div className=" col-2 border" style={{}}>
              image
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
