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
  const nodesRef = useRef<{ osc: OscillatorNode; gain: GainNode; filter: BiquadFilterNode } | null>(null);
  const toggleRef = useRef<number | null>(null);

  /**
   * Authentic European-style ambulance two-tone "nee-naw":
   * alternates between two stable pitches (~960 Hz HI, ~770 Hz LO),
   * each held for ~450 ms, shaped through a low-pass filter to
   * mimic a real horn driver instead of a synth tone.
   */
  const start = () => {
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx();
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = "square";              // brassy horn-like timbre
      osc.frequency.value = 960;
      filter.type = "lowpass";
      filter.frequency.value = 1800;    // tame the harsh harmonics
      filter.Q.value = 6;
      gain.gain.value = 0.08;

      osc.connect(filter).connect(gain).connect(ctx.destination);
      osc.start();

      ctxRef.current = ctx;
      nodesRef.current = { osc, gain, filter };

      // Two-tone toggle: HI ↔ LO every 450ms with a tiny glide
      let hi = true;
      const swap = () => {
        if (!nodesRef.current) return;
        const f = hi ? 770 : 960;
        nodesRef.current.osc.frequency.setTargetAtTime(f, ctx.currentTime, 0.015);
        hi = !hi;
      };
      swap();
      toggleRef.current = window.setInterval(swap, 450);
    } catch {
      // audio not available — visual only
    }
  };

  const stop = () => {
    if (toggleRef.current) { clearInterval(toggleRef.current); toggleRef.current = null; }
    try { nodesRef.current?.osc.stop(); } catch {}
    try { ctxRef.current?.close(); } catch {}
    nodesRef.current = null; ctxRef.current = null;
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
