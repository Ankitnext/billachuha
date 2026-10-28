# Billa Chuha website

Trap Escape now has **19 traps**, adding ceiling slams, sliding/elevator floors, floor pistons, pendulums, shutters and reverse conveyors to its original twelve. Run past far levers as Rat to set the machinery for the pursuing Cat. Moving platforms carry Rat physically; every new machine supports Cat stuns, combos, magnets and quick retries. All fifty stages and saved progress remain. See [TRAP_ESCAPE.md](TRAP_ESCAPE.md).

**Cat Chase** replaces Joystick Shooter with 50 platform stages where you manually control the Cat and catch an AI Rat. Jump, pounce and avoid collapsing floors, popup spikes, falling blocks and moving obstacles across five worlds. Stars, bells, best times and stage unlocks save locally. `cat-chase.html` is the new entry, `index3.html` redirects, and the `joystick-shooter` catalog ID remains. See [CAT_CHASE.md](CAT_CHASE.md) for controls, mechanics and tests.

Cat Chase now mixes thirteen trap families across the campaign. Wide ceiling slams, shifting and elevator floors, pistons, pendulums, timed shutters and conveyors appear early in the chase. The five worlds use different main-trap sequences, and moving floors physically carry the characters. Existing progress is retained.

**Super Fighting Arena** upgrades the Fighting Arena catalog slot with three original stick warriors, flight/dashes, four basic attacks, six energy powers, combos, best-of-three rounds and Solo or Local 2 Player. The new entry is `super-fight.html`; the original `fight.html` stays playable. See [SUPER_FIGHT.md](SUPER_FIGHT.md) for controls, implementation and checks. Online 1v1 belongs to the later backend phase; this update is offline website source only.

Jump & Fire has become **Dungeon Dash**, a solo roguelike with generated rooms, six enemy types, four weapons, permanent gem upgrades, shops every five rooms and phased bosses every ten. The old `index5.html` link redirects to `dungeon-dash.html`; its catalog slot remains `jump-and-fire`. Movement and combat are manual, with keyboard and separate touch controls. Progress saves on this device; optional deepest-room rankings reuse the existing account API. See [DUNGEON_DASH.md](DUNGEON_DASH.md) for controls, saves, tests and scope.

The two catalog demos have been replaced by **Zombie Horde** (three-player online co-op survival) and **Arena Blitz** (online 3-vs-3 jetpack combat). Both use existing Billa Chuha accounts, private room invitations and Quick Play with bots filling empty slots. Their shared browser interface and authoritative simulations ship with the Go backend. Deploy matching website and backend sources; see the backend's `MULTIPLAYER_MODES.md` for rules, controls, tests and current scope. No new database migration or Android APK is required for these browser games.

Zombie Horde's game menu now offers **Endless Survival** and **Capture the Zone**. Capture sends a three-player squad across four checkpoints, with mounted guns, barricades, supplies and a final extraction boss. Its rooms and Quick Play queue preserve the mission selection. The catalog keeps one Zombie Horde entry; `zombie-horde.html?variant=capture` launches the new mission directly.

The homepage presents Billa Chuha as a multi-game platform, with a searchable/filterable library and Chase as a featured game. [CATALOG.md](CATALOG.md) explains the single `games.json` catalog, generated individual game pages, adding new games, 24-card pagination and local recent plays. Chase's role guide, pausable Canvas preview and account controls now live at `/games/chase/`; its online counter is explicitly scoped to Chase.

The original mascot art and local styles introduced in Sprint 4 are retained. Artwork provenance and the built-in imagegen prompt are in [tools/artwork/README.md](tools/artwork/README.md). Preview animation pauses offscreen/in hidden tabs and respects reduced motion. Optional `ANDROID_DOWNLOAD_URL` enables the HTTPS APK/Play Store link on `android.html`; when empty, that page clearly states the public download is being prepared. No APK is bundled with this site.

This repository owns the browser arcade: homepage, game pages, JavaScript, styles, images and audio. The project now has three independent Git repositories:

