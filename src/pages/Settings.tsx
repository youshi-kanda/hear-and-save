import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getAsrConfig, getLlmConfig, saveAsrConfig, saveLlmConfig } from '@/lib/storage';
import type { AsrProvider, LlmProvider, AsrConfig, LlmConfig } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

const Settings = () => {
  const { toast } = useToast();
  
  // ASR Settings
  const [asrProvider, setAsrProvider] = useState<AsrProvider>('openai');
  const [asrApiKey, setAsrApiKey] = useState('');
  const [asrModel, setAsrModel] = useState('whisper-1');

  // LLM Settings
  const [llmProvider, setLlmProvider] = useState<LlmProvider>('azure');
  const [llmApiKey, setLlmApiKey] = useState('');
  const [llmEndpoint, setLlmEndpoint] = useState('');
  const [llmDeployment, setLlmDeployment] = useState('');
  const [llmApiVersion, setLlmApiVersion] = useState('2024-10-21');
  const [llmModel, setLlmModel] = useState('gpt-4o');

  useEffect(() => {
    const asrConfig = getAsrConfig();
    if (asrConfig) {
      setAsrProvider(asrConfig.provider);
      setAsrApiKey(asrConfig.apiKey);
      setAsrModel(asrConfig.model || 'whisper-1');
    }

    const llmConfig = getLlmConfig();
    if (llmConfig) {
      setLlmProvider(llmConfig.provider);
      setLlmApiKey(llmConfig.apiKey || '');
      setLlmEndpoint(llmConfig.endpoint || '');
      setLlmDeployment(llmConfig.deployment || '');
      setLlmApiVersion(llmConfig.apiVersion || '2024-10-21');
      setLlmModel(llmConfig.model || 'gpt-4o');
    }
  }, []);

  const handleSave = () => {
    // 入力バリデーション（LLM必須、ASRは現状UI無効のため軽め）
    if (!llmApiKey.trim()) {
      toast({
        title: '入力エラー',
        description: 'LLMのAPIキーを入力してください。',
        variant: 'destructive'
      });
      return;
    }
    if (llmProvider === 'azure') {
      if (!llmEndpoint.trim() || !llmDeployment.trim() || !llmApiVersion.trim()) {
        toast({
          title: '入力エラー',
          description: 'Azureのエンドポイント、デプロイメント名、APIバージョンは必須です。',
          variant: 'destructive'
        });
        return;
      }
    }

    const asrConfig: AsrConfig = {
      provider: asrProvider,
      apiKey: asrApiKey,
      model: asrModel,
    };

    const llmConfig: LlmConfig = {
      provider: llmProvider,
      apiKey: llmApiKey,
      endpoint: llmEndpoint,
      deployment: llmDeployment,
      apiVersion: llmApiVersion,
      model: llmModel,
    };

    saveAsrConfig(asrConfig);
    saveLlmConfig(llmConfig);

    toast({
      title: '設定を保存しました',
      description: 'APIキーはセッション中のみ保持されます。',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <Button variant="ghost" size="sm" asChild className="flex-shrink-0">
              <Link to="/">
                <Home className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">ホーム</span>
              </Link>
            </Button>
            <h1 className="text-lg sm:text-2xl font-bold text-foreground truncate">設定</h1>
          </div>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            保存
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Security Notice */}
        <Card className="p-4 mb-6 bg-warning-bg border-warning">
          <p className="text-sm text-warning-foreground">
            ⚠️ APIキーは保存されません。セッション中のみ保持され、ページを離れると破棄されます。
          </p>
        </Card>

        {/* ASR Settings */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">文字起こし（ASR）設定</h2>
          {/* 告知バナー（カード上） */}
          <div className="mb-4 rounded-md border border-warning bg-warning-bg p-3">
            <p className="text-sm text-warning-foreground">
              開発中です。開発用キーで運用中のためテスト利用でご使用いただけます。
            </p>
          </div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="asr-provider">プロバイダ</Label>
              {/* 全面無効化 */}
              <Select value={asrProvider} onValueChange={(v) => setAsrProvider(v as AsrProvider)} disabled>
                <SelectTrigger id="asr-provider" disabled>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">OpenAI Whisper</SelectItem>
                  <SelectItem value="deepgram">Deepgram</SelectItem>
                  <SelectItem value="google">Google Speech-to-Text</SelectItem>
                  <SelectItem value="azure">Azure Speech</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="asr-api-key">APIキー</Label>
              <Input
                id="asr-api-key"
                type="password"
                value={asrApiKey}
                onChange={(e) => setAsrApiKey(e.target.value)}
                placeholder="sk-..."
                disabled
              />
            </div>

            {asrProvider === 'openai' && (
              <div>
                <Label htmlFor="asr-model">モデル</Label>
                <Input
                  id="asr-model"
                  value={asrModel}
                  onChange={(e) => setAsrModel(e.target.value)}
                  placeholder="whisper-1"
                  disabled
                />
              </div>
            )}
          </div>
        </Card>

        {/* LLM Settings */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">要約・抽出（LLM）設定</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="llm-provider">プロバイダ</Label>
              <Select value={llmProvider} onValueChange={(v) => setLlmProvider(v as LlmProvider)}>
                <SelectTrigger id="llm-provider">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="azure">Azure OpenAI</SelectItem>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="google">Google Gemini</SelectItem>
                  <SelectItem value="anthropic">Anthropic Claude</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {llmProvider === 'azure' && (
              <>
                <div>
                  <Label htmlFor="llm-endpoint">エンドポイント</Label>
                  <Input
                    id="llm-endpoint"
                    value={llmEndpoint}
                    onChange={(e) => setLlmEndpoint(e.target.value)}
                    placeholder="https://your-resource.openai.azure.com"
                  />
                </div>
                <div>
                  <Label htmlFor="llm-deployment">デプロイメント名</Label>
                  <Input
                    id="llm-deployment"
                    value={llmDeployment}
                    onChange={(e) => setLlmDeployment(e.target.value)}
                    placeholder="gpt-4o"
                  />
                </div>
                <div>
                  <Label htmlFor="llm-api-version">APIバージョン</Label>
                  <Input
                    id="llm-api-version"
                    value={llmApiVersion}
                    onChange={(e) => setLlmApiVersion(e.target.value)}
                    placeholder="2024-10-21"
                  />
                </div>
              </>
            )}

            <div>
              <Label htmlFor="llm-api-key">APIキー</Label>
              <Input
                id="llm-api-key"
                type="password"
                value={llmApiKey}
                onChange={(e) => setLlmApiKey(e.target.value)}
                placeholder={llmProvider === 'anthropic' ? 'sk-ant-...' : 'sk-...'}
              />
            </div>

            {/* モデル指定は不要のため非表示（サーバ側でプロバイダ既定を使用） */}
          </div>
        </Card>
      </main>
    </div>
  );
};

export default Settings;
