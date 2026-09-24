import { useDashboard } from "@/lib/dashboard-context";
import { useEffect, useState } from "react";

export function TrafficBar() {
  const { t } = useDashboard();
  // intensity 0..100 -- determines marker position
  const [intensity, setIntensity] = useState(55);

  useEffect(() => {
    const id = setInterval(() => {
      setIntensity((i) => {
        const next = i + (Math.random() - 0.5) * 12;
        return Math.max(5, Math.min(95, next));
      });
    }, 2000);
    return () => clearInterval(id);
  }, []);

  const label =
    intensity < 33 ? t("light") : intensity < 66 ? t("moderate") : t("heavy");
  const labelColor =
    intensity < 33 ? "text-success" : intensity < 66 ? "text-warning" : "text-emergency";

  return (
    <div className="tactical-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm uppercase tracking-widest text-muted-foreground">
          {t("trafficIntensity")}
        </h3>
        <span className={`font-mono text-xs font-bold ${labelColor}`}>{label.toUpperCase()}</span>
      </div>
      <div className="relative h-3 rounded-full overflow-hidden border border-border">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, hsl(var(--success)) 0%, hsl(var(--success)) 33%, hsl(var(--warning)) 33%, hsl(var(--warning)) 66%, hsl(var(--emergency)) 66%, hsl(var(--emergency)) 100%)",
          }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 h-5 w-1 bg-foreground rounded-full transition-all duration-1000 ease-out shadow-lg"
          style={{ left: `calc(${intensity}% - 2px)` }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 h-5 w-5 -translate-x-1/2 rounded-full bg-foreground/20 backdrop-blur-sm border-2 border-foreground transition-all duration-1000 ease-out"
          style={{ left: `${intensity}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
        <span>{t("light")}</span>
        <span>{t("moderate")}</span>
        <span>{t("heavy")}</span>
      </div>
    </div>
  );
}
