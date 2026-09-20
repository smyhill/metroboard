# AGENTS.md — MetroBoard

## Project Overview

MetroBoard is a dedicated physical Washington Metro real-time departure
terminal built around a Raspberry Pi and a 7.9-inch touchscreen.

This is not intended to feel like a generic web dashboard displayed on a
Raspberry Pi.

The goal is to build a polished physical transit appliance that feels like it
could plausibly exist inside a Washington Metro station while also having a
subtle retro-terminal / cyberpunk character.

MetroBoard should combine:

- real-time WMATA rail data
- a purpose-built 1280×400 touchscreen interface
- Washington Metro visual language
- amber/orange transit-display aesthetics
- physical hardware integration
- kiosk-style appliance behavior
- high reliability and graceful degradation

The default station is Bethesda (`A09`) on the Red Line.

The project is primarily developed on macOS and deployed to a Raspberry Pi
runtime target.

---

# Product Philosophy

MetroBoard should feel like a piece of transit infrastructure, not a website.

When making product, UI, or architectural decisions, favor:

1. glanceability
2. reliability
3. information density
4. tactile/appliance-like behavior
5. Metro/transit authenticity
6. restrained retro-futurism
7. maintainable engineering

The application will normally sit on a desk or shelf and remain running for
long periods of time.

A user should be able to glance at it from across a room and immediately
understand when the next trains are arriving.

Touch interaction should be simple enough that the application never requires
a keyboard or mouse during normal operation.

Avoid unnecessary features simply because this is implemented using web
technology.

---

# Primary Visual Reference

The authoritative visual reference is:

`docs/design/metroboard-reference.png`

Agents working on UI should inspect this image before making substantial visual
changes.

Treat the reference as art direction rather than a literal screenshot to
reproduce pixel-for-pixel.

The production interface must consist of real HTML/CSS/React UI elements.
Do NOT simply use the reference image as a background or bake information into
static images.

The reference establishes the visual language of the product.

---

# Visual Direction

The intended aesthetic is:

**Washington Metro station equipment meets retro computer terminal meets
restrained cyberpunk interface.**

The UI should look believable as equipment that might actually exist inside a
Metro station.

It should NOT look like:

- a generic SaaS dashboard
- a tablet application
- a mobile application enlarged to fit the screen
- a collection of modern rounded cards
- a gaming HUD
- an exaggerated sci-fi interface
- neon cyberpunk artwork
- a normal website with a retro font applied to it

The cyberpunk influence should be subtle and emerge from the terminal-like
presentation rather than excessive decoration.

---

# Color Language

The primary interface should use:

- nearly black / charcoal background
- warm amber-orange foreground
- restrained secondary dark-orange tones
- very limited use of white or gray where necessary

The amber/orange should evoke the electronic information displays used in
Washington Metro stations.

The orange should feel emitted by a display rather than painted onto a modern
web interface.

Appropriate effects include:

- extremely subtle glow
- subtle phosphor appearance
- subtle scanlines
- subtle dot-matrix texture
- low-intensity illuminated borders

These effects must never interfere with readability.

Avoid excessive bloom, gradients, shadows, or glowing effects.

---

# Typography

Typography should evoke:

- transit information systems
- LED/dot-matrix displays
- old computer terminals
- industrial signage

Display typography may use an appropriate pixel, terminal, or dot-matrix style.

Readability takes priority over aesthetic authenticity.

Large arrival times and destination names must remain readable from several
feet away.

Small metadata can use a cleaner monospace face if necessary.

Avoid fonts that feel cartoonish, arcade-like, or excessively stylized.

---

# Main Departures Screen

The main screen should broadly follow the composition shown in:

`docs/design/metroboard-reference.png`

Important visual elements include:

- Metro identity / mark area
- large station name
- `DEPARTURES` label
- current date and time
- rail-line navigation
- destination column
- arrival-time / minutes column
- track/platform information when useful and reliable
- right-side Metro train illustration
- Washington, DC skyline treatment
- `REAL TIME DEPARTURES`
- `WASHINGTON METROPOLITAN AREA TRANSIT AUTHORITY`

Do not introduce marketing slogans, inspirational text, or decorative prose.

The earlier design concepts included phrases such as marketing taglines.
Those are explicitly NOT part of the final design direction.

`REAL TIME DEPARTURES` should remain.

The full text:

`WASHINGTON METROPOLITAN AREA TRANSIT AUTHORITY`

should remain beneath the Washington skyline treatment where practical.

---

# Physical Display

Target hardware:

