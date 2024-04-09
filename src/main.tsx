import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";

import { registerAllModules } from "handsontable/registry";
import "handsontable/dist/handsontable.full.min.css";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

import App from "./App";

registerAllModules();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
