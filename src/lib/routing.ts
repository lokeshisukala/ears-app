/**
 * Dijkstra Routing Engine (browser implementation).
 *
 * This is the SAME algorithm that runs in the Node.js middleware
 * (`server/dijkstra.js`) — the middleware is the production path,
 * and this client copy is the offline fallback used inside the
 * browser preview when the socket server is not reachable.
 *
 * Graph model
 * ───────────
 * • Nodes  = { id, lat, lng }            (intersections)
 * • Edges  = { a, b, weight }            (road segments, weight = km × traffic)
 * • Path   = sequence of node coords     (rendered as polyline)
 *
 * The street graph below is a hand-authored sub-network of Madhapur /
 * Hitech City / Gachibowli covering ~30 intersections — enough nodes for
 * Dijkstra to produce visibly different routes for different OD pairs.
 */

export type LatLng = [number, number];

export interface RouteResult {
  path: LatLng[];
  distanceKm: number;
  etaMin: number;
  nodesExplored: number; // for the toast / debug HUD
}

/* ────────────────────────────  GRAPH  ──────────────────────────── */

interface GNode { id: string; lat: number; lng: number }
interface GEdge { a: string; b: string; w: number } // w = km

// 30 intersections roughly matching real road geometry in west Hyderabad
const NODES: GNode[] = [
  { id: "n01", lat: 17.4486, lng: 78.3908 }, // Madhapur base
  { id: "n02", lat: 17.4470, lng: 78.3870 },
  { id: "n03", lat: 17.4452, lng: 78.3835 },
  { id: "n04", lat: 17.4435, lng: 78.3772 }, // ≈ patient P-001
  { id: "n05", lat: 17.4420, lng: 78.3720 },
  { id: "n06", lat: 17.4499, lng: 78.3823 }, // ≈ Medicover
  { id: "n07", lat: 17.4530, lng: 78.3780 },
  { id: "n08", lat: 17.4555, lng: 78.3740 },
  { id: "n09", lat: 17.4480, lng: 78.3700 },
  { id: "n10", lat: 17.4440, lng: 78.3650 },
  { id: "n11", lat: 17.4401, lng: 78.3600 },
  { id: "n12", lat: 17.4401, lng: 78.3489 }, // ≈ patient P-003
  { id: "n13", lat: 17.4350, lng: 78.3540 },
  { id: "n14", lat: 17.4290, lng: 78.3500 },
  { id: "n15", lat: 17.4205, lng: 78.3464 }, // ≈ Continental
  { id: "n16", lat: 17.4310, lng: 78.3650 },
  { id: "n17", lat: 17.4280, lng: 78.3780 },
  { id: "n18", lat: 17.4260, lng: 78.3900 },
  { id: "n19", lat: 17.4239, lng: 78.4071 }, // ≈ patient P-002
  { id: "n20", lat: 17.4310, lng: 78.4050 },
  { id: "n21", lat: 17.4380, lng: 78.4000 },
  { id: "n22", lat: 17.4420, lng: 78.3960 },
  { id: "n23", lat: 17.4560, lng: 78.3890 }, // ≈ KIMS
  { id: "n24", lat: 17.4610, lng: 78.3850 },
  { id: "n25", lat: 17.4680, lng: 78.3700 },
  { id: "n26", lat: 17.4823, lng: 78.3491 }, // ≈ Citizens
  { id: "n27", lat: 17.4720, lng: 78.3580 },
  { id: "n28", lat: 17.4150, lng: 78.4200 }, // ≈ Apollo Jubilee
  { id: "n29", lat: 17.4080, lng: 78.4380 }, // ≈ Care Banjara
  { id: "n30", lat: 17.4060, lng: 78.3380 }, // ≈ AIG Gachibowli
];

const RAW_EDGES: [string, string][] = [
  ["n01", "n02"], ["n02", "n03"], ["n03", "n04"], ["n04", "n05"],
  ["n01", "n06"], ["n06", "n07"], ["n07", "n08"], ["n08", "n25"],
  ["n02", "n22"], ["n22", "n21"], ["n21", "n20"], ["n20", "n19"],
  ["n03", "n09"], ["n09", "n10"], ["n10", "n11"], ["n11", "n12"],
  ["n12", "n13"], ["n13", "n14"], ["n14", "n15"], ["n13", "n16"],
  ["n16", "n17"], ["n17", "n18"], ["n18", "n19"], ["n16", "n11"],
  ["n21", "n22"], ["n22", "n06"], ["n06", "n23"], ["n23", "n24"],
  ["n24", "n25"], ["n25", "n27"], ["n27", "n26"], ["n23", "n07"],
  ["n19", "n28"], ["n28", "n29"], ["n14", "n30"], ["n12", "n30"],
  ["n17", "n21"], ["n09", "n22"],
];

