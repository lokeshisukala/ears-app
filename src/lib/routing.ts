/**
 * Simulated Dijkstra routing engine.
 * In production this is delegated to the C++ binary via Node Socket.io.
 * Here we generate a smooth, organic path between two LatLng points
 * with slight detours to feel like real road routing.
 */

export type LatLng = [number, number];

export interface RouteResult {
  path: LatLng[];
  distanceKm: number;
  etaMin: number;
}

function rand(seed: number) {
  // Mulberry32 deterministic noise
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function haversine(a: LatLng, b: LatLng) {
  const R = 6371;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function computeRoute(start: LatLng, end: LatLng, seed = 42): RouteResult {
  const steps = 80;
  const noise = rand(seed);
  const path: LatLng[] = [];

  // generate 3 control points perpendicular offsets to mimic road curves
  const offsetMag = 0.0035;
  const ctrl: LatLng[] = [
    start,
    [
      start[0] + (end[0] - start[0]) * 0.33 + (noise() - 0.5) * offsetMag,
      start[1] + (end[1] - start[1]) * 0.33 + (noise() - 0.5) * offsetMag,
    ],
    [
      start[0] + (end[0] - start[0]) * 0.66 + (noise() - 0.5) * offsetMag,
      start[1] + (end[1] - start[1]) * 0.66 + (noise() - 0.5) * offsetMag,
    ],
    end,
  ];

  // Catmull-Rom-ish spline through control points
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // cubic bezier
    const u = 1 - t;
    const lat =
      u * u * u * ctrl[0][0] +
      3 * u * u * t * ctrl[1][0] +
      3 * u * t * t * ctrl[2][0] +
      t * t * t * ctrl[3][0];
    const lng =
      u * u * u * ctrl[0][1] +
      3 * u * u * t * ctrl[1][1] +
      3 * u * t * t * ctrl[2][1] +
      t * t * t * ctrl[3][1];
    // tiny jitter to look like road segments
    const jitter = (noise() - 0.5) * 0.00015;
    path.push([lat + jitter, lng + jitter]);
  }

  // distance
  let distanceKm = 0;
  for (let i = 1; i < path.length; i++) distanceKm += haversine(path[i - 1], path[i]);
  // ETA assuming avg 45 km/h with traffic factor
  const trafficFactor = 1 + noise() * 0.5;
  const etaMin = (distanceKm / 45) * 60 * trafficFactor;

  return { path, distanceKm, etaMin };
}

export function bearing(a: LatLng, b: LatLng): number {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const toDeg = (x: number) => (x * 180) / Math.PI;
  const φ1 = toRad(a[0]);
  const φ2 = toRad(b[0]);
  const λ1 = toRad(a[1]);
  const λ2 = toRad(b[1]);
  const y = Math.sin(λ2 - λ1) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ2 - λ1);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

// Demo dataset (Hyderabad area — central Madhapur)
export const DEMO = {
  base: [17.4486, 78.3908] as LatLng, // Madhapur ambulance base
  patients: [
    { id: "P-001", name: "Aarav Sharma", addr: "Hitech City Main Rd, Madhapur", coord: [17.4435, 78.3772] as LatLng },
    { id: "P-002", name: "Lakshmi Reddy", addr: "Jubilee Hills Check Post", coord: [17.4239, 78.4071] as LatLng },
    { id: "P-003", name: "Mohammed Irfan", addr: "Gachibowli Stadium Rd", coord: [17.4401, 78.3489] as LatLng },
  ],
  hospitals: [
    { id: "H-MED", name: "Medicover Hospital", addr: "Hitech City", coord: [17.4499, 78.3823] as LatLng, beds: 12 },
    { id: "H-CON", name: "Continental Hospital", addr: "Gachibowli", coord: [17.4205, 78.3464] as LatLng, beds: 8 },
    { id: "H-CIT", name: "Citizens Hospital", addr: "Serilingampally", coord: [17.4823, 78.3491] as LatLng, beds: 5 },
  ],
};
