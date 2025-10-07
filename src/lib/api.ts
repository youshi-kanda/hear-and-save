export type AsrProvider = 'openai' | 'deepgram' | 'google' | 'azure';
export type LlmProvider = 'azure' | 'openai' | 'google' | 'anthropic';

export interface AsrConfig {
  provider: AsrProvider;
  apiKey: string;
  model?: string;
}

export interface LlmConfig {
  provider: LlmProvider;
  apiKey?: string;
  endpoint?: string;
  deployment?: string;
  apiVersion?: string;
  model?: string;
}

export interface AnalyzeResponse {
  ok: boolean;
  summary: string;
  data: Record<string, string>;
  activeSheet: string;
}

export interface TranscribeResponse {
  ok: boolean;
  transcript: string;
}

export interface SchemaResponse {
  ok: boolean;
  name?: string;
  fields?: string[];
  sheets?: Array<{ name: string; fields: string[] }>;
}

export async function post<T>(body: any): Promise<T> {
  const url = import.meta.env.VITE_GAS_API_URL!;
  if (!url) {
    throw new Error('VITE_GAS_API_URL is not configured');
  }
  
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  
  const json = await res.json();
  
  if (!res.ok || json.ok === false) {
    throw new Error(json.error || 'Request failed');
  }
  
  return json as T;
}

export async function transcribe(
  audioBase64: string,
  asrCfg: AsrConfig
): Promise<TranscribeResponse> {
  return post<TranscribeResponse>({
    route: 'asr.transcribe',
    audio: { mime: 'audio/webm', base64: audioBase64 },
    asr: asrCfg,
  });
}

export async function analyzeAndSave(
  text: string,
  llmCfg: LlmConfig
): Promise<AnalyzeResponse> {
  return post<AnalyzeResponse>({
    route: 'analyze.save',
    text,
    llm: llmCfg,
  });
}

export async function createSchema(
  name: string,
  fields: string[]
): Promise<SchemaResponse> {
  return post<SchemaResponse>({
    route: 'schema.create',
    name,
    fields,
  });
}

export async function getActiveSchema(): Promise<SchemaResponse> {
  return post<SchemaResponse>({
    route: 'schema.active.get',
  });
}

export async function setActiveSchema(sheetName: string): Promise<SchemaResponse> {
  return post<SchemaResponse>({
    route: 'schema.active.set',
    sheetName,
  });
}

export async function listSchemas(): Promise<SchemaResponse> {
  return post<SchemaResponse>({
    route: 'schema.list',
  });
}
