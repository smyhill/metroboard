# MetroBoard

MetroBoard is a purpose-built Washington Metro departures terminal for a 1280×400 Waveshare touchscreen. It runs a local Node backend and a React/Vite interface; the browser only talks to the local backend.

## Develop on the Mac

```sh
npm install
npm run dev
```

The visual canvas is designed first for a 1280×400 landscape browser viewport. Production builds are static assets:

```sh
npm run build
npm run serve
```

`npm run serve` binds only to `127.0.0.1:4173` and is the same lightweight server used on the Pi. Start it alongside Vite development to proxy `/api` requests locally.

## Enable live WMATA departures

The app starts in clearly marked Bethesda demo-data mode without a key. To enable live predictions and the full station list, create `/home/simon/metroboard/.env` on the Pi with the following single line (use your own WMATA subscription key):

```sh
WMATA_API_KEY=your-key-here
```

The deployment script preserves this file, sources it only for the local server process, and never copies it from the Mac or ships it to the browser. Restart the server with `./scripts/deploy.sh --start` after adding or changing the key. The backend uses official rail prediction and station endpoints, times out upstream requests, caches the last successful result on disk, and labels cached data as stale.

## Deploy to the physical MetroBoard

From the repository root on the Mac:

```sh
./scripts/deploy.sh --start
```

This builds locally, copies only the static production assets and static server to `/home/simon/metroboard` on the configured `metroboard` SSH target, and starts/replaces only the server process tracked in that directory. It makes no changes to display, touch, network, SSH, labwc, or boot configuration.

To also request a temporary Chromium Wayland kiosk launch for this milestone:

```sh
./scripts/deploy.sh --kiosk
```

The kiosk command is intentionally not installed as an autostart service. It can also be run directly on the Pi with:

```sh
/home/simon/metroboard/scripts/kiosk.sh
```

Override the SSH host, remote directory, or port through `METROBOARD_TARGET`, `METROBOARD_REMOTE_DIR`, and `METROBOARD_PORT` respectively.

## Recover after reboot or a process failure

After confirming the kiosk works interactively, install the optional user-scoped recovery services:

```sh
./scripts/install-services.sh
```

They restart MetroBoard’s local backend after boot or failure, wait for it before launching Chromium, and restart Chromium if it exits. They do not alter labwc, display rotation, touch, network, SSH, or system-wide services.
