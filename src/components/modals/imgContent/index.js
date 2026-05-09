import React from "react";
import { GlobalContext } from "../../../libs/context/globalContext";

export default function ImgModalContent() {
  const { imageToView } = React.useContext(GlobalContext);

  return (
    <div
      style={{
        width: "auto",
        height: "auto",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {imageToView === "" ? (
        <span>Invalid image url</span>
      ) : (
        <img src={imageToView} alt="Preview" width="100%" height="100%" />
      )}
    </div>
  );
}
