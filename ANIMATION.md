# Character movement

`character-motion.js` supplies original Canvas limb poses. Walking follows distance travelled, settles to idle when stopped, and uses separate rising, falling, jetpack and landing poses. Gun arms keep aiming while legs step. Animation only reads actor positions; it never changes movement, collision, damage or network messages. Reduced-motion preferences suppress gait and bounce.

Coverage:

- Chase: animated Rat, Cat and Dog paws, including airborne poses.
- Zombie Horde / Capture the Zone: animated survivors, decoys and all zombie types, with interpolated enemy presentation.
- Arena Blitz: walking, jumping, falling and jetpack poses for every role.
- Dungeon Dash: Rat and mobile enemies; fixed turrets remain planted.
- Sky Siege: Rat and climbing Cats; stationary Dog defenses keep their punch/bark animations.
- Snake & Ladder: all three playable roles and walking guardians.
- Kitchen Heist: Rat and Cat guards; Dog security cameras remain stationary.
- Trap Escape / Cat Chase: existing walking cycles retained, with bent knees and raised arms in the air.
- Long Survival and Android's bundled Long Run: original articulated Rat, replacing the fixed player image.
- Super Fighting Arena and the legacy sword arena already animate movement and combat.

The helper is copied into the backend's embedded multiplayer assets and Android's offline Long Run folder. Keep all three copies identical. Android's multiplayer WebView allows the new script. No new external art or animation library is required.

Long Survival and Android Long Run also share `long-run-movement.js`. It preserves the original 60 FPS acceleration, drag and distance at other refresh rates. Previously the website applied drag once per rendered frame, cutting keyboard speed in half at 120 Hz. Walking, touch boost and jump momentum now keep the same pace at 30–240 Hz. Its regression tests are in `tools/long-run-movement.test.cjs`.

Validation: `node --test tools/character-motion.test.cjs` checks speed-independent timing, stopping, airborne states, pause/reconnect recovery and copy parity. `node tools/check-character-motion.cjs` uses Playwright on `NODE_PATH` and an optional `CHROMIUM_PATH`; it checks visible poses, full renderers, multiplayer fixtures and desktop/phone entry points using intercepted local sources. Screenshots go to ignored `tools/screenshots/`.

These are source changes. Publishing the website/backend and building a new APK are separate actions.
