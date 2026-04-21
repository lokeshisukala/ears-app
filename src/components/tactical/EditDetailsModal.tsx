import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDashboard } from "@/lib/dashboard-context";
import { useEffect, useState } from "react";

export function EditDetailsModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { driver, setDriver, t } = useDashboard();
  const [name, setName] = useState(driver.name);
  const [unit, setUnit] = useState(driver.unit);

  useEffect(() => {
    if (open) { setName(driver.name); setUnit(driver.unit); }
  }, [open, driver]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display tracking-wider">{t("editDetails")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs">{t("driverName")}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t("unitNumber")}</Label>
            <Input value={unit} onChange={(e) => setUnit(e.target.value)} className="font-mono" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("cancel")}</Button>
          <Button
            onClick={() => { setDriver({ name, unit }); onOpenChange(false); }}
            className="bg-gradient-primary"
          >
            {t("saveChanges")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
