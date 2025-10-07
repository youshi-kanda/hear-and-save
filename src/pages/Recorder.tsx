import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mic, Square, Play, Pause, Star, Settings as SettingsIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import ConsentModal from '@/components/recorder/ConsentModal';
import LevelMeter from '@/components/recorder/LevelMeter';
import ProgressSteps from '@/components/recorder/ProgressSteps';
import BookmarkBar from '@/components/recorder/BookmarkBar';
import SummaryCard from '@/components/results/SummaryCard';
import ExtractTable from '@/components/results/ExtractTable';
import { hasConsent } from '@/lib/storage';

export type RecordingState = 'idle' | 'recording' | 'paused' | 'completed';
export type ProcessStep = 'recording' | 'asr' | 'summary' | 'extract' | 'save';

export interface Bookmark {
  time: number;
  note?: string;
}

const Recorder = () => {
  const [showConsent, setShowConsent] = useState(!hasConsent());
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [currentStep, setCurrentStep] = useState<ProcessStep>('recording');
  const [audioLevel, setAudioLevel] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [transcript, setTranscript] = useState('');
  const [summary, setSummary] = useState('');
  const [extractedData, setExtractedData] = useState<Record<string, string>>({});

  const handleStartRecording = () => {
    if (!hasConsent()) {
      setShowConsent(true);
      return;
    }
    setRecordingState('recording');
    // TODO: Start MediaRecorder
  };

  const handleStopRecording = () => {
    setRecordingState('completed');
    // TODO: Stop MediaRecorder and process
  };

  const handlePauseRecording = () => {
    setRecordingState('paused');
    // TODO: Pause MediaRecorder
  };

  const handleResumeRecording = () => {
    setRecordingState('recording');
    // TODO: Resume MediaRecorder
  };

  const handleAddBookmark = () => {
    setBookmarks([...bookmarks, { time: duration }]);
  };

  return (
    <div className="min-h-screen bg-background">
      <ConsentModal open={showConsent} onOpenChange={setShowConsent} />
      
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">営業ヒアリング記録</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/schema">
                <SettingsIcon className="w-4 h-4 mr-2" />
                スキーマ
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/settings">
                <SettingsIcon className="w-4 h-4 mr-2" />
                設定
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Progress Steps */}
        <ProgressSteps currentStep={currentStep} />

        {/* Recording Panel */}
        <Card className="p-8 mb-6">
          <div className="space-y-6">
            {/* Level Meter */}
            <LevelMeter level={audioLevel} />

            {/* Duration Display */}
            <div className="text-center">
              <div className="text-5xl font-bold text-foreground tabular-nums">
                {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
              </div>
              <div className="text-sm text-muted-foreground mt-1">録音時間</div>
            </div>

            {/* Control Buttons */}
            <div className="flex justify-center items-center gap-4">
              {recordingState === 'idle' && (
                <Button
                  size="lg"
                  className="h-20 w-20 rounded-full bg-gradient-primary hover:shadow-glow transition-all"
                  onClick={handleStartRecording}
                >
                  <Mic className="w-8 h-8" />
                </Button>
              )}

              {recordingState === 'recording' && (
                <>
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-16 w-16 rounded-full"
                    onClick={handlePauseRecording}
                  >
                    <Pause className="w-6 h-6" />
                  </Button>
                  <Button
                    size="lg"
                    className="h-20 w-20 rounded-full animate-pulse bg-recording hover:bg-recording/90"
                    onClick={handleStopRecording}
                  >
                    <Square className="w-8 h-8" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-16 w-16 rounded-full"
                    onClick={handleAddBookmark}
                  >
                    <Star className="w-6 h-6" />
                  </Button>
                </>
              )}

              {recordingState === 'paused' && (
                <>
                  <Button
                    size="lg"
                    className="h-20 w-20 rounded-full bg-gradient-primary"
                    onClick={handleResumeRecording}
                  >
                    <Play className="w-8 h-8" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-16 w-16 rounded-full"
                    onClick={handleStopRecording}
                  >
                    <Square className="w-6 h-6" />
                  </Button>
                </>
              )}
            </div>

            {/* Bookmarks */}
            {bookmarks.length > 0 && <BookmarkBar bookmarks={bookmarks} />}
          </div>
        </Card>

        {/* Results Section */}
        {transcript && (
          <div className="space-y-6">
            <SummaryCard summary={summary} transcript={transcript} />
            <ExtractTable data={extractedData} />
          </div>
        )}
      </main>
    </div>
  );
};

export default Recorder;
