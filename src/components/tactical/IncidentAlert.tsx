import { useEffect, useRef, useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, MapPin, Navigation, X, Bell } from "lucide-react";
import { LatLng, DEMO } from "@/lib/routing";
import { toast } from "@/hooks/use-toast";

export interface IncidentReport {
  id: string;
  type: string;
  severity: "critical" | "high" | "moderate";
  addr: string;
  coord: LatLng;
  reportedAt: number;
  callerNote: string;
  distanceKm: number;
}

const INCIDENT_TEMPLATES = [
  { type: "Vehicle Collision",    severity: "critical" as const, note: "Multi-vehicle pile-up · 3 casualties reported · airbags deployed" },
  { type: "Cardiac Emergency",    severity: "critical" as const, note: "Male, ~55y, collapsed at venue · CPR in progress by bystanders" },
  { type: "Industrial Accident",  severity: "high"     as const, note: "Worker fall from scaffolding · conscious but immobile" },
  { type: "Pedestrian Hit",       severity: "critical" as const, note: "Child struck by two-wheeler · bleeding, alert" },
  { type: "House Fire Casualty",  severity: "high"     as const, note: "Smoke inhalation · 2 victims evacuated, oxygen needed" },
  { type: "Fall / Trauma",        severity: "moderate" as const, note: "Elderly fall down stairs · suspected hip fracture" },
];

function pickIncident(currentPos: LatLng): IncidentReport {
  // Pick a random nearby coordinate jittered around an unused patient address
  const tpl = INCIDENT_TEMPLATES[Math.floor(Math.random() * INCIDENT_TEMPLATES.length)];
  const seed = DEMO.patients[Math.floor(Math.random() * DEMO.patients.length)];
  const jitter = (): number => (Math.random() - 0.5) * 0.006;
  const coord: LatLng = [seed.coord[0] + jitter(), seed.coord[1] + jitter()];
  const distanceKm = Math.hypot(coord[0] - currentPos[0], coord[1] - currentPos[1]) * 111;
  return {
    id: `INC-${Math.floor(Math.random() * 9000 + 1000)}`,
    type: tpl.type,
    severity: tpl.severity,
    addr: seed.addr,
    coord,
    reportedAt: Date.now(),
    callerNote: tpl.note,
    distanceKm,
  };
}

// Short alert chirp using WebAudio (no asset needed)
function playAlertChirp() {
  try {
    const Ctx = (window.AudioContext || (window as any).webkitAudioContext);
    if (!Ctx) return;
    const ctx = new Ctx();
    const now = ctx.currentTime;
    [880, 1320, 880].forEach((freq, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "square";
      o.frequency.value = freq;
      o.connect(g); g.connect(ctx.destination);
      const t0 = now + i * 0.18;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.25, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.16);
      o.start(t0); o.stop(t0 + 0.18);
    });
    setTimeout(() => ctx.close(), 1200);
  } catch { /* no-op */ }
}

interface Props {
  idle: boolean;            // only fire alerts when driver is free
  vehiclePos: LatLng;
  onAccept: (incident: IncidentReport) => void;
}

