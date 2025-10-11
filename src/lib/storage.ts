import { AsrConfig, LlmConfig } from './api';

const CONSENT_KEY = 'recording_consent_timestamp';
const ASR_CONFIG_KEY = 'asr_config';
const LLM_CONFIG_KEY = 'llm_config';
const ASR_MODE = (import.meta.env.VITE_ASR_MODE ?? 'demo') as string;

const DEFAULT_ASR_PROVIDER = import.meta.env.VITE_DEFAULT_ASR_PROVIDER as AsrConfig['provider'] | undefined;
const DEFAULT_ASR_API_KEY = import.meta.env.VITE_DEFAULT_ASR_API_KEY as string | undefined;
const DEFAULT_ASR_MODEL = import.meta.env.VITE_DEFAULT_ASR_MODEL as string | undefined;

export const isDemoAsrMode = ASR_MODE === 'demo';

const buildDefaultAsrConfig = (): AsrConfig | null => {
  if (!DEFAULT_ASR_PROVIDER) {
    return null;
  }

  const apiKey = DEFAULT_ASR_API_KEY?.trim() ?? '';
  const model = DEFAULT_ASR_MODEL?.trim() ?? undefined;

  return {
    provider: DEFAULT_ASR_PROVIDER,
    apiKey,
    ...(model ? { model } : {}),
  };
};

export const getDefaultAsrConfig = (): AsrConfig | null => buildDefaultAsrConfig();

export function saveConsent(): void {
  sessionStorage.setItem(CONSENT_KEY, new Date().toISOString());
}

export function hasConsent(): boolean {
  return sessionStorage.getItem(CONSENT_KEY) !== null;
}

export function saveAsrConfig(config: AsrConfig): void {
  sessionStorage.setItem(ASR_CONFIG_KEY, JSON.stringify(config));
}

export function getAsrConfig(): AsrConfig | null {
  const demoConfig = isDemoAsrMode ? getDefaultAsrConfig() : null;

  const data = sessionStorage.getItem(ASR_CONFIG_KEY);
  if (data) {
    return JSON.parse(data);
  }

  return demoConfig;
}

export function saveLlmConfig(config: LlmConfig): void {
  sessionStorage.setItem(LLM_CONFIG_KEY, JSON.stringify(config));
}

export function getLlmConfig(): LlmConfig | null {
  const data = sessionStorage.getItem(LLM_CONFIG_KEY);
  return data ? JSON.parse(data) : null;
}

export function clearAllConfigs(): void {
  sessionStorage.removeItem(CONSENT_KEY);
  sessionStorage.removeItem(ASR_CONFIG_KEY);
  sessionStorage.removeItem(LLM_CONFIG_KEY);
}
