import { Button } from "@/components/ui/button";
import { RadioTower, Power, AlertOctagon } from "lucide-react";

interface Props {
  open: boolean;
  onRestore: () => void;
}

/**
 * Full-screen "EARS SIGNAL LOST" overlay.
 * Triggered when the ambulance is involved in an accident and the
 * on-board EARS unit goes offline. Driver can tap RESTORE to bring
 * the system back online.
 */
export function ServerLostOverlay({ open, onRestore }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[9999] bg-background/95 backdrop-blur-md flex flex-col items-center justify-center px-6 text-center select-none">
      {/* Antenna with lost-signal arcs */}
      <div className="relative mb-8">
        <div className="absolute inset-0 -m-12 rounded-full border-2 border-emergency/30 animate-ping" />
        <div className="absolute inset-0 -m-6  rounded-full border-2 border-emergency/50 animate-ping" style={{ animationDelay: "0.4s" }} />
        <div className="relative h-28 w-28 rounded-full bg-emergency/15 border-2 border-emergency flex items-center justify-center glow-primary">
          <RadioTower className="h-14 w-14 text-emergency animate-pulse" />
          <AlertOctagon className="absolute -bottom-1 -right-1 h-7 w-7 text-warning bg-background rounded-full p-0.5" />
        </div>
      </div>

      <h1 className="font-display font-bold tracking-[0.4em] text-4xl sm:text-6xl text-emergency text-glow mb-3">
        EARS
      </h1>
      <div className="font-mono text-sm sm:text-base text-emergency tracking-widest mb-2">
        ◢ SIGNAL LOST ◣
      </div>
      <p className="font-mono text-xs sm:text-sm text-muted-foreground max-w-md mb-1">
        On-board uplink offline · telemetry frozen
      </p>
      <p className="font-mono text-[10px] sm:text-xs text-warning max-w-md mb-8">
        Suspected vehicle incident · driver unresponsive · awaiting manual recovery
      </p>

      <Button
        onClick={onRestore}
        size="lg"
        className="bg-success hover:bg-success/90 text-success-foreground font-mono tracking-widest glow-primary"
      >
        <Power className="h-5 w-5 mr-2" />
        RESTORE EARS
      </Button>

      <div className="absolute bottom-4 font-mono text-[10px] text-muted-foreground tracking-widest">
        EMERGENCY PROTOCOL · TAC-OS v2.4.1
      </div>
    </div>
  );
}
