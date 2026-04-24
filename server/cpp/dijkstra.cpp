// EARS Dijkstra backend (C++17)
// ─────────────────────────────
// Reads a JSON-ish payload from stdin describing the graph, source, and target.
// Writes a JSON result to stdout: { "path": [id...], "costKm": <num>, "visited": <int> }.
//
// Wire format (one line, no spaces required):
//   N M S T
//   id_0 lat_0 lng_0
//   ...
//   id_{N-1} lat lng
//   a_0 b_0 w_0
//   ...
//   a_{M-1} b_{M-1} w_{M-1}
//   src_id dst_id
//
// We keep the protocol space-separated to avoid pulling in a JSON lib; the Node
// middleware serialises/parses around this binary.

#include <algorithm>
#include <cstdint>
#include <iostream>
#include <limits>
#include <queue>
#include <string>
#include <unordered_map>
#include <vector>

struct Edge {
    int to;
    double w;
};

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int N = 0, M = 0;
    if (!(std::cin >> N >> M)) {
        std::cerr << "bad header\n";
        return 1;
    }

    std::vector<std::string> ids(N);
    std::unordered_map<std::string, int> idx;
    idx.reserve(N * 2);

    for (int i = 0; i < N; ++i) {
        std::string id;
        double lat, lng;
        std::cin >> id >> lat >> lng;  // lat/lng currently unused server-side
        ids[i] = id;
        idx.emplace(id, i);
        (void)lat; (void)lng;
    }

    std::vector<std::vector<Edge>> adj(N);
    for (int i = 0; i < M; ++i) {
        std::string a, b;
        double w;
        std::cin >> a >> b >> w;
        auto ia = idx.find(a);
        auto ib = idx.find(b);
        if (ia == idx.end() || ib == idx.end()) continue;
        adj[ia->second].push_back({ib->second, w});
        adj[ib->second].push_back({ia->second, w});
    }

    std::string srcId, dstId;
    std::cin >> srcId >> dstId;
    auto itS = idx.find(srcId);
    auto itD = idx.find(dstId);
    if (itS == idx.end() || itD == idx.end()) {
        std::cout << "{\"error\":\"unknown node\"}";
        return 0;
    }
    const int s = itS->second, t = itD->second;

    const double INF = std::numeric_limits<double>::infinity();
    std::vector<double> dist(N, INF);
    std::vector<int> prev(N, -1);
    dist[s] = 0.0;

    using PQItem = std::pair<double, int>;  // (distance, node)
    std::priority_queue<PQItem, std::vector<PQItem>, std::greater<PQItem>> pq;
    pq.push({0.0, s});

    int explored = 0;
    std::vector<char> done(N, 0);

    while (!pq.empty()) {
        auto [d, u] = pq.top();
        pq.pop();
        if (done[u]) continue;
        done[u] = 1;
        ++explored;
        if (u == t) break;
        for (const auto& e : adj[u]) {
            if (done[e.to]) continue;
            double nd = d + e.w;
            if (nd < dist[e.to]) {
                dist[e.to] = nd;
                prev[e.to] = u;
                pq.push({nd, e.to});
            }
        }
    }

    // Reconstruct path
    std::vector<int> rev;
    if (dist[t] != INF) {
        for (int cur = t; cur != -1; cur = prev[cur]) rev.push_back(cur);
        std::reverse(rev.begin(), rev.end());
    }

    // Emit JSON manually (no deps).
    std::cout << "{\"costKm\":";
    if (dist[t] == INF) std::cout << "null";
    else std::cout << dist[t];
    std::cout << ",\"visited\":" << explored << ",\"path\":[";
    for (size_t i = 0; i < rev.size(); ++i) {
        if (i) std::cout << ",";
        std::cout << "\"" << ids[rev[i]] << "\"";
    }
    std::cout << "]}";
    return 0;
}
