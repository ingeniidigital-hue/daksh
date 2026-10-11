#!/usr/bin/env bash
# Daksh Game BaaS — Standalone Plane Community Edition Launcher
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PLANE_DIR="$ROOT_DIR/deploy/pm/plane"

echo "=========================================================="
echo "  🚀 Starting Daksh Dedicated Plane Community Edition"
echo "=========================================================="

if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed or not in PATH."
    exit 1
fi

cd "$PLANE_DIR"
docker compose up -d

echo ""
echo "✅ Plane Community Edition containers launched successfully!"
echo "🌐 Web Dashboard: http://localhost:8090"
echo "📁 Stories Import File: $ROOT_DIR/tasks/daksh_stories_plane_import.csv"
echo ""
echo "Next Steps:"
echo "1. Open http://localhost:8090 in your browser."
echo "2. Create your workspace (e.g. 'daksh') and project ('Daksh Game BaaS')."
echo "3. Go to Project Settings -> Import -> CSV and select 'tasks/daksh_stories_plane_import.csv' to import all 17 stories instantly."
echo "=========================================================="
