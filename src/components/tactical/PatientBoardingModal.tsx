import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useDashboard } from "@/lib/dashboard-context";
import { Ambulance } from "lucide-react";

export function PatientBoardingModal({
  open, onYes, onNo,
}: { open: boolean; onYes: () => void; onNo: () => void }) {
  const { t } = useDashboard();
  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md" hideClose>
        <DialogHeader>
          <div className="mx-auto h-14 w-14 rounded-full bg-gradient-emergency flex items-center justify-center mb-2 animate-pulse-emergency">
            <Ambulance className="h-7 w-7 text-destructive-foreground" />
          </div>
          <DialogTitle className="text-center font-display tracking-wider text-2xl">{t("patientBoarding")}</DialogTitle>
          <DialogDescription className="text-center">{t("patientBoardingDesc")}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center gap-2 pt-2">
          <Button variant="outline" onClick={onNo} className="min-w-[120px]">{t("no")}</Button>
          <Button onClick={onYes} className="min-w-[140px] bg-gradient-emergency text-destructive-foreground hover:opacity-90">
            {t("yes")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
