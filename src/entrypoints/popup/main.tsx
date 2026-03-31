import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app.tsx";
import "../../assets/main.css";

const rootElement = document.getElementById("root");
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
