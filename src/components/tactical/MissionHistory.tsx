import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, History, CheckCircle2 } from "lucide-react";
import { useDashboard } from "@/lib/dashboard-context";

export interface MissionRecord {
  id: string;
  patient: string;
  hospital: string;
  endedAt: number;
  durationSec: number;
  distanceKm: number;
}

const STORAGE_KEY = "ears.mission.history";

export function loadHistory(): MissionRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as MissionRecord[]) : [];
  } catch { return []; }
}

export function pushHistory(rec: MissionRecord) {
  const list = loadHistory();
  list.unshift(rec);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 30)));
  window.dispatchEvent(new Event("ears:history"));
}

export function MissionHistory() {
  const { missionState } = useDashboard();
  const [open, setOpen] = useState(false);
  const [list, setList] = useState<MissionRecord[]>(() => loadHistory());

  useEffect(() => {
    const refresh = () => setList(loadHistory());
    window.addEventListener("ears:history", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("ears:history", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  // refresh when mission ends
  useEffect(() => { if (missionState === "dispatched") setList(loadHistory()); }, [missionState]);

  return (
    <div className="tactical-card overflow-hidden">
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition"
      >
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-primary" />
          <h3 className="font-display text-sm uppercase tracking-widest text-muted-foreground">
            Mission Log
          </h3>
          <span className="font-mono text-[10px] text-primary">({list.length})</span>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="border-t border-border max-h-56 overflow-y-auto custom-scrollbar">
          {list.length === 0 ? (
            <div className="p-4 text-center text-xs text-muted-foreground font-mono">
              No completed missions yet.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {list.map((m) => (
                <li key={m.id} className="p-3 hover:bg-muted/20 transition">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-display text-xs font-semibold text-foreground truncate">
                          {m.patient}
                        </span>
                        <span className="font-mono text-[10px] text-muted-foreground shrink-0">
                          {new Date(m.endedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate">→ {m.hospital}</div>
                      <div className="flex items-center gap-3 mt-0.5 font-mono text-[10px] text-primary">
                        <span>{Math.round(m.durationSec)}s</span>
                        <span>·</span>
                        <span>{m.distanceKm.toFixed(2)} km</span>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