function haversine(a: LatLng, b: LatLng): number {
  const R = 6371;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const EDGES: GEdge[] = RAW_EDGES.map(([a, b]) => {
  const na = NODES.find((n) => n.id === a)!;
  const nb = NODES.find((n) => n.id === b)!;
  return { a, b, w: haversine([na.lat, na.lng], [nb.lat, nb.lng]) };
});

// adjacency map (built once)
const ADJ = new Map<string, { to: string; w: number }[]>();
for (const n of NODES) ADJ.set(n.id, []);
for (const e of EDGES) {
  ADJ.get(e.a)!.push({ to: e.b, w: e.w });
  ADJ.get(e.b)!.push({ to: e.a, w: e.w });
}

function nearestNode(p: LatLng): GNode {
  let best = NODES[0];
  let bestD = Infinity;
  for (const n of NODES) {
    const d = haversine(p, [n.lat, n.lng]);
    if (d < bestD) { bestD = d; best = n; }
  }
  return best;
}

/* ────────────────────────────  DIJKSTRA  ──────────────────────────── */

interface DijkstraOut {
  nodeIds: string[];
  costKm: number;
  visited: number;
}

function dijkstra(srcId: string, dstId: string): DijkstraOut {
  const dist = new Map<string, number>();
  const prev = new Map<string, string | null>();
  for (const n of NODES) { dist.set(n.id, Infinity); prev.set(n.id, null); }
  dist.set(srcId, 0);

  // simple priority array (graph is small — O(V²) is fine and matches the
  // reference C++ implementation referenced in the README)
  const visited = new Set<string>();
  let explored = 0;

  while (visited.size < NODES.length) {
    // pick unvisited node with smallest dist
    let u: string | null = null;
    let uD = Infinity;
    for (const [id, d] of dist) {
      if (!visited.has(id) && d < uD) { uD = d; u = id; }
    }
    if (u === null || uD === Infinity) break;
    if (u === dstId) break;
    visited.add(u);
    explored++;

    for (const { to, w } of ADJ.get(u)!) {
      if (visited.has(to)) continue;
      const nd = uD + w;
      if (nd < (dist.get(to) ?? Infinity)) {
        dist.set(to, nd);
        prev.set(to, u);
      }
    }
  }

  // reconstruct
  const out: string[] = [];
  let cur: string | null = dstId;
  while (cur) { out.unshift(cur); cur = prev.get(cur) ?? null; }
  return { nodeIds: out, costKm: dist.get(dstId) ?? Infinity, visited: explored };
}

/* ────────────────────────────  PUBLIC API  ──────────────────────────── */

export function computeRoute(start: LatLng, end: LatLng, _seed = 42): RouteResult {
  const s = nearestNode(start);
  const e = nearestNode(end);
  const { nodeIds, costKm, visited } = dijkstra(s.id, e.id);

  // build polyline: actual start → nodes → actual end
  const nodeCoords: LatLng[] = nodeIds.map((id) => {
    const n = NODES.find((x) => x.id === id)!;
    return [n.lat, n.lng];
  });
  const path: LatLng[] = [start, ...nodeCoords, end];

  // recompute true distance including stub legs
  let distanceKm = 0;
  for (let i = 1; i < path.length; i++) distanceKm += haversine(path[i - 1], path[i]);

  // ETA: 45 km/h base, +20% traffic
  const etaMin = (distanceKm / 45) * 60 * 1.2;

  return { path, distanceKm, etaMin, nodesExplored: visited };
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

/* ────────────────────────────  DEMO DATASET  ──────────────────────────── */
// Hyderabad — Madhapur / Hitech City / Gachibowli / Jubilee Hills cluster.
// 8 hospitals so Dijkstra has multiple candidates to choose from.

export const DEMO = {
  base: [17.4486, 78.3908] as LatLng,
  patients: [
    { id: "P-001", name: "Aarav Sharma",      addr: "Hitech City Main Rd, Madhapur",  coord: [17.4435, 78.3772] as LatLng },
    { id: "P-002", name: "Lakshmi Reddy",     addr: "Jubilee Hills Check Post",       coord: [17.4239, 78.4071] as LatLng },
    { id: "P-003", name: "Mohammed Irfan",    addr: "Gachibowli Stadium Rd",          coord: [17.4401, 78.3489] as LatLng },
    { id: "P-004", name: "Sneha Iyer",        addr: "Kondapur Junction",              coord: [17.4620, 78.3650] as LatLng },
    { id: "P-005", name: "Vikram Naidu",      addr: "Banjara Hills Rd-12",            coord: [17.4080, 78.4380] as LatLng },
  ],
  hospitals: [
    { id: "H-MED", name: "Medicover Hospital",     addr: "Hitech City",       coord: [17.4499, 78.3823] as LatLng, beds: 12 },
    { id: "H-CON", name: "Continental Hospital",   addr: "Gachibowli",        coord: [17.4205, 78.3464] as LatLng, beds: 8  },
    { id: "H-CIT", name: "Citizens Hospital",      addr: "Serilingampally",   coord: [17.4823, 78.3491] as LatLng, beds: 5  },
    { id: "H-KIM", name: "KIMS Hospital",          addr: "Kondapur",          coord: [17.4560, 78.3890] as LatLng, beds: 18 },
    { id: "H-APL", name: "Apollo Hospital",        addr: "Jubilee Hills",     coord: [17.4150, 78.4200] as LatLng, beds: 22 },
    { id: "H-AIG", name: "AIG Hospitals",          addr: "Gachibowli",        coord: [17.4060, 78.3380] as LatLng, beds: 30 },
    { id: "H-CAR", name: "Care Hospital",          addr: "Banjara Hills",     coord: [17.4080, 78.4380] as LatLng, beds: 14 },
    { id: "H-SUN", name: "Sunshine Hospital",      addr: "Gachibowli",        coord: [17.4290, 78.3500] as LatLng, beds: 9  },
  ],
};
