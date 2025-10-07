import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Mic,
  Upload,
  Settings,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronRight,
  ClipboardCheck,
  Volume2,
  Shield,
  Database,
} from "lucide-react";

export default function Index() {
  const [showPreparation, setShowPreparation] = useState(false);

  // ダミーデータ
  const recentRecords = [
    { id: "MEET-20251007-001", customer: "田中太郎", case: "学資保険相談", date: "2025-10-07" },
    { id: "MEET-20251006-003", customer: "佐藤花子", case: "医療保険見直し", date: "2025-10-06" },
    { id: "MEET-20251006-002", customer: "鈴木一郎", case: "ライフプラン相談", date: "2025-10-06" },
  ];

  const currentSchema = "面談_スキーマ_20251008-120001";
  const asrStatus = "connected"; // connected | disconnected
  const llmStatus = "connected";

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* ヘッダー */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              営業ヒアリング記録
            </h1>
            <p className="text-base text-muted-foreground max-w-2xl mx-auto">
              録音してAIが自動要約・スプレッドシートに保存します
            </p>
          </div>

          {/* メイン録音ボタン */}
          <Card className="p-6 text-center bg-gradient-to-br from-card to-card/50 border-primary/20 transition-all duration-200 hover:shadow-md">
            <div className="space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
                <Mic className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-semibold">新しい面談を記録</h2>
                <p className="text-sm text-muted-foreground">マイクを使って会話を録音します</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild size="lg" className="text-base h-12 px-8 shadow-lg hover:shadow-xl transition-all">
                  <Link to="/record">
                    <Mic className="mr-2 h-5 w-5" />
                    録音を開始する
                  </Link>
                </Button>
                <Dialog open={showPreparation} onOpenChange={setShowPreparation}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="lg" className="h-12 px-6">
                      <ClipboardCheck className="mr-2 h-5 w-5" />
                      録音前の準備を確認
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <ClipboardCheck className="h-5 w-5 text-primary" />
                        録音前のチェックリスト
                      </DialogTitle>
                      <DialogDescription>
                        スムーズな録音のために、以下を確認してください
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 py-4">
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                        <Volume2 className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <p className="font-medium text-sm">マイクの音量を確認</p>
                          <p className="text-xs text-muted-foreground">録音開始後にレベルメーターで確認できます</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                        <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <p className="font-medium text-sm">顧客の録音同意を得る</p>
                          <p className="text-xs text-muted-foreground">録音開始前に必ず確認してください</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                        <Shield className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <p className="font-medium text-sm">静かな環境で録音する</p>
                          <p className="text-xs text-muted-foreground">ノイズの少ない場所を選んでください</p>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </Card>

          {/* 直近の面談記録 & システム状態 */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
              <CardHeader className="px-0 pt-0 pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="h-5 w-5 text-primary" />
                  直近の面談記録
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <div className="space-y-2">
                  {recentRecords.map((record) => (
                    <div
                      key={record.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-all duration-200 cursor-pointer hover:shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">{record.customer}</p>
                          <p className="text-xs text-muted-foreground">{record.case}</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">{record.date}</p>
                    </div>
                  ))}
                </div>
                <Button asChild variant="ghost" className="w-full mt-3 h-9">
                  <Link to="/history" className="flex items-center gap-2 text-sm">
                    すべての履歴を見る
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
              <CardHeader className="px-0 pt-0 pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Settings className="h-5 w-5 text-primary" />
                  システム状態
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <span className="text-sm font-medium">現在のスキーマ</span>
                    <span className="text-xs text-muted-foreground truncate max-w-[200px]">{currentSchema}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <span className="text-sm font-medium">ASR接続</span>
                    <div className="flex items-center gap-2">
                      {asrStatus === "connected" ? (
                        <>
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-success/10">
                            <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                            <span className="text-xs font-medium text-success">接続済み</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-destructive/10">
                            <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                            <span className="text-xs font-medium text-destructive">未接続</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <span className="text-sm font-medium">LLM接続</span>
                    <div className="flex items-center gap-2">
                      {llmStatus === "connected" ? (
                        <>
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-success/10">
                            <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                            <span className="text-xs font-medium text-success">接続済み</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-destructive/10">
                            <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                            <span className="text-xs font-medium text-destructive">未接続</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* その他の操作 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer group">
              <Link to="/record?mode=upload" className="flex flex-col items-center text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Upload className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">音声ファイルをアップロード</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">既存の音声を解析</p>
                </div>
              </Link>
            </Card>

            <Card className="p-4 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer group">
              <Link to="/settings" className="flex flex-col items-center text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Settings className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">設定</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">APIキー・プロバイダ</p>
                </div>
              </Link>
            </Card>

            <Card className="p-4 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer group">
              <Link to="/schema" className="flex flex-col items-center text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Database className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">スキーマ管理</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">項目のカスタマイズ</p>
                </div>
              </Link>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
