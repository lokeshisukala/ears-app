import { useDashboard } from "@/lib/dashboard-context";
import driverImg from "@/assets/driver-avatar.jpg";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuSub,
  DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Pencil, Languages, Eye, LogOut, Check, Radio } from "lucide-react";
import { LANGUAGES } from "@/lib/i18n";
import { TelemetryCard } from "./TelemetryCard";
import { TrafficBar } from "./TrafficBar";
import { MissionCard } from "./MissionCard";
import { useState } from "react";
import { EditDetailsModal } from "./EditDetailsModal";

interface Patient { id: string; name: string; addr: string }

interface Props {
  patient: Patient;
  onNavigate: () => void;
  onCustomDispatch: (s: string, e: string) => void;
}

export function Sidebar({ patient, onNavigate, onCustomDispatch }: Props) {
  const { driver, t, lang, setLang, eyeComfort, toggleEyeComfort } = useDashboard();
  const [editOpen, setEditOpen] = useState(false);

  return (
    <>
      <aside className="w-[340px] shrink-0 h-screen border-r border-border bg-card/40 backdrop-blur-xl flex flex-col">
        {/* Header / Brand */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-gradient-tactical">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Radio className="h-6 w-6 text-emergency" />
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emergency animate-blink" />
            </div>
            <div>
              <div className="font-display font-bold text-lg text-glow tracking-widest leading-none">EARS</div>
              <div className="text-[9px] uppercase tracking-widest text-muted-foreground">{t("appTagline")}</div>
            </div>
          </div>
        </div>

        {/* Driver Profile */}
        <div className="px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={driverImg}
                alt={driver.name}
                width={56} height={56}
                loading="lazy"
                className="h-14 w-14 rounded-full object-cover border-2 border-primary/60 glow-primary"
              />
              <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-success border-2 border-card" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-display font-semibold text-sm text-foreground truncate">{driver.name}</div>
              <div className="font-mono text-xs text-primary">{driver.unit}</div>
              <div className="font-mono text-[10px] text-success mt-0.5">● {t("onDuty")}</div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger className="h-8 w-8 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition">
                <MoreVertical className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-display tracking-wider text-xs">SETTINGS</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setEditOpen(true)}>
                  <Pencil className="h-4 w-4 mr-2" /> {t("editDetails")}
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Languages className="h-4 w-4 mr-2" /> {t("language")}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {LANGUAGES.map((l) => (
                      <DropdownMenuItem key={l.code} onClick={() => setLang(l.code)}>
                        <span className="flex-1">{l.native}</span>
                        {lang === l.code && <Check className="h-4 w-4 ml-2 text-primary" />}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuCheckboxItem checked={eyeComfort} onCheckedChange={toggleEyeComfort}>
                  <Eye className="h-4 w-4 mr-2" /> {t("eyeComfort")}
                </DropdownMenuCheckboxItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <a href="#" className="text-emergency focus:text-emergency">
                    <LogOut className="h-4 w-4 mr-2" /> {t("logout")}
                  </a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Language Bar */}
        <div className="px-3 py-2 border-b border-border bg-muted/20 flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
          <Languages className="h-3.5 w-3.5 text-muted-foreground shrink-0 ml-1" />
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              className={`px-2 py-1 rounded text-[11px] font-display font-semibold tracking-wider shrink-0 transition-all ${
                lang === l.code
                  ? "bg-primary text-primary-foreground glow-primary"
                  : "bg-card/60 text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
              title={l.label}
            >
              {l.native}
            </button>
          ))}
        </div>

        {/* Scroll content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          <TelemetryCard />
          <TrafficBar />
          <MissionCard patient={patient} onNavigate={onNavigate} onCustomDispatch={onCustomDispatch} />
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 border-t border-border font-mono text-[10px] text-muted-foreground flex justify-between">
          <span>v2.4.1 · TAC-OS</span>
          <span className="text-success">● SYS NOMINAL</span>
        </div>
      </aside>

      <EditDetailsModal open={editOpen} onOpenChange={setEditOpen} />
    </>
  );
}
