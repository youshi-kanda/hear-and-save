import { Card } from '@/components/ui/card';
import { FileText } from 'lucide-react';

interface SummaryCardProps {
  summary: string;
  transcript: string;
}

const SummaryCard = ({ summary, transcript }: SummaryCardProps) => {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-bold">要約</h2>
      </div>

      {summary ? (
        <div className="prose prose-sm max-w-none">
          <div className="text-foreground whitespace-pre-wrap">{summary}</div>
        </div>
      ) : (
        <div className="text-muted-foreground text-sm">
          要約を生成中...
        </div>
      )}

      {transcript && (
        <details className="mt-6">
          <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            文字起こし全文を表示
          </summary>
          <div className="mt-3 p-4 bg-muted rounded-lg text-sm whitespace-pre-wrap">
            {transcript}
          </div>
        </details>
      )}
    </Card>
  );
};

export default SummaryCard;
