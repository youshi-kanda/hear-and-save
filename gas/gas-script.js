// ====================================
// 営業ヒアリング自動要約・記録アプリ - Phase 1完全対応版
// Google Speech長時間音声対応・セキュア・FORM-POSTでプリフライト回避
// ====================================

// 基本設定
const SPREADSHEET_ID = '1fV9CK56hyH2UTpkDwl6Lv44bPTIAt3i7f09AppvXidw';
const ALLOWED_ORIGIN = 'https://youshi-kanda.github.io';

// GCP設定（Phase 1統一プロジェクト）
const GCP_PROJECT_ID = 'my-asr-project-474507';

// デフォルトスキーマ
const DEFAULT_FIELDS = [
  "訪問日時", "所要時間", "面談相手の氏名", "面談相手の情報",
  "訪問目的", "次回アポイントの有無と日程", "提案に対する顧客の反応",
  "顧客が抱える課題・困りごと", "予算規模・予算時期", "決裁フロー",
  "キーパーソン", "競合他社の動向", "利用状況", "導入検討時期",
  "スケジュール感", "宿題事項", "見積もり提示の有無"
];

// ====================================
// メインエンドポイント（FORM-POST前提）
// ====================================

function doPost(e) {
  const startTime = Date.now();
  let route = 'unknown';
  try {
    let requestData;

    if (e.parameter && e.parameter.data) {
      // application/x-www-form-urlencoded (data=JSON)
      requestData = JSON.parse(e.parameter.data);
    } else if (e.postData && e.postData.contents) {
      // JSON直投げにも一応対応
      try {
        requestData = JSON.parse(e.postData.contents);
      } catch (error) {
        return createResponse({ ok: false, error: 'Invalid JSON request body' });
      }
    } else {
      return createResponse({ ok: false, error: 'Missing request body' });
    }

    route = requestData.route || 'missing_route';
    if (!requestData.route) {
      return createResponse({ ok: false, error: 'Missing route parameter' });
    }

    let response;
    switch (route) {
      case 'asr.transcribe':
        response = handleTranscribe(requestData);
        break;
      case 'analyze.save':
        response = handleAnalyzeAndSave(requestData);
        break;
      case 'schema.create':
        response = handleCreateSchema(requestData);
        break;
      case 'schema.active.get':
        response = handleGetActiveSchema();
        break;
      case 'schema.active.set':
        response = handleSetActiveSchema(requestData);
        break;
      case 'schema.list':
        response = handleListSchemas();
        break;
      case 'system.status':
        response = handleSystemStatus(requestData);
        break;
      default:
        response = { ok: false, error: `Unknown route: ${route}` };
    }

    const duration = Date.now() - startTime;
    logActivity(route, duration, response.ok, response.activeSheet, response.error);
    return createResponse(response);

  } catch (error) {
    const duration = Date.now() - startTime;
    logActivity(route, duration, false, null, error.message);
    return createResponse({ ok: false, error: `Internal server error: ${error.message}` });
  }
}

// プリフライトは来ない想定（FORM-POST）。置いておくなら最小でOK
function doOptions(e) {
  return ContentService.createTextOutput('').setMimeType(ContentService.MimeType.TEXT);
}

function doGet(e) {
  const params = e.parameter || {};
  if (params.corstest === 'true') {
    return createResponse({
      ok: true,
      message: 'CORS test successful - Phase 1 Google Speech Long Audio Support',
      timestamp: new Date().toISOString(),
      origin: ALLOWED_ORIGIN,
      version: '2.1.0-phase1',
      gcpProject: GCP_PROJECT_ID
    });
  }
  return createResponse({
    ok: true,
    message: 'Hear & Save API (Phase 1)',
    url: ScriptApp.getService().getUrl(),
    cors: 'FORM-POST (no preflight)',
    version: '2.1.0-phase1',
    origin: ALLOWED_ORIGIN
  });
}

// ====================================
// レスポンス関数（JSONのみ）
// ====================================

function createResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ====================================
// セキュアなAPIキー管理
// ====================================

function getApiKeyForProvider(provider) {
  try {
    const keyName = `${provider.toUpperCase()}_API_KEY`;
    const apiKey = PropertiesService.getScriptProperties().getProperty(keyName);
    if (!apiKey) return null;
    return apiKey;
  } catch (error) {
    return null;
  }
}

