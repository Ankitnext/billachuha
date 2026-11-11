# Super Fighting Arena

`super-fight.html` replaces the Fighting Arena catalog launch. The existing `fighting-arena` ID and detail URL remain stable. The original `fight.html`, sword fighters and their assets remain playable and are linked from the move list. Solo vs Bot, Local 2 Player and Online Match are available. Online Match uses the existing account session to find a random human opponent across browsers and Android. The queue waits for a second player; it never fills the opponent slot with a bot.

## Systems

The modules in `super-fight/` separate physics, fighter state, combat, powers, bot, pooled particles, camera, procedural art, input, HUD, audio and menus. `engine.js` runs deterministic 1/60-second ticks; the browser menu uses a capped accumulator and a separate render pass. Physics converts the plan's frame-based tuning to units per second: gravity 2160, flight drain 90/s, ground recharge 120/s and shield drain 180/s. The arena is 1400×800, with a following camera fitting both fighters instead of shrinking the entire stage at all times. Rendering and effects do not influence the simulation.

Blaze has 100 HP, 120 energy, fast movement and a 0.7-second beam charge. Shadow has 90 HP, 150 energy and no teleport cooldown. Titan has 130 HP, 90 energy and a 252px Ground Pound radius, versus 180px for the others. All share four basic attacks and six energy powers. The art uses original procedural stick warriors; there are no borrowed anime characters or external sprites, fonts or sound files.

## Controls

| Action | Player 1 | Player 2 |
|---|---|---|
| Move, jump/fly, fast fall | WASD | Arrows |
| Attack | F | L |
| Special 1 | G | K |
| Special 2 | H | J |
| Physical block | Left Shift | Right Shift |
| Pause | P / Escape | P / Escape |

Tap Up to jump; hold to fly. Double-tap any movement direction within 250ms for an approximately 200px dash costing 20 energy. High-speed wall impacts bounce the fighter. Attacks use the stick's Up/Down direction too: Attack alone punches (8), Down+Attack kicks on ground (12) or slams in air (18), and Up+Attack uppercuts (15).

Tap Special 1 for a horizontal blast (20 energy, 15 damage); hold it for a beam (50 energy, 35 damage, 1s charge, or 0.7s for Blaze). Holding Special 1 buffers its charge through an existing attack or cooldown, then fires once until released. Up+Special 1 activates Rising Dragon (30 energy, 22 damage). Tap Special 2 to teleport behind the opponent (25 energy), hold it for Energy Shield, or use Down+Special 2 in the air for Ground Pound (35 energy, 28 damage). Shielding stops ground recharge. Releasing/canceling controls, switching tabs or opening a dialog cancels an uncommitted charge rather than releasing a blast/teleport.

Solo touch has a movement stick and four action buttons. Local two-player has independent sticks/action pads and supports simultaneous touches. Narrow portrait phones stack the two pads to retain usable target sizes; landscape or a larger screen gives more room. Keyboard and touch can be mixed. Browser modifiers and text/select fields keep their normal shortcuts.

## Combat and rounds

Hits apply 150ms stun and directional knockback. Hits within 800ms build a combo: damage is ×1 initially, ×1.1 at three hits, ×1.2 at six and ×1.5 at ten. The defender can teleport during stun after five incoming hits if energy permits. Physical block protects the front and takes 25% chip damage; Energy Shield prevents all damage while it has energy. Powers and basic attacks cannot retain a physical block during the attack.

Two round wins take a best-of-three match, with 90 simulation seconds per round. Draws replay the same decisive-round number without awarding a point. Timeouts compare remaining health percentage to account for different maximum health. KO/time results stop combat, show damage/combo statistics and allow the next round. Match results offer rematch or new character/opponent selection. Pause, move list, hidden tabs and window blur freeze the simulation and round timer.

Bots have 400/200/100/50ms decision intervals across Easy, Normal, Hard and Impossible. They use the same legal movement/power functions and energy budgets as people, with seeded aggression variance, ranged attacks, flight pursuit, dash, charged beams, defensive reactions and combo escape. There are no hidden health or damage bonuses.

Effects include a fixed 500-particle pool, limited projectiles/afterimages, aura/charge animation, impact bursts, teleport/dash trails, ground waves, beam clashes, heavy-hit freeze and camera shake/flash/zoom. Reduced-motion preference disables those motion effects by default; the move list has an effects switch and sound switch. Sound is on by default, remembers the player's mute choice and unlocks on the first interaction. It uses procedural Web Audio, including charge/shield loops that stop on pause or quit.

## Integration and checks

The catalog uses Action, Fighting and Arcade tags and the local `img/brand/super-fight.svg` thumbnail. `tools/build.mjs` includes the new module directory in its public allowlist. The page uses the shared shell stylesheet and its custom-layout opt-out without restructuring the legacy game.

Run `node --test tools/super-fight.test.cjs` for physics, energy, damage, guard/shield, charged input buffering, combos, escape, clashes, ground waves, KO/timeout/best-of-three, bot reactions and bounded full-match simulations. Run the other existing JavaScript tests for regressions and `node tools/render-catalog.mjs --check` for catalog consistency. No package/build/deployment is needed for source checks. Use a local static server for browser play.

Online matchmaking and shared combat are implemented; online ranking/progression, prediction, replays and tournaments are outside this update.

## Online Match

Choose Online Match, choose your fighter and click Find opponent. Existing browser login is reused; otherwise sign in from the game. Account creation and recovery use the existing multiplayer screen. Android exposes Super Fighting Arena Online in Online Arena; the local game’s Online Match button opens that native authenticated screen. No account token is placed in a URL or exposed to game JavaScript.

POST /api/v1/matchmaking with game `super-fight` and fighter `blaze`, `shadow` or `titan` atomically pairs two humans. It reuses the room ticket/WebSocket transport and account validation. Each device controls its own fighter with Player 1 keys/touch controls. The Go server embeds the same trusted JavaScript combat rules through Goja, simulates at 60 Hz and broadcasts snapshots at 20 Hz. Clients render state; they cannot submit health, positions or winners. Rounds advance automatically after four seconds. Menus release controls while the match continues. Reconnect restores the current snapshot; 20 seconds without inputs forfeits the match, and leaving forfeits immediately. Abandoned waiting queues expire after 25 seconds without a heartbeat. A match has a 12-minute safety limit.

Run `node tools/sync-fight-online.mjs` after changing the rules/presentation, then refresh the Android local and online bundles. Deploy matching website/backend sources. Android changes require a newly authorized APK build; this update does not build or publish one. Online results do not enter the existing browser-reported local rankings.

Verification: `node --test tools/super-fight.test.cjs tools/control-settings.test.cjs`; `node tools/check-fight-online.cjs` (Node 24 and Chrome, optional CHROMIUM_PATH). The browser check uses two isolated clients against a loopback protocol fixture with the exact embedded combat engine. Go coverage is in internal/fightengine, internal/multiplayer/fight_test.go and internal/httpapi/fight_test.go.