**Waveshare 7.9-inch capacitive touchscreen**

Native panel resolution:

`400 × 1280`

The display is physically rotated and used in landscape orientation.

The effective application canvas is therefore:

**1280 × 400**

This resolution is a first-class product constraint.

Design for 1280×400 FIRST.

Do not treat MetroBoard primarily as a responsive website.

The interface may behave reasonably at other resolutions for development
convenience, but decisions should always prioritize the physical 1280×400
display.

There should be no vertical scrolling on primary screens.

There should normally be no horizontal scrolling.

Important controls must fit comfortably within this canvas.

---

# Touch Interaction

The Waveshare display supports capacitive touch.

Touch has already been configured and tested successfully on the physical
device.

All four corners correctly align with the rotated display.

Do not add touchscreen calibration or coordinate transforms unless an actual
problem is observed.

Interactive elements must have practical touch targets.

Do not make controls tiny simply to preserve the visual aesthetic.

The interface should be usable entirely through touch during normal operation.

---

# Primary Navigation

The departures screen should provide access to WMATA rail lines:

- Red
- Orange
- Blue
- Silver
- Green
- Yellow

The visual treatment should remain consistent with the terminal/transit
aesthetic.

The currently selected line should be visually obvious.

The default state is:

- Station: Bethesda
- Station code: A09
- Line: Red

Touching/changing lines should allow the user to navigate to stations belonging
to that line.

---

# Station Selection

MetroBoard should eventually provide a touch-friendly station-selection screen.

Expected interaction:

1. Select a Metro line.
2. View stations served by that line.
3. Select a station.
4. Return immediately to departures for that station.

Station data should be represented canonically rather than duplicated once per
line.

Transfer stations may belong to multiple lines.

The data model must support this cleanly.

Do not encode station relationships directly into UI components.

---

# Real-Time Data

The authoritative data source should be the official WMATA API.

Expected information includes:

- real-time rail predictions
- station information
- rail lines
- service incidents
- elevator/escalator status where useful

Default station:

`Bethesda — A09`

Never expose the WMATA API key in client-side JavaScript.

The browser should communicate with the local MetroBoard backend.

The backend should communicate with WMATA.

Use an environment variable such as:

`WMATA_API_KEY`

Secrets must not be committed to Git.

`.env` files containing real credentials must be ignored.

---

# Data Reliability

MetroBoard is an always-on information appliance.

Network and API failures must not turn the display into a broken webpage.

The application should eventually support:

- periodic automatic refresh
- request timeouts
- cached last-known-good departures
- visible stale-data state
- connectivity state
- graceful WMATA API failure
- graceful local network failure
- sensible retry behavior

If fresh data cannot be obtained, displaying slightly stale data with a clear
indicator is preferable to displaying nothing.

Never present stale information as fresh.

---

# Initial Development Milestone

Do NOT begin by implementing every feature.

The first milestone is:

**Render the static main departures interface on the physical 1280×400
MetroBoard display using representative fake data.**

Example development data:

- Bethesda
- Red Line
- Shady Grove — 2 MIN
- Glenmont — 5 MIN
- Shady Grove — 12 MIN
- Glenmont — 20 MIN

The purpose of this milestone is to validate:

- layout
- typography
- spacing
- physical readability
- touch target sizing
- rendering performance
- Chromium kiosk behavior
- overall visual character

Do not prematurely optimize the UI around API response structures.

First make the physical object look and feel correct.

---

# Application Architecture

Preferred high-level architecture:

    WMATA API
        |
        v
    MetroBoard local backend
        |
        v
    local HTTP API
        |
        v
    React UI
        |
        v
    Chromium kiosk
        |
        v
    1280×400 Waveshare touchscreen

The browser must not directly own secrets.

Keep the architecture lightweight.

This device has limited resources and does not need unnecessary infrastructure.

---

# Frontend

Preferred frontend stack:

- React
- TypeScript
- Vite
- CSS

Avoid introducing a large UI framework unless there is a compelling reason.

In particular, avoid dependencies whose primary purpose is creating generic
dashboard/card interfaces.

Custom CSS is preferred for the main MetroBoard interface because the visual
identity is intentionally specialized.

The frontend should ultimately be built on the Mac and deployed as static
production assets.

Avoid running a Vite development server continuously on the Raspberry Pi in
production.

---

# Backend

The backend should be lightweight Node.js.

Its responsibilities should eventually include:

- serving the production frontend
- communicating with WMATA
- protecting the WMATA API key
- normalizing upstream responses
- caching useful data
- reporting connectivity/data freshness
- exposing simple local endpoints to the frontend

