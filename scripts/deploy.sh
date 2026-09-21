#!/usr/bin/env sh
# Build on the Mac and deploy static assets to the MetroBoard Pi.
set -eu

project_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
target=${METROBOARD_TARGET:-metroboard}
remote_dir=${METROBOARD_REMOTE_DIR:-/home/simon/metroboard}
port=${METROBOARD_PORT:-4173}
start_server=0
launch_kiosk=0

for option in "$@"; do
  case "$option" in
    --start) start_server=1 ;;
    --kiosk) start_server=1; launch_kiosk=1 ;;
    *) echo "Usage: $0 [--start|--kiosk]" >&2; exit 2 ;;
  esac
done

cd "$project_root"
npm run build

ssh "$target" "mkdir -p '$remote_dir/dist' '$remote_dir/server' '$remote_dir/scripts'"
rsync -az --delete "$project_root/dist/" "$target:$remote_dir/dist/"
rsync -az --delete "$project_root/server/" "$target:$remote_dir/server/"
rsync -az "$project_root/scripts/kiosk.sh" "$project_root/scripts/run-server.sh" "$target:$remote_dir/scripts/"
ssh "$target" "chmod 755 '$remote_dir/scripts/kiosk.sh' '$remote_dir/scripts/run-server.sh'"

if [ "$start_server" -eq 1 ]; then
  ssh "$target" "METROBOARD_PORT='$port' METROBOARD_APP_DIR='$remote_dir' sh -s" <<'REMOTE_COMMAND'
set -eu
pid_file="$METROBOARD_APP_DIR/metroboard-server.pid"
log_file="$METROBOARD_APP_DIR/metroboard-server.log"

if [ -f "$pid_file" ]; then
  previous_pid=$(cat "$pid_file")
  if kill -0 "$previous_pid" 2>/dev/null; then
    kill "$previous_pid"
    attempts=0
    while kill -0 "$previous_pid" 2>/dev/null && [ "$attempts" -lt 20 ]; do
      sleep 1
      attempts=$((attempts + 1))
    done
  fi
fi

if [ -f "$METROBOARD_APP_DIR/.env" ]; then
  set -a
  . "$METROBOARD_APP_DIR/.env"
  set +a
fi

nohup env METROBOARD_PORT="$METROBOARD_PORT" METROBOARD_APP_DIR="$METROBOARD_APP_DIR" "$METROBOARD_APP_DIR/scripts/run-server.sh" >"$log_file" 2>&1 &
echo $! >"$pid_file"
REMOTE_COMMAND
  echo "MetroBoard is serving locally on $target at http://127.0.0.1:$port"
fi

if [ "$launch_kiosk" -eq 1 ]; then
  ssh "$target" "METROBOARD_APP_DIR='$remote_dir' sh -s" <<'REMOTE_COMMAND'
set -eu
pid_file="$METROBOARD_APP_DIR/metroboard-kiosk.pid"

if [ -f "$pid_file" ]; then
  previous_pid=$(cat "$pid_file")
  if kill -0 "$previous_pid" 2>/dev/null; then
    kill "$previous_pid"
  fi
fi

nohup "$METROBOARD_APP_DIR/scripts/kiosk.sh" >"$METROBOARD_APP_DIR/kiosk.log" 2>&1 &
echo $! >"$pid_file"
REMOTE_COMMAND
  echo "Chromium kiosk launch requested on $target."
fi

echo "Deployed MetroBoard assets to $target:$remote_dir"
