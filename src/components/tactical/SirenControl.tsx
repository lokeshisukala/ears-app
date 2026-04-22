import { useEffect, useRef, useState } from "react";
import { Siren, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Siren toggle: synthesizes a two-tone wail via WebAudio and overlays
 * pulsing red/blue emergency lights on the viewport.
 */
export function SirenControl() {
  const [active, setActive] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const lfoRef = useRef<number | null>(null);

  const start = () => {
    try {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new Ctx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.value = 700;
      gain.gain.value = 0.06;
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      ctxRef.current = ctx;
      oscRef.current = osc;
      gainRef.current = gain;

      // wail LFO
      let t = 0;
      lfoRef.current = window.setInterval(() => {
        t += 0.12;
        const f = 700 + Math.sin(t) * 350;
        if (oscRef.current) oscRef.current.frequency.setTargetAtTime(f, ctx.currentTime, 0.04);
      }, 60);
    } catch {
      // audio not available — visual only
    }
  };

  const stop = () => {
    if (lfoRef.current) { clearInterval(lfoRef.current); lfoRef.current = null; }
    try { oscRef.current?.stop(); } catch {}
    try { ctxRef.current?.close(); } catch {}
    oscRef.current = null; gainRef.current = null; ctxRef.current = null;
  };

  useEffect(() => {
    if (active) start(); else stop();
    return () => stop();
  }, [active]);

  return (
    <>
      {/* Emergency lights overlay */}
      {active && (
        <div className="pointer-events-none fixed inset-0 z-[450] overflow-hidden">
          <div className="absolute inset-y-0 left-0 w-1/2 animate-siren-red" />
          <div className="absolute inset-y-0 right-0 w-1/2 animate-siren-blue" />
        </div>
      )}

      <Button
        onClick={() => setActive((p) => !p)}
        variant="ghost"
        size="icon"
        aria-label={active ? "Disable siren" : "Enable siren"}
        className={`tactical-panel h-10 w-10 rounded-lg backdrop-blur-md transition-all ${
          active ? "bg-emergency/20 text-emergency animate-pulse-emergency" : ""
        }`}
      >
        {active ? <Siren className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
      </Button>
    </>
  );
}
