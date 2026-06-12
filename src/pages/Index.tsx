import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DashboardProvider, useDashboard } from "@/lib/dashboard-context";
import { Sidebar, DesktopSidebar } from "@/components/tactical/Sidebar";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { MapEngine } from "@/components/tactical/MapEngine";
import { PatientBoardingModal } from "@/components/tactical/PatientBoardingModal";
import { VitalsModal } from "@/components/tactical/VitalsModal";
import { ScanningOverlay } from "@/components/tactical/ScanningOverlay";
import { MissionAccomplishedModal } from "@/components/tactical/MissionAccomplishedModal";
import { computeRoute, bearing, DEMO, LatLng, RouteResult } from "@/lib/routing";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import earsLogo from "@/assets/ears-logo.jpeg";
import { ClockHUD } from "@/components/tactical/ClockHUD";
import { CompassSpeed } from "@/components/tactical/CompassSpeed";
import { QuickActionDock } from "@/components/tactical/QuickActionDock";
import { VoiceCommand } from "@/components/tactical/VoiceCommand";
import { IncidentAlert, IncidentReport } from "@/components/tactical/IncidentAlert";
import { pushHistory } from "@/components/tactical/MissionHistory";
import { ServerLostOverlay } from "@/components/tactical/ServerLostOverlay";
import { RouteAdvisory } from "@/components/tactical/RouteAdvisory";
import { useAuth } from "@/lib/auth-context";

