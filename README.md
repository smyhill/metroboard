# MetroBoard

MetroBoard is a purpose-built Washington Metro departures terminal for a 1280×400 Waveshare touchscreen. This first milestone is a static React/Vite interface with clearly isolated Bethesda Red Line development fixtures; it does not call WMATA yet.

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

`npm run serve` binds only to `127.0.0.1:4173` and is the same lightweight static server used on the Pi.

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
