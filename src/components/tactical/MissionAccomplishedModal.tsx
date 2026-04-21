import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useDashboard } from "@/lib/dashboard-context";
import { CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export function MissionAccomplishedModal({ open, onDone }: { open: boolean; onDone: () => void }) {
  const { t } = useDashboard();
  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md" hideClose>
        <DialogHeader>
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 14 }}
            className="mx-auto h-20 w-20 rounded-full bg-success flex items-center justify-center mb-2 shadow-[0_0_40px_hsl(var(--success)/0.7)]"
          >
            <CheckCircle2 className="h-12 w-12 text-success-foreground" strokeWidth={2.5} />
          </motion.div>
          <DialogTitle className="text-center font-display tracking-widest text-2xl">
            {t("missionAccomplished")}
          </DialogTitle>
          <DialogDescription className="text-center">{t("missionAccomplishedDesc")}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center pt-2">
          <Button onClick={onDone} className="min-w-[160px] bg-gradient-primary font-display tracking-wider">
            {t("done")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