// ====================================
// ASR処理（Phase 1対応版）
// ====================================

function handleTranscribe(data) {
  try {
    const { audio, asr } = data;
    if (!audio || !audio.base64) return { ok: false, error: 'Missing audio data' };
    if (!asr || !asr.provider) return { ok: false, error: 'Missing ASR configuration' };

    let apiKey = getApiKeyForProvider(asr.provider);
    if (!apiKey && asr.apiKey) {
      // 要注意：クライアントからのキー受け取りはリスク。可能なら無効化を推奨
      apiKey = asr.apiKey;
    }

    if (asr.provider === 'google' && !apiKey) {
      return { ok: false, error: 'Google Speech API key not configured. Please set GOOGLE_API_KEY in Script Properties.' };
    }
    if (!apiKey && asr.provider !== 'google') {
      return { ok: false, error: `API key not configured for ${asr.provider}. Please set ${asr.provider.toUpperCase()}_API_KEY in Script Properties.` };
    }

    const cfg = { ...asr, apiKey };
    let transcript;
    switch (asr.provider) {
      case 'openai':
        transcript = transcribeWithOpenAI(audio.base64, cfg);
        break;
      case 'deepgram':
        transcript = transcribeWithDeepgram(audio.base64, cfg);
        break;
      case 'google':
        transcript = transcribeWithGoogle(audio.base64, cfg);
        break;
      case 'azure':
        transcript = transcribeWithAzure(audio.base64, cfg);
        break;
      default:
        return { ok: false, error: `Unsupported ASR provider: ${asr.provider}` };
    }

    return { ok: true, transcript };
  } catch (error) {
    return formatSecureError(error, 'transcription');
  }
}

// ====================================
// Google Speech-to-Text（長時間音声対応）
// ====================================

function transcribeWithGoogle(audioBase64, config) {
  const estimatedDuration = estimateAudioDuration(audioBase64.length);
  if (estimatedDuration < 60) {
    try {
      return transcribeWithGoogleSync(audioBase64, config);
    } catch (error) {
      if (String(error.message || '').includes('Sync input too long')) {
        return transcribeWithGoogleLongRunning(audioBase64, config);
      }
      throw error;
    }
  } else {
    return transcribeWithGoogleLongRunning(audioBase64, config);
  }
}

function transcribeWithGoogleSync(audioBase64, config) {
  const { apiKey } = config;
  const payload = {
    config: {
      encoding: 'WEBM_OPUS',
      sampleRateHertz: 48000,
      languageCode: 'ja-JP',
      enableAutomaticPunctuation: true,
      model: 'default'
    },
    audio: { content: audioBase64 }
  };
  const options = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': apiKey },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  const url = 'https://speech.googleapis.com/v1/speech:recognize';
  const res = UrlFetchApp.fetch(url, options);
  if (res.getResponseCode() !== 200) {
    const errorData = JSON.parse(res.getContentText());
    throw new Error(errorData.error?.message || `API error: ${res.getResponseCode()}`);
  }
  const result = JSON.parse(res.getContentText());
  const transcripts = (result.results || [])
    .map(r => r.alternatives?.[0]?.transcript || '')
    .join(' ');
  return transcripts;
}

function transcribeWithGoogleLongRunning(audioBase64, config) {
  const { apiKey } = config;
  const bucketName = getBucketName();
  let gcsUri = null;
  try {
    gcsUri = uploadAudioToGCS(audioBase64, bucketName);
    const operation = startLongRunningRecognize(gcsUri, apiKey);
    const result = pollForCompletion(operation.name, apiKey);
    return result.transcript;
  } finally {
    if (gcsUri) {
      try {
        deleteAudioFromGCS(gcsUri, bucketName);
      } catch (e) {}
    }
  }
}

// ====================================
// GCS操作関数
// ====================================

function getBucketName() {
  const bucketName = PropertiesService.getScriptProperties().getProperty('GCS_BUCKET_NAME');
  if (!bucketName) throw new Error('GCS_BUCKET_NAME not set in Script Properties');
  return bucketName;
}

