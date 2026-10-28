# Dungeon Dash

Dungeon Dash upgrades the existing Jump & Fire slot. `index5.html` redirects to `dungeon-dash.html`; `/games/jump-and-fire/` and the `jump-and-fire` catalog ID remain valid. Climber and Moving Stairs remain separate games. The catalog still has 11 entries. The HTML, CSS, deterministic core, canvas art and UI are separate files; no dependency install or packaging step is needed to run them from a static server.

## Play

- Move with A/D or Left/Right. W/Up jumps twice; upgrades add a third and fourth jump. S/Down drops through floating platforms.
- Hold Space or FIRE to shoot. Shots aim at the nearest eligible enemy. F, SWAP or the weapon HUD picks up a weapon within reach; otherwise it exchanges the active and reserve slots.
- Touch uses a horizontal movement joystick and separate Jump, Fire and Swap buttons. Movement, jumping and firing can be combined.
- Clear every enemy, then walk through the green door. There are no dice. Rooms continue until death or retreat, with a safe shop after each five rooms and a phased boss every ten.
- P pauses. Help, rankings and backgrounding pause the simulation. Retreat & keep gems ends the run and banks its unspent gems.

## Rooms and combat

The seeded generator provides a floor and 3–7 floating platforms with a connected jump route. The arena adapts to portrait phones and short landscape screens; rotation reshapes the same room while preserving enemy health, loot and run progress. Each room fits on one screen. Enemy counts grow from 2–4 to at most 8, with bounded summoned minions, bullets, bombs, loot and effects. Floors progress through Kitchen, Garden, Rooftop, Sewer and Inferno; Inferno continues with increasing difficulty.

Walkers unlock first, Jumpers at room 4, Shooters at 7, Chargers at 11, Flyers at 21 and Shielded dogs at 31. Stomps hurt enemies and bounce the player. Front shields block flat shots; attack from behind or above. The player starts with five hearts and gets one second of invulnerability after damage.

Pistol has unlimited ammo. SMG, shotgun and rockets have finite magazines; empty weapons fall back to the pistol. Rockets damage nearby enemies and can hurt the player. A three-second kill chain multiplies normal gem drops. Each defeated enemy pays once.

The Fat Cat charges, then summons walkers/throws bombs, and finally slams with ground waves. The Dog General fires spreads, summons a turret, then receives a shield until the turret is destroyed. Twin Cats split jumping and ranged attacks; the survivor enrages. These three encounters repeat with higher stats on subsequent floors. Boss rewards and guaranteed weapon drops pay once per room.

## Progression and storage

Seven permanent upgrades cover health, damage, speed, extra jumps, a starting shield, gem bonuses and starting weapon. They apply at the start of the next run. The safe shop offers healing, shield, three-room double damage, five-room magnet and a bomb that clears the next room. It spends the run's gems rather than the permanent wallet. Temporary buffs are lost on death.

`dungeon-dash.save.v1` stores a validated profile: wallet, upgrade levels, best room, lifetime runs/kills, last-run summary and an active-run checkpoint. Checkpoints track collected gems minus shop spending. Death/retreat banks the balance exactly once. Reloading recovers the last checkpoint's unspent gems and ends the interrupted run; it does not resume the room. Persistence happens at room/shop changes, about once a second during play and when hiding/leaving the page. Browser storage failure leaves the game playable in memory and is shown in the title status. Saves belong to this browser; cloud accounts do not sync upgrades or gems.

## Optional rankings

Only the user selecting Scores or Save deepest room online contacts the configured backend. The game uses the existing HttpOnly account cookie and `X-Chase-Web: 1`, never a token in storage or links. The `dungeon-dash` score is deepest room reached. Guests play locally; non-guest accounts may submit a run after death or retreat. Rankings are explicitly client-reported, with no server run verification. Matching backend source adds this game ID to the existing API; no migration is needed. Network failures do not block local play.

## Verification

Run `node --test tools/dungeon-dash.test.cjs tools/snake-ladder.test.cjs tools/fight-bot.test.cjs` and `node tools/render-catalog.mjs --check`. Dungeon tests cover 300 generated arena layouts, transitions/locked exits, input edges, weapons/ammo, damage/death, combos, shops/buff durations, upgrade bounds, checkpoint recovery/idempotent banking, boss phases, shields/rocket self-damage and entity limits. Backend tests cover deepest-room bests, game isolation, authenticated/guest API access and invalid submissions. `go vet ./...` checks the Go sources. Local browser verification covers actual room clearing, the fifth-room shop, upgrade buying, persistence, touch/keyboard controls, responsive layouts and old play links.

No APK, package, push or deployment is part of this source update.
