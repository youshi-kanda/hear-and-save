import { AsrConfig, LlmConfig } from './api';

const CONSENT_KEY = 'recording_consent_timestamp';
const ASR_CONFIG_KEY = 'asr_config';
const LLM_CONFIG_KEY = 'llm_config';

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
  const data = sessionStorage.getItem(ASR_CONFIG_KEY);
  return data ? JSON.parse(data) : null;
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
