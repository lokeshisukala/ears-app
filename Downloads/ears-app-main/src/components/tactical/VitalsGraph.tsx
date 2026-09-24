import { useEffect, useRef, useState } from "react";
import { Heart, Gauge, Activity } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip } from "recharts";

interface Point { t: number; hr: number; sys: number; dia: number; spo2: number }

const MAX_POINTS = 24;

export function VitalsGraph() {
  const [data, setData] = useState<Point[]>(() => {
    const now = Date.now();
    return Array.from({ length: MAX_POINTS }, (_, i) => ({
      t: now - (MAX_POINTS - i) * 1500,
      hr: 82 + Math.round(Math.sin(i / 2) * 4),
      sys: 120 + Math.round(Math.cos(i / 3) * 4),
      dia: 80 + Math.round(Math.sin(i / 3) * 3),
      spo2: 96 + Math.round(Math.cos(i / 4) * 1),
    }));
  });

  const timerRef = useRef<number | null>(null);
  useEffect(() => {
    timerRef.current = window.setInterval(() => {
      setData((prev) => {
        const last = prev[prev.length - 1];
        const next: Point = {
          t: Date.now(),
          hr: clamp(last.hr + Math.round((Math.random() - 0.5) * 6), 60, 130),
          sys: clamp(last.sys + Math.round((Math.random() - 0.5) * 5), 95, 160),
          dia: clamp(last.dia + Math.round((Math.random() - 0.5) * 4), 55, 105),
          spo2: clamp(last.spo2 + Math.round((Math.random() - 0.5) * 2), 88, 100),
        };
        return [...prev.slice(-(MAX_POINTS - 1)), next];
      });
    }, 1500);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const latest = data[data.length - 1];
  const hrColor = latest.hr > 110 || latest.hr < 60 ? "text-emergency" : latest.hr > 100 ? "text-warning" : "text-success";
  const bpColor = latest.sys > 140 || latest.sys < 100 ? "text-warning" : "text-success";
  const spo2Color = latest.spo2 < 92 ? "text-emergency" : latest.spo2 < 95 ? "text-warning" : "text-success";

  return (
    <div className="tactical-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <Activity className="h-4 w-4 text-emergency" />
          Patient Vitals
        </h3>
        <span className="font-mono text-[10px] text-emergency animate-blink">● LIVE</span>
      </div>

      {/* Heart rate */}
      <div>
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Heart className="h-3.5 w-3.5 text-emergency" /> Heart Rate
          </span>
          <span className={`font-mono font-bold tabular-nums ${hrColor}`}>{latest.hr} bpm</span>
        </div>
        <div className="h-14 -mx-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
              <YAxis hide domain={[50, 140]} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 10, padding: 4 }}
                labelFormatter={() => ""}
                formatter={(v: number) => [`${v} bpm`, "HR"]}
              />
              <Line type="monotone" dataKey="hr" stroke="hsl(var(--emergency))" strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Blood pressure */}
      <div>
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Gauge className="h-3.5 w-3.5 text-warning" /> Blood Pressure
          </span>
          <span className={`font-mono font-bold tabular-nums ${bpColor}`}>{latest.sys}/{latest.dia}</span>
        </div>
        <div className="h-14 -mx-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
              <YAxis hide domain={[50, 170]} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 10, padding: 4 }}
                labelFormatter={() => ""}
              />
              <Line type="monotone" dataKey="sys" stroke="hsl(var(--warning))" strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="dia" stroke="hsl(var(--primary))" strokeWidth={1.5} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="flex justify-between text-[10px] font-mono pt-1 border-t border-border/40">
        <span className="text-muted-foreground">SpO₂ <span className={`font-bold ${spo2Color}`}>{latest.spo2}%</span></span>
        <span className="text-muted-foreground">SYS <span className="text-warning">●</span> DIA <span className="text-primary">●</span></span>
      </div>
    </div>
  );
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
