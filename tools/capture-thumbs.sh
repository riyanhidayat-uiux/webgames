#!/bin/bash
# Membuat gambar kartu (img/<game>.jpg) dari mode pratinjau (?preview=1) tiap game — tangkapan permainan sungguhan.
# Pemakaian:  tools/capture-thumbs.sh [game ...]     (tanpa argumen = semua game yang punya js/99-preview.js)
# Butuh Google Chrome (macOS). Three.js diambil dari tools/vendor/three.min.js (r128) agar tidak butuh internet.
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; TMP="$(mktemp -d)"; CH="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
GAMES=("$@"); [ ${#GAMES[@]} -eq 0 ] && for d in "$ROOT"/*/js/99-preview.js; do GAMES+=("$(basename "$(dirname "$(dirname "$d")")")"); done
mkdir -p "$ROOT/img"
for g in "${GAMES[@]}"; do
  rm -rf "$TMP/$g" "$TMP/shared" "$TMP/three"; cp -R "$ROOT/$g" "$TMP/$g"; cp -R "$ROOT/shared" "$TMP/shared"; mkdir -p "$TMP/three"; cp "$ROOT/tools/vendor/three.min.js" "$TMP/three/three.min.js"
  sed -i '' 's#https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js#../three/three.min.js#' "$TMP/$g/index.html"
  "$CH" --headless=new --use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader --hide-scrollbars --window-size=1280,720 --virtual-time-budget="${BUDGET:-9000}" --screenshot="$TMP/$g.png" "file://$TMP/$g/index.html?preview=1" >/dev/null 2>&1
  sips -s format jpeg -s formatOptions 80 "$TMP/$g.png" --out "$ROOT/img/$g.jpg" >/dev/null && echo "✓ img/$g.jpg"
done
rm -rf "$TMP"
