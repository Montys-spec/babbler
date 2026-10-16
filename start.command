#!/bin/bash
# Babbler starter: double-click this file in Finder.
# Starts a small local web server (only reachable from this Mac) and opens the app.
# To stop: close this Terminal window.

cd "$(dirname "$0")" || exit 1

PORT=8000
echo "Babbler läuft auf http://localhost:$PORT"
echo "Zum Beenden dieses Fenster schließen."

# Open the browser a moment after the server has started.
(sleep 1 && open "http://localhost:$PORT") &

python3 -m http.server "$PORT" --bind 127.0.0.1
