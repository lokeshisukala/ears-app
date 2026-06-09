import { useEffect, useState } from "react";
import { CloudRain, Wind, Construction, AlertTriangle, Droplets, Sun, Eye } from "lucide-react";

interface Advisory {
  icon: typeof CloudRain;
  text: string;
  tone: "info" | "warn" | "danger";
}

const POOL: Advisory[] = [
  { icon: CloudRain,   tone: "warn",   text: "Light rain expected in 4 km — reduce speed, wipers on" },
  { icon: Droplets,    tone: "warn",   text: "Wet/slippery patch ahead near flyover — drive carefully" },
  { icon: Construction,tone: "danger", text: "Roadworks 800 m ahead · single-lane diversion" },
  { icon: Wind,        tone: "info",   text: "Crosswind advisory — maintain firm grip on the wheel" },
  { icon: AlertTriangle,tone: "danger",text: "Muddy road segment reported by previous unit — slow down" },
  { icon: Eye,         tone: "warn",   text: "Reduced visibility (fog patch) — headlights to LOW BEAM" },
  { icon: Sun,         tone: "info",   text: "Glare from setting sun · visor recommended next 1.2 km" },
  { icon: AlertTriangle,tone: "warn",  text: "Heavy two-wheeler density — siren on, expect lane weaving" },
];

interface Props {
  active: boolean;
  phase: "patient" | "hospital";
}

export function RouteAdvisory({ active, phase }: Props) {
  const [current, setCurrent] = useState<Advisory | null>(null);
  const [log, setLog] = useState<Advisory[]>([]);

  useEffect(() => {
    if (!active) { setCurrent(null); setLog([]); return; }
    // first advisory after 1.2s, then every 4-6s
    const fire = () => {
      const a = POOL[Math.floor(Math.random() * POOL.length)];
      setCurrent(a);
      setLog((prev) => [a, ...prev].slice(0, 4));
    };
    const first = window.setTimeout(fire, 1200);
    const iv = window.setInterval(fire, 4500 + Math.random() * 1500);
    return () => { clearTimeout(first); clearInterval(iv); };
  }, [active]);

  if (!active || !current) return null;

  const toneCls =
    current.tone === "danger" ? "border-emergency/60 text-emergency"
    : current.tone === "warn" ? "border-warning/60 text-warning"
    : "border-primary/60 text-primary";

  return (
    <div className="absolute bottom-24 sm:bottom-28 left-3 sm:left-4 z-[500] w-[min(92vw,360px)] pointer-events-none">
      <div className={`tactical-panel rounded-lg backdrop-blur-md border ${toneCls} p-3 shadow-tactical`}>
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-[9px] tracking-[0.2em] text-muted-foreground uppercase">
            ROUTE ADVISORY · {phase === "patient" ? "TO SCENE" : "TO HOSPITAL"}
          </span>
          <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
        </div>
        <div className="flex items-start gap-2">
          <current.icon className="h-5 w-5 shrink-0 mt-0.5" />
          <p className="font-mono text-xs text-foreground leading-snug">{current.text}</p>
        </div>
        {log.length > 1 && (
          <ul className="mt-2 pt-2 border-t border-border/40 space-y-1 max-h-20 overflow-hidden">
            {log.slice(1).map((a, i) => (
              <li key={i} className="font-mono text-[10px] text-muted-foreground flex items-center gap-1.5 truncate">
                <a.icon className="h-3 w-3 shrink-0 opacity-60" />
                <span className="truncate">{a.text}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
