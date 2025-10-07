import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Plus, Save } from 'lucide-react';
import { Link } from 'react-router-dom';
import SchemaEditor from '@/components/schema/SchemaEditor';

const Schema = () => {
  const [schemaName, setSchemaName] = useState('面談_スキーマ');
  const [fields, setFields] = useState<string[]>([
    '氏名',
    '年齢',
    '職業',
    '家族構成',
    '相談内容',
    '希望保障額',
    '予算',
  ]);

  const handleSave = () => {
    // TODO: Save schema
    console.log('Saving schema:', { name: schemaName, fields });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                戻る
              </Link>
            </Button>
            <h1 className="text-2xl font-bold text-foreground">スキーマ管理</h1>
          </div>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            保存
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="p-6 mb-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">スキーマ名</label>
              <Input
                value={schemaName}
                onChange={(e) => setSchemaName(e.target.value)}
                placeholder="例: 面談_スキーマ"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">項目リスト</label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setFields([...fields, '新しい項目'])}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  項目を追加
                </Button>
              </div>
              <SchemaEditor fields={fields} onFieldsChange={setFields} />
            </div>
          </div>
        </Card>

        {/* Template Presets */}
        <Card className="p-6">
          <h3 className="text-lg font-bold mb-4">テンプレート</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-start"
              onClick={() => {
                setSchemaName('学資保険_面談');
                setFields(['氏名', '子供の年齢', '進学希望', '必要保障額', '月額予算']);
              }}
            >
              <span className="font-medium">学資保険</span>
              <span className="text-xs text-muted-foreground">子供の教育資金</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-start"
              onClick={() => {
                setSchemaName('医療保険_面談');
                setFields(['氏名', '年齢', '既往症', '希望保障内容', '月額予算']);
              }}
            >
              <span className="font-medium">医療保険</span>
              <span className="text-xs text-muted-foreground">病気・ケガの保障</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-start"
              onClick={() => {
                setSchemaName('ライフプラン_面談');
                setFields(['氏名', '年齢', '家族構成', '年収', '資産状況', '将来の目標']);
              }}
            >
              <span className="font-medium">ライフプラン</span>
              <span className="text-xs text-muted-foreground">人生設計全般</span>
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default Schema;
