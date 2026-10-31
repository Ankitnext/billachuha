# Game audio

`game-audio.js` creates original sound effects with Web Audio oscillators and
generated white noise. It contains no recorded samples, imported songs, external
audio URLs or copied melodies. The new effects require no third-party audio
downloads or attribution. No claim is made here about unrelated legacy assets.

The weapon palette covers pistol, dual pistols, shotgun, SMG, rifle, sniper,
rocket, minigun, flamethrower and mounted turret. A shotgun has a layered bass
blast, noise burst and mechanical tail. Other effects include explosions,
reloads, hits, melee, jumps, role powers, pickups, kill confirmation and results.

- Chase now has sound controls on its home screen and arena toolbar.
- Zombie Horde (both missions) and Arena Blitz replace their generic beeps with
  weapon-specific, server-confirmed effects. Stable effect IDs prevent replay
  across repeated snapshots; the weapon/owner travels with the muzzle event, so
  one shotgun trigger produces one blast rather than one sound for each pellet.
- Dungeon Dash uses its accepted firing events, including the last shell before
  automatic fallback to the pistol. Snake & Ladder adds Dog shots and role/movement
  cues to its existing pickup and result feedback.
- Climber and the original sword arena gain firing/movement/combat feedback.
  Active Joystick Catch and Long Survival pages replace their old MP3 playback
  with generated pickup/impact effects. The old files remain in the repository.
- Existing procedural audio in Trap Escape, Cat Chase and Super Fighting Arena
  is retained.

Sound is on by default. A player can turn it off with the Sound button; an
existing saved mute choice stays respected across reloads. This also applies to
Trap Escape, Cat Chase and Super Fighting Arena. Android's offline Long Run
already defaults to sound on and remembers its mute setting. Browsers require
a first tap/click or keypress to unlock playback. Unsupported or blocked audio
does not prevent gameplay. Muting stops
active voices, leaving/backgrounding stops active playback, and new online
snapshots do not replay past sounds on join/reconnect. Distant online effects
fade, simultaneous voices are capped, and the output uses a master gain and
compressor. No background song is introduced by this change.

The matching copy under the backend's `internal/playweb` is embedded in the Go
binary. Publish the matching website/backend source for online weapon effects.
No database migration is needed. Android's shared-screen resource allowlist
includes the new asset; no APK is built by these source edits.

## Verification

Run `node --test tools/game-audio.test.cjs tools/dungeon-dash.test.cjs`.
With Playwright on `NODE_PATH` and optional `CHROMIUM_PATH`, run
`node tools/check-game-audio.cjs`. It uses intercepted local source and no real
accounts/server, renders twelve effects through `OfflineAudioContext`, checks
their finite/bounded output and distinct tails, verifies immediate mute and
stored preferences across current game entry points and Android's bundled Long Run.

The backend's `TestWeaponAudioEventsDescribeAcceptedTriggerOnce` verifies
accepted shotgun events, pellet grouping, cooldown rejection and increasing IDs.
