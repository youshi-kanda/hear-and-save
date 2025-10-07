import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mic, Square, Play, Pause, Star, Settings as SettingsIcon, Home } from 'lucide-react';
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

  // MediaRecorder関連の ref と state
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const levelIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleStartRecording = async () => {
    if (!hasConsent()) {
      setShowConsent(true);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // AudioContext setup for level monitoring
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      // MediaRecorder setup
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        processRecording();
      };

      mediaRecorder.start();
      setRecordingState('recording');
      
      // Start duration timer
      intervalRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

      // Start level monitoring
      startLevelMonitoring();

    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('マイクへのアクセスが拒否されました。ブラウザの設定を確認してください。');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    cleanup();
    setRecordingState('completed');
  };

  const handlePauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setRecordingState('paused');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (levelIntervalRef.current) {
        clearInterval(levelIntervalRef.current);
      }
    }
  };

  const handleResumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setRecordingState('recording');
      
      // Resume duration timer
      intervalRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

      // Resume level monitoring
      startLevelMonitoring();
    }
  };

  const startLevelMonitoring = () => {
    if (!analyserRef.current) return;
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    
    levelIntervalRef.current = setInterval(() => {
      if (analyserRef.current) {
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
        setAudioLevel(Math.min(100, (average / 255) * 100));
      }
    }, 100);
  };

  const cleanup = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (levelIntervalRef.current) {
      clearInterval(levelIntervalRef.current);
      levelIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setAudioLevel(0);
  };

  const processRecording = async () => {
    if (chunksRef.current.length === 0) return;

    const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
    
    // Convert to base64 for API
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(',')[1];
      
      setCurrentStep('asr');
      
      // TODO: Call ASR API
      setTimeout(() => {
        setTranscript('音声認識処理が完了しました。設定画面でASRプロバイダーを設定してください。');
        setCurrentStep('summary');
        
        setTimeout(() => {
          setSummary('要約処理が完了しました。設定画面でLLMプロバイダーを設定してください。');
          setCurrentStep('extract');
          
          setTimeout(() => {
            setExtractedData({
              '面談相手の氏名': '設定完了後に自動抽出されます',
              '訪問目的': '設定完了後に自動抽出されます'
            });
            setCurrentStep('save');
          }, 1000);
        }, 1000);
      }, 2000);
    };
    
    reader.readAsDataURL(audioBlob);
  };

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  const handleAddBookmark = () => {
    setBookmarks([...bookmarks, { time: duration }]);
  };

  return (
    <div className="min-h-screen bg-background">
      <ConsentModal open={showConsent} onOpenChange={setShowConsent} />
      
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild>
              <Link to="/">
                <Home className="w-4 h-4 mr-2" />
                ホーム
              </Link>
            </Button>
            <h1 className="text-2xl font-bold text-foreground">営業ヒアリング記録</h1>
          </div>
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
