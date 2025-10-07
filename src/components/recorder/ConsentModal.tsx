import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { saveConsent } from '@/lib/storage';

interface ConsentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ConsentModal = ({ open, onOpenChange }: ConsentModalProps) => {
  const [agreed, setAgreed] = useState(false);

  const handleAgree = () => {
    if (agreed) {
      saveConsent();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>録音の同意</DialogTitle>
          <DialogDescription>
            営業ヒアリングを録音します。録音された音声は文字起こしと要約のために使用され、
            処理後は保持されません。
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <h4 className="font-medium text-sm">以下の内容にご同意ください：</h4>
            <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
              <li>音声データは一時的に処理のみに使用されます</li>
              <li>APIキーはセッション中のみ保持されます</li>
              <li>個人情報は適切に取り扱われます</li>
            </ul>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="consent"
              checked={agreed}
              onCheckedChange={(checked) => setAgreed(checked === true)}
            />
            <Label
              htmlFor="consent"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              上記の内容に同意し、録音を開始します
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleAgree}
            disabled={!agreed}
            className="w-full"
          >
            同意して録音を開始
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConsentModal;
