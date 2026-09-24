import { Progress } from "@/components/ui/progress";
import { useDashboard } from "@/lib/dashboard-context";
import { Fuel, Wind, Thermometer, Gauge, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";

export function TelemetryCard() {
  const { t } = useDashboard();
  const [fuel, setFuel] = useState(82);
  const [oxy, setOxy] = useState(94);
  const [temp, setTemp] = useState(88); // deg C, normal ~75-95
  const [tire, setTire] = useState(34); // PSI, normal 30-36

  useEffect(() => {
    const id = setInterval(() => {
      setFuel((f) => Math.max(15, f - Math.random() * 0.25));
      setOxy((o) => Math.max(60, o - Math.random() * 0.05));
      setTemp((tp) => Math.min(110, Math.max(70, tp + (Math.random() - 0.5) * 2)));
      setTire((p) => Math.min(38, Math.max(28, p + (Math.random() - 0.5) * 0.3)));
    }, 2200);
    return () => clearInterval(id);
  }, []);

  const tempColor = temp > 100 ? "text-emergency" : temp > 92 ? "text-warning" : "text-success";
  const fuelLow = fuel < 25;
  const fuelColor = fuelLow ? "bg-emergency" : fuel < 40 ? "bg-warning" : "";
  const tireOk = tire >= 30 && tire <= 36;
  const tireColor = !tireOk ? "text-warning" : "text-success";

  return (
    <div className="tactical-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm uppercase tracking-widest text-muted-foreground">
          {t("telemetry")}
        </h3>
        <span className="font-mono text-[10px] text-success animate-blink">● LIVE</span>
      </div>

      {fuelLow && (
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-emergency/15 border border-emergency/40 text-emergency">
          <AlertTriangle className="h-3.5 w-3.5 animate-pulse" />
          <span className="font-mono text-[10px] tracking-wider">LOW FUEL — REFUEL ASAP</span>
        </div>
      )}

      <Row icon={<Fuel className={`h-4 w-4 ${fuelLow ? "text-emergency" : ""}`} />} label={t("fuel")} value={`${fuel.toFixed(0)}%`}>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div className={`h-full transition-all duration-500 ${fuelColor || "bg-success"}`} style={{ width: `${fuel}%` }} />
        </div>
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

      <Row icon={<Gauge className={`h-4 w-4 ${tireColor}`} />} label="Tire Pressure" value={`${tire.toFixed(1)} PSI`}>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${tireOk ? "bg-success" : "bg-warning"}`}
            style={{ width: `${Math.min(100, ((tire - 24) / 16) * 100)}%` }}
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
