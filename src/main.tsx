import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import type { AsrProvider } from "./lib/api";
import { getAsrConfig, saveAsrConfig } from "./lib/storage";

const DEMO_ASR_ENV_PREFIX = "VITE_DEMO_ASR_";

function applyDemoAsrConfig(): void {
  if (typeof window === "undefined") {
    return;
  }

  const rawProvider = import.meta.env[`${DEMO_ASR_ENV_PREFIX}PROVIDER`] as
    | string
    | undefined;
  const apiKey = import.meta.env[`${DEMO_ASR_ENV_PREFIX}API_KEY`] as
    | string
    | undefined;
  const model = import.meta.env[`${DEMO_ASR_ENV_PREFIX}MODEL`] as
    | string
    | undefined;

  if (!rawProvider || !apiKey) {
    return;
  }

  const supportedProviders: AsrProvider[] = [
    "openai",
    "deepgram",
    "google",
    "azure",
  ];
  if (!supportedProviders.includes(rawProvider as AsrProvider)) {
    console.warn(
      `Unsupported demo ASR provider: ${rawProvider}. Expected one of ${supportedProviders.join(", ")}.`,
    );
    return;
  }

  const provider = rawProvider as AsrProvider;

  try {
    const existing = getAsrConfig();
    if (existing) {
      return;
    }

    saveAsrConfig({
      provider,
      apiKey,
      ...(model ? { model } : {}),
    });

    console.info("Demo ASR config applied from environment variables.");
  } catch (error) {
    console.error("Failed to apply demo ASR config", error);
  }
}

applyDemoAsrConfig();

createRoot(document.getElementById("root")!).render(<App />);
