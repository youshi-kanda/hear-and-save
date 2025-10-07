import { GripVertical, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface SchemaEditorProps {
  fields: string[];
  onFieldsChange: (fields: string[]) => void;
}

const SchemaEditor = ({ fields, onFieldsChange }: SchemaEditorProps) => {
  const updateField = (index: number, value: string) => {
    const newFields = [...fields];
    newFields[index] = value;
    onFieldsChange(newFields);
  };

  const removeField = (index: number) => {
    onFieldsChange(fields.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      {fields.map((field, index) => (
        <div key={index} className="flex items-center gap-2">
          <GripVertical className="w-5 h-5 text-muted-foreground cursor-grab" />
          <Input
            value={field}
            onChange={(e) => updateField(index, e.target.value)}
            className="flex-1"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => removeField(index)}
            disabled={fields.length <= 1}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ))}
    </div>
  );
};

export default SchemaEditor;
