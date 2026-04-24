import { useEffect, useRef, useState } from "react";
import { Phone, Radio, AlertOctagon, FileWarning, Plus, X, PhoneOff, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useDashboard } from "@/lib/dashboard-context";
import { pushHistory } from "./MissionHistory";

type ActionId = "call" | "radio" | "report" | "sos";

export function QuickActionDock() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<ActionId | null>(null);
  const { driver, missionState } = useDashboard();

  /* ─────────────────────────  CALL HOSPITAL  ───────────────────────── */
  const [callSec, setCallSec] = useState(0);
  const callTimer = useRef<number | null>(null);
  useEffect(() => {
    if (active === "call") {
      setCallSec(0);
      callTimer.current = window.setInterval(() => setCallSec((s) => s + 1), 1000);
    } else if (callTimer.current) {
      clearInterval(callTimer.current);
      callTimer.current = null;
    }
    return () => { if (callTimer.current) clearInterval(callTimer.current); };
  }, [active]);
  const callMMSS = `${String(Math.floor(callSec / 60)).padStart(2, "0")}:${String(callSec % 60).padStart(2, "0")}`;

  /* ─────────────────────────  RADIO DISPATCH  ───────────────────────── */
  const [channel, setChannel] = useState("7");
  const [radioMsg, setRadioMsg] = useState("");
  const [radioLog, setRadioLog] = useState<{ from: string; text: string; t: number }[]>([
    { from: "DISPATCH", text: "All units, weather advisory NW sector. Reduce speed.", t: Date.now() - 60000 },
    { from: "EARS-12",  text: "Copy dispatch, slowing to 40.", t: Date.now() - 45000 },
  ]);
  const sendRadio = () => {
    if (!radioMsg.trim()) return;
    setRadioLog((l) => [...l, { from: driver?.unit ?? "EARS-07", text: radioMsg.trim(), t: Date.now() }]);
    setRadioMsg("");
    // simulate dispatch reply
    window.setTimeout(() => {
      setRadioLog((l) => [...l, { from: "DISPATCH", text: "Copy that. Continue mission.", t: Date.now() }]);
    }, 1200);
  };

  /* ─────────────────────────  REPORT INCIDENT  ───────────────────────── */
  const [incType, setIncType] = useState<string>("traffic");
  const [incNote, setIncNote] = useState("");
  const submitIncident = () => {
    if (!incNote.trim()) {
      toast({ title: "Description required", description: "Briefly describe the incident.", variant: "destructive" });
      return;
    }
    toast({
      title: "⚠ Incident Filed",
      description: `${incType.toUpperCase()} report sent to HQ · #${Math.floor(Math.random() * 9000 + 1000)}`,
    });
    setIncNote("");
    setActive(null);
  };

  /* ─────────────────────────  SOS  ───────────────────────── */
  const [sosCountdown, setSosCountdown] = useState(5);
  const sosTimer = useRef<number | null>(null);
  useEffect(() => {
    if (active === "sos") {
      setSosCountdown(5);
      sosTimer.current = window.setInterval(() => {
        setSosCountdown((c) => {
          if (c <= 1) {
            // BROADCAST
            if (sosTimer.current) clearInterval(sosTimer.current);
            pushHistory({
              id: `sos-${Date.now()}`,
              patient: "— SOS BROADCAST —",
              hospital: `${driver?.unit ?? "EARS"} requested assistance`,
              endedAt: Date.now(),
              durationSec: 0,
              distanceKm: 0,
            });
            toast({
              title: "🆘 SOS BROADCAST LIVE",
              description: "HQ + 3 nearest units notified. Beacon active.",
              variant: "destructive",
            });
            setActive(null);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    } else if (sosTimer.current) {
      clearInterval(sosTimer.current);
      sosTimer.current = null;
    }
    return () => { if (sosTimer.current) clearInterval(sosTimer.current); };
  }, [active, driver]);

  /* ─────────────────────────  ACTION META  ───────────────────────── */
  const actions: { id: ActionId; icon: typeof Phone; label: string; color: string }[] = [
    { id: "call",   icon: Phone,        label: "Call Hospital",  color: "text-success" },
    { id: "radio",  icon: Radio,        label: "Radio Dispatch", color: "text-primary" },
    { id: "report", icon: FileWarning,  label: "Report Incident",color: "text-warning" },
    { id: "sos",    icon: AlertOctagon, label: "SOS",            color: "text-emergency" },
  ];

  return (
    <>
      <div className="absolute bottom-24 sm:bottom-28 left-4 z-[500] flex flex-col-reverse items-start gap-2">
        {open && actions.map((a, i) => (
          <div
            key={a.id}
            className="flex items-center gap-2 animate-fade-in"
            style={{ animationDelay: `${i * 40}ms`, animationFillMode: "backwards" }}
          >
            <Button
              onClick={() => { setActive(a.id); setOpen(false); }}
              size="icon"
              className={`tactical-panel h-10 w-10 rounded-full backdrop-blur-md hover:scale-110 transition-transform ${a.color}`}
              aria-label={a.label}
            >
              <a.icon className="h-4 w-4" />
            </Button>
            <span className="tactical-panel rounded-md px-2 py-1 font-mono text-[10px] tracking-wider text-foreground backdrop-blur-md whitespace-nowrap">
              {a.label}
            </span>
          </div>
        ))}

        <Button
          onClick={() => setOpen((p) => !p)}
          size="icon"
          className={`h-12 w-12 rounded-full backdrop-blur-md transition-all glow-primary ${
            open ? "bg-emergency hover:bg-emergency/90 rotate-45" : "bg-primary hover:bg-primary/90"
          }`}
          aria-label={open ? "Close quick actions" : "Open quick actions"}
        >
          {open ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
        </Button>
      </div>

      {/* ───── CALL HOSPITAL DIALOG ───── */}
      <Dialog open={active === "call"} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="tactical-panel max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-mono tracking-wider flex items-center gap-2">
              <Phone className="h-4 w-4 text-success animate-pulse" />
              CALL · CITY GENERAL ER
            </DialogTitle>
            <DialogDescription className="font-mono text-[11px]">
              Secure VoIP · Channel encrypted · {driver?.unit ?? "EARS-07"}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="h-20 w-20 rounded-full bg-success/20 flex items-center justify-center animate-pulse-emergency">
              <Phone className="h-9 w-9 text-success" />
            </div>
            <div className="font-mono text-2xl tabular-nums tracking-widest text-success">{callMMSS}</div>
            <div className="font-mono text-[10px] tracking-wider text-muted-foreground">CONNECTED · ER TRIAGE DESK</div>
            {missionState !== "idle" && missionState !== "dispatched" && (
              <div className="tactical-panel rounded-md px-3 py-2 font-mono text-[10px] tracking-wider w-full text-center">
                ETA + patient vitals streamed automatically
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              onClick={() => { toast({ title: "📞 Call Ended", description: `Duration ${callMMSS}` }); setActive(null); }}
              variant="destructive"
              className="w-full font-mono tracking-wider"
            >
              <PhoneOff className="h-4 w-4 mr-2" /> END CALL
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ───── RADIO DISPATCH DIALOG ───── */}
      <Dialog open={active === "radio"} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="tactical-panel max-w-md">
          <DialogHeader>
            <DialogTitle className="font-mono tracking-wider flex items-center gap-2">
              <Radio className="h-4 w-4 text-primary animate-pulse" />
              RADIO · CHANNEL {channel}
            </DialogTitle>
            <DialogDescription className="font-mono text-[11px]">
              Open band · Dispatch + nearby units listening
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-2">
            <Label className="font-mono text-[10px] tracking-wider text-muted-foreground">CH</Label>
            <Select value={channel} onValueChange={setChannel}>
              <SelectTrigger className="h-8 w-24 font-mono text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["1", "3", "7", "9", "12"].map((c) => (
                  <SelectItem key={c} value={c} className="font-mono text-xs">CH-{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="tactical-panel max-h-48 overflow-y-auto rounded-md p-2 space-y-1.5 font-mono text-[11px]">
            {radioLog.map((m, i) => (
              <div key={i} className="flex gap-2">
                <span className={`shrink-0 ${m.from === "DISPATCH" ? "text-warning" : m.from === (driver?.unit ?? "EARS-07") ? "text-success" : "text-primary"}`}>
                  {m.from}:
                </span>
                <span className="text-foreground">{m.text}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              value={radioMsg}
              onChange={(e) => setRadioMsg(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendRadio()}
              placeholder="Push to talk…"
              className="font-mono text-xs"
            />
            <Button onClick={sendRadio} size="icon" className="bg-primary hover:bg-primary/90">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ───── REPORT INCIDENT DIALOG ───── */}
      <Dialog open={active === "report"} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="tactical-panel max-w-md">
          <DialogHeader>
            <DialogTitle className="font-mono tracking-wider flex items-center gap-2">
              <FileWarning className="h-4 w-4 text-warning" />
              FILE INCIDENT REPORT
            </DialogTitle>
            <DialogDescription className="font-mono text-[11px]">
              Submitted to HQ for review · timestamped & geo-tagged
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="font-mono text-[10px] tracking-wider text-muted-foreground">TYPE</Label>
              <Select value={incType} onValueChange={setIncType}>
                <SelectTrigger className="font-mono text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="traffic"  className="font-mono text-xs">Traffic obstruction</SelectItem>
                  <SelectItem value="hazard"   className="font-mono text-xs">Road hazard</SelectItem>
                  <SelectItem value="vehicle"  className="font-mono text-xs">Vehicle malfunction</SelectItem>
                  <SelectItem value="patient"  className="font-mono text-xs">Patient complication</SelectItem>
                  <SelectItem value="other"    className="font-mono text-xs">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="font-mono text-[10px] tracking-wider text-muted-foreground">DETAILS</Label>
              <Textarea
                value={incNote}
                onChange={(e) => setIncNote(e.target.value)}
                placeholder="Describe the incident…"
                className="font-mono text-xs min-h-24"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="ghost" onClick={() => setActive(null)} className="font-mono tracking-wider">CANCEL</Button>
            <Button onClick={submitIncident} className="bg-warning hover:bg-warning/90 text-warning-foreground font-mono tracking-wider">
              <Send className="h-4 w-4 mr-2" /> SUBMIT
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ───── SOS DIALOG ───── */}
      <Dialog open={active === "sos"} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="tactical-panel max-w-sm border-emergency/60">
          <DialogHeader>
            <DialogTitle className="font-mono tracking-widest text-emergency flex items-center gap-2">
              <AlertOctagon className="h-5 w-5 animate-pulse" />
              SOS BROADCAST
            </DialogTitle>
            <DialogDescription className="font-mono text-[11px]">
              Hold to confirm. Emergency beacon will alert HQ + nearest units.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="h-24 w-24 rounded-full bg-emergency/20 border-2 border-emergency flex items-center justify-center animate-pulse-emergency">
              <span className="font-mono text-4xl font-bold text-emergency tabular-nums">{sosCountdown}</span>
            </div>
            <div className="font-mono text-[10px] tracking-widest text-emergency">BROADCASTING IN {sosCountdown}s</div>
          </div>
          <DialogFooter>
            <Button onClick={() => { setActive(null); toast({ title: "SOS cancelled" }); }} variant="ghost" className="w-full font-mono tracking-wider">
              CANCEL
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
