import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { Lang, t as translate, STRINGS } from "./i18n";

export type MissionState =
  | "idle"
  | "dispatched"      // received, before navigate click
  | "en_route_patient"
  | "arrived_patient"
  | "boarded"         // vitals form
  | "scanning"        // hospital scan
  | "en_route_hospital"
  | "accomplished";

export interface Driver { name: string; unit: string }

interface Ctx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: keyof typeof STRINGS["en"]) => string;

  theme: "dark" | "light";
  toggleTheme: () => void;

  eyeComfort: boolean;
  toggleEyeComfort: () => void;

  driver: Driver;
  setDriver: (d: Driver) => void;

  missionState: MissionState;
  setMissionState: (s: MissionState) => void;
}

const DashboardContext = createContext<Ctx | null>(null);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [eyeComfort, setEyeComfort] = useState(false);
  const [driver, setDriver] = useState<Driver>({ name: "Capt. Arjun Verma", unit: "EARS-07" });
  const [missionState, setMissionState] = useState<MissionState>("dispatched");

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("light", theme === "light");
    root.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    document.body.classList.toggle("eye-comfort", eyeComfort);
  }, [eyeComfort]);

  const value = useMemo<Ctx>(
    () => ({
      lang, setLang,
      t: (k) => translate(lang, k),
      theme, toggleTheme: () => setTheme((p) => (p === "dark" ? "light" : "dark")),
      eyeComfort, toggleEyeComfort: () => setEyeComfort((p) => !p),
      driver, setDriver,
      missionState, setMissionState,
    }),
    [lang, theme, eyeComfort, driver, missionState]
  );

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used within DashboardProvider");
  return ctx;
}
