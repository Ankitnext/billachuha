# Cat Chase

Joystick Shooter becomes **Cat Chase**, a single-player platform chase with the human controlling the Cat and an autonomous Rat running ahead. `cat-chase.html` is the playable entry. The `joystick-shooter` catalog ID/detail URL remains, and `index3.html` redirects to the new game. Trap Escape keeps its existing gameplay; its Canvas drawing functions are reused for the original mascots and world scenery.

## Controls and rules

A/D or arrows moves the Cat, W/Up/Space jumps, E/F/Shift pounces, and P/Escape pauses. Touch uses a horizontal joystick and independent Jump/Pounce buttons. The fixed 60 Hz simulation includes acceleration, gravity, swept vertical landings, coyote time, buffered jumps, moving-platform carry and solid walls. Pounce is a 0.19-second directional burst at 490 pixels/second with a 1.35-second cooldown. It gives no immunity and cannot cross solid walls. Quick taps are latched to the next simulation step. Input clears on blur, resize and dialogs.

The Rat has independent platform physics and a route controller. It jumps gaps, cracked floors and shelves, avoids active spikes, waits for falling blocks and pauses at bait. It waits seven seconds at the exit (nine in finales) before escaping. Both actors use the same real floor holes and solid obstacles. Touching the Rat wins; falling, spikes, a falling block or an escaped Rat resets the stage after 0.42 seconds. Attempts are unlimited. There is no gun, health bar, ammo or online multiplayer in this chase version.

## Stages and traps

Fifty deterministic stages span Kitchen, Garden, Rooftop, Sewer and Inferno. Each world has a different primary-trap sequence rather than repeating the same ten patterns. The main hazard is encountered early enough to affect the chase. Kitchen introduces a full-width ceiling slam in 1-3, shifting ground in 1-4, a pendulum in 1-5, a floor piston in 1-6, timed shutters in 1-7 and an elevator in 1-9. Finales combine several machines with space to wait safely between them.

Thirteen trap families include seven new mechanisms: **ceiling slabs** fall across a 180+ pixel zone and retract; **shifting floors** slide 68 pixels sideways, carry actors and expose real holes; **elevators** lift real floor pieces by 90 pixels; **pistons** rise 132 pixels from the floor and cycle through safe windows; **pendulums** swing along an arc with circular collision; **shutters** close and reopen with real solid/crush collision; and **conveyors** carry both actors at 95 pixels/second in the arrow direction. Crumbling floors, popup spikes, falling crates, sliding walls, springs and fake exits remain in the mix. Moving ledges also remain above some gaps.

Warning markers, striped danger zones, physical motion and the per-stage mechanic label explain what to watch. Every trap is driven by the fixed simulation clock; pause and quick retry freeze/reset its state. Retry layouts and trigger timing remain deterministic so they can be learned. Existing stage IDs and saved progress are retained. Par times include waiting for machinery, and the Rat waits longer at the exit so a safe timing strategy remains viable.

The camera follows the Cat and retains readable sprite sizes. A route strip shows Cat/Rat positions, gaps and revealed traps. An edge indicator points toward an off-screen Rat. Original procedural art has alternating arms/legs, optional pounce trails and cartoon capture/bonk feedback. Optional synthesized sound reuses the existing small audio helper. Extra effects default off for reduced motion. Pause/help/background tabs freeze the simulation and clock.

## Progress

Catch the Rat to unlock the next stage. Collect all three bonus bells, or beat par without a retry, for three stars. Within two retries earns two stars; every catch earns at least one. `cat-chase-save` stores maximum stars/bells, minimum time and lifetime retries; `cat-chase-settings` stores sound/effects preferences. Saves are independent of Trap Escape. Invalid JSON falls back to a fresh save, and blocked storage keeps in-memory progress and displays a notice. No account, backend request or database change is required.

## Verification

`node --test tools/cat-chase.test.cjs` covers physics, Rat timing, pounce cooldown, all new trap phases/crush collision, circular ball collision, real floor holes, horizontal/vertical carry, conveyor transport, retry reset, save/unlock rules and all 50 stages driven using ordinary movement/jump/pounce inputs. Solvability checks also require the main trap to activate before the Rat is caught. Catalog sources are generated from `games.json` with `node tools/render-catalog.mjs` and verified with `--check`. The root HTML/CSS/JS assets and existing shared `trap-escape/` folder are already on the public asset allowlist.

This is a source update only. No APK, website package, push or deployment is included.
