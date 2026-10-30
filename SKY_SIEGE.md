# Sky Siege

Sky Siege replaces Climber in the existing `climber` catalog slot and detail
URL. `index6.html` redirects to `sky-siege.html`. Kitchen Heist and the other
games remain available. Source is split into `sky-siege-core.js` (DOM-free
rules and saves), `sky-siege-art.js` (original Canvas art) and `sky-siege.js`
(browser/input/save wiring).

## Climb and defend

The 480px-wide world grows upward in 80px layers. Each seeded layer has two or
three shelves, guaranteed cheese and an occasional bonus pickup. Layouts depend
on seed and layer index, so generation is deterministic independently of render
rate. Shelves stay within the world and the next layer has reachable routes.
Rat has acceleration, a 260px/s base speed, two distinct jump presses, one-way
platform landing and slow wall sliding when holding toward a world edge.

The camera follows upward and never resets the world on rotation. Falling below
the view ends a run. Eight layers above and fifteen below the camera's top are
retained, plus the original ground. Platforms, active Cats, pending warnings,
wave records, effects and audio voices are bounded. Cats left far below the
retained world retire as **outpaced**, not defeated, and earn no clear bonus.

Every five layers queues a wave with a two-second preview. A wave contains
`min(8, 2 + floor(wave/3))` Cats and can overlap earlier waves. Early waves spawn
as low as the existing world allows; later waves start about ten layers below
Rat. Cat climb rates increase gradually, bounded at +120%.

| Cat | Unlock | Behaviour |
| --- | --- | --- |
| Walker | Wave 1 | One shelf at a time, one hit. |
| Jumper | Wave 3 | Jumps two layers, skipping intermediate landing traps. |
| Tank | Wave 5 | Two hits; the first single-use defense is destroyed while the Tank survives and falls. |
| Ninja | Wave 8 | Hidden until one layer away, temporarily revealed by magnets, blasts and Dog barks. |

Cat contact ends the run after a 1.5-second catch animation. Stunned/falling
Cats cannot catch Rat. A complete wave defeated by traps earns five times the
wave number in cheese; merely outrunning a wave does not pay that bonus.

## Defenses

All four defenses are always selectable. Rat must stand on a shelf and pay its
cheese cost. A shelf holds one defense, including a Dog. No airborne placement.

| Defense | Base cost | Effect |
| --- | --- | --- |
| Butter Trap | 5 | One hit and two-layer knockback for surviving Tanks. Single use. |
| Magnet Mine | 10 | Pulls one Cat within 60px, reveals and stuns it for three seconds, then deals a hit and is consumed. Can intercept an airborne Cat in range. |
| Firecracker | 15 | Cat contact lights a two-second fuse. An 80px blast damages/reveals nearby Cats and knocks surviving Tanks down three layers. |
| Dog Guard | 25 | Three punches or twenty seconds, whichever ends first. A Tank consumes a punch but cannot destroy the Dog. A bark every five seconds reveals Ninjas within 120px. |

Visible defenses glow on their shelves. Effects show magnetic holds, fuses,
blasts, spinning defeated Cats and Dog punches/barks. Kitchen, Garden, Rooftop,
Sewer and Inferno palettes cycle every 25 layers, blending at transitions.
Background scenery scrolls at a different rate from the tower.

## Score, wallet and upgrades

The plan contains two different descriptions of scoring. This implementation
uses its explicit formula: **highest layer × total cheese earned this run**.
Spending on defenses reduces the wallet brought home; it does not subtract
from cheese already counted toward score. The HUD, result screen and Help
state that distinction. Cheese is earned from shelves, Cat defeats, complete
wave clears and a ten-cheese bonus for every 25 new layers in a run.

Unspent **earned** cheese banks on death, retreat or interrupted-run recovery.
Packed-lunch starter supplies can pay for traps but cannot be repeatedly banked
by starting and immediately retreating. They do not count as earned score cheese.

Seven permanent upgrade tracks are available between runs:

- Extra leap: third and fourth jumps, costs 30 / 80.
- Quick paws: +15% horizontal speed per level, costs 25 / 60 / 120.
- Bargain builder: 1 / 2 / 3 cheese discount, costs 40 / 90 / 160.
- Bigger bang: +30% blast radius per level, costs 50 / 110.
- Good boy: +10 seconds of Dog duration per level, costs 60 / 130.
- Cheese nose: +40% collection range per level, costs 35 / 75 / 140.
- Packed lunch: five starter cheese per level, costs 20 / 50 / 100 / 180.

Profile milestone badges at 25 / 50 / 75 / 100 / 150 layers grant one-time wallet
rewards of 15 / 25 / 40 / 60 / 100. The separate ten-cheese run bonus repeats in
each new run. Upgrades cannot be purchased during an active run.

## Save and recovery

`billachuha_sky_siege_v1` stores the wallet, upgrade levels, personal bests,
lifetime Cats/defenses/runs, milestone claims and a small active checkpoint.
Checkpointing happens regularly and around spending, milestones, pause and
visibility changes. Recovery ends an interrupted climb and banks its latest
saved earned cheese once; it does not resume the exact tower. Banking and
recovery are idempotent. Invalid numeric data is sanitized, and storage failures
show a visible note without preventing play.

Scores are local in this website-only phase. The current backend's game
validation rejects `sky-siege`; the plan's assumption that the new ID already
works is not true of this checkout. No unsupported score request is sent. The
optional online leaderboard requires a later backend game-registration update.
No backend or database changes are included here.

## Controls, accessibility and sound

A/D or arrows move; W/Up/Space jumps, with a fresh press for each extra leap.
E places, Q cycles, P/Escape pauses. Touch has independent movement and jump
fingers, Place, Cycle, tap selection and swipe cycling. Opening dialogs,
backgrounding or rotating clears held controls. Choose keys and Customize HUD
reuse the platform's local editors. The first run explains climb/build/wave
play; Help contains all Cats, defenses and economy rules.

All art is drawn locally with Canvas/SVG. All new sound is synthesized through
the existing Web Audio engine, including jumps, landing, collection, placement,
slips, magnetic hum, a two-second fuse, explosions, Dog cues, waves, milestones
and upgrades. Sound is off by default and requires user interaction. Pausing or
muting stops sustained sounds. Hidden tabs stop the animation loop. Reduced
motion disables moving particles and title animation without changing physics.

## Verification and publishing

- `node --test tools/sky-siege.test.cjs` covers seeded shelf reachability, real
  jumping/landing, all Cats/defenses, waves, scoring, exactly-once wallet
  recovery, upgrade limits, milestone rewards and long-run memory bounds.
- With Playwright on `NODE_PATH` and optional `CHROMIUM_PATH`, run
  `node tools/check-sky-siege.cjs`. It uses intercepted local source with no live
  server or accounts. It checks the old redirect, desktop/phone/landscape/small
  layouts, keyboard movement, pause, trap placement, retreat, upgrade purchases,
  reload recovery, remapping, real two-finger input and all theme renders.
- `node tools/render-catalog.mjs --check`,
  `node --test tools/public-assets.test.mjs` and `node tools/build.mjs` verify
  generated source and public dependencies. CI runs the Sky Siege rule tests.

The existing root-file allowlist already includes the new HTML/CSS/JS. The
Dockerfile copies the whole source checkout to its build stage and publishes
`dist/`, so no directory-specific COPY or Nginx route is needed. This update
does not build an APK, push commits or deploy.
