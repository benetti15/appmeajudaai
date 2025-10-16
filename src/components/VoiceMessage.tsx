import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mic, MicOff, Play, Pause, Square, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VoiceMessageProps {
  onVoiceRecorded: (audioBlob: Blob, duration: number) => void;
  disabled?: boolean;
}

export function VoiceMessage({ onVoiceRecorded, disabled }: VoiceMessageProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [duration, setDuration] = useState(0);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        } 
      });
      
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm;codecs=opus' });
        setAudioBlob(blob);
        setDuration(recordingTime);
        
        // Create audio URL for preview
        const audioUrl = URL.createObjectURL(blob);
        audioRef.current = new Audio(audioUrl);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      toast({
        title: "Gravação iniciada",
        description: "Fale agora. Toque novamente para parar.",
      });
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        title: "Erro no microfone",
        description: "Não foi possível acessar o microfone. Verifique as permissões.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  };

  const playPreview = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
        
        audioRef.current.onended = () => {
          setIsPlaying(false);
        };
      }
    }
  };

  const sendVoiceMessage = () => {
    if (audioBlob) {
      onVoiceRecorded(audioBlob, duration);
      resetRecording();
    }
  };

  const resetRecording = () => {
    setAudioBlob(null);
    setDuration(0);
    setRecordingTime(0);
    setIsPlaying(false);
    
    if (audioRef.current) {
      URL.revokeObjectURL(audioRef.current.src);
      audioRef.current = null;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (audioBlob) {
    return (
      <Card className="p-3 bg-primary/5 border-primary/20">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={playPreview}
            className="text-primary hover:bg-primary/10"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-primary/20 rounded-full h-2">
                <div className="bg-primary rounded-full h-2 w-1/3 transition-all duration-300"></div>
              </div>
              <span className="text-sm text-muted-foreground">{formatTime(duration)}</span>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={resetRecording}
            className="text-muted-foreground hover:text-destructive"
          >
            <Square className="h-4 w-4" />
          </Button>
          
          <Button
            size="sm"
            onClick={sendVoiceMessage}
            className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
            disabled={disabled}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {isRecording && (
        <Card className="p-2 bg-destructive/10 border-destructive/20 animate-pulse">
          <div className="flex items-center gap-2 text-destructive">
            <div className="w-2 h-2 bg-destructive rounded-full animate-ping"></div>
            <span className="text-sm font-medium">{formatTime(recordingTime)}</span>
          </div>
        </Card>
      )}
      
      <Button
        variant={isRecording ? "destructive" : "ghost"}
        size="sm"
        onClick={isRecording ? stopRecording : startRecording}
        disabled={disabled}
        className={isRecording ? 
          "bg-destructive hover:bg-destructive/90" : 
          "text-muted-foreground hover:text-primary hover:bg-primary/10"
        }
      >
        {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
      </Button>
    </div>
  );
}