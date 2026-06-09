import { Stethoscope, ShieldCheck, Phone, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

export interface Specialist {
  name: string;
  role: string;
  reg: string;
  yrs: number;
}

export const DEFAULT_SPECIALIST: Specialist = {
  name: "Dr. Priya Sharma",
  role: "Emergency Physician · MD",
  reg: "MCI-EM-44821",
  yrs: 9,
};

interface Props {
  specialist?: Specialist;
}

export function SpecialistCard({ specialist = DEFAULT_SPECIALIST }: Props) {
  const initials = specialist.name
    .replace(/^Dr\.\s*/i, "")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");

  return (
    <div className="tactical-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <Stethoscope className="h-4 w-4 text-primary" />
          On-Board Specialist
        </h3>
        <span className="font-mono text-[10px] text-success animate-blink">● ON BOARD</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative h-12 w-12 shrink-0 rounded-full bg-gradient-to-br from-primary to-primary/40 border-2 border-primary/60 glow-primary flex items-center justify-center font-display font-bold text-base text-primary-foreground">
          {initials}
          <span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-success border-2 border-card flex items-center justify-center">
            <ShieldCheck className="h-2.5 w-2.5 text-success-foreground" />
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-display font-semibold text-sm text-foreground truncate">{specialist.name}</div>
          <div className="text-[11px] text-primary truncate">{specialist.role}</div>
          <div className="font-mono text-[10px] text-muted-foreground">{specialist.reg} · {specialist.yrs}y exp</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-[11px] font-mono tracking-wider"
          onClick={() => toast({ title: "📞 Intercom", description: `Connecting to ${specialist.name}…` })}
        >
          <Phone className="h-3 w-3 mr-1" /> INTERCOM
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-[11px] font-mono tracking-wider border-primary/40 text-primary hover:bg-primary/10"
          onClick={() => toast({ title: "🩺 Triage Active", description: `${specialist.name} performing patient assessment.` })}
        >
          <Activity className="h-3 w-3 mr-1" /> TRIAGE
        </Button>
      </div>
    </div>
  );
}
