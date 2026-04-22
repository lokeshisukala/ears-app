import { useEffect, useRef, useState } from "react";
import { LatLng } from "@/lib/routing";
import { Navigation, Gauge } from "lucide-react";

interface Props {
  heading: number;        // deg
  vehiclePos: LatLng;
  active: boolean;        // true while driving
}

export function CompassSpeed({ heading, vehiclePos, active }: Props) {
  const [speed, setSpeed] = useState(0); // km/h
  const lastRef = useRef<{ pos: LatLng; t: number } | null>(null);

  useEffect(() => {
    const now = performance.now();
    const last = lastRef.current;
    if (last) {
      const dKm = Math.hypot(vehiclePos[0] - last.pos[0], vehiclePos[1] - last.pos[1]) * 111;
      const dH = (now - last.t) / 1000 / 3600;
      if (dH > 0) {
        const inst = dKm / dH;
        // Smooth + cap (demo speeds get high since path is compressed to ~10s)
        setSpeed((prev) => prev * 0.6 + Math.min(120, inst) * 0.4);
      }
    }
    lastRef.current = { pos: vehiclePos, t: now };
  }, [vehiclePos]);

  useEffect(() => {
    if (!active) {
      const id = setInterval(() => setSpeed((p) => (p > 0.5 ? p * 0.85 : 0)), 200);
      return () => clearInterval(id);
    }
  }, [active]);

  // Speed arc (0..120)
  const pct = Math.min(1, speed / 120);
  const dash = 126 * pct; // circumference of r=20 ≈ 125.6

  return (
    <div className="absolute bottom-24 sm:bottom-28 right-4 z-[500] flex flex-col gap-2 items-end">
      {/* Compass */}
      <div className="tactical-panel rounded-full p-2 backdrop-blur-md w-16 h-16 flex items-center justify-center relative">
        <div className="absolute inset-1 rounded-full border border-border" />
        <span className="absolute top-1 text-[8px] font-mono text-muted-foreground">N</span>
        <span className="absolute bottom-1 text-[8px] font-mono text-muted-foreground">S</span>
        <span className="absolute left-1.5 text-[8px] font-mono text-muted-foreground">W</span>
        <span className="absolute right-1.5 text-[8px] font-mono text-muted-foreground">E</span>
        <Navigation
          className="h-6 w-6 text-primary drop-shadow-[0_0_6px_hsl(var(--primary))] transition-transform duration-300"
          style={{ transform: `rotate(${heading}deg)` }}
          fill="currentColor"
        />
      </div>

      {/* Speedometer */}
      <div className="tactical-panel rounded-lg backdrop-blur-md p-2 w-24 flex items-center gap-2">
        <svg viewBox="0 0 48 48" className="h-10 w-10 -rotate-90">
          <circle cx="24" cy="24" r="20" stroke="hsl(var(--muted))" strokeWidth="3" fill="none" />
          <circle
            cx="24" cy="24" r="20"
            stroke={speed > 80 ? "hsl(var(--emergency))" : "hsl(var(--primary))"}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${dash} 999`}
            style={{ transition: "stroke-dasharray .3s linear, stroke .2s linear", filter: "drop-shadow(0 0 4px currentColor)" }}
          />
        </svg>
        <div className="flex flex-col leading-none">
          <span className="font-display font-bold text-base text-foreground">{Math.round(speed)}</span>
          <span className="font-mono text-[8px] text-muted-foreground tracking-widest">KM/H</span>
        </div>
        <Gauge className="h-3 w-3 text-muted-foreground ml-auto" />
      </div>
    </div>
  );
}
