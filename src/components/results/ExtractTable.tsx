import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Database } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExtractTableProps {
  data: Record<string, string>;
}

const ExtractTable = ({ data }: ExtractTableProps) => {
  const entries = Object.entries(data);

  if (entries.length === 0) {
    return null;
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Database className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-bold">抽出データ</h2>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/3">項目</TableHead>
              <TableHead>値</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map(([key, value]) => {
              const isAiAnalyzed = value.includes('【AI分析】');
              const isMissing = value === '情報なし' || !value;

              return (
                <TableRow key={key}>
                  <TableCell className="font-medium">{key}</TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        isAiAnalyzed && 'border-b-2 border-warning bg-warning-bg px-1',
                        isMissing && 'text-muted-foreground italic'
                      )}
                    >
                      {value || '情報なし'}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};

export default ExtractTable;
