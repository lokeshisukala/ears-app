import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { LatLng, bearing, DEMO } from "@/lib/routing";
import ambulanceIconUrl from "@/assets/ambulance-icon.png";
import { useDashboard } from "@/lib/dashboard-context";
import { Button } from "@/components/ui/button";
import { Sun, Moon, Map as MapIcon, Mountain, Clock, Route as RouteIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  path: LatLng[] | null;
  vehiclePos: LatLng;
  vehicleHeading: number;
  destination: { coord: LatLng; label: string; type: "patient" | "hospital" } | null;
  etaMin: number;
  distanceKm: number;
  scanning: boolean;
}

// Patient pulse divIcon
const patientIcon = L.divIcon({
  className: "",
  html: `<div style="position:relative;width:28px;height:28px;">
    <div style="position:absolute;inset:0;border-radius:9999px;background:hsl(358 90% 58% / .35);animation:radar-ping 1.6s ease-out infinite;"></div>
    <div style="position:absolute;inset:6px;border-radius:9999px;background:hsl(358 90% 58%);box-shadow:0 0 16px hsl(358 100% 65%);border:2px solid white;"></div>
  </div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const hospitalIcon = L.divIcon({
  className: "",
  html: `<div style="position:relative;width:32px;height:32px;display:flex;align-items:center;justify-content:center;">
    <div style="position:absolute;inset:0;border-radius:8px;background:hsl(188 95% 55%);box-shadow:0 0 16px hsl(188 100% 65%);border:2px solid white;"></div>
    <span style="position:relative;color:white;font-weight:900;font-size:18px;line-height:1;">+</span>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

function buildAmbulanceIcon(rotation: number) {
  return L.divIcon({
    className: "",
    html: `<div style="width:42px;height:42px;transform:rotate(${rotation}deg);transition:transform .25s linear;filter:drop-shadow(0 0 12px hsl(188 100% 65% / .8));">
      <img src="${ambulanceIconUrl}" style="width:100%;height:100%;object-fit:contain;" />
    </div>`,
    iconSize: [42, 42],
    iconAnchor: [21, 21],
  });
}

function MapController({ center, zoom, fly }: { center: LatLng; zoom: number; fly: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (fly) map.flyTo(center, zoom, { duration: 1.4 });
  }, [center, zoom, fly, map]);
  return null;
}

export function MapEngine({ path, vehiclePos, vehicleHeading, destination, etaMin, distanceKm, scanning }: Props) {
  const { theme, toggleTheme, t } = useDashboard();
  const [view, setView] = useState<"transit" | "terrain">("transit");
  const [flyOn, setFlyOn] = useState(false);

  // trigger flyTo when destination changes
  useEffect(() => {
    if (destination) {
      setFlyOn(true);
      const id = setTimeout(() => setFlyOn(false), 1500);
      return () => clearTimeout(id);
    }
  }, [destination]);

  const tileUrl =
    view === "terrain"
      ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      : theme === "dark"
        ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        : "https://{s}.basemaps.cartocdn.com/voyager/{z}/{x}/{y}{r}.png";

  const ambIcon = useMemo(() => buildAmbulanceIcon(vehicleHeading), [vehicleHeading]);

  return (
    <div className={`relative h-full w-full ${theme === "dark" && view === "transit" ? "" : ""}`}>
      <MapContainer
        center={DEMO.base}
        zoom={14}
        zoomControl={false}
        className={`h-full w-full ${theme === "dark" && view === "transit" ? "" : ""}`}
        style={{ background: "hsl(var(--background))" }}
      >
        <TileLayer url={tileUrl} attribution='&copy; OpenStreetMap, CARTO, Esri' />

        <MapController center={destination?.coord ?? vehiclePos} zoom={14} fly={flyOn} />

        {/* Patient/hospital marker */}
        {destination && (
          <Marker
            position={destination.coord}
            icon={destination.type === "patient" ? patientIcon : hospitalIcon}
          >
            <Popup>{destination.label}</Popup>
          </Marker>
        )}

        {/* Ambulance */}
        <Marker position={vehiclePos} icon={ambIcon} />

        {/* Path */}
        {path && (
          <>
            {/* glow underlay */}
            <Polyline
              positions={path}
              pathOptions={{
                color: destination?.type === "hospital" ? "hsl(188, 95%, 55%)" : "hsl(358, 90%, 58%)",
                weight: 12,
                opacity: 0.25,
                lineCap: "round",
              }}
            />
            <Polyline
              positions={path}
              pathOptions={{
                color: destination?.type === "hospital" ? "hsl(188, 100%, 65%)" : "hsl(358, 100%, 68%)",
                weight: 4,
                opacity: 0.95,
                lineCap: "round",
              }}
            />
          </>
        )}
      </MapContainer>

      {/* HUD overlays */}
      {/* Top-left status pill (offset on mobile to clear hamburger) */}
      <div className="absolute top-4 left-4 z-[500] flex items-center gap-2 ml-12 lg:ml-0">
        <div className="tactical-panel rounded-full px-2.5 py-1 sm:px-3 sm:py-1.5 flex items-center gap-2 backdrop-blur-md">
          <span className="h-2 w-2 rounded-full bg-success animate-blink" />
          <span className="font-mono text-[9px] sm:text-[10px] tracking-widest text-foreground whitespace-nowrap">
            <span className="hidden sm:inline">GPS LOCK · 12 SAT</span>
            <span className="sm:hidden">GPS · 12</span>
          </span>
        </div>
      </div>

      {/* Top-right controls */}
      <div className="absolute top-4 right-4 z-[500] flex flex-col gap-2 items-end">
        <div className="tactical-panel rounded-lg p-1 flex backdrop-blur-md">
          <Button
            variant="ghost" size="sm"
            onClick={() => setView("transit")}
            className={`h-8 px-2 sm:px-3 font-mono text-[10px] tracking-wider ${view === "transit" ? "bg-primary/20 text-primary" : "text-muted-foreground"}`}
          >
            <MapIcon className="h-3.5 w-3.5 sm:mr-1.5" /> <span className="hidden sm:inline">{t("transitView")}</span>
          </Button>
          <Button
            variant="ghost" size="sm"
            onClick={() => setView("terrain")}
            className={`h-8 px-2 sm:px-3 font-mono text-[10px] tracking-wider ${view === "terrain" ? "bg-primary/20 text-primary" : "text-muted-foreground"}`}
          >
            <Mountain className="h-3.5 w-3.5 sm:mr-1.5" /> <span className="hidden sm:inline">{t("terrainView")}</span>
          </Button>
        </div>
        <Button
          variant="ghost" size="icon"
          onClick={toggleTheme}
          className="tactical-panel h-10 w-10 rounded-lg backdrop-blur-md"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </div>

      {/* ETA pill (bottom center) */}
      <AnimatePresence>
        {path && !scanning && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-[500] w-[min(92vw,420px)]"
          >
            <div className="tactical-panel rounded-full px-3 py-2 sm:px-5 sm:py-2.5 flex items-center justify-center gap-3 sm:gap-5 backdrop-blur-xl glow-primary">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary shrink-0" />
                <div>
                  <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground leading-none">{t("eta")}</div>
                  <div className="font-display font-bold text-sm sm:text-base text-foreground leading-tight">{etaMin.toFixed(1)} min</div>
                </div>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="flex items-center gap-2">
                <RouteIcon className="h-4 w-4 text-emergency shrink-0" />
                <div>
                  <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground leading-none">{t("distance")}</div>
                  <div className="font-display font-bold text-sm sm:text-base text-foreground leading-tight">{distanceKm.toFixed(2)} km</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scanline / grid overlay (subtle) */}
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.04] z-[400]" />
    </div>
  );
}
