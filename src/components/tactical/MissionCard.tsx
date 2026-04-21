import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDashboard } from "@/lib/dashboard-context";
import { Navigation, Siren, MapPin, User, Crosshair } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface Patient { id: string; name: string; addr: string }

interface Props {
  patient: Patient;
  onNavigate: () => void;
  onCustomDispatch: (start: string, end: string) => void;
}

export function MissionCard({ patient, onNavigate, onCustomDispatch }: Props) {
  const { t, missionState } = useDashboard();

  const isActive = missionState !== "idle";
  const canNavigate = missionState === "dispatched";

  return (
    <div className="tactical-card p-4 space-y-4 relative overflow-hidden">
      {isActive && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-emergency animate-pulse-emergency" />
      )}

      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <Siren className="h-4 w-4 text-emergency" />
          {t("activeMission")}
        </h3>
        <motion.span
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ duration: 1.4, repeat: Infinity }}
          className="font-mono text-[10px] text-emergency font-bold"
        >
          ● {missionState === "idle" ? t("idle") : "ACTIVE"}
        </motion.span>
      </div>

      <Tabs defaultValue="auto" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-muted/50">
          <TabsTrigger value="auto" className="text-xs">{t("auto")}</TabsTrigger>
          <TabsTrigger value="manual" className="text-xs">{t("manualDispatch")}</TabsTrigger>
        </TabsList>

        <TabsContent value="auto" className="space-y-3 mt-3">
          <div className="space-y-2 rounded-md bg-muted/30 p-3 border border-border">
            <div className="flex items-start gap-2 text-xs">
              <User className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
              <div>
                <div className="text-muted-foreground">{t("patient")}</div>
                <div className="font-semibold text-foreground font-display">{patient.name}</div>
                <div className="font-mono text-[10px] text-primary">{patient.id}</div>
              </div>
            </div>
            <div className="flex items-start gap-2 text-xs">
              <MapPin className="h-3.5 w-3.5 text-emergency mt-0.5 shrink-0" />
              <div>
                <div className="text-muted-foreground">{t("location")}</div>
                <div className="font-semibold text-foreground">{patient.addr}</div>
              </div>
            </div>
          </div>

          <Button
            onClick={onNavigate}
            disabled={!canNavigate}
            size="lg"
            className="w-full font-display tracking-wider bg-gradient-emergency text-destructive-foreground hover:opacity-90 shadow-[0_0_24px_hsl(var(--emergency)/0.4)] hover:shadow-[0_0_36px_hsl(var(--emergency)/0.7)] transition-all"
          >
            <Navigation className="h-4 w-4 mr-2" />
            {canNavigate ? t("navigate") : missionState === "en_route_patient" ? t("enRoute") : t("arrived")}
          </Button>
        </TabsContent>

        <TabsContent value="manual" className="space-y-3 mt-3">
          <ManualForm onDispatch={onCustomDispatch} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ManualForm({ onDispatch }: { onDispatch: (s: string, e: string) => void }) {
  const { t } = useDashboard();
  const [currentLoc, setCurrentLoc] = useState<string>("");
  const [locating, setLocating] = useState(false);
  const [destination, setDestination] = useState<string>("");

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setCurrentLoc("17.44860, 78.39080");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCurrentLoc(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        setLocating(false);
      },
      () => {
        setCurrentLoc("17.44860, 78.39080");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  useEffect(() => {
    detectLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        onDispatch(currentLoc, destination);
      }}
    >
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground flex items-center gap-1">
          <MapPin className="h-3 w-3 text-success" /> {t("customStart")}
        </Label>
        <div className="flex gap-1.5">
          <Input
            value={locating ? "Detecting GPS…" : currentLoc}
            readOnly
            className="font-mono text-xs h-8 bg-muted/40 cursor-not-allowed"
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={detectLocation}
            disabled={locating}
            className="h-8 px-2 shrink-0"
            title="Re-detect GPS"
          >
            <Crosshair className={`h-3.5 w-3.5 ${locating ? "animate-spin text-primary" : ""}`} />
          </Button>
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground flex items-center gap-1">
          <MapPin className="h-3 w-3 text-emergency" /> {t("customEnd")}
        </Label>
        <Input
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="e.g. Apollo Hospital, Jubilee Hills"
          className="text-xs h-8"
        />
      </div>
      <Button type="submit" size="sm" variant="outline" className="w-full" disabled={!destination.trim()}>
        {t("dispatch")}
      </Button>
    </form>
  );
}
