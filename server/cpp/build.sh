#!/usr/bin/env bash
# Build the EARS C++ Dijkstra solver. Requires g++ or clang++ with C++17.
set -euo pipefail
cd "$(dirname "$0")"
CXX="${CXX:-g++}"
"$CXX" -std=c++17 -O2 -Wall -Wextra -o dijkstra dijkstra.cpp
echo "✓ built $(pwd)/dijkstra"