export function IncidentAlert({ idle, vehiclePos, onAccept }: Props) {
  const [incident, setIncident] = useState<IncidentReport | null>(null);
  const [secLeft, setSecLeft] = useState(30);
  const timerRef = useRef<number | null>(null);
  const autoRef = useRef<number | null>(null);

  // Auto-dispatch a random incident every 45-75s while idle
  useEffect(() => {
    if (!idle || incident) return;
    const delay = 25000 + Math.random() * 30000;
    autoRef.current = window.setTimeout(() => {
      const inc = pickIncident(vehiclePos);
      setIncident(inc);
      setSecLeft(30);
      playAlertChirp();
      toast({
        title: `🚨 ${inc.type} · ${inc.id}`,
        description: `${inc.addr} · ${inc.distanceKm.toFixed(2)} km away`,
        variant: "destructive",
      });
    }, delay);
    return () => { if (autoRef.current) clearTimeout(autoRef.current); };
  }, [idle, incident, vehiclePos]);

  // Acceptance countdown
  useEffect(() => {
    if (!incident) return;
    timerRef.current = window.setInterval(() => {
      setSecLeft((s) => {
        if (s <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          // Auto-accept critical, dismiss otherwise
          if (incident.severity === "critical") {
            handleAccept();
          } else {
            handleDismiss();
          }
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incident]);

  const handleAccept = useCallback(() => {
    if (!incident) return;
    onAccept(incident);
    setIncident(null);
  }, [incident, onAccept]);

  const handleDismiss = useCallback(() => {
    if (!incident) return;
    toast({ title: "Incident dismissed", description: `${incident.id} forwarded to next available unit.` });
    setIncident(null);
  }, [incident]);

  // Manual trigger button (always visible)
  const triggerNow = () => {
    if (incident) return;
    const inc = pickIncident(vehiclePos);
    setIncident(inc);
    setSecLeft(30);
    playAlertChirp();
  };

  const sevColor =
    incident?.severity === "critical" ? "text-emergency border-emergency/60"
    : incident?.severity === "high"   ? "text-warning border-warning/60"
                                       : "text-primary border-primary/60";

  return (
    <>
      {/* Simulate incoming-call button — top-left, below mobile header */}
      <Button
        onClick={triggerNow}
        size="icon"
        title="Simulate incoming incident alert"
        aria-label="Simulate incoming incident alert"
        className="absolute top-16 lg:top-3 left-3 lg:left-auto lg:right-[15rem] z-[550] h-10 w-10 rounded-full tactical-panel backdrop-blur-md hover:scale-110 transition-transform"
      >
        <Bell className="h-4 w-4 text-warning" />
      </Button>

      <Dialog open={!!incident} onOpenChange={(o) => { if (!o) handleDismiss(); }}>
        <DialogContent className={`tactical-panel max-w-md border-2 ${sevColor}`}>
          <DialogHeader>
            <DialogTitle className="font-mono tracking-widest flex items-center gap-2">
              <AlertTriangle className={`h-5 w-5 animate-pulse ${incident?.severity === "critical" ? "text-emergency" : "text-warning"}`} />
              INCOMING ALERT · {incident?.id}
            </DialogTitle>
            <DialogDescription className="font-mono text-[11px]">
              Auto-dispatched by HQ · respond within {secLeft}s
            </DialogDescription>
          </DialogHeader>

          {incident && (
            <div className="space-y-3 py-2">
              <div className="flex items-center justify-between">
                <span className={`font-mono text-xs tracking-widest uppercase ${sevColor}`}>
                  {incident.severity}
                </span>
                <span className="font-mono text-xs text-foreground">{incident.type}</span>
              </div>

              <div className="tactical-panel rounded-md p-3 space-y-2 font-mono text-[11px]">
                <div className="flex items-start gap-2">
                  <MapPin className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="text-foreground">{incident.addr}</div>
                    <div className="text-muted-foreground tabular-nums">
                      {incident.coord[0].toFixed(5)}, {incident.coord[1].toFixed(5)}
                    </div>
                  </div>
                </div>
                <div className="text-muted-foreground">"{incident.callerNote}"</div>
                <div className="flex justify-between text-muted-foreground border-t border-border/40 pt-2">
                  <span>DIST <span className="text-foreground tabular-nums">{incident.distanceKm.toFixed(2)} km</span></span>
                  <span>ETA <span className="text-foreground tabular-nums">~{Math.max(1, Math.round(incident.distanceKm * 1.6))} min</span></span>
                </div>
              </div>

              <div className="h-1.5 w-full bg-border/40 rounded overflow-hidden">
                <div
                  className={`h-full transition-all ${incident.severity === "critical" ? "bg-emergency" : "bg-warning"}`}
                  style={{ width: `${(secLeft / 30) * 100}%` }}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="ghost" onClick={handleDismiss} className="font-mono tracking-wider">
              <X className="h-4 w-4 mr-1" /> DISMISS
            </Button>
            <Button
              onClick={handleAccept}
              className="bg-emergency hover:bg-emergency/90 text-emergency-foreground font-mono tracking-wider glow-primary"
            >
              <Navigation className="h-4 w-4 mr-1" /> ACCEPT & NAVIGATE
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
