# Kitchen Heist

Kitchen Heist replaces Joystick Catch in the existing `joystick-catch` catalog
slot. `index2.html` redirects to `kitchen-heist.html`; the existing detail URL and
recent-play ID remain valid. Climber is unchanged by this replacement.

## Campaign and rules

There are 50 deterministic stages across Home Kitchen, Restaurant, Factory,
Warehouse and Secret Lab. Each has named objectives, furniture cover, valid
patrol routes and a par time. Later worlds introduce Dog cameras, conveyors,
noisy metal floors, darkness, ground-level Dog security and timed laser grids.
All objectives and tools are reachable through walkable corridors. No external
images, fonts or recorded audio are required.

Rat walks at 120px/s and sprints at 180px/s, with acceleration, diagonal
normalization and collision sliding. Walking is silent except on metal floors;
sprinting can be heard within 96px. Cat patrols pause at waypoints, alert for
1.5 seconds, chase the last known position, search after losing sight for three
seconds, and return to patrol after five seconds. Navigation uses a bounded
tile-grid A* search. Hunter Cats actively pursue without a fixed patrol route.

Analytic ray/rectangle and ray/circle intersections clip visible cones against
furniture and smoke. Detection samples Rat's body, with the same angle/range
and occlusion rules used by the cones. Dog spotlights and active red lasers
raise a ten-second alarm. Remaining continuously in one camera beam does not
refresh that timer every frame; leaving and re-entering can trigger it again.

Collect every cheese and enter the unlocked exit. Each tenth stage also requires
four successful nearby hunter distractions. Boss loadouts contain exactly two
tool pickups, each with two charges, so all four distractions are possible.
Allow at least 1.5 seconds between counted distractions. Getting caught stops
the simulation and automatically starts a fresh attempt after two seconds.

## Tools

Rat carries up to three tool stacks. Pickups remain available while pockets
are full. Consuming the last charge frees its slot.

| Tool | Behaviour |
| --- | --- |
| Cheese Decoy | Travels at 40px/s for six seconds, stopping at cover; lures the nearest patrol within 200px. Also distracts the hunter. |
| Smoke Bomb | A 96px cloud blocks Cat/Dog vision for four seconds. Nearby guards enter a blinded search. |
| Mouse Hole | First use places an entrance. A second use places an exit 40–400px away and consumes the item. Step into the entrance after arming to travel once. Both ends disappear. |
| Soft Paws | Silent movement for five seconds, with 30% shorter Cat detection cones. Camera range is unchanged. Cannot be activated again while active. |

## Controls and presentation

WASD/arrows move, Shift sprints, E/Space uses the selected tool, Q cycles it,
and P/Escape pauses. Touch provides a joystick, Use Tool, Cycle and held Sprint;
inventory supports tap selection and swipe cycling. Movement and sprint support
independent fingers. Opening menus, losing focus and rotating release input.
Choose keys and Customize HUD reuse the platform's device-local editors.

Desktop and landscape show the entire room. Portrait uses a following view so
characters stay readable, with a camera rectangle on the full-room minimap.
The view scales uniformly without changing world geometry. Native-size safe
areas and viewport changes are handled by the layout. The first stage has a
one-time controls briefing; stage introductions and Help explain each mechanic.
Reduced motion suppresses particles and preview animation. Hidden tabs stop the
animation loop and pause the heist.

Audio is original Web Audio synthesis: footsteps, sprint taps, pickups, alert,
chase, a one-second security siren, capture, escape and tool cues. The remembered
Sound toggle is off by default. Existing shared audio limits and mute behaviour
apply. No APK, account, backend change or database migration is required.

## Stars and local storage

Three stars require all cheese, no sightings and beating par. Two require all
cheese with at most one sighting. Any successful escape earns one star. New
worlds require 15 stars in the previous world and its boss cleared. Each stage
unlocks after the preceding stage is cleared.

`billachuha_kitchen_heist_v1` stores best stars, minimum completion times,
minimum sighting counts, catches and consumed tools. Invalid saves fall back to
a fresh campaign. Storage errors do not prevent play, but the message explains
that progress could not be saved. There is no online score submission in this
phase: the optional fastest-time leaderboard would require a matching backend
game definition and ordering, so the game does not call unsupported endpoints.

## Source, build and verification

Logic lives in `kitchen-heist/`; pure modules support Node and browser loading.
The static build allowlist includes that directory. The current Dockerfile
already copies the entire checkout into the build stage and publishes `dist/`,
so another directory-specific COPY instruction is unnecessary. Public-asset
validation discovers dependencies from the actual HTML. CI runs the game rules.

Run `node --test tools/kitchen-heist.test.cjs` and
`node --test tools/public-assets.test.mjs`. The rule checks cover all 50 levels,
objective reachability and patrol routes, geometric par budgets, vision/math,
AI state changes, all tools, hazards, boss charges and progression. Geometric
par checks establish route-distance budgets, not perfect human stealth runs.

With Playwright on `NODE_PATH` and optional `CHROMIUM_PATH`, run
`node tools/check-kitchen-heist.cjs`. It checks the old redirect, keyboard
movement, pause, a complete first-stage escape with guards active, save/reload,
remapping, desktop/portrait/landscape/small-phone fitting, real two-finger touch
and all 50 stage renders. Screenshots go to ignored `tools/screenshots/`.
`node tools/build.mjs` validates and creates the local public artifact.

This source change does not push, deploy, build an APK or modify Sky Siege.