function uploadAudioToGCS(audioBase64, bucketName) {
  const fileName = `audio_${Utilities.getUuid()}_${Date.now()}.webm`;
  const audioBlob = Utilities.base64Decode(audioBase64);
  const uploadUrl = `https://storage.googleapis.com/upload/storage/v1/b/${bucketName}/o?uploadType=media&name=${fileName}`;
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'audio/webm',
      'Authorization': 'Bearer ' + ScriptApp.getOAuthToken()
    },
    payload: audioBlob,
    muteHttpExceptions: true
  };
  const res = UrlFetchApp.fetch(uploadUrl, options);
  if (res.getResponseCode() !== 200) {
    throw new Error(`Failed to upload audio to GCS: ${res.getResponseCode()} - ${res.getContentText()}`);
  }
  return `gs://${bucketName}/${fileName}`;
}

function deleteAudioFromGCS(gcsUri, bucketName) {
  const fileName = gcsUri.replace(`gs://${bucketName}/`, '');
  const deleteUrl = `https://storage.googleapis.com/storage/v1/b/${bucketName}/o/${encodeURIComponent(fileName)}`;
  const options = {
    method: 'DELETE',
    headers: { 'Authorization': 'Bearer ' + ScriptApp.getOAuthToken() },
    muteHttpExceptions: true
  };
  const res = UrlFetchApp.fetch(deleteUrl, options);
  // 204で削除成功。失敗しても致命ではないためwarnに留める
  if (res.getResponseCode() !== 204) {
    console.warn(`Failed to delete GCS file: ${res.getResponseCode()}`);
  }
}

// ====================================
// Google Speech Long Running API
// ====================================

function startLongRunningRecognize(gcsUri, apiKey) {
  const payload = {
    config: {
      encoding: 'WEBM_OPUS',
      sampleRateHertz: 48000,
      languageCode: 'ja-JP',
      enableAutomaticPunctuation: true,
      model: 'default'
    },
    audio: { uri: gcsUri }
  };
  const options = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': apiKey },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  const url = 'https://speech.googleapis.com/v1/speech:longrunningrecognize';
  const res = UrlFetchApp.fetch(url, options);
  if (res.getResponseCode() !== 200) {
    const errorData = JSON.parse(res.getContentText());
    throw new Error(errorData.error?.message || `Long-running recognize failed: ${res.getResponseCode()}`);
  }
  return JSON.parse(res.getContentText());
}

function pollForCompletion(operationName, apiKey) {
  const MAX_DURATION = 5 * 60 * 1000; // 5分
  const POLL_INTERVAL = 5000;
  const MAX_RETRIES = 2;

  const startTime = Date.now();
  let retryCount = 0;

  while (Date.now() - startTime < MAX_DURATION) {
    try {
      const operation = getOperation(operationName, apiKey);
      if (operation.done) {
        if (operation.error) {
          throw new Error(`Speech operation failed: ${operation.error.message}`);
        }
        const transcripts = (operation.response?.results || [])
          .map(r => r.alternatives?.[0]?.transcript || '')
          .join(' ') || '';
        return { transcript: transcripts };
      }
      Utilities.sleep(POLL_INTERVAL);
      retryCount = 0;
    } catch (error) {
      if (shouldRetry(error) && retryCount < MAX_RETRIES) {
        const backoffTime = Math.pow(2, retryCount) * 1000;
        Utilities.sleep(backoffTime);
        retryCount++;
        continue;
      }
      throw error;
    }
  }
  throw new Error('タイムアウト: 音声処理に時間がかかりすぎています');
}

function getOperation(operationName, apiKey) {
  const url = `https://speech.googleapis.com/v1/operations/${operationName}`;
  const options = { method: 'GET', headers: { 'X-Goog-Api-Key': apiKey }, muteHttpExceptions: true };
  const res = UrlFetchApp.fetch(url, options);
  if (res.getResponseCode() !== 200) {
    throw new Error(`Failed to get operation status: ${res.getResponseCode()}`);
  }
  return JSON.parse(res.getContentText());
}

// ====================================
// 既存ASRプロバイダー（OpenAI、Deepgram、Azure）
// ====================================

