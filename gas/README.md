# Google Apps Script 連携

このディレクトリには、営業ヒアリング自動要約・記録アプリのバックエンドとして利用する Google Apps Script のソースコードを格納しています。

## ファイル構成
- `gas-script.js` : Web アプリとしてデプロイする Apps Script 本体。録音データの文字起こし、LLM による要約・項目抽出、スプレッドシート保存、スキーマ管理を一括で処理します。

## デプロイ手順
1. Google ドライブで新規に Apps Script プロジェクトを作成します。
2. `gas-script.js` の内容を `Code.gs` などのファイルに貼り付けて保存します。
3. スクリプト プロパティに以下の値を設定します。
   - `GOOGLE_API_KEY` など各種プロバイダーの API キー
   - `GCS_BUCKET_NAME` : 長時間音声用にファイルを一時保存する Cloud Storage バケット名
4. スプレッドシートを作成し、`gas-script.js` 内の `SPREADSHEET_ID` を対象の ID に変更します。
5. Apps Script の「デプロイ」→「新しいデプロイ」から Web アプリとして公開し、URL を取得します。
6. フロントエンドの `.env` で `VITE_GAS_API_URL` に取得した Web アプリの URL を設定します。

## 補足
- CORS を避けるため、フロントエンド側は `application/x-www-form-urlencoded` 形式で `data` パラメーターに JSON を格納して送信する必要があります。
- ASR / LLM の API キーはクライアントから受け取る経路も残していますが、可能な限りスクリプト プロパティ側に保持する運用を推奨します。
- スプレッドシートの `設定` シートにアクティブスキーマを保存し、カスタムスキーマを切り替えられる設計です。
