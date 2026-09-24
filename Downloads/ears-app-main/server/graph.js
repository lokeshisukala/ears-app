// Hyderabad street-graph (Madhapur / Hitech City / Gachibowli / Jubilee Hills).
// Mirror of the node/edge set in `src/lib/routing.ts`.

export const NODES = [
  { id: "n01", lat: 17.4486, lng: 78.3908 },
  { id: "n02", lat: 17.4470, lng: 78.3870 },
  { id: "n03", lat: 17.4452, lng: 78.3835 },
  { id: "n04", lat: 17.4435, lng: 78.3772 },
  { id: "n05", lat: 17.4420, lng: 78.3720 },
  { id: "n06", lat: 17.4499, lng: 78.3823 },
  { id: "n07", lat: 17.4530, lng: 78.3780 },
  { id: "n08", lat: 17.4555, lng: 78.3740 },
  { id: "n09", lat: 17.4480, lng: 78.3700 },
  { id: "n10", lat: 17.4440, lng: 78.3650 },
  { id: "n11", lat: 17.4401, lng: 78.3600 },
  { id: "n12", lat: 17.4401, lng: 78.3489 },
  { id: "n13", lat: 17.4350, lng: 78.3540 },
  { id: "n14", lat: 17.4290, lng: 78.3500 },
  { id: "n15", lat: 17.4205, lng: 78.3464 },
  { id: "n16", lat: 17.4310, lng: 78.3650 },
  { id: "n17", lat: 17.4280, lng: 78.3780 },
  { id: "n18", lat: 17.4260, lng: 78.3900 },
  { id: "n19", lat: 17.4239, lng: 78.4071 },
  { id: "n20", lat: 17.4310, lng: 78.4050 },
  { id: "n21", lat: 17.4380, lng: 78.4000 },
  { id: "n22", lat: 17.4420, lng: 78.3960 },
  { id: "n23", lat: 17.4560, lng: 78.3890 },
  { id: "n24", lat: 17.4610, lng: 78.3850 },
  { id: "n25", lat: 17.4680, lng: 78.3700 },
  { id: "n26", lat: 17.4823, lng: 78.3491 },
  { id: "n27", lat: 17.4720, lng: 78.3580 },
  { id: "n28", lat: 17.4150, lng: 78.4200 },
  { id: "n29", lat: 17.4080, lng: 78.4380 },
  { id: "n30", lat: 17.4060, lng: 78.3380 },
];

export const RAW_EDGES = [
  ["n01","n02"],["n02","n03"],["n03","n04"],["n04","n05"],
  ["n01","n06"],["n06","n07"],["n07","n08"],["n08","n25"],
  ["n02","n22"],["n22","n21"],["n21","n20"],["n20","n19"],
  ["n03","n09"],["n09","n10"],["n10","n11"],["n11","n12"],
  ["n12","n13"],["n13","n14"],["n14","n15"],["n13","n16"],
  ["n16","n17"],["n17","n18"],["n18","n19"],["n16","n11"],
  ["n21","n22"],["n22","n06"],["n06","n23"],["n23","n24"],
  ["n24","n25"],["n25","n27"],["n27","n26"],["n23","n07"],
  ["n19","n28"],["n28","n29"],["n14","n30"],["n12","n30"],
  ["n17","n21"],["n09","n22"],
];

export function haversine(a, b) {
  const R = 6371;
  const toRad = (x) => (x * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// adjacency map
export const ADJ = new Map();
for (const n of NODES) ADJ.set(n.id, []);
for (const [a, b] of RAW_EDGES) {
  const na = NODES.find((n) => n.id === a);
  const nb = NODES.find((n) => n.id === b);
  const w = haversine([na.lat, na.lng], [nb.lat, nb.lng]);
  ADJ.get(a).push({ to: b, w });
  ADJ.get(b).push({ to: a, w });
}

export function nearestNode(p) {
  let best = NODES[0], bestD = Infinity;
  for (const n of NODES) {
    const d = haversine(p, [n.lat, n.lng]);
    if (d < bestD) { bestD = d; best = n; }
  }
  return best;
}
