import { useEffect, useState } from "react";
import { Cloud, CloudRain, Sun, CloudSnow, Wind, Eye, Droplets } from "lucide-react";

type Condition = "clear" | "cloudy" | "rain" | "fog";

const CONDITIONS: { c: Condition; label: string; icon: typeof Sun; color: string; road: string; roadColor: string }[] = [
  { c: "clear",  label: "Clear",        icon: Sun,       color: "text-warning",   road: "Dry · Optimal",  roadColor: "text-success" },
  { c: "cloudy", label: "Cloudy",       icon: Cloud,     color: "text-muted-foreground", road: "Dry",           roadColor: "text-success" },
  { c: "rain",   label: "Light Rain",   icon: CloudRain, color: "text-primary",   road: "Wet · Caution",  roadColor: "text-warning" },
  { c: "fog",    label: "Fog · Low Vis",icon: CloudSnow, color: "text-muted-foreground", road: "Reduced Vis",  roadColor: "text-emergency" },
];

export function WeatherCard() {
  const [idx, setIdx] = useState(0);
  const [temp, setTemp] = useState(28);
  const [wind, setWind] = useState(12);
  const [vis, setVis] = useState(8);
  const [humidity, setHumidity] = useState(64);

  useEffect(() => {
    const id = setInterval(() => {
      setIdx((p) => (Math.random() < 0.15 ? (p + 1) % CONDITIONS.length : p));
      setTemp((p) => Math.max(18, Math.min(38, p + (Math.random() - 0.5))));
      setWind((p) => Math.max(2, Math.min(35, p + (Math.random() - 0.5) * 2)));
      setVis((p) => Math.max(0.5, Math.min(10, p + (Math.random() - 0.5) * 0.4)));
      setHumidity((p) => Math.max(30, Math.min(95, p + (Math.random() - 0.5) * 2)));
    }, 4000);
    return () => clearInterval(id);
  }, []);

  const cond = CONDITIONS[idx];
  const Icon = cond.icon;

  return (
    <div className="tactical-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm uppercase tracking-widest text-muted-foreground">
          Weather & Road
        </h3>
        <span className="font-mono text-[10px] text-success animate-blink">● LIVE</span>
      </div>

      <div className="flex items-center gap-3">
        <div className={`h-12 w-12 rounded-lg bg-muted/40 grid place-items-center ${cond.color}`}>
          <Icon className="h-7 w-7" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-display font-bold text-2xl text-foreground leading-none">
            {temp.toFixed(0)}°C
          </div>
          <div className="text-xs text-muted-foreground mt-0.5 truncate">{cond.label}</div>
        </div>
        <div className={`text-right font-mono text-[10px] ${cond.roadColor}`}>
          ROAD<br />
          <span className="font-semibold">{cond.road}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-border">
        <Stat icon={<Wind className="h-3 w-3" />} label="Wind" value={`${wind.toFixed(0)} km/h`} />
        <Stat icon={<Eye className="h-3 w-3" />} label="Vis" value={`${vis.toFixed(1)} km`} />
        <Stat icon={<Droplets className="h-3 w-3" />} label="Hum" value={`${humidity.toFixed(0)}%`} />
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-1 text-[9px] uppercase tracking-wider text-muted-foreground">
        {icon} {label}
      </div>
      <div className="font-mono text-xs font-semibold text-foreground mt-0.5">{value}</div>
    </div>
  );
}
