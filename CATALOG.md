# Multi-game platform catalog

The website presents **Billa Chuha as Osieq's gaming platform**. Multiplayer Chase is a featured title within that collection. Both `index.html` and `home.html` use the same platform homepage, with Explore Games, search, character/genre filters and game cards. Chase's detailed role guide, animated preview and account controls live at `/games/chase/`.

## Current collection

The catalog contains **11 games**, including three online multiplayer titles. **Zombie Horde** replaces Sprite Preview with three-player co-op survival; **Arena Blitz** replaces Animation Playground with online 3-vs-3 jetpack combat. Both launch the configured backend's `/multiplayer/modes` interface and use the existing account and room system. Fighting Arena remains an arcade extra with fighter characters; it is not assigned animal tags. Categories appear only when a published entry uses them. Adding a puzzle game with the Puzzle genre will create its category automatically.

Each entry has its own `/games/<id>/` page with a description, controls, a Play / Open demo link and related games. Existing `index1.html`–`index9.html` and `fight.html` play URLs remain available.

Moving Stairs is now **Moving Stairs: Snake & Ladder**. `snake-ladder.html` is its playable entry; `index7.html` redirects there for old links. The deterministic board/physics core, canvas art and UI live in `snake-ladder-core.js`, `snake-ladder-art.js` and `snake-ladder.js`. It supports solo (ten-minute clock) and 2–4 local players, four themes, three characters, ladder/snake stages, three-turn powers and guardians. Online multiplayer is a future phase. Local bests need no account; completed solo wins can be explicitly submitted through the existing `moving-stairs` leaderboard API. Scores are client-reported. Run `node --test tools/snake-ladder.test.cjs` for board rules and physics coverage.

The homepage player count explicitly says **players online in Chase** and **active Chase matches**. It measures the Chase backend only. No platform-wide activity, popularity, ratings or fictitious game counts are inferred. Account restoration/log-out remains on the Chase introduction page; the catalog makes no Chase session request and the solo games can be browsed without login.

## Adding a game

Super Fighting Arena upgrades the existing `fighting-arena` slot and launches `super-fight.html`. Its Action/Fighting/Arcade categories, original-warrior thumbnail and manual controls are generated from `games.json`. `fight.html` remains the original sword game. Solo and same-device local two-player are available; online 1v1 is marked as a future phase. See [SUPER_FIGHT.md](SUPER_FIGHT.md).

Jump & Fire is now **Dungeon Dash** in its existing catalog slot. `dungeon-dash.html` is the playable entry and `index5.html` redirects to it. The existing `jump-and-fire` ID/detail URL preserves links and recent plays. Its new Roguelike genre, thumbnail and controls come from `games.json`. See [DUNGEON_DASH.md](DUNGEON_DASH.md) for the room loop, weapons, progression, persistence and optional `dungeon-dash` deepest-room leaderboard.

1. Add the game's playable files and a local thumbnail to the checkout. Keep all assets inside the website's public asset directories.
2. Add one entry to `games.json`, including a unique lowercase hyphenated `id`, title, description, summary, thumbnail, launch path, kind (`game` or `demo`), mode, genre/character arrays and controls. Use `featured:true` only when selecting a featured entry. `launch:"chase"` is reserved for the existing Chase integration.
3. Run `node tools/render-catalog.mjs`. This renders the checked-in homepage and individual detail sources; it does not package, push or deploy the website.
4. Review the generated pages and run `node tools/render-catalog.mjs --check`. The normal website build also checks for stale generated sources before touching its output directory.

`games.json` is the source of truth. Edit metadata or `tools/render-catalog.mjs` instead of editing generated home/detail HTML directly. Rendering validates IDs, metadata, relative paths and asset existence. Catalog text is HTML escaped. Removing an entry removes it from the homepage on regeneration; remove its obsolete detail directory separately when intentionally retiring the old URL.

The catalog and generated `games/` directory are included in the existing public build allowlist. Catalog metadata is public and must not contain secrets. This change adds no upload/admin service or database migration; publishing game files continues through the project's existing source/deployment workflow.

## Browsing behavior

Joystick Shooter's `joystick-shooter` ID now opens **Cat Chase** (`cat-chase.html`), a 50-stage manual Cat-versus-AI-Rat platform chase. `index3.html` redirects. Metadata and the thumbnail are generated from `games.json`; see [CAT_CHASE.md](CAT_CHASE.md).

Arrow Catch's existing `arrow-catch` ID now opens **Trap Escape** (`trap-escape.html`). The original `index1.html` link redirects. Its thumbnail, five-world/50-stage description and manual platform/trap controls are generated from `games.json`; stars and times are browser-local. See [TRAP_ESCAPE.md](TRAP_ESCAPE.md).

- Search matches titles, characters, descriptions shown on cards and genres. Search and category filters work together and remain in the URL for reloading/sharing.
- Large collections show 24 matching cards initially, then load the next batch with Show more. All links remain in static HTML and work without the filtering script.
- Recent plays store at most six game IDs locally on the device. They are recorded when a Play / Open demo link is selected, including on individual detail pages. There is no account-based history or new tracking cookie. Missing/blocked storage does not block navigation or filters.
- Chase launch links still use the validated environment's backend URL. Its account integration, invite URLs, native sharing and gameplay remain owned by the backend/app. The Android availability page still requires a real public `ANDROID_DOWNLOAD_URL` before offering an APK/Play Store link.

## Verification

Run `node tools/render-catalog.mjs --check`, then `node tools/check-catalog.cjs` with Playwright on `NODE_PATH`. The browser fixture checks category/search combinations, filter URL restoration, all detail/play links, recent plays, Chase-specific count/auth behavior, responsive layouts, unavailable counts, a simulated 101-entry catalog, JavaScript-disabled navigation and blocked storage. It uses local fixtures and never real accounts or a production server.

Screenshots are saved under ignored `tools/screenshots/catalog/`. Numbers shown there come from a test fixture. The backend's existing retention and Sprint 4 browser checks also cover the moved Chase introduction and ongoing invitation/share/tutorial flows.

No APK, website package, push, live database change or deployment was performed for this update.
