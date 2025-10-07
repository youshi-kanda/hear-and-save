import { cn } from '@/lib/utils';

interface LevelMeterProps {
  level: number; // 0-100
}

const LevelMeter = ({ level }: LevelMeterProps) => {
  const isClipping = level > 90;
  const isSilent = level < 5;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">入力レベル</span>
        {isClipping && (
          <span className="text-destructive font-medium">クリッピング検出</span>
        )}
        {isSilent && (
          <span className="text-warning font-medium">無音</span>
        )}
      </div>
      
      <div className="h-3 bg-secondary rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full transition-all duration-100',
            isClipping && 'bg-destructive',
            !isClipping && level > 70 && 'bg-warning',
            !isClipping && level > 30 && level <= 70 && 'bg-success',
            !isClipping && level <= 30 && 'bg-primary'
          )}
          style={{ width: `${level}%` }}
        />
      </div>
    </div>
  );
};

export default LevelMeter;
