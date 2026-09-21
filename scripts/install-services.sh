#!/usr/bin/env sh
# Install MetroBoard's user-scoped recovery services on the Pi.
set -eu

project_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
target=${METROBOARD_TARGET:-metroboard}
remote_dir=${METROBOARD_REMOTE_DIR:-/home/simon/metroboard}

cd "$project_root"
./scripts/deploy.sh --start
ssh "$target" "mkdir -p /home/simon/.config/systemd/user"
rsync -az "$project_root/systemd/metroboard-server.service" "$project_root/systemd/metroboard-kiosk.service" "$target:/home/simon/.config/systemd/user/"
ssh "$target" "METROBOARD_APP_DIR='$remote_dir' sh -s" <<'REMOTE_COMMAND'
set -eu

for pid_file in "$METROBOARD_APP_DIR/metroboard-server.pid" "$METROBOARD_APP_DIR/metroboard-kiosk.pid"; do
  if [ -f "$pid_file" ]; then
    pid=$(cat "$pid_file")
    if kill -0 "$pid" 2>/dev/null; then
      kill "$pid"
    fi
    rm -f "$pid_file"
  fi
done

systemctl --user daemon-reload
systemctl --user enable --now metroboard-server.service metroboard-kiosk.service
REMOTE_COMMAND

echo "MetroBoard recovery services are installed for the Pi user."
