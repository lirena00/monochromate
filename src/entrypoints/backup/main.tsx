import React from "react";
import ReactDOM from "react-dom/client";
import BackupPage from "./backup-page";
import "../../assets/main.css";

const rootElement = document.getElementById("root");
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <BackupPage />
    </React.StrictMode>
  );
}