function transcribeWithOpenAI(audioBase64, config) {
  const { apiKey, model = 'whisper-1' } = config;
  const audioBytes = Utilities.base64Decode(audioBase64);
  const boundary = '----WebKitFormBoundary' + Utilities.getUuid();

  let data = [];
  data.push('--' + boundary);
  data.push('Content-Disposition: form-data; name="model"');
  data.push('');
  data.push(model);

  data.push('--' + boundary);
  data.push('Content-Disposition: form-data; name="language"');
  data.push('');
  data.push('ja');

  data.push('--' + boundary);
  data.push('Content-Disposition: form-data; name="file"; filename="audio.webm"');
  data.push('Content-Type: audio/webm');
  data.push('');

  const pre = data.join('\r\n') + '\r\n';
  const post = '\r\n--' + boundary + '--\r\n';

  const preBytes = Utilities.newBlob(pre).getBytes();
  const postBytes = Utilities.newBlob(post).getBytes();
  const payload = new Uint8Array(preBytes.length + audioBytes.length + postBytes.length);
  payload.set(preBytes, 0);
  payload.set(audioBytes, preBytes.length);
  payload.set(postBytes, preBytes.length + audioBytes.length);

  const options = {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + apiKey,
      'Content-Type': 'multipart/form-data; boundary=' + boundary
    },
    payload: payload,
    muteHttpExceptions: true
  };

  const res = UrlFetchApp.fetch('https://api.openai.com/v1/audio/transcriptions', options);
  if (res.getResponseCode() !== 200) {
    const err = JSON.parse(res.getContentText());
    throw new Error(err.error?.message || `API error: ${res.getResponseCode()}`);
  }
  const result = JSON.parse(res.getContentText());
  return result.text;
}

function transcribeWithDeepgram(audioBase64, config) {
  const { apiKey } = config;
  const audioBytes = Utilities.base64Decode(audioBase64);
  const options = {
    method: 'POST',
    headers: { 'Authorization': 'Token ' + apiKey, 'Content-Type': 'audio/webm' },
    payload: audioBytes,
    muteHttpExceptions: true
  };
  const url = 'https://api.deepgram.com/v1/listen?language=ja&model=general&punctuate=true';
  const res = UrlFetchApp.fetch(url, options);
  if (res.getResponseCode() !== 200) {
    throw new Error(`Deepgram API error: ${res.getResponseCode()}`);
  }
  const result = JSON.parse(res.getContentText());
  return result.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
}

function transcribeWithAzure(audioBase64, config) {
  const { apiKey, endpoint } = config;
  if (!endpoint) throw new Error('Azure endpoint is required');
  const audioBytes = Utilities.base64Decode(audioBase64);
  const options = {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': apiKey,
      'Content-Type': 'audio/webm',
      'Accept': 'application/json'
    },
    payload: audioBytes,
    muteHttpExceptions: true
  };
  const recognizeUrl = endpoint.replace(/\/$/, '') + '/speech/recognition/conversation/cognitiveservices/v1?language=ja-JP';
  const res = UrlFetchApp.fetch(recognizeUrl, options);
  if (res.getResponseCode() !== 200) {
    throw new Error(`Azure Speech API error: ${res.getResponseCode()}`);
  }
  const result = JSON.parse(res.getContentText());
  return result.DisplayText || result.RecognizedPhrase || '';
}

// ====================================
// LLM分析・保存処理
// ====================================

function handleAnalyzeAndSave(data) {
  try {
    const { text, llm } = data;
    if (!text) return { ok: false, error: 'Missing text data' };
    if (!llm || !llm.provider) return { ok: false, error: 'Missing LLM configuration' };

    let apiKey = getApiKeyForProvider(llm.provider);
    if (!apiKey && llm.apiKey) {
      // 要注意：クライアントからのキー受け取りはリスク。可能なら無効化を推奨
      apiKey = llm.apiKey;
    }
    if (!apiKey) {
      return { ok: false, error: `API key not configured for ${llm.provider}. Please set ${llm.provider.toUpperCase()}_API_KEY in Script Properties.` };
    }

    const fields = getActiveSchemaFields();
    const cfg = { ...llm, apiKey };
    let analysisResult;

    switch (llm.provider) {
      case 'openai':
        analysisResult = analyzeWithOpenAI(text, fields, cfg);
        break;
      case 'azure':
        analysisResult = analyzeWithAzureOpenAI(text, fields, cfg);
        break;
      case 'google':
        analysisResult = analyzeWithGoogleGemini(text, fields, cfg);
        break;
      case 'anthropic':
        analysisResult = analyzeWithAnthropic(text, fields, cfg);
        break;
      default:
        return { ok: false, error: `Unsupported LLM provider: ${llm.provider}` };
    }

    const activeSheet = saveToSpreadsheet(text, analysisResult.data, fields);
    return { ok: true, summary: analysisResult.summary, data: analysisResult.data, activeSheet };

  } catch (error) {
    return formatSecureError(error, 'analysis');
  }
}