function Dashboard() {
  const { missionState, setMissionState, t, setDriver } = useDashboard();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Sync logged-in user → dashboard driver
  useEffect(() => {
    if (user) setDriver({ name: user.name, unit: user.unit });
  }, [user, setDriver]);

  // Patient + hospital selection (auto-pick first; rotate on reset)
  const [patientIdx, setPatientIdx] = useState(0);
  const patient = DEMO.patients[patientIdx % DEMO.patients.length];
  const [hospital, setHospital] = useState(DEMO.hospitals[0]);

  // Vehicle state
  const [vehiclePos, setVehiclePos] = useState<LatLng>(DEMO.base);
  const [vehicleHeading, setVehicleHeading] = useState<number>(0);

  // Active route
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [destination, setDestination] = useState<{ coord: LatLng; label: string; type: "patient" | "hospital" } | null>({
    coord: patient.coord, label: patient.name, type: "patient",
  });
  const [etaMin, setEtaMin] = useState(0);
  const [distanceKm, setDistanceKm] = useState(0);

  const [boardingOpen, setBoardingOpen] = useState(false);
  const [vitalsOpen, setVitalsOpen] = useState(false);
  const [scanningActive, setScanningActive] = useState(false);
  const [accomplishedOpen, setAccomplishedOpen] = useState(false);

  // EARS uplink state — goes offline on simulated ambulance accident
  const [serverOnline, setServerOnline] = useState(true);

  // Mission timing for history record
  const missionStartRef = useRef<number | null>(null);
  const missionDistanceRef = useRef<number>(0);

  const animFrame = useRef<number | null>(null);
  const pauseRef = useRef<boolean>(false);
  const boardingRepromptRef = useRef<number | null>(null);

  const clearBoardingReprompt = useCallback(() => {
    if (boardingRepromptRef.current) {
      clearTimeout(boardingRepromptRef.current);
      boardingRepromptRef.current = null;
    }
  }, []);

  // Cleanup animation + timers on unmount
  useEffect(() => () => {
    if (animFrame.current) cancelAnimationFrame(animFrame.current);
    if (boardingRepromptRef.current) clearTimeout(boardingRepromptRef.current);
  }, []);

  // Pause/resume animation when EARS goes offline / restores
  // Pause/resume animation when EARS goes offline / restores
  useEffect(() => { pauseRef.current = !serverOnline; }, [serverOnline]);

  // Refs mirroring latest state for use inside timers
  const missionStateRef = useRef(missionState);
  const serverOnlineRef = useRef(serverOnline);
  useEffect(() => { missionStateRef.current = missionState; }, [missionState]);
  useEffect(() => { serverOnlineRef.current = serverOnline; }, [serverOnline]);

  // Defensive guard: boarding modal may only be open when actually arrived at patient
  useEffect(() => {
    if (missionState !== "arrived_patient" && boardingOpen) {
      setBoardingOpen(false);
      clearBoardingReprompt();
    }
  }, [missionState, boardingOpen, clearBoardingReprompt]);

  // Animate vehicle along path (safe against route swaps & pauses)
  const animateAlong = useCallback(
    (path: LatLng[], totalSec: number, onArrive: () => void) => {
      if (animFrame.current) cancelAnimationFrame(animFrame.current);
      if (!path || path.length < 2) { onArrive(); return; }

      const startTs = performance.now();
      const totalMs = totalSec * 1000;
      let pausedAcc = 0;
      let pausedAt: number | null = null;

      const tick = (now: number) => {
        // Honor pause (server offline)
        if (pauseRef.current) {
          if (pausedAt === null) pausedAt = now;
          animFrame.current = requestAnimationFrame(tick);
          return;
        }
        if (pausedAt !== null) { pausedAcc += now - pausedAt; pausedAt = null; }

        const t = Math.min(1, (now - startTs - pausedAcc) / totalMs);
        const idxF = t * (path.length - 1);
        const i = Math.min(path.length - 1, Math.max(0, Math.floor(idxF)));
        const frac = idxF - i;
        const a = path[i] ?? path[0];
        const b = path[Math.min(path.length - 1, i + 1)] ?? a;
        if (!a || !b) { onArrive(); return; }
        const lat = a[0] + (b[0] - a[0]) * frac;
        const lng = a[1] + (b[1] - a[1]) * frac;
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          setVehiclePos([lat, lng]);
          if (i < path.length - 1) setVehicleHeading(bearing(a, b));
        }

        // update remaining ETA & distance
        let remaining = 0;
        for (let k = i; k < path.length - 1; k++) {
          const p1 = path[k], p2 = path[k + 1];
          if (!p1 || !p2) continue;
          remaining += Math.hypot(p1[0] - p2[0], p1[1] - p2[1]) * 111;
        }
        setDistanceKm(remaining);
        setEtaMin((1 - t) * (totalMs / 60000));

        if (t < 1) animFrame.current = requestAnimationFrame(tick);
        else onArrive();
      };
      animFrame.current = requestAnimationFrame(tick);
    },
    []
  );

  // Step 1: Driver clicks NAVIGATE
  const handleNavigateToPatient = useCallback(() => {
    const r = computeRoute(DEMO.base, patient.coord, Date.now());
    setRoute(r);
    setDestination({ coord: patient.coord, label: patient.name, type: "patient" });
    setDistanceKm(r.distanceKm);
    setEtaMin(r.etaMin);
    setMissionState("en_route_patient");
    missionStartRef.current = Date.now();
    missionDistanceRef.current = r.distanceKm;
    toast({ title: "🚨 Dijkstra Route Computed", description: `${r.nodesExplored} nodes explored · ${r.path.length} waypoints · ${r.distanceKm.toFixed(2)} km` });

    // simulate drive (compress to ~10s for demo)
    animateAlong(r.path, 10, () => {
      setMissionState("arrived_patient");
      setBoardingOpen(true);
    });
  }, [patient, animateAlong, setMissionState]);

  // Step 2: Patient boarding → Yes
  const handleBoardingYes = useCallback(() => {
    clearBoardingReprompt();
    setBoardingOpen(false);
    setMissionState("boarded");
    setVitalsOpen(true);
  }, [setMissionState, clearBoardingReprompt]);

  const handleBoardingNo = useCallback(() => {
    clearBoardingReprompt();
    setBoardingOpen(false);
    toast({ title: "Awaiting boarding", description: "Stand by — re-prompt in 5s." });
    boardingRepromptRef.current = window.setTimeout(() => {
      boardingRepromptRef.current = null;
      // Only re-prompt if still arrived at patient and EARS is online
      if (missionStateRef.current === "arrived_patient" && serverOnlineRef.current) {
        setBoardingOpen(true);
      }
    }, 5000);
  }, [clearBoardingReprompt]);

  // Step 3: vitals submit
  const handleVitalsSubmit = useCallback(() => {
    clearBoardingReprompt();
    setVitalsOpen(false);
    setMissionState("scanning");
    setScanningActive(true);

    // pick best hospital (closest)
    const closest = [...DEMO.hospitals].sort((a, b) => {
      const da = Math.hypot(a.coord[0] - patient.coord[0], a.coord[1] - patient.coord[1]);
      const db = Math.hypot(b.coord[0] - patient.coord[0], b.coord[1] - patient.coord[1]);
      return da - db;
    })[0];
    setHospital(closest);

    setTimeout(() => {
      setScanningActive(false);
      // Step 4: route to hospital
      const r2 = computeRoute(patient.coord, closest.coord, Date.now());
      setRoute(r2);
      setDestination({ coord: closest.coord, label: closest.name, type: "hospital" });
      setDistanceKm(r2.distanceKm);
      setEtaMin(r2.etaMin);
      setMissionState("en_route_hospital");
      missionDistanceRef.current += r2.distanceKm;
      toast({ title: `→ ${closest.name}`, description: `${closest.beds} beds available · ETA ${r2.etaMin.toFixed(1)} min` });

      animateAlong(r2.path, 10, () => {
        setAccomplishedOpen(true);
      });
    }, 3500);
  }, [patient, animateAlong, setMissionState]);

  // Step 5: Mission Done → reset
  const handleDone = useCallback(() => {
    setAccomplishedOpen(false);
    clearBoardingReprompt();
    if (animFrame.current) cancelAnimationFrame(animFrame.current);

    // Save mission to history
    if (missionStartRef.current) {
      pushHistory({
        id: `m-${missionStartRef.current}`,
        patient: patient.name,
        hospital: hospital.name,
        endedAt: Date.now(),
        durationSec: (Date.now() - missionStartRef.current) / 1000,
        distanceKm: missionDistanceRef.current,
      });
      missionStartRef.current = null;
      missionDistanceRef.current = 0;
    }

    // rotate to next patient for next mission
    const nextIdx = (patientIdx + 1) % DEMO.patients.length;
    setPatientIdx(nextIdx);
    const nextPatient = DEMO.patients[nextIdx];

    setVehiclePos(DEMO.base);
    setVehicleHeading(0);
    setRoute(null);
    setDestination({ coord: nextPatient.coord, label: nextPatient.name, type: "patient" });
    setDistanceKm(0);
    setEtaMin(0);
    setMissionState("dispatched");
    toast({ title: "✓ Mission Accomplished", description: "Standing by for next dispatch." });
  }, [patientIdx, patient, hospital, setMissionState]);

  // Voice command router — all branches do something visible
  const handleVoiceCommand = useCallback((cmd: "navigate" | "sos" | "call" | "scan") => {
    if (cmd === "navigate") {
      if (missionState === "dispatched" || missionState === "idle") {
        handleNavigateToPatient();
      } else {
        toast({ title: "Already en route", description: "Navigation already in progress." });
      }
    } else if (cmd === "sos") {
      toast({ title: "🆘 SOS BROADCAST", description: "Emergency beacon transmitting on all channels.", variant: "destructive" });
    } else if (cmd === "call") {
      toast({ title: "📞 Calling Hospital", description: `Connecting to ${hospital.name}…` });
    } else if (cmd === "scan") {
      setScanningActive(true);
      toast({ title: "🔍 Scanning", description: "Sweeping nearby facilities…" });
      setTimeout(() => setScanningActive(false), 2500);
    }
  }, [missionState, handleNavigateToPatient, hospital.name]);

  // ─── Simulated ambulance accident → EARS signal lost ───
  const triggerAccident = useCallback(() => {
    if (!serverOnline) return;
    setServerOnline(false);
    clearBoardingReprompt();
    setBoardingOpen(false);
    toast({
      title: "💥 VEHICLE INCIDENT DETECTED",
      description: "Impact sensors triggered · EARS uplink lost.",
      variant: "destructive",
    });
  }, [serverOnline]);

  // Randomly trigger an accident while driving (rare)
  useEffect(() => {
    const driving = missionState === "en_route_patient" || missionState === "en_route_hospital";
    if (!driving || !serverOnline) return;
    const delay = 18000 + Math.random() * 22000; // 18–40s into a drive
    const id = window.setTimeout(() => {
      if (Math.random() < 0.35) triggerAccident();
    }, delay);
    return () => clearTimeout(id);
  }, [missionState, serverOnline, triggerAccident]);

  const handleRestoreServer = useCallback(() => {
    setServerOnline(true);
    toast({ title: "✅ EARS Online", description: "Driver responsive · uplink restored · resuming mission." });
  }, []);

  const handleCustomDispatch = useCallback((s: string, e: string) => {
    toast({ title: "Manual Dispatch", description: `Routing ${s || "AUTO"} → ${e || "AUTO"}` });
    handleNavigateToPatient();
  }, [handleNavigateToPatient]);

  // ─── Auto-dispatch: incident alert accepted ───
  const handleIncidentAccept = useCallback((inc: IncidentReport) => {
    const r = computeRoute(vehiclePos, inc.coord, Date.now());
    setRoute(r);
    setDestination({ coord: inc.coord, label: `${inc.type} · ${inc.id}`, type: "patient" });
    setDistanceKm(r.distanceKm);
    setEtaMin(r.etaMin);
    setMissionState("en_route_patient");
    missionStartRef.current = Date.now();
    missionDistanceRef.current = r.distanceKm;
    toast({
      title: `🚨 EN ROUTE · ${inc.id}`,
      description: `${inc.addr} · ${r.distanceKm.toFixed(2)} km · ETA ${r.etaMin.toFixed(1)} min`,
      variant: "destructive",
    });
    animateAlong(r.path, 10, () => {
      setMissionState("arrived_patient");
      setBoardingOpen(true);
    });
  }, [vehiclePos, animateAlong, setMissionState]);

  const handleDeceased = useCallback(() => {
    setMissionState("accomplished");
    setAccomplishedOpen(true);
  }, [setMissionState]);

  const sidebarProps = {
    patient,
    hospitalName: hospital.name,
    onNavigate: handleNavigateToPatient,
    onCustomDispatch: handleCustomDispatch,
    onDeceased: handleDeceased,
  };

  const mainContent = (
    <main className="relative h-screen w-full min-w-0">
      {/* Mobile header: menu trigger + brand */}
      <div className="lg:hidden absolute top-3 left-3 right-3 z-[600] flex items-center gap-2 pointer-events-none">
        <Button
          onClick={() => setSidebarOpen(true)}
          variant="ghost"
          size="icon"
          aria-label="Open menu"
          className="h-10 w-10 tactical-panel rounded-lg backdrop-blur-md pointer-events-auto shrink-0"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="tactical-panel rounded-lg backdrop-blur-md px-2.5 py-1.5 flex items-center gap-2 pointer-events-auto">
          <img src={earsLogo} alt="EARS logo" className="h-7 w-7 rounded object-cover" />
          <span className="font-display font-bold text-sm tracking-widest text-glow leading-none">EARS</span>
        </div>
      </div>
      <MapEngine
        path={route?.path ?? null}
        vehiclePos={vehiclePos}
        vehicleHeading={vehicleHeading}
        destination={destination}
        etaMin={etaMin}
        distanceKm={distanceKm}
        scanning={scanningActive}
      />
      <ClockHUD />
      <CompassSpeed
        heading={vehicleHeading}
        vehiclePos={vehiclePos}
        active={missionState === "en_route_patient" || missionState === "en_route_hospital"}
      />
      <QuickActionDock />
      <VoiceCommand onCommand={handleVoiceCommand} />
      <IncidentAlert
        idle={missionState === "idle" || missionState === "dispatched"}
        vehiclePos={vehiclePos}
        onAccept={handleIncidentAccept}
      />
      <RouteAdvisory
        active={serverOnline && (missionState === "en_route_patient" || missionState === "en_route_hospital")}
        phase={missionState === "en_route_hospital" ? "hospital" : "patient"}
      />
      {/* Manual accident-simulation button (demo) */}
      {(missionState === "en_route_patient" || missionState === "en_route_hospital") && serverOnline && (
        <Button
          onClick={triggerAccident}
          size="sm"
          variant="destructive"
          className="absolute bottom-3 right-3 z-[502] font-mono tracking-wider text-[10px] backdrop-blur-md opacity-80 hover:opacity-100"
          title="Simulate ambulance accident"
        >
          ⚠ SIM ACCIDENT
        </Button>
      )}
      <ScanningOverlay active={scanningActive} hospitalName={hospital.name} />
    </main>
  );

  return (
    <div className="h-screen w-full overflow-hidden bg-background">
      <ServerLostOverlay open={!serverOnline} onRestore={handleRestoreServer} />

      {/* Mobile/Tablet: drawer + full-width main */}
      <div className="lg:hidden h-screen w-full">
        <Sidebar {...sidebarProps} mobileOpen={sidebarOpen} onMobileOpenChange={setSidebarOpen} />
        {mainContent}
      </div>

      {/* Desktop: resizable split */}
      <div className="hidden lg:block h-screen w-full">
        <ResizablePanelGroup direction="horizontal" autoSaveId="ears-layout" className="h-screen w-full">
          <ResizablePanel defaultSize={26} minSize={18} maxSize={50} className="min-w-0">
            <DesktopSidebar {...sidebarProps} />
          </ResizablePanel>
          <ResizableHandle withHandle className="bg-border/60 hover:bg-primary/60 transition-colors" />
          <ResizablePanel defaultSize={74} minSize={50} className="min-w-0">
            {mainContent}
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      <PatientBoardingModal open={boardingOpen} onYes={handleBoardingYes} onNo={handleBoardingNo} />
      <VitalsModal open={vitalsOpen} onSubmit={handleVitalsSubmit} />
      <MissionAccomplishedModal open={accomplishedOpen} onDone={handleDone} />
    </div>
  );
}

const Index = () => (
  <DashboardProvider>
    <Dashboard />
  </DashboardProvider>
);

export default Index;
