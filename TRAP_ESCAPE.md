# Trap Escape

Arrow Catch is now a manual Rat-versus-Cat chase platformer at `trap-escape.html`. The `arrow-catch` catalog ID and detail URL are preserved. `index1.html` redirects to the new entry. Existing unrelated games are unchanged.

## Play

Move with A/D or arrows, jump with W/Up/Space, drop with E/F, cycle with Q (or Tab when the canvas has focus), and pause with P/Escape. Touch has a horizontal joystick, Jump/Drop buttons and three inventory slots. Tap a slot to select, tap again to drop, or swipe to cycle.

The Cat follows a fixed-step recording of the Rat’s route, including jumps. It starts after 1.5 seconds in Kitchen, down to 1 second in Inferno, and plays the route 10% faster initially, increasing with each world. Stuns pause or alter playback. Banana and ice reactions slide along the recorded route; queued stuns resume in order. Landing positions follow the original route rather than attempting to solve platform collisions independently.

Reach the exit or stun the Cat three times. Every tenth stage is a boss requiring four stuns and a 2× chain. Consecutive trap hits within three seconds chain. Stages reset in 0.42 seconds after a fall or capture. There is no lives limit. The campaign has 50 authored stage configurations across Kitchen, Garden, Rooftop, Sewer and Inferno; it is not endless or random.

Carried traps: banana, mousetrap, paint, magnet, ice and two-second-fuse firecracker. Environmental traps: bucket, broom sweep, spring, loose wire, trapdoor and steam. Levers arm only after the Rat passes at the correct height. Magnets can pull nearby armed metal traps into a chain. All traps affect the Cat; visible gaps/lava and capture affect the Rat.

Seven new stage traps bring the total to **19**: ceiling slams, sliding floors, elevator launches, floor pistons, pendulum bonks, shutter traps and reversing conveyors. Pass each machine's far lever to arm it behind the Rat. When the Cat enters, the windup briefly holds its route playback while the machine strikes, then queues one normal stun. These hits count toward combos, boss knockouts and star ratings. Armed metal machinery also chains with magnets. Each contraption is single use per attempt and resets on retry.

Sliding floors and lifts are real moving platform pieces with horizontal/vertical carry and real holes beneath them. Conveyors move the Rat and reverse after catching the Cat. The Rat can ride or jump them; returning to a new gap still requires care. Ceiling slabs, pistons and shutters temporarily become solid behind the Rat while firing, then reopen. The Cat keeps its recorded route and has distinct squash, launch, swing, slip and bonk reactions.

Kitchen introduces ceiling slams in 1-3, sliding floors in 1-4, pendulums in 1-5, pistons in 1-6, shutters in 1-7, lifts in 1-8 and conveyors in 1-9. Other worlds mix these mechanisms with the original traps. Later-world pickups are spaced beyond the machinery so it can contribute to the chase. Stage IDs, saves, boss requirements, old trap items and controls are preserved.

## Progress and presentation

Three stars for a Cat knockout, a 3× chain or beating par; two for an exit with a stun; otherwise one. Clear the boss and earn 15 stars in its world to unlock the next. Replays preserve maximum stars/combo and minimum time. `trap-escape-save` stores browser-local progress, best times, total retries and trap usage. `trap-escape-settings` stores sound/effects preferences. Invalid JSON falls back to a fresh save; blocked storage keeps in-memory progress for that visit and shows a message. Full-campaign best time appears after all 50 stages have a saved time.

Canvas draws original Rat/Cat mascots, alternating limbs, recognizable items, world scenery and distinct trap reactions. The following camera keeps characters readable. An inset shows off-screen Cat reactions. Particle storage is bounded to 240 particles, recordings to 3,600 frames and dropped traps to 12 per attempt. Optional synthesized audio needs no downloaded media. Effects default off with reduced motion. Pause/help/background tabs stop simulation and the clock. Input resets on focus loss, resize and dialogs; short taps are latched to the next physics step.

## Files and validation

`trap-escape/` contains physics, level data, route recording, traps, Cat logic, fixed-step simulation, art, audio, input, save, HUD and menu modules. Pure simulation modules expose CommonJS exports for tests and the browser shares the same implementations. The public build allowlist includes the folder.

Run `node --test tools/trap-escape.test.cjs` and `node tools/render-catalog.mjs --check`. Tests cover all 19 trap families, machinery arming/windups, single-impact scoring, horizontal/vertical carry, conveyor reversal, recording holds, magnet chains, retry reset, fuses, combos, bosses, saves and all 50 stages using ordinary movement/jump/drop controls. `machinery.js` contains pure simulation and `machinery-art.js` its Canvas art. The shared mascot/audio helpers continue to serve Cat Chase.

This is a website-only single-player implementation. It makes no API requests or backend changes. The plan’s optional online leaderboard needs a future supported backend score category and is not presented as available. Local stars and times work without an account. No APK, package, push or deployment is part of this source update.
