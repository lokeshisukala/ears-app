// Bridge from Node middleware → native C++ Dijkstra solver.
// Spawns ./cpp/dijkstra, pipes the graph + query in via stdin, parses JSON stdout.

import { spawn } from "child_process";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
import { NODES, RAW_EDGES, nearestNode, haversine } from "./graph.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BIN = path.join(__dirname, "cpp", "dijkstra");

if (!fs.existsSync(BIN)) {
  console.warn(`[ears] C++ solver not found at ${BIN} — run server/cpp/build.sh`);
}

// Pre-serialise the static graph header (nodes + edges with weights) once.
const GRAPH_HEADER = (() => {
  const lines = [];
  lines.push(`${NODES.length} ${RAW_EDGES.length}`);
  for (const n of NODES) lines.push(`${n.id} ${n.lat} ${n.lng}`);
  for (const [a, b] of RAW_EDGES) {
    const na = NODES.find((n) => n.id === a);
    const nb = NODES.find((n) => n.id === b);
    const w = haversine([na.lat, na.lng], [nb.lat, nb.lng]);
    lines.push(`${a} ${b} ${w}`);
  }
  return lines.join("\n");
})();

function runCppDijkstra(srcId, dstId) {
  return new Promise((resolve, reject) => {
    const proc = spawn(BIN, [], { stdio: ["pipe", "pipe", "pipe"] });
    let out = "";
    let err = "";
    proc.stdout.on("data", (d) => (out += d.toString()));
    proc.stderr.on("data", (d) => (err += d.toString()));
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code !== 0) return reject(new Error(`cpp exited ${code}: ${err}`));
      try {
        resolve(JSON.parse(out));
      } catch (e) {
        reject(new Error(`bad json from cpp: ${out}`));
      }
    });
    proc.stdin.write(`${GRAPH_HEADER}\n${srcId} ${dstId}\n`);
    proc.stdin.end();
  });
}

export async function computeRoute(start, end) {
  const s = nearestNode(start);
  const e = nearestNode(end);
  const { path: nodeIds, visited } = await runCppDijkstra(s.id, e.id);

  const nodeCoords = nodeIds.map((id) => {
    const n = NODES.find((x) => x.id === id);
    return [n.lat, n.lng];
  });
  const fullPath = [start, ...nodeCoords, end];

  let distanceKm = 0;
  for (let i = 1; i < fullPath.length; i++) distanceKm += haversine(fullPath[i - 1], fullPath[i]);
  const etaMin = (distanceKm / 45) * 60 * 1.2;

  return { path: fullPath, distanceKm, etaMin, nodesExplored: visited, engine: "cpp" };
}
