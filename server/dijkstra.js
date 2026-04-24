// Dijkstra shortest-path over the road graph in graph.js.
// Pure ES module — no runtime deps.

import { NODES, ADJ, nearestNode, haversine } from "./graph.js";

function dijkstra(srcId, dstId) {
  const dist = new Map();
  const prev = new Map();
  for (const n of NODES) { dist.set(n.id, Infinity); prev.set(n.id, null); }
  dist.set(srcId, 0);

  const visited = new Set();
  let explored = 0;

  while (visited.size < NODES.length) {
    let u = null, uD = Infinity;
    for (const [id, d] of dist) {
      if (!visited.has(id) && d < uD) { uD = d; u = id; }
    }
    if (u === null || uD === Infinity) break;
    if (u === dstId) break;
    visited.add(u);
    explored++;

    for (const { to, w } of ADJ.get(u)) {
      if (visited.has(to)) continue;
      const nd = uD + w;
      if (nd < (dist.get(to) ?? Infinity)) {
        dist.set(to, nd);
        prev.set(to, u);
      }
    }
  }

  const out = [];
  let cur = dstId;
  while (cur) { out.unshift(cur); cur = prev.get(cur) ?? null; }
  return { nodeIds: out, costKm: dist.get(dstId) ?? Infinity, visited: explored };
}

export function computeRoute(start, end) {
  const s = nearestNode(start);
  const e = nearestNode(end);
  const { nodeIds, visited } = dijkstra(s.id, e.id);

  const nodeCoords = nodeIds.map((id) => {
    const n = NODES.find((x) => x.id === id);
    return [n.lat, n.lng];
  });
  const path = [start, ...nodeCoords, end];

  let distanceKm = 0;
  for (let i = 1; i < path.length; i++) distanceKm += haversine(path[i - 1], path[i]);
  const etaMin = (distanceKm / 45) * 60 * 1.2;

  return { path, distanceKm, etaMin, nodesExplored: visited };
}
