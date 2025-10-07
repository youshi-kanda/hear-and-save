import { Check, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProcessStep } from '@/pages/Recorder';

interface ProgressStepsProps {
  currentStep: ProcessStep;
  failedStep?: ProcessStep;
}

const steps: { key: ProcessStep; label: string }[] = [
  { key: 'recording', label: '録音' },
  { key: 'asr', label: '文字起こし' },
  { key: 'summary', label: '要約' },
  { key: 'extract', label: 'データ抽出' },
  { key: 'save', label: '保存' },
];

const ProgressSteps = ({ currentStep, failedStep }: ProgressStepsProps) => {
  const currentIndex = steps.findIndex((s) => s.key === currentStep);

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isFailed = step.key === failedStep;

          return (
            <div key={step.key} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all',
                    isCompleted && 'bg-success border-success text-success-foreground',
                    isCurrent && 'bg-primary border-primary text-primary-foreground animate-pulse',
                    isFailed && 'bg-destructive border-destructive text-destructive-foreground',
                    !isCompleted && !isCurrent && !isFailed && 'bg-muted border-muted-foreground/30'
                  )}
                >
                  {isCompleted && <Check className="w-5 h-5" />}
                  {isCurrent && !isFailed && <Loader2 className="w-5 h-5 animate-spin" />}
                  {isFailed && <X className="w-5 h-5" />}
                  {!isCompleted && !isCurrent && !isFailed && (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>
                <span
                  className={cn(
                    'text-xs mt-2 font-medium',
                    (isCompleted || isCurrent) && 'text-foreground',
                    !isCompleted && !isCurrent && 'text-muted-foreground'
                  )}
                >
                  {step.label}
                </span>
              </div>

              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'h-0.5 flex-1 mx-2 transition-all',
                    isCompleted ? 'bg-success' : 'bg-muted'
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressSteps;