Do not introduce a database unless a concrete requirement emerges.

Do not introduce Docker unless a concrete benefit emerges.

Do not introduce Redis, message queues, or other infrastructure inappropriate
for a single-device appliance.

Favor boring, reliable components.

---

# Runtime Hardware

Production/runtime target:

**Raspberry Pi 3 Model B+**

Architecture:

`aarch64`

Operating system:

Debian GNU/Linux 13 (trixie) / Raspberry Pi OS environment

Kernel observed during setup:

`6.18.50+rpt-rpi-v8`

Approximate RAM:

`~1 GB`

Storage observed during setup:

`~29 GB root filesystem`

The Pi is resource constrained compared with the development Mac.

Treat memory and CPU consumption accordingly.

---

# Runtime Software

Known runtime software:

- Git 2.47.x
- Node.js 20.19.2
- npm 9.2.0
- Chromium 153.x
- labwc / Wayland
- wlr-randr

Do not replace system components or install alternate runtimes without a
specific reason.

Node 20 is currently sufficient for the intended runtime.

---

# Display / Wayland Configuration

The physical HDMI output is:

`HDMI-A-1`

The panel advertises its native mode as:

`400x1280`

The desktop compositor is:

`labwc`

The display is rotated 90 degrees using `wlr-randr`.

The effective application orientation is:

`1280x400 landscape`

Persistent rotation is configured through the user's labwc autostart.

A working command is:

    wlr-randr --output HDMI-A-1 --transform 90

Do not modify display rotation configuration unless necessary.

The display configuration is already known-good.

---

# Touch Hardware

Touch device observed by Linux:

`WaveShare WaveShare`

USB device ID observed during setup:

`0712:000a`

Touch works correctly after display rotation.

No additional touch transform is currently required.

---

# Raspberry Pi Networking

Hostname:

`metroboard`

Primary SSH alias from the development Mac:

    ssh metroboard

The SSH alias resolves to:

`metroboard.local`

Runtime user:

`simon`

Passwordless public-key authentication from the development Mac has already
been configured and tested.

Agents may use:

    ssh metroboard

when physical-device inspection, deployment, or runtime testing is appropriate.

Do not request, inspect, copy, print, modify, or expose the developer's private
SSH key.

Authentication is already configured.

Do not attempt to create replacement SSH keys.

Do not modify `authorized_keys` unless explicitly asked.

---

# Agent SSH Behavior

The Raspberry Pi is a real physical device.

Treat SSH access accordingly.

Safe operations include:

- inspecting logs
- checking running processes
- checking system resources
- inspecting application files
- starting/stopping MetroBoard during development
- deploying MetroBoard code
- testing the application
- checking Chromium
- checking localhost endpoints
- inspecting hardware-related state relevant to MetroBoard

Be cautious with:

- package installation
- system configuration
- networking changes
- display configuration
- boot configuration
- deleting files
- changing permissions
- changing SSH configuration
- rebooting or shutting down the device

Do not make destructive or unrelated system-wide changes simply because SSH
access exists.

Do not modify known-working display, touch, Wi-Fi, Ethernet, or SSH
configuration without a concrete MetroBoard requirement.

---

# Development Workflow

Primary development environment:

**macOS**

Primary repository:

the local `metroboard` Git repository on the Mac.

The Mac is the source of truth for source code.

The Raspberry Pi is primarily:

- deployment target
- runtime environment
- hardware integration environment
- kiosk environment

Prefer:

    edit/build/test on Mac
            |
            v
       deploy via SSH
            |
            v
       run on MetroBoard

Do not turn the Raspberry Pi into the primary development workstation.

Avoid installing IDEs, Codex, large build environments, or unnecessary
development services on the Pi.

---

# Deployment

Deployment should eventually be automated.

A likely interface is:

    ./scripts/deploy.sh

The deployment process should be:

- repeatable
- understandable
- safe
- relatively fast
- runnable from the Mac

It may use SSH/rsync or another simple mechanism.

Do not build an elaborate CI/CD system for a single local appliance unless the
project's needs materially change.

Git remains the source of truth.

---

# Production Behavior

MetroBoard should eventually behave like an appliance.

Desired behavior:

1. Raspberry Pi boots.
2. Network becomes available.
3. MetroBoard backend starts automatically.
4. Chromium launches automatically.
5. Chromium opens the local MetroBoard application.
6. Browser chrome is hidden.
7. Application fills the physical display.
8. No keyboard or mouse is required.
9. Application recovers gracefully from temporary network/API problems.