// ====================================
// LLMプロバイダー実装
// ====================================

function analyzeWithOpenAI(text, fields, config) {
  const { apiKey, model = 'gpt-4o' } = config;
  const fieldsJson = fields.reduce((acc, f) => (acc[f] = "値または情報なし", acc), {});
  const prompt = createAnalysisPrompt(text, fieldsJson);

  const payload = {
    model,
    messages: [
      { role: 'system', content: 'あなたは営業ヒアリング内容を分析する専門家です。指定された項目を正確に抽出してください。' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.1,
    max_tokens: 4000,
    response_format: { type: 'json_object' }
  };
  const options = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  const res = UrlFetchApp.fetch('https://api.openai.com/v1/chat/completions', options);
  if (res.getResponseCode() !== 200) {
    const err = JSON.parse(res.getContentText());
    throw new Error(err.error?.message || `API error: ${res.getResponseCode()}`);
  }
  const result = JSON.parse(res.getContentText());
  const content = result.choices?.[0]?.message?.content;
  return parseAnalysisResponse(content, fields);
}

function analyzeWithAzureOpenAI(text, fields, config) {
  const { apiKey, endpoint, deployment, apiVersion = '2024-02-15-preview' } = config;
  if (!apiKey || !endpoint || !deployment) throw new Error('Azure OpenAI configuration is incomplete');

  const fieldsJson = fields.reduce((acc, f) => (acc[f] = "値または情報なし", acc), {});
  const prompt = createAnalysisPrompt(text, fieldsJson);
  const payload = {
    messages: [
      { role: 'system', content: 'あなたは営業ヒアリング内容を分析する専門家です。指定された項目を正確に抽出してください。' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.1,
    max_tokens: 4000,
    response_format: { type: 'json_object' }
  };
  const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;
  const options = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-key': apiKey },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  const res = UrlFetchApp.fetch(url, options);
  if (res.getResponseCode() !== 200) {
    throw new Error(`Azure OpenAI API error: ${res.getResponseCode()}`);
  }
  const result = JSON.parse(res.getContentText());
  const content = result.choices?.[0]?.message?.content;
  return parseAnalysisResponse(content, fields);
}

function analyzeWithGoogleGemini(text, fields, config) {
  const { apiKey, model = 'gemini-pro' } = config;
  const fieldsJson = fields.reduce((acc, f) => (acc[f] = "値または情報なし", acc), {});
  const prompt = createAnalysisPrompt(text, fieldsJson);
  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.1, maxOutputTokens: 4000 }
  };
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const options = { method: 'POST', headers: { 'Content-Type': 'application/json' }, payload: JSON.stringify(payload), muteHttpExceptions: true };
  const res = UrlFetchApp.fetch(url, options);
  if (res.getResponseCode() !== 200) {
    throw new Error(`Google Gemini API error: ${res.getResponseCode()}`);
  }
  const result = JSON.parse(res.getContentText());
  const content = result.candidates?.[0]?.content?.parts?.[0]?.text;
  return parseAnalysisResponse(content, fields);
}

function analyzeWithAnthropic(text, fields, config) {
  const { apiKey, model = 'claude-3-sonnet-20240229' } = config;
  const fieldsJson = fields.reduce((acc, f) => (acc[f] = "値または情報なし", acc), {});
  const prompt = createAnalysisPrompt(text, fieldsJson);
  const payload = { model, max_tokens: 4000, temperature: 0.1, messages: [{ role: 'user', content: prompt }] };
  const options = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  const res = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', options);
  if (res.getResponseCode() !== 200) {
    throw new Error(`Anthropic API error: ${res.getResponseCode()}`);
  }
  const result = JSON.parse(res.getContentText());
  const content = result.content?.[0]?.text;
  return parseAnalysisResponse(content, fields);
}

// ====================================
// 共通ヘルパー関数
// ====================================

function createAnalysisPrompt(text, fieldsJson) {
  return `あなたは営業ヒアリング分析の専門家です。以下のヒアリング内容から指定された項目を正確に抽出し、要約を作成してください。

## ヒアリング内容
${text}

## 抽出タスク
以下のJSON形式で情報を抽出してください。各フィールドについて、ヒアリング内容から該当する情報を抽出してください。
情報が見つからない場合は「情報なし」と記載してください。

必ず以下の形式のJSONを返してください：
{
  "summary": "ヒアリング全体の要約（2-3文で簡潔に）",
  "data": ${JSON.stringify(fieldsJson, null, 2)}
}

重要：必ず有効なJSONフォーマットで返答してください。`;
}

function parseAnalysisResponse(content, fields) {
  try {
    let clean = String(content || '').trim();
    clean = clean.replace(/```json\\s*/g, '').replace(/```\\s*/g, '');
    const parsed = JSON.parse(clean);
    const result = { summary: parsed.summary || 'AI分析による要約を生成中...', data: {} };
    fields.forEach(f => { result.data[f] = parsed.data?.[f] || '情報なし'; });
    return result;
  } catch (error) {
    const fallback = {};
    fields.forEach(f => fallback[f] = '解析エラー');
    return { summary: '解析中にエラーが発生しました', data: fallback };
  }
}

function estimateAudioDuration(base64Length) {
  const estimatedBytes = base64Length * 0.75; // base64→バイナリ
  // 大雑把な推定（WEBM/OPUSで実際のビットレートは変動する）
  const estimatedDuration = estimatedBytes / (48000 * 2 * 1 * 0.1);
  return Math.max(estimatedDuration, 1);
}

function shouldRetry(error) {
  const msg = String(error.message || '').toLowerCase();
  return msg.includes('timeout') || msg.includes('network') || msg.includes('connection') ||
         msg.includes('502') || msg.includes('503') || msg.includes('504');
}

function formatSecureError(error, context) {
  let message = error.message || String(error);
  message = message.replace(/Bearer\\s+[A-Za-z0-9\\-_.]{10,}/g, 'Bearer [REDACTED]');
  message = message.replace(/api-key:\\s*[A-Za-z0-9\\-_.]{10,}/g, 'api-key: [REDACTED]');
  message = message.replace(/Token\\s+[A-Za-z0-9\\-_.]{10,}/g, 'Token [REDACTED]');
  message = message.replace(/sk-[A-Za-z0-9\\-_.]{10,}/g, '[API_KEY_REDACTED]');

  if (message.includes('timeout') || message.includes('タイムアウト')) {
    return { ok: false, error: `タイムアウトが発生しました: ${context}` };
  }
  if (message.toLowerCase().includes('api key') || message.includes('api-key') || message.toLowerCase().includes('authentication')) {
    return { ok: false, error: `API keyが無効または未設定です: ${context}` };
  }
  return { ok: false, error: `${context} failed: ${message}` };
}

// ====================================
// スプレッドシート操作
// ====================================

function getActiveSchemaFields() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const configSheet = ss.getSheetByName('設定');
    if (configSheet) {
      const activeSheetName = configSheet.getRange('B1').getValue();
      if (activeSheetName) {
        const activeSheet = ss.getSheetByName(activeSheetName);
        if (activeSheet) {
          const headers = activeSheet.getRange(1, 4, 1, activeSheet.getLastColumn() - 3).getValues()[0];
          return headers.filter(h => h !== '');
        }
      }
    }
  } catch (e) {}
  return DEFAULT_FIELDS;
}

