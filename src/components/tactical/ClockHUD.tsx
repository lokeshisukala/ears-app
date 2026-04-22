import { useEffect, useState } from "react";
import { useDashboard } from "@/lib/dashboard-context";
import { Clock as ClockIcon, Timer, Activity } from "lucide-react";

function pad(n: number) { return n.toString().padStart(2, "0"); }
function fmtTime(d: Date) { return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`; }
function fmtDuration(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

export function ClockHUD() {
  const { missionState } = useDashboard();
  const [now, setNow] = useState(new Date());
  const [missionStart, setMissionStart] = useState<number | null>(null);
  const [shiftStart] = useState<number>(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Track mission timer based on state
  useEffect(() => {
    const active =
      missionState === "en_route_patient" ||
      missionState === "arrived_patient" ||
      missionState === "boarded" ||
      missionState === "scanning" ||
      missionState === "en_route_hospital";

    if (active && missionStart === null) setMissionStart(Date.now());
    if (!active && missionState !== "accomplished") setMissionStart(null);
  }, [missionState, missionStart]);

  const missionElapsed = missionStart ? now.getTime() - missionStart : 0;
  const shiftElapsed = now.getTime() - shiftStart;

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[500] hidden md:flex">
      <div className="tactical-panel rounded-full px-4 py-1.5 flex items-center gap-4 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <ClockIcon className="h-3.5 w-3.5 text-primary" />
          <span className="font-mono text-[11px] tracking-widest text-foreground">{fmtTime(now)}</span>
        </div>
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-2">
          <Timer className={`h-3.5 w-3.5 ${missionStart ? "text-emergency animate-pulse" : "text-muted-foreground"}`} />
          <span className="font-mono text-[11px] tracking-widest text-foreground">
            {missionStart ? fmtDuration(missionElapsed) : "--:--"}
          </span>
        </div>
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-2">
          <Activity className="h-3.5 w-3.5 text-success" />
          <span className="font-mono text-[11px] tracking-widest text-muted-foreground">
            SHIFT {fmtDuration(shiftElapsed)}
          </span>
        </div>
      </div>
    </div>
  );
}
