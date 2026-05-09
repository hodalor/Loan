import React from "react";
import { GlobalContext } from "../../../libs/context/globalContext";
import BasicSelect from "../../inputs/select";
import BigLoader from "../../loaders/bigLoader";

export default function CallRecordModal(props) {
  const { callResult, relationship, _handleAddCallRecord, bigLoader } =
    React.useContext(GlobalContext);

  const [comment, setComment] = React.useState("");

  return (
    <div
      style={{
        width: 500,
        height: 310,
        display: "flex",
        flexDirection: "column",
        paddingLeft: 10,
        paddingRight: 10,
        position: "relative",
      }}
    >
      {bigLoader ? (
        <div
          style={{
            position: "absolute",
            display: "flex",
            alignSelf: "center",
            justifyContent: "center",
            alignItems: "center",
            opacity: 0.6,
            zIndex: 1,
            width: 900,
            height: 400,
            backgroundColor: "grey",
            color: "#fff",
          }}
        >
          <BigLoader />
        </div>
      ) : null}
      <div style={{ height: 20 }}>Create a record</div>
      <div className="row" style={{ marginTop: 15 }}>
        <div className="col-md-4" style={{ fontSize: 15 }}>
          Called number
        </div>
        <div className="col-md-8">
          <input
            style={{ height: "1.8rem", fontSize: 12 }}
            type="text"
            disabled={true}
            className="form-control"
            value={props.phone}
            aria-label="userid"
          />
        </div>
        <div className="col-md-4" style={{ fontSize: 15, marginTop: 20 }}>
          Relationship
        </div>
        <div
          className="col-md-8"
          style={{
            width: "13rem",
            height: "1.8rem",
            fontSize: 12,
            marginTop: 20,
          }}
        >
          <BasicSelect data={relationship} title="Relationship" />
        </div>

        <div className="col-md-4" style={{ fontSize: 15, marginTop: 20 }}>
          Call result
        </div>
        <div
          className="col-md-8"
          style={{
            width: "13rem",
            height: "1.8rem",
            fontSize: 12,
            marginTop: 20,
          }}
        >
          <BasicSelect data={callResult} title="Call result" />
        </div>

        <div className="col-md-4" style={{ fontSize: 15, marginTop: 20 }}>
          Officer remarks
        </div>
        <div className="col-md-8">
          <textarea
            style={{ marginTop: 20 }}
            type="text"
            rows={3}
            className="form-control"
            onChange={(e) => setComment(e.target.value)}
            value={comment}
            placeholder="enter your comment here"
            aria-label="userid"
          />
        </div>
      </div>
      <div
        style={{
          display: "flex",
          width: "100%",
          justifyContent: "right",
          alignItems: "center",
          marginTop: 15,
        }}
      >
        <button
          type="button"
          disabled={bigLoader ? true : false}
          className="btn btn-primary ml-2"
          onClick={() =>
            _handleAddCallRecord({
              phone: props.phone,
              comment,
              title: props.title,
            })
          }
        >
          <i className="fa fa-check text-xs" />
        </button>
      </div>
    </div>
  );
}
