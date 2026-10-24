# Billa Chuha website

This repository owns the browser arcade: homepage, game pages, JavaScript, styles, images and audio. The project now has three independent Git repositories:

| Repository | Local checkout | Owns |
| --- | --- | --- |
| [billachuha](https://github.com/Ankitnext/billachuha) | `D:\Custom\billachuha\billachuha` | Static website |
| [billachuha_app](https://github.com/Ankitnext/billachuha_app) | `D:\Custom\billachuha\billachuha_app` | Native Android, offline Long Run and Android tests |
| [billachuha_backend](https://github.com/Ankitnext/billachuha_backend) | `D:\Custom\billachuha\billachuha_backend` | Go/Gin API, accounts, leaderboard, Chase server, shared Chase screen and Docker deployment |

Each repository builds from its own root without a parent checkout. Only the optional cross-platform device harness expects app and backend beside each other. No submodules or nested repositories are needed.

## Build and serve

Use Node.js 24 to build the public upload directory (no npm dependencies):

```powershell
node tools/build.mjs
```

Serve or upload **only `dist/`**. The build copies public files using an allowlist; Git metadata, local configuration and tools stay out of the artifact. Homepage image paths work at a domain root and under a GitHub Pages repository path. You can also serve this repository directly with a static web server during development.

## Connect multiplayer

The homepage's **Play multiplayer** link opens the shared Chase screen at the configured backend's `/multiplayer` URL. Android opens that server's `/multiplayer/app` inside the native app. Both platforms share rooms, bots and gameplay through one Go server.

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

## Repository split

All three existing Git remotes were preserved. App files, local configuration and build outputs moved to the app checkout; Go files and its database moved to the backend checkout. The move verified 855 app files and 68 backend files by SHA-256 before follow-up configuration edits.

Previously staged Android content was preserved locally at `D:\Custom\billachuha\tools\repo-split-20261023\website-staged-app.patch` before removing those paths from this website's index. The old Node auth server and monorepo instructions are archived in `billachuha_backend/legacy/`, excluded from current Docker/CI. This local split does not commit, push or deploy the repositories.
