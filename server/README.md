# EARS Routing Middleware (Node.js)

Real-time Dijkstra routing service that the React dashboard connects to via
Socket.io. The browser keeps an offline copy of the same algorithm in
`src/lib/routing.ts` as a fallback, but in production the middleware is the
authoritative router.

## Run

```bash
cd server
npm install
npm start          # listens on :4000
```

The dashboard auto-detects the socket at `ws://localhost:4000` and falls back
to the in-browser Dijkstra if the server is unreachable.

## Wire protocol

```
client → server   "route:request"   { start: [lat,lng], end: [lat,lng] }
server → client   "route:result"    { path, distanceKm, etaMin, nodesExplored }

client → server   "telemetry:push"  { lat, lng, heading, speed }
server → broadcast "telemetry:live" { unit, lat, lng, heading, speed, ts }
```

## Files

| File              | Purpose                                          |
|-------------------|--------------------------------------------------|
| `index.js`        | Express + Socket.io entry point                  |
| `dijkstra.js`     | Pure-JS Dijkstra implementation (mirrors client) |
| `graph.js`        | Hyderabad street-graph nodes + edges             |
| `package.json`    | Dependencies                                     |
