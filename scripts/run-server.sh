#!/usr/bin/env sh
# Runtime entrypoint shared by the manual deploy flow and the user service.
set -eu

app_dir=${METROBOARD_APP_DIR:-/home/simon/metroboard}

if [ -f "$app_dir/.env" ]; then
  set -a
  . "$app_dir/.env"
  set +a
fi

exec env METROBOARD_PORT="${METROBOARD_PORT:-4173}" node "$app_dir/server/static-server.mjs"
