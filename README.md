# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/82c8af1c-e1ac-4a3d-b2d8-9e8a2310a917

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/82c8af1c-e1ac-4a3d-b2d8-9e8a2310a917) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/82c8af1c-e1ac-4a3d-b2d8-9e8a2310a917) and click on Share -> Publish.

## Demo ASR configuration

For demo environments where you want to ship a preconfigured speech recognition setup (e.g. a Google Cloud key), provide the following Vite environment variables at build time:

- `VITE_DEMO_ASR_PROVIDER` – one of `openai`, `deepgram`, `google`, or `azure`.
- `VITE_DEMO_ASR_API_KEY` – the API key that should be stored in `sessionStorage` for the current session.
- `VITE_DEMO_ASR_MODEL` *(optional)* – model name to include in the saved configuration.

When the application boots it will automatically persist this configuration to `sessionStorage` if no ASR settings have been saved yet, enabling the recording screen to call `transcribe` without requiring the settings UI.

## Google Apps Script backend

The frontend communicates with a Google Apps Script (GAS) web app that handles speech-to-text, LLM analysis, spreadsheet persistence, schema management, and system status checks. The script source and deployment steps are stored under [`gas/`](gas/).

Quick steps:

1. Copy [`gas/gas-script.js`](gas/gas-script.js) into your GAS project (e.g. `Code.gs`).
2. Configure Script Properties for each provider API key (e.g. `GOOGLE_API_KEY`, `OPENAI_API_KEY`) and `GCS_BUCKET_NAME` for Google Speech long audio support.
3. Update the `SPREADSHEET_ID` constant to point at your Google Sheet, then deploy the script as a Web App.
4. Set `VITE_GAS_API_URL` in this frontend to the deployed Web App URL.

See [`gas/README.md`](gas/README.md) for the full deployment guide and operational notes.

## 本番（main ブランチ）反映前のチェックリスト

1. `npm run build` をローカルで実行し、フロントエンドが問題なくビルドできることを確認します。
2. 必要であれば `.env` または GitHub Actions のシークレットに `VITE_GAS_API_URL` や `VITE_DEMO_ASR_*` を設定し、デモ環境でも自動的に ASR 設定が反映されるようにします。
3. GAS 側の `gas/gas-script.js` を最新化し、スプレッドシート ID や API キー設定がプロダクション環境と一致していることを確認します。
4. 以上の確認が完了したら、`work` ブランチを `main` ブランチへマージし、GitHub Pages のデプロイ結果を確認します（`work` ブランチへ push した時点でも自動デプロイが走るため、事前確認が必要な場合は `work` に push して挙動を確認できます）。

## GitHub Pages ワークフローについて

- GitHub Pages へのデプロイは `.github/workflows/pages.yml` のみで管理しています。旧来の `deploy.yml` は削除したため、Actions タブからデプロイを確認する場合は `Deploy to GitHub Pages` ワークフローを参照してください。
- `work` ブランチで挙動を確認したいときは、`work` に push した直後に Actions タブで `Deploy to GitHub Pages` を選択し、対象ブランチを `work` にして `Run workflow` を実行します。GitHub Actions は最新コミットに対する push が発生した場合にのみ自動トリガーされるため、ワークフローファイルを更新した直後などは手動実行が必要です。

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