function saveToSpreadsheet(text, data, fields) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheetName = '面談記録';
    try {
      const configSheet = ss.getSheetByName('設定');
      if (configSheet) {
        const activeSheetName = configSheet.getRange('B1').getValue();
        if (activeSheetName) sheetName = activeSheetName;
      }
    } catch (e) {}

    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      const headers = ['ID', 'UpdatedAt', 'TranscriptText'].concat(fields);
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }

    const id = `REC_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const timestamp = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
    const row = [id, timestamp, text];
    fields.forEach(f => row.push(data[f] || '情報なし'));
    sheet.getRange(sheet.getLastRow() + 1, 1, 1, row.length).setValues([row]);

    return sheetName;
  } catch (error) {
    throw new Error(`スプレッドシート保存エラー: ${error.message}`);
  }
}

// ====================================
// スキーマ管理
// ====================================

function handleGetActiveSchema() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const configSheet = ss.getSheetByName('設定');
    if (configSheet) {
      const activeSheetName = configSheet.getRange('B1').getValue();
      if (activeSheetName) {
        const activeSheet = ss.getSheetByName(activeSheetName);
        if (activeSheet) {
          const headers = activeSheet.getRange(1, 4, 1, activeSheet.getLastColumn() - 3).getValues()[0];
          const fields = headers.filter(h => h !== '');
          return { ok: true, name: activeSheetName, fields };
        }
      }
    }
    return { ok: true, name: '面談記録', fields: DEFAULT_FIELDS };
  } catch (error) {
    return { ok: false, error: `Failed to get active schema: ${error.message}` };
  }
}

function handleSetActiveSchema(data) {
  try {
    const { sheetName } = data;
    if (!sheetName) return { ok: false, error: 'Missing sheetName parameter' };

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let configSheet = ss.getSheetByName('設定');
    if (!configSheet) {
      configSheet = ss.insertSheet('設定');
      configSheet.getRange('A1').setValue('アクティブスキーマ');
    }
    configSheet.getRange('B1').setValue(sheetName);
    return handleGetActiveSchema();
  } catch (error) {
    return { ok: false, error: `Failed to set active schema: ${error.message}` };
  }
}

function handleCreateSchema(data) {
  try {
    const { name, fields } = data;
    if (!name || !fields || !Array.isArray(fields)) {
      return { ok: false, error: 'Missing name or fields parameter' };
    }
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName(name);
    if (sheet) return { ok: false, error: `Schema "${name}" already exists` };

    sheet = ss.insertSheet(name);
    const headers = ['ID', 'UpdatedAt', 'TranscriptText'].concat(fields);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    handleSetActiveSchema({ sheetName: name });
    return { ok: true, name, fields };
  } catch (error) {
    return { ok: false, error: `Failed to create schema: ${error.message}` };
  }
}

function handleListSchemas() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheets = ss.getSheets();
    const schemas = sheets
      .filter(s => s.getName() !== '設定')
      .map(sheet => {
        try {
          const headers = sheet.getRange(1, 4, 1, sheet.getLastColumn() - 3).getValues()[0];
          const fields = headers.filter(h => h !== '');
          return { name: sheet.getName(), fields: fields.length > 0 ? fields : DEFAULT_FIELDS };
        } catch (e) {
          return { name: sheet.getName(), fields: DEFAULT_FIELDS };
        }
      });
    return { ok: true, sheets: schemas };
  } catch (error) {
    return { ok: false, error: `Failed to list schemas: ${error.message}` };
  }
}

// ====================================
// システムステータス・ログ
// ====================================

function handleSystemStatus(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let totalRecords = 0;
    ss.getSheets().forEach(sheet => {
      if (sheet.getName() !== '設定') {
        const lastRow = sheet.getLastRow();
        if (lastRow > 1) totalRecords += (lastRow - 1);
      }
    });
    const activeSchema = handleGetActiveSchema();
    return {
      ok: true,
      status: {
        asrConnected: true,
        llmConnected: true,
        currentSchema: activeSchema.name || '面談記録',
        totalRecords,
        timestamp: new Date().toISOString(),
        version: '2.1.0-phase1'
      }
    };
  } catch (error) {
    return {
      ok: true,
      status: {
        asrConnected: true,
        llmConnected: true,
        currentSchema: '面談記録',
        totalRecords: 0,
        timestamp: new Date().toISOString(),
        version: '2.1.0-phase1',
        error: error.message
      }
    };
  }
}

function logActivity(route, durationMs, ok, activeSheetName, errorMessage) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let logSheet = ss.getSheetByName('ActivityLog');
    if (!logSheet) {
      logSheet = ss.insertSheet('ActivityLog');
      const headers = ['Timestamp', 'Route', 'DurationMs', 'Success', 'ActiveSheet', 'ErrorMessage'];
      logSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }
    const timestamp = new Date().toISOString();
    logSheet.appendRow([timestamp, route, durationMs, ok, activeSheetName || '', errorMessage || '']);
  } catch (error) {}
}

// ====================================
// 初期化関数
// ====================================

function initializePhase1() {
  const googleApiKey = getApiKeyForProvider('google');
  const bucketName = PropertiesService.getScriptProperties().getProperty('GCS_BUCKET_NAME');
  return {
    ok: true,
    message: 'Phase 1 initialization completed',
    gcpProjectId: GCP_PROJECT_ID,
    gcsBucketConfigured: !!bucketName,
    googleApiKeyConfigured: !!googleApiKey
  };
}
