# Competitive rankings and progression

Open `rankings.html` from the catalog navigation or a competitive game's ranking link. Online clients also serve the same page at `/multiplayer/rankings`, including inside Android's multiplayer WebView.

The page offers player/team views, game filters, all-game discovery, pagination, XP levels and each entry's highest challenge level. Best scores follow each game's rules; raw scores across different games are not equivalent. Global entries show their game and whether results came from the server or browser.

| Game | Player points | Team points |
| --- | --- | --- |
| Chase | Existing cheese/catch score | Existing Rat/Cat/Dog team score |
| Zombie Horde | 10 × kills + 3 × assists + 10 × wave reached | 10 × squad kills + 100 × wave reached |
| Capture the Zone | Horde player scoring | Horde squad scoring + 1,000 per secured zone + 5,000 for extraction |
| Arena Blitz | max(0, 100 × kills + 25 × assists − 10 × deaths) | 100 × team kills |
| Super Fighting Arena | Damage, combos, round wins and match wins; difficulty/challenge multiplier | Individual opponents |
| Original Sword Arena | Damage, remaining health and win points; challenge multiplier | Individual opponent |
| Snake & Ladder | Existing completed-race scoring for each player | Individual opponents |

Online scores are captured from the authoritative simulation after a completed match. Bots and guests receive no account ranking. A team's identity is its game, side and sorted registered roster, so rematches with that roster accumulate together. Bot support is disclosed. Teams without a registered participant do not enter global rankings. Completed-result retries are idempotent; invalid writes roll back.

Fighting and local race participants are saved in `billachuha.competition.v1`, with names, personal bests, wins, match counts and progression. Select **This device** for every local opponent's ranking. If Player 1 is signed in, their own result also syncs to the separate browser-reported global game board. Local play cannot submit online game scores or impersonate another account. Local game reports are not server-validated gameplay replays.

## Levels

Earned level is `1 + floor(sqrt(XP / 100))`, capped at 50. Server-recorded matches award 25 completion XP, up to 75 score XP, and 50 win XP. Local reports award 15 completion XP and 35 win XP. Team XP comes from completed matches and wins. These are progress badges; they do not buff human movement, HP or damage.

Super Fighting Arena and the sword arena have a separate saved challenge stage. Wins unlock the next stage, up to 50; defeats retain the stage. Super Fighting Arena's selected difficulty remains the baseline, with faster reactions and stronger attack/defense decisions at higher stages and subsequent rounds. The sword opponent reacts and attacks faster at higher stages. Online Chase and Blitz increase their bot challenge each minute up to level 5. Horde already scales enemy health, speed and damage by wave; Capture progresses by checkpoint. The current online challenge is visible in the match HUD. Snake & Ladder keeps its existing increasing cell/guardian difficulty.

## Backend and deployment

Migration **007_competition.sql** adds immutable competition matches, players and teams, with indexes. Both SQLite and schema-scoped Postgres migrations are supplied, and fallback replication includes the new tables. SQLite upgrades when opened. Postgres needs the existing explicit migration/deployment step before running this version (schema version 7). No live migration has been run by this change.

Existing personal score tables and historical Chase leaderboards remain intact. The new team/XP rankings begin with completed matches recorded by this version; old matches are not assigned invented team rosters or XP.

Public reads: `GET /api/v1/competition?game=all&type=players|teams&limit=20&offset=0`. Account progress: `GET /api/v1/competition/me`. Authenticated local reports: `POST /api/v1/competition/local`. Online modes use the server's completion sink and reject this client-report route.

The website and backend copies of `competitive.js`, `rankings.js` and `rankings.css` must stay identical. The embedded HTML omits the website's origin configuration script and uses the current server origin.

Validation: `node --test tools/competitive.test.cjs` and `node tools/check-competitive.cjs` (Playwright on `NODE_PATH`). Backend tests cover account-only recording, source validation, team identity, retries, rollback, pagination, progression, routes, migration upgrades and the existing multiplayer behavior. No APK, website package or release is built by this source-only change.
