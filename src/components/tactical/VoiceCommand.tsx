import { useEffect, useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface Props {
  onCommand: (cmd: "navigate" | "sos" | "call" | "scan") => void;
}

// Minimal types for browser SpeechRecognition API
type SpeechRecognitionResult = { transcript: string };
interface SREvent { results: ArrayLike<ArrayLike<SpeechRecognitionResult>> }
interface SR {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: SREvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

export function VoiceCommand({ onCommand }: Props) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const [last, setLast] = useState<string>("");
  const recRef = useRef<SR | null>(null);

  useEffect(() => {
    const w = window as unknown as { SpeechRecognition?: new () => SR; webkitSpeechRecognition?: new () => SR };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) { setSupported(false); return; }
    const rec = new Ctor();
    rec.lang = "en-US";
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e) => {
      const transcript = e.results[0]?.[0]?.transcript?.toLowerCase() ?? "";
      setLast(transcript);
      if (!transcript) return;
      if (/(navigate|go|drive|start)/.test(transcript))      { onCommand("navigate"); toast({ title: "🎤 Voice", description: `"${transcript}" → Navigate` }); }
      else if (/(sos|emergency|help)/.test(transcript))      { onCommand("sos");      toast({ title: "🆘 Voice", description: `"${transcript}" → SOS`, variant: "destructive" }); }
      else if (/(call|phone|hospital)/.test(transcript))     { onCommand("call");     toast({ title: "📞 Voice", description: `"${transcript}" → Call` }); }
      else if (/(scan|find|search)/.test(transcript))        { onCommand("scan");     toast({ title: "🔍 Voice", description: `"${transcript}" → Scan` }); }
      else                                                    toast({ title: "🎤 Heard", description: `"${transcript}" — no matching command` });
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recRef.current = rec;
  }, [onCommand]);

  const toggle = () => {
    if (!supported) {
      toast({ title: "Voice unavailable", description: "Speech recognition not supported in this browser." });
      return;
    }
    const rec = recRef.current;
    if (!rec) return;
    if (listening) { rec.stop(); setListening(false); }
    else {
      try { rec.start(); setListening(true); }
      catch { /* already started */ }
    }
  };

  return (
    <div className="absolute bottom-40 sm:bottom-44 left-4 z-[501] flex flex-col items-start gap-2">
      {last && (
        <div className="tactical-panel rounded-md px-2 py-1 font-mono text-[10px] tracking-wider text-foreground backdrop-blur-md max-w-[180px] truncate">
          🎤 "{last}"
        </div>
      )}
      <Button
        onClick={toggle}
        size="icon"
        aria-label={listening ? "Stop listening" : "Start voice command"}
        className={`h-10 w-10 rounded-full backdrop-blur-md transition-all ${
          listening
            ? "bg-emergency hover:bg-emergency/90 animate-pulse glow-primary"
            : "tactical-panel hover:bg-primary/20 text-primary"
        }`}
      >
        {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
      </Button>
    </div>
  );
}
