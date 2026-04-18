import { TDSMobileAITProvider } from "@toss/tds-mobile-ait";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { APP_BRAND_PRIMARY_COLOR } from "./appConfig.ts";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <TDSMobileAITProvider brandPrimaryColor={APP_BRAND_PRIMARY_COLOR}>
      <App />
    </TDSMobileAITProvider>
  </StrictMode>,
);