The long-term production URL should be local, for example:

`http://127.0.0.1:<port>`

The device should not depend on a remote frontend deployment to render its UI.

---

# Chromium / Kiosk Mode

The final application should run in Chromium kiosk mode.

Desired properties include:

- fullscreen
- no browser chrome
- no address bar
- no accidental navigation UI
- no unnecessary cursor during normal idle operation
- no screen blanking during intended operating hours
- automatic launch after boot
- recovery after application/browser failure where practical

Do not prematurely configure all kiosk behavior before the basic UI is proven
on the device.

---

# Physical Status Light

Future hardware integration includes:

**Adafruit NeoPixel Jewel — 7 RGBW LEDs**

The Jewel is intended to become a diffused physical status indicator in the
eventual enclosure.

Potential states include:

- healthy / connected
- refreshing
- stale data
- connectivity failure
- WMATA service issue
- imminent train arrival

The exact color/animation vocabulary is not finalized.

Keep hardware integration isolated from core UI/business logic.

The application should continue to function if NeoPixel hardware is absent.

Do not make the frontend directly manipulate GPIO.

---

# Future Enclosure

MetroBoard will eventually have a purpose-built enclosure, likely 3D printed.

The enclosure may expose the NeoPixel Jewel as a diffused status light.

Software should not assume the development setup's exposed Pi/display wiring is
the final physical form.

No enclosure dimensions should be invented without measuring the actual
hardware.

---

# Repository Direction

A likely repository organization is:

    metroboard/
    ├── AGENTS.md
    ├── README.md
    ├── package.json
    ├── docs/
    │   └── design/
    │       └── metroboard-reference.png
    ├── src/
    │   ├── api/
    │   │   └── wmata/
    │   ├── components/
    │   ├── data/
    │   │   └── stations.ts
    │   ├── hooks/
    │   ├── screens/
    │   │   ├── Departures/
    │   │   └── StationSelect/
    │   └── styles/
    ├── server/
    ├── scripts/
    │   ├── deploy.sh
    │   └── kiosk.sh
    └── hardware/
        └── neopixel/

This structure is guidance rather than an immutable requirement.

Prefer clear boundaries over strict adherence to this exact tree.

---

# Code Quality

This is a hobby project, but it should demonstrate professional engineering
quality.

Prefer:

- strict TypeScript
- small focused components
- explicit domain types
- clear boundaries between WMATA data and UI models
- testable transformation logic
- useful error handling
- minimal dependencies
- readable CSS
- descriptive names
- simple deployment
- documentation for non-obvious hardware behavior

Avoid:

- giant components
- unnecessary abstractions
- premature framework-building
- `any` without justification
- hidden global state
- hardcoded API secrets
- unexplained magic numbers
- excessive dependencies
- overengineering

---

# Performance

Remember the production device is a Raspberry Pi 3 B+ with roughly 1 GB RAM.

Keep the frontend lightweight.

Avoid:

- heavy animation libraries
- WebGL for ordinary UI effects
- large client-side frameworks beyond what is already justified
- unnecessary background polling
- huge image assets
- excessive DOM complexity
- continuous high-frequency animations

CSS effects should be restrained.

The terminal aesthetic should not come at the expense of smooth operation.

---

# Accessibility and Readability

Even though MetroBoard is a personal physical appliance, readability matters.

Prioritize:

- strong contrast
- sufficiently large text
- clear information hierarchy
- large touch targets
- obvious selected states
- understandable stale/error indicators

Do not rely solely on subtle color differences for critical state.

The display may be viewed from several feet away.

---

# WMATA Terminology

Use transit terminology consistently.

Prefer actual station names and official line names.

Default:

- `Bethesda`
- station code `A09`
- `Red Line`

Be careful with terms such as track, platform, destination, arrival, and
departure.

Do not fabricate data that appears to be real-time data in production.

Fake data is acceptable in development but should be clearly represented as
fixtures/mock data in code.

---

# Design Restraint

When uncertain whether to add another visual element, usually do less.

The desired visual richness should come from:

- typography
- alignment
- information hierarchy
- amber illumination
- transit diagrams/illustration
- subtle terminal texture
- precise spacing

not from adding decorative widgets.

The final object should feel mature, intentional, industrial, and slightly
futuristic.

---

# Decision Rule

When choosing between:

**"This looks like a cool web app"**

and

**"This looks like a strange piece of Metro equipment someone brought home"**

choose the second.

That is MetroBoard.