import { useEffect, useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface Props {
  onCommand: (cmd: "navigate" | "sos" | "call" | "scan") => void;
}

// Minimal types for browser SpeechRecognition API
type SpeechRecognitionResult = { transcript: string };
interface SREvent { results: ArrayLike<ArrayLike<SpeechRecognitionResult> & { isFinal?: boolean }> }
interface SRErrorEvent { error?: string; message?: string }
interface SR {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: SREvent) => void) | null;
  onerror: ((e: SRErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
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
    rec.onstart = () => setListening(true);
    rec.onresult = (e) => {
      // Grab the most recent final transcript
      let transcript = "";
      const results = e.results as unknown as Array<Array<SpeechRecognitionResult>>;
      for (let i = 0; i < results.length; i++) {
        transcript += results[i]?.[0]?.transcript ?? "";
      }
      transcript = transcript.trim().toLowerCase();
      setLast(transcript);
      if (!transcript) return;
      console.log("[VoiceCommand] heard:", transcript);

      if (/(navigate|go|drive|start|move|dispatch)/.test(transcript)) {
        onCommand("navigate"); toast({ title: "🎤 Voice", description: `"${transcript}" → Navigate` });
      } else if (/(sos|emergency|help|mayday)/.test(transcript)) {
        onCommand("sos"); toast({ title: "🆘 Voice", description: `"${transcript}" → SOS`, variant: "destructive" });
      } else if (/(call|phone|hospital|dial)/.test(transcript)) {
        onCommand("call"); toast({ title: "📞 Voice", description: `"${transcript}" → Call hospital` });
      } else if (/(scan|find|search|locate)/.test(transcript)) {
        onCommand("scan"); toast({ title: "🔍 Voice", description: `"${transcript}" → Scan` });
      } else {
        toast({ title: "🎤 Heard", description: `"${transcript}" — no matching command` });
      }
    };
    rec.onerror = (e) => {
      console.warn("[VoiceCommand] error:", e?.error, e?.message);
      setListening(false);
      const code = e?.error ?? "unknown";
      if (code === "not-allowed" || code === "service-not-allowed") {
        toast({ title: "🎤 Microphone blocked", description: "Allow mic access in your browser to use voice.", variant: "destructive" });
      } else if (code === "no-speech") {
        toast({ title: "🎤 No speech detected", description: "Tap the mic and try again." });
      } else if (code !== "aborted") {
        toast({ title: "🎤 Voice error", description: code });
      }
    };
    rec.onend = () => setListening(false);
    recRef.current = rec;
  }, [onCommand]);

  const toggle = async () => {
    if (!supported) {
      toast({ title: "Voice unavailable", description: "Speech recognition not supported in this browser." });
      return;
    }
    const rec = recRef.current;
    if (!rec) return;

    if (listening) {
      try { rec.stop(); } catch { /* noop */ }
      setListening(false);
      return;
    }

    // Proactively request microphone permission so SpeechRecognition can start
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // immediately stop tracks — we only needed the permission grant
        stream.getTracks().forEach((t) => t.stop());
      }
    } catch (err) {
      console.warn("[VoiceCommand] mic permission denied", err);
      toast({ title: "🎤 Microphone blocked", description: "Please allow microphone access and try again.", variant: "destructive" });
      return;
    }

    try {
      rec.start();
      setListening(true);
      toast({ title: "🎤 Listening…", description: "Say: navigate, call hospital, scan, or SOS." });
    } catch (err) {
      console.warn("[VoiceCommand] start failed", err);
      // already started — stop & retry
      try { rec.stop(); } catch { /* noop */ }
    }
  };

  return (
    <div className="absolute top-20 sm:top-32 right-3 sm:right-4 z-[501] flex flex-col items-end gap-2">
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