| Repository | Local checkout | Owns |
| --- | --- | --- |
| [billachuha](https://github.com/Ankitnext/billachuha) | `D:\Custom\billachuha\billachuha` | Static website |
| [billachuha_app](https://github.com/Ankitnext/billachuha_app) | `D:\Custom\billachuha\billachuha_app` | Native Android, offline Long Run and Android tests |
| [billachuha_backend](https://github.com/Ankitnext/billachuha_backend) | `D:\Custom\billachuha\billachuha_backend` | Go/Gin API, accounts, leaderboard, Chase server, shared Chase screen and Docker deployment |

Each repository builds from its own root without a parent checkout. Only the optional cross-platform device harness expects app and backend beside each other. No submodules or nested repositories are needed.

## Responsive game controls

Sprint 3 adds `community.js` to show the configured backend's actual connected-player count. It polls every 30 seconds while visible, excludes bot estimates, and shows an unavailable state on errors. Shared Chase result cards and referral totals are owned by the backend. Deploy both checkouts with the matching schema-5 backend; no new public configuration or website tracking cookie is required.

Friend invitations now use `/join/CODE` on the hosted website. Nginx routes valid eight-character room codes to `invite.html`, which previews the lobby through the configured backend and continues to sign-in/join. Deploy the website and backend Sprint 2 sources together; local static hosts without the Nginx rule can use `invite.html?room=CODE`. API-origin `/join/CODE` links also work directly in the browser.

All numbered arcade pages and the fighting game use `game-shell.css` and `game-shell.js`. The complete canvas and controls fit the current viewport without scrolling. Portrait docks controls below the canvas; landscape reserves left/right control lanes. The canvas keeps its logical aspect ratio, and the layout accounts for safe areas and browser viewport changes. Rotating releases held controls; Climber keeps its logical world and progress during resize.

The fighting game runs against a reactive bot (`js/fight-bot.js`) with approach/retreat decisions, reaction delays, attack cooldowns and occasional evasive jumps. Use A/D or arrow keys to move, W/Up to jump, and Space to attack, or use the on-screen controls. Combat uses a fixed 60 Hz simulation; Rematch starts a fresh round.

Run `node --test tools/fight-bot.test.cjs`. For the optional real-browser source checks, make Playwright available on `NODE_PATH`, set `CHROMIUM_PATH` if needed, then run `node tools/check-device-layout.cjs`. It checks portrait, landscape, small phones and desktop layouts, real touch movement, independent firing/movement releases, rotation cancellation and the sibling backend's shared Chase page when available. Screenshots stay in ignored `tools/screenshots/`. It runs a local source server without building or deploying.

## Build and serve

Use Node.js 24 to build the public upload directory (no npm dependencies):

```powershell
node tools/build.mjs
```

Serve or upload **only `dist/`**. The build copies public files using an allowlist; Git metadata, local configuration and tools stay out of the artifact. Homepage image paths work at a domain root and under a GitHub Pages repository path. You can also serve this repository directly with a static web server during development.

## Connect multiplayer

The homepage's **Play multiplayer** link opens the shared Chase screen at the configured backend's `/multiplayer` URL. Android opens that server's `/multiplayer/app` inside the native app. Both platforms share rooms, bots and gameplay through one Go server.

The homepage restores the browser account through the API's persistent HttpOnly cookie, shows **Signed in as**, the player ID and **Logout**, and opens multiplayer without another login. Sign in once with email/password on the shared screen; registration verifies email once, while email-code fallback supports existing accounts and password recovery. Closing a tab or leaving a match keeps the login. Temporary connection failures retain cached account display; the backend always validates protected actions. Guest sessions stay temporary.

Configure the exact website origin in the backend's `CORS_ORIGINS`. Account requests use `credentials: include` and `X-Chase-Web: 1`; the backend approves credentials only for allowed origins. The website/API need matching site hosts for SameSite cookies (the hosted `osieq.online` subdomains do). Use `127.0.0.1` consistently on both local servers. No account tokens are transferred through links or browser storage.

The shared Chase screen stays bundled in `billachuha_backend/internal/playweb` so native one-use launch tickets, HttpOnly app sessions, relative API/WebSocket paths and the game protocol ship together. Arcade pages belong here; offline Android Long Run belongs in the app repository. There are no copies of app/backend source in this repository.

For local testing, `site-config.js` points to `http://127.0.0.1:3000`. Start the Go backend from its own checkout. For production, inject its HTTPS origin:

```powershell
$env:BACKEND_URL='https://api.osieq.online'
node tools/build.mjs --production
```

Use that same HTTPS origin for Android's `authBaseUrl`. `BACKEND_URL` is public configuration, with no path, query or credentials. MSG91 keys and OTP secrets belong only on the backend. The homepage navigates to the game server and does not transfer authentication tokens between domains.

Chase supports 15 players (7 rats / 5 cats / 3 dogs), five-minute matches and bots filling empty slots. Development servers offer **Play as guest (test)** without email. Production uses verified account login. The original browser games remain available.

## CI and publishing

The website now has separate staging and production Docker builds and deployment targets. `staging` deploys to a staging website domain and uses the staging API; the default branch deploys production and uses the production API. Their containers and Docker networks are separate. Normal staging updates never change the shared HTTPS gateway or production containers.

Create GitHub environments `staging` and `production` in this repository. Configure environment-specific VPS/SSH settings there, then add repository variables `STAGING_BACKEND_URL` and `PRODUCTION_BACKEND_URL`. Enable automatic deployment independently with `DEPLOY_STAGING_TO_VPS` and `DEPLOY_PRODUCTION_TO_VPS` after server setup. The pipeline validates both public configurations, checks a preview container with its runtime restrictions, publishes branch-specific images and deploys by digest.

For local builds, copy `.env.staging.example` to `.env.staging` (or production), edit its public API URL, then run:

```powershell
node tools/build.mjs --environment staging
node tools/build.mjs --environment production
```

Each build writes `dist/`; deploy/copy it before building the next environment if needed. GitHub CI and Docker builds use separate workspaces/images. Real `.env.*` files are ignored and excluded from Docker context. Only public backend origins enter the built site.

Follow the [complete VPS and GitHub environment guide](https://github.com/Ankitnext/billachuha_backend/blob/main/DEPLOYMENT.md) for DNS, networks, environment files, gateway setup, branches, secrets and deployment commands. You can also host `dist/` on another static host. Optional GitHub Pages deployment stays production-only: choose Actions in Settings → Pages, set `PRODUCTION_BACKEND_URL`, and enable `DEPLOY_GITHUB_PAGES=true`. Staging cannot publish over the production Pages site.

On a shared VPS, the updater uses `/opt/billachuha/docker-config` for Billa Chuha's private GHCR image login. Log in with `docker --config /opt/billachuha/docker-config login ghcr.io --username Ankitnext` and a classic token with `read:packages`. Existing projects keep their own credentials. An explicit `BILLACHUHA_DOCKER_CONFIG` can override this application's login directory.

## Repository split

All three existing Git remotes were preserved. App files, local configuration and build outputs moved to the app checkout; Go files and its database moved to the backend checkout. The move verified 855 app files and 68 backend files by SHA-256 before follow-up configuration edits.

Previously staged Android content was preserved locally at `D:\Custom\billachuha\tools\repo-split-20261023\website-staged-app.patch` before removing those paths from this website's index. The old Node auth server and monorepo instructions are archived in `billachuha_backend/legacy/`, excluded from current Docker/CI. This local split does not commit, push or deploy the repositories.

Endless Survival now spans a 2400×1800 map with five supply areas and a scrolling camera/mini-map. Both Horde missions share Long Survival jump parameters, rechargeable jetpacks, Rat decoys, Cat speed/invisibility and Dog chain-hook/bark abilities. Use J to jump, hold Shift/V to fly and E/Q for role powers. C retains Rat Dash and Cat Pounce alongside the newer abilities; touch provides separate action buttons.

Arena Blitz now spans 2400×1100 with wider platform routes and separated team spawns. A following camera keeps player sprites readable, and the tactical minimap shows both teams, weapons and the current camera area.

Moving Stairs now opens a Snake & Ladder platform adventure at `snake-ladder.html` (old `index7.html` links redirect). Roll and clear a platform stage to move across a 100-cell board. Solo has a ten-minute clock; Pass & play supports 2–4 local players. Rat double-jumps, Cat boosts and blocks its first snake, and Dog shoots with one reroll per game. Ladder climbs, coin-saving snake falls, guardians and three-turn powers span four themes. Use A/D to move, W/Space to jump, E for Cat/Dog abilities and P to pause; touch controls have separate movement and action buttons. The optional solo leaderboard uses the existing account cookie and reports scores as client-reported. Online multiplayer is a future phase. Validate rules and platform reachability with `node --test tools/snake-ladder.test.cjs`.

Arrow Catch is now **Trap Escape** at trap-escape.html. Its existing catalog ID/detail URL are preserved, and index1.html redirects. Manually run and jump as Rat, set nineteen types of cartoon traps for a route-following Cat, and clear fifty stages across five worlds. Stars, times and progress save locally. See [TRAP_ESCAPE.md](TRAP_ESCAPE.md) for controls, rules and tests. Online leaderboards are a future backend integration.
