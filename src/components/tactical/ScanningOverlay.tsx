import { motion, AnimatePresence } from "framer-motion";
import { useDashboard } from "@/lib/dashboard-context";

export function ScanningOverlay({ active, hospitalName }: { active: boolean; hospitalName?: string }) {
  const { t } = useDashboard();
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 z-[1000] bg-background/80 backdrop-blur-md flex items-center justify-center"
        >
          <div className="relative w-80 h-80 flex items-center justify-center">
            {/* concentric rings */}
            {[0, 0.5, 1, 1.5].map((d) => (
              <span
                key={d}
                className="absolute inset-0 rounded-full border-2 border-primary/40 animate-radar-ping"
                style={{ animationDelay: `${d}s` }}
              />
            ))}
            {/* sweeping gradient */}
            <div className="absolute inset-0 rounded-full bg-gradient-radar animate-radar-sweep origin-center" />
            {/* center */}
            <div className="relative z-10 w-40 h-40 rounded-full bg-card/90 border-2 border-primary glow-primary flex flex-col items-center justify-center text-center px-4">
              <div className="font-mono text-[10px] text-primary tracking-widest mb-1">SCAN</div>
              <div className="font-display font-bold text-foreground text-sm leading-tight">
                {t("scanning")}
              </div>
              {hospitalName && (
                <div className="font-mono text-[10px] text-success mt-2 animate-blink">
                  → {hospitalName}
                </div>
              )}
            </div>
          </div>
          <div className="absolute bottom-20 text-center max-w-md px-6">
            <div className="font-mono text-xs text-muted-foreground">{t("scanningDesc")}</div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
