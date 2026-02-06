import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const root = createRoot(document.getElementById("root")!);

// Disable StrictMode in development to prevent double effect invocation
// StrictMode intentionally runs effects twice to detect side effects,
// but it causes duplicate API calls in development
if (import.meta.env.PROD) {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
} else {
  root.render(<App />);
}
