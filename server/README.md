# EARS Routing Middleware (Node.js + C++ backend)

The actual Dijkstra solver is written in **C++17** (`server/cpp/dijkstra.cpp`).
The Node.js layer (`server/index.js`) only handles HTTP/Socket.io transport — it
spawns the compiled `cpp/dijkstra` binary per request, pipes the graph + query
into stdin, and parses the JSON result from stdout.

The browser keeps an offline JS Dijkstra in `src/lib/routing.ts` purely as a
fallback when the middleware is unreachable.

## Build & run

```bash
cd server
bash cpp/build.sh   # compiles cpp/dijkstra (needs g++ or clang++ with C++17)
npm install
npm start           # listens on :4000
```

If you change `cpp/dijkstra.cpp`, re-run `bash cpp/build.sh`.

## Wire protocol (browser ↔ middleware)

```
client → server   "route:request"   { start: [lat,lng], end: [lat,lng] }
server → client   "route:result"    { path, distanceKm, etaMin, nodesExplored, engine: "cpp" }

client → server   "telemetry:push"  { lat, lng, heading, speed }
server → broadcast "telemetry:live" { unit, lat, lng, heading, speed, ts }
```

## Internal protocol (Node ↔ C++ binary, over stdio)

```
N M
id_0 lat_0 lng_0
...
id_{N-1} lat lng
a_0 b_0 w_0
...
a_{M-1} b_{M-1} w_{M-1}
src_id dst_id
```

The binary replies with one line of JSON:

```json
{"costKm": 7.42, "visited": 18, "path": ["n03", "n09", "..."]}
```

## Files

| File              | Purpose                                                    |
|-------------------|------------------------------------------------------------|
| `cpp/dijkstra.cpp`| C++17 priority-queue Dijkstra, reads stdin / writes JSON   |
| `cpp/build.sh`    | Build script (`g++ -std=c++17 -O2`)                        |
| `dijkstra.js`     | Node bridge that spawns the C++ binary                     |
| `graph.js`        | Hyderabad street-graph nodes + edges (shared with client)  |
| `index.js`        | Express + Socket.io entry point                            |
| `package.json`    | Node dependencies                                          |
