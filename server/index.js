// EARS Routing & Telemetry Middleware
// ───────────────────────────────────
// Express + Socket.io server that exposes Dijkstra route computation and
// broadcasts vehicle telemetry to all connected dashboards.
//
// Start:   npm install && npm start
// Listens: http://localhost:4000

import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import { computeRoute } from "./dijkstra.js";

const PORT = process.env.PORT || 4000;

const app = express();
app.use(cors());
app.use(express.json());

// ── REST fallback (curl / debug) ────────────────────────────────────
app.get("/health", (_req, res) => res.json({ ok: true, service: "ears-routing", uptime: process.uptime() }));

app.post("/route", async (req, res) => {
  const { start, end } = req.body ?? {};
  if (!Array.isArray(start) || !Array.isArray(end)) {
    return res.status(400).json({ error: "start and end must be [lat,lng] arrays" });
  }
  try {
    const t0 = performance.now();
    const result = await computeRoute(start, end);
    const tookMs = +(performance.now() - t0).toFixed(2);
    res.json({ ...result, tookMs });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
});

// ── Socket.io realtime ─────────────────────────────────────────────
const httpServer = http.createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

io.on("connection", (socket) => {
  console.log(`[ears] client connected: ${socket.id}`);

  socket.on("route:request", async ({ start, end }) => {
    if (!Array.isArray(start) || !Array.isArray(end)) {
      socket.emit("route:error", { message: "Invalid coordinates" });
      return;
    }
    try {
      const t0 = performance.now();
      const result = await computeRoute(start, end);
      const tookMs = +(performance.now() - t0).toFixed(2);
      console.log(`[ears] route ${start} → ${end}  (cpp, ${result.nodesExplored} nodes, ${tookMs}ms)`);
      socket.emit("route:result", { ...result, tookMs });
    } catch (e) {
      socket.emit("route:error", { message: String(e.message || e) });
    }
  });

  socket.on("telemetry:push", (payload) => {
    // re-broadcast to every other dashboard so multi-driver views stay in sync
    socket.broadcast.emit("telemetry:live", { ...payload, ts: Date.now() });
  });

  socket.on("disconnect", () => console.log(`[ears] client disconnected: ${socket.id}`));
});

httpServer.listen(PORT, () => {
  console.log(`╭──────────────────────────────────────────────╮`);
  console.log(`│  EARS Routing Middleware                     │`);
  console.log(`│  http://localhost:${PORT}  ·  ws://localhost:${PORT}  │`);
  console.log(`╰──────────────────────────────────────────────╯`);
});
