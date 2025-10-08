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

// シンプルなPOSTリクエストを使用したGAS WebApp通信
export async function post<T>(body: any): Promise<T> {
  const url = import.meta.env.VITE_GAS_API_URL!;
  if (!url) {
    throw new Error('VITE_GAS_API_URL is not configured');
  }

  console.log('API Request:', { url, route: body.route });

  try {
    // URLSearchParamsを使用してフォームデータとして送信
    const params = new URLSearchParams();
    params.append('data', JSON.stringify(body));
    
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
      mode: 'cors',
      credentials: 'omit'
    });
    
    if (!res.ok) {
      let errorMessage = `HTTP ${res.status}: ${res.statusText}`;
      
      // レスポンスボディからエラー詳細を取得
      try {
        const errorText = await res.text();
        if (errorText) {
          errorMessage += ` - ${errorText}`;
        }
      } catch (e) {
        // テキスト取得に失敗した場合は無視
      }
      
      console.error('API Response Error:', errorMessage);
      throw new Error(errorMessage);
    }
    
    const json = await res.json();
    console.log('API Response:', { ok: json.ok, route: body.route });
    
    if (json.ok === false) {
      throw new Error(json.error || 'API returned error');
    }
    
    return json as T;
  } catch (error: any) {
    console.error('API Error:', error);
    
    // ネットワークエラーの場合のメッセージ改善
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error('ネットワークエラーが発生しました。インターネット接続を確認してください。');
    }
    
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
