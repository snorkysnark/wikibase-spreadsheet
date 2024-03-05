import "vite/modulepreload-polyfill";
import React from "react";
import ReactDOM from "react-dom/client";
import Login from "./Login.tsx";
import "./index.css";
import "handsontable/dist/handsontable.full.min.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Login />
  </React.StrictMode>
);
