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
  
  // タイムアウト設定（60秒）
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);
  
  try {
    console.log('API Request:', { url, route: body.route });
    
    // CORS回避のため、まずOPTIONSリクエストを手動実行
    const optionsRes = await fetch(url, {
      method: 'OPTIONS',
      headers: { 
        'Origin': 'https://youshi-kanda.github.io',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      },
      signal: controller.signal,
    });
    
    console.log('OPTIONS Response:', { status: optionsRes.status });
    
    const res = await fetch(url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body),
      signal: controller.signal,
      mode: 'cors',
      credentials: 'omit'
    });
    
    clearTimeout(timeoutId);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('API Response Error:', { status: res.status, statusText: res.statusText, body: errorText });
      throw new Error(`HTTP ${res.status}: ${res.statusText} - ${errorText}`);
    }
    
    const json = await res.json();
    console.log('API Response:', { ok: json.ok, route: body.route });
    
    if (json.ok === false) {
      throw new Error(json.error || 'API returned error');
    }
    
    return json as T;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error('リクエストがタイムアウトしました（60秒）。音声ファイルが大きすぎる可能性があります。');
    }
    
    console.error('API Error:', error);
    throw error;
  }
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
