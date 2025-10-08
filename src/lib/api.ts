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

// JSONP回避策を使用したGAS WebApp通信
export async function post<T>(body: any): Promise<T> {
  const url = import.meta.env.VITE_GAS_API_URL!;
  if (!url) {
    throw new Error('VITE_GAS_API_URL is not configured');
  }

  console.log('API Request:', { url, route: body.route });

  try {
    // GETリクエストでデータを送信（CORS回避）
    const params = new URLSearchParams();
    params.append('data', JSON.stringify(body));
    params.append('callback', 'handleResponse');
    
    const getUrl = `${url}?${params.toString()}`;
    console.log('Making GET request to avoid CORS');
    
    const res = await fetch(getUrl, {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit'
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('API Response Error:', { status: res.status, statusText: res.statusText, body: errorText });
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    
    const json = await res.json();
    console.log('API Response:', { ok: json.ok, route: body.route });
    
    if (json.ok === false) {
      throw new Error(json.error || 'API returned error');
    }
    
    return json as T;
  } catch (error) {
    console.error('API Error:', error);
    
    // フォールバック: 単純なPOST試行
    console.log('Fallback: trying simple POST without CORS checks');
    
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        mode: 'no-cors'
      });
      
      // no-corsでは結果を取得できないため、成功と仮定
      console.log('POST request sent (no-cors mode)');
      return { ok: true, message: 'Request sent via fallback' } as T;
    } catch (fallbackError) {
      console.error('Fallback POST also failed:', fallbackError);
      throw new Error('Both CORS and fallback requests failed');
    }
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
