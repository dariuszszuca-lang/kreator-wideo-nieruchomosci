#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Sprawdz node_modules
if [ ! -d "node_modules" ]; then
  echo "Instaluje zależności Remotion..."
  npm install
fi

# Sprawdz Python dependencies
pip3 install -q -r requirements.txt 2>/dev/null

echo ""
echo "=================================================="
echo "  KREATOR WIDEO NIERUCHOMOSCI"
echo "  http://localhost:5558"
echo "=================================================="
echo ""

(sleep 1 && open http://localhost:5558) &

python3 server.py
