import { Progress } from "@/components/ui/progress";
import { useDashboard } from "@/lib/dashboard-context";
import { Fuel, Wind, Thermometer } from "lucide-react";
import { useEffect, useState } from "react";

export function TelemetryCard() {
  const { t } = useDashboard();
  const [fuel, setFuel] = useState(82);
  const [oxy, setOxy] = useState(94);
  const [temp, setTemp] = useState(88); // deg C, normal ~75-95

  useEffect(() => {
    const id = setInterval(() => {
      setFuel((f) => Math.max(40, f - Math.random() * 0.2));
      setOxy((o) => Math.max(60, o - Math.random() * 0.05));
      setTemp((tp) => Math.min(110, Math.max(70, tp + (Math.random() - 0.5) * 2)));
    }, 2200);
    return () => clearInterval(id);
  }, []);

  const tempColor = temp > 100 ? "text-emergency" : temp > 92 ? "text-warning" : "text-success";

  return (
    <div className="tactical-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm uppercase tracking-widest text-muted-foreground">
          {t("telemetry")}
        </h3>
        <span className="font-mono text-[10px] text-success animate-blink">● LIVE</span>
      </div>

      <Row icon={<Fuel className="h-4 w-4" />} label={t("fuel")} value={`${fuel.toFixed(0)}%`}>
        <Progress value={fuel} className="h-1.5" />
      </Row>

      <Row icon={<Wind className="h-4 w-4 text-primary" />} label={t("oxygen")} value={`${oxy.toFixed(0)}%`}>
        <Progress value={oxy} className="h-1.5" />
      </Row>

      <Row icon={<Thermometer className={`h-4 w-4 ${tempColor}`} />} label={t("engineTemp")} value={`${temp.toFixed(0)}°C`}>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              temp > 100 ? "bg-emergency" : temp > 92 ? "bg-warning" : "bg-success"
            }`}
            style={{ width: `${Math.min(100, ((temp - 60) / 60) * 100)}%` }}
          />
        </div>
      </Row>
    </div>
  );
}

function Row({
  icon, label, value, children,
}: { icon: React.ReactNode; label: string; value: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-2 text-muted-foreground">
          {icon} {label}
        </span>
        <span className="font-mono font-semibold text-foreground">{value}</span>
      </div>
      {children}
    </div>
  );
}
