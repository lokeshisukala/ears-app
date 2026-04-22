import { useState } from "react";
import { Phone, Radio, AlertOctagon, FileWarning, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface Action {
  icon: typeof Phone;
  label: string;
  color: string;
  onClick: () => void;
}

export function QuickActionDock() {
  const [open, setOpen] = useState(false);

  const actions: Action[] = [
    {
      icon: Phone,
      label: "Call Hospital",
      color: "text-success",
      onClick: () => toast({ title: "📞 Calling Hospital", description: "Connecting to receiving facility…" }),
    },
    {
      icon: Radio,
      label: "Radio Dispatch",
      color: "text-primary",
      onClick: () => toast({ title: "📻 Radio Open", description: "Channel 7 — Dispatch standing by." }),
    },
    {
      icon: FileWarning,
      label: "Report Incident",
      color: "text-warning",
      onClick: () => toast({ title: "⚠ Incident Logged", description: "Report queued for HQ review." }),
    },
    {
      icon: AlertOctagon,
      label: "SOS",
      color: "text-emergency",
      onClick: () =>
        toast({
          title: "🆘 SOS BROADCAST",
          description: "Emergency beacon activated. HQ + nearest units notified.",
          variant: "destructive",
        }),
    },
  ];

  return (
    <div className="absolute bottom-24 sm:bottom-28 left-4 z-[500] flex flex-col-reverse items-start gap-2">
      {/* Action buttons */}
      {open &&
        actions.map((a, i) => (
          <div
            key={a.label}
            className="flex items-center gap-2 animate-fade-in"
            style={{ animationDelay: `${i * 40}ms`, animationFillMode: "backwards" }}
          >
            <Button
              onClick={() => { a.onClick(); setOpen(false); }}
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

      {/* FAB toggle */}
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
  );
}
