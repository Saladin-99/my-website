import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/bricolage-grotesque";
import App from "./App";
import "./app/globals.css";
import "./app/mobile-os.css";
import "./app/mobile-launcher.css";
import "./app/mobile-scale.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
