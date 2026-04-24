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

app.post("/route", (req, res) => {
  const { start, end } = req.body ?? {};
  if (!Array.isArray(start) || !Array.isArray(end)) {
    return res.status(400).json({ error: "start and end must be [lat,lng] arrays" });
  }
  const t0 = performance.now();
  const result = computeRoute(start, end);
  const tookMs = +(performance.now() - t0).toFixed(2);
  res.json({ ...result, tookMs });
});

// ── Socket.io realtime ─────────────────────────────────────────────
const httpServer = http.createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

io.on("connection", (socket) => {
  console.log(`[ears] client connected: ${socket.id}`);

  socket.on("route:request", ({ start, end }) => {
    if (!Array.isArray(start) || !Array.isArray(end)) {
      socket.emit("route:error", { message: "Invalid coordinates" });
      return;
    }
    const t0 = performance.now();
    const result = computeRoute(start, end);
    const tookMs = +(performance.now() - t0).toFixed(2);
    console.log(`[ears] route ${start} → ${end}  (${result.nodesExplored} nodes, ${tookMs}ms)`);
    socket.emit("route:result", { ...result, tookMs });
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
