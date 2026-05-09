import React from "react";
import { Switch, Route } from "react-router-dom";
import Login from "./login";

export default function Auth() {
  return (
    <div>
      <Switch>
        <Route path="/" component={Login} />
      </Switch>
    </div>
  );
}
