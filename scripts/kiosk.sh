#!/usr/bin/env sh
# Run on the Pi (or over SSH) after the static server is available locally.
set -eu

url=${METROBOARD_URL:-http://127.0.0.1:4173/?kiosk=1}
runtime_dir=${XDG_RUNTIME_DIR:-/run/user/$(id -u)}

export XDG_RUNTIME_DIR="$runtime_dir"

if [ -z "${WAYLAND_DISPLAY:-}" ]; then
  set -- "$XDG_RUNTIME_DIR"/wayland-*
  if [ ! -S "$1" ]; then
    echo "No Wayland display socket found in $XDG_RUNTIME_DIR." >&2
    exit 1
  fi
  export WAYLAND_DISPLAY=${1##*/}
fi

exec chromium \
  --ozone-platform=wayland \
  --kiosk \
  --noerrdialogs \
  --disable-session-crashed-bubble \
  "$url"
