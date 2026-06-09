import { useEffect, useState } from "react";
import { AlertOctagon, PhoneCall, Stethoscope, HeartCrack, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { DEFAULT_SPECIALIST } from "./SpecialistCard";

interface Props {
  hospitalName: string;
  onDeceased?: () => void;
}

export function TrafficBlockageCard({ hospitalName, onDeceased }: Props) {
  const [intensity, setIntensity] = useState(60);
  const [blocked, setBlocked] = useState(false);
  const [confirmDeceased, setConfirmDeceased] = useState(false);
  const [calledHospital, setCalledHospital] = useState(false);
  const [treatmentActive, setTreatmentActive] = useState(false);

  // Random intensity drift; auto-blockage when very high
  useEffect(() => {
    const id = setInterval(() => {
      setIntensity((i) => {
        const next = i + (Math.random() - 0.45) * 14;
        const v = Math.max(20, Math.min(100, next));
        if (v >= 92 && !blocked) setBlocked(true);
        return v;
      });
    }, 2500);
    return () => clearInterval(id);
  }, [blocked]);

  const sev = intensity >= 85 ? "CRITICAL" : intensity >= 65 ? "HEAVY" : intensity >= 40 ? "MODERATE" : "CLEAR";
  const sevColor =
    intensity >= 85 ? "text-emergency border-emergency/50 bg-emergency/10"
    : intensity >= 65 ? "text-warning border-warning/50 bg-warning/10"
    : "text-success border-success/50 bg-success/10";

  const callHospital = () => {
    setCalledHospital(true);
    toast({
      title: `📞 ${hospitalName}`,
      description: "Rescue team dispatched to ambulance location. ETA 6 min.",
    });
  };

  const startTreatment = () => {
    setTreatmentActive(true);
    toast({
      title: `🩺 ${DEFAULT_SPECIALIST.name} treating`,
      description: "On-board intervention started · IV line, O₂ support, monitoring.",
    });
  };

  const reportDeceased = () => {
    setConfirmDeceased(false);
    toast({
      title: "💔 Patient Deceased",
      description: `Mortuary unit notified at ${hospitalName}. Time of death logged.`,
      variant: "destructive",
    });
    onDeceased?.();
  };

  return (
    <div className="tactical-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-warning" />
          Blockage Protocol
        </h3>
        <span className={`font-mono text-[10px] font-bold tracking-widest px-2 py-0.5 rounded border ${sevColor}`}>
          {sev} · {intensity.toFixed(0)}%
        </span>
      </div>

      {!blocked ? (
        <Button
          variant="outline"
          size="sm"
          className="w-full h-8 text-[11px] font-mono tracking-wider border-warning/40 text-warning hover:bg-warning/10"
          onClick={() => setBlocked(true)}
        >
          <AlertOctagon className="h-3.5 w-3.5 mr-1.5" /> DECLARE ROAD BLOCKAGE
        </Button>
      ) : (
        <div className="space-y-2">
          <div className="rounded-md border border-emergency/40 bg-emergency/10 px-2.5 py-2 text-[11px] font-mono text-emergency flex items-start gap-2">
            <AlertOctagon className="h-3.5 w-3.5 mt-0.5 animate-pulse shrink-0" />
            <span>Total blockage detected. Standard protocol activated.</span>
          </div>

          <Button
            size="sm"
            onClick={callHospital}
            disabled={calledHospital}
            className="w-full h-9 font-mono text-[11px] tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            <PhoneCall className="h-3.5 w-3.5 mr-1.5" />
            {calledHospital ? "TEAM DISPATCHED ✓" : "CALL HOSPITAL → SEND TEAM"}
          </Button>

          <Button
            size="sm"
            onClick={startTreatment}
            disabled={treatmentActive}
            className="w-full h-9 font-mono text-[11px] tracking-wider bg-success/90 text-success-foreground hover:bg-success disabled:opacity-60"
          >
            <Stethoscope className="h-3.5 w-3.5 mr-1.5" />
            {treatmentActive ? "TREATMENT IN PROGRESS ✓" : "SPECIALIST: ON-BOARD TREATMENT"}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setConfirmDeceased(true)}
            className="w-full h-8 font-mono text-[11px] tracking-wider border-emergency/50 text-emergency hover:bg-emergency/10"
          >
            <HeartCrack className="h-3.5 w-3.5 mr-1.5" />
            REPORT PATIENT DECEASED
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setBlocked(false); setCalledHospital(false); setTreatmentActive(false); }}
            className="w-full h-7 text-[10px] font-mono text-muted-foreground"
          >
            CLEAR BLOCKAGE
          </Button>
        </div>
      )}

      <Dialog open={confirmDeceased} onOpenChange={setConfirmDeceased}>
        <DialogContent className="max-w-sm border-2 border-emergency/60">
          <DialogHeader>
            <DialogTitle className="font-mono tracking-widest flex items-center gap-2 text-emergency">
              <HeartCrack className="h-5 w-5" /> CONFIRM PATIENT DECEASED
            </DialogTitle>
            <DialogDescription className="font-mono text-[11px]">
              This will notify {hospitalName} mortuary unit and log time of death. Action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="ghost" onClick={() => setConfirmDeceased(false)} className="font-mono tracking-wider">CANCEL</Button>
            <Button onClick={reportDeceased} className="bg-emergency hover:bg-emergency/90 text-emergency-foreground font-mono tracking-wider">
              CONFIRM & NOTIFY
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
