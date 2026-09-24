import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDashboard } from "@/lib/dashboard-context";
import { Heart, Activity, Gauge } from "lucide-react";
import { useState } from "react";

export function VitalsModal({ open, onSubmit }: { open: boolean; onSubmit: () => void }) {
  const { t } = useDashboard();
  const [hr, setHr] = useState("88");
  const [spo2, setSpo2] = useState("96");
  const [bp, setBp] = useState("120/80");

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md" hideClose>
        <DialogHeader>
          <DialogTitle className="font-display tracking-wider flex items-center gap-2">
            <Activity className="h-5 w-5 text-emergency" />
            {t("logVitals")}
          </DialogTitle>
          <DialogDescription>Capture initial readings before transport.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <Field icon={<Heart className="h-4 w-4 text-emergency" />} label={t("heartRate")}>
            <Input value={hr} onChange={(e) => setHr(e.target.value)} className="font-mono" />
          </Field>
          <Field icon={<Activity className="h-4 w-4 text-primary" />} label={t("spo2")}>
            <Input value={spo2} onChange={(e) => setSpo2(e.target.value)} className="font-mono" />
          </Field>
          <Field icon={<Gauge className="h-4 w-4 text-warning" />} label={t("bloodPressure")}>
            <Input value={bp} onChange={(e) => setBp(e.target.value)} className="font-mono" />
          </Field>
        </div>

        <DialogFooter>
          <Button onClick={onSubmit} className="w-full bg-gradient-emergency text-destructive-foreground hover:opacity-90">
            {t("findHospitals")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs flex items-center gap-2">{icon}{label}</Label>
      {children}
    </div>
  );
}
