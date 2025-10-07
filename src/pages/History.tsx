import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, FileText, Calendar, User, Tag, Home } from "lucide-react";

// ダミーデータ（実際にはAPIから取得）
const allRecords = [
  { id: "MEET-20251007-001", customer: "田中太郎", case: "学資保険相談", date: "2025-10-07", status: "完了" },
  { id: "MEET-20251006-003", customer: "佐藤花子", case: "医療保険見直し", date: "2025-10-06", status: "完了" },
  { id: "MEET-20251006-002", customer: "鈴木一郎", case: "ライフプラン相談", date: "2025-10-06", status: "完了" },
  { id: "MEET-20251005-001", customer: "山田美咲", case: "年金保険新規", date: "2025-10-05", status: "完了" },
  { id: "MEET-20251004-002", customer: "高橋健太", case: "がん保険相談", date: "2025-10-04", status: "完了" },
  { id: "MEET-20251003-001", customer: "伊藤愛", case: "学資保険相談", date: "2025-10-03", status: "完了" },
  { id: "MEET-20251002-001", customer: "渡辺誠", case: "終身保険見直し", date: "2025-10-02", status: "完了" },
  { id: "MEET-20251001-003", customer: "中村優子", case: "医療保険新規", date: "2025-10-01", status: "完了" },
];

export default function History() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredRecords = allRecords.filter(
    (record) =>
      record.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.case.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* ヘッダー */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              <Button asChild variant="ghost" size="sm" className="flex-shrink-0">
                <Link to="/">
                  <Home className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">ホーム</span>
                </Link>
              </Button>
              <div>
                <h1 className="text-3xl font-bold">面談履歴</h1>
                <p className="text-sm text-muted-foreground mt-1">すべての面談記録を表示</p>
              </div>
            </div>
            <Badge variant="secondary" className="text-sm">
              {filteredRecords.length} 件
            </Badge>
          </div>

          {/* 検索バー */}
          <Card className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="顧客名、案件名、IDで検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </Card>

          {/* 履歴リスト */}
          <div className="grid gap-4">
            {filteredRecords.map((record) => (
              <Card
                key={record.id}
                className="p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-semibold text-lg">{record.customer}</h3>
                        <Badge variant="outline" className="text-xs">
                          {record.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <Tag className="h-3.5 w-3.5" />
                          <span>{record.case}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{record.date}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5" />
                          <span className="font-mono text-xs">{record.id}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    詳細
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {/* 検索結果なし */}
          {filteredRecords.length === 0 && (
            <Card className="p-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">検索結果がありません</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    別のキーワードで検索してみてください
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
