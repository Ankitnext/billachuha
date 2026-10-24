#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

environment="${1:-}"
[[ "$environment" == staging || "$environment" == production ]] || { echo 'Usage: WEB_IMAGE=... bash deploy/update.sh staging|production' >&2; exit 1; }
: "${WEB_IMAGE:?Set WEB_IMAGE to the image tag or digest to deploy}"
[[ "$WEB_IMAGE" =~ ^ghcr\.io/[a-z0-9._/-]+(:[a-zA-Z0-9._-]+|@sha256:[a-f0-9]{64})$ ]] || { echo 'Expected a ghcr.io image tag or digest.' >&2; exit 1; }
test -f .env || { echo 'Configure this environment .env before deploying.' >&2; exit 1; }
configured=$(sed -n 's/^DEPLOY_ENV=//p' .env | tr -d '\r')
[[ "$configured" == "$environment" ]] || { echo 'Requested environment does not match DEPLOY_ENV in .env.' >&2; exit 1; }
export DEPLOY_ENV="$environment" WEB_IMAGE
# Keep this application's registry login separate from other VPS projects.
export DOCKER_CONFIG="${BILLACHUHA_DOCKER_CONFIG:-/opt/billachuha/docker-config}"
compose=(docker compose --project-name "billachuha-web-$environment" --env-file .env)
previous=''
if [[ -f .current-image ]]; then previous=$(cat .current-image); fi
"${compose[@]}" pull website
image_environment=$(docker image inspect --format '{{ index .Config.Labels "com.billachuha.environment" }}' "$WEB_IMAGE")
[[ "$image_environment" == "$environment" ]] || { echo 'Website image belongs to a different environment.' >&2; exit 1; }
resolved=$(docker image inspect --format '{{ index .RepoDigests 0 }}' "$WEB_IMAGE")
[[ "$resolved" =~ ^ghcr\.io/[a-z0-9._/-]+@sha256:[a-f0-9]{64}$ ]] || { echo 'Could not resolve an immutable website image digest.' >&2; exit 1; }
export WEB_IMAGE="$resolved"
if "${compose[@]}" up -d --no-deps --force-recreate --wait --wait-timeout 90 website; then
  if [[ -n "$previous" ]]; then printf '%s\n' "$previous" > .previous-image; fi
  printf '%s\n' "$WEB_IMAGE" > .current-image
  echo "$environment website deployment is healthy."
else
  echo "$environment deployment failed." >&2
  if [[ -n "$previous" ]]; then
    echo 'Restoring the previous image for this environment.' >&2
    export WEB_IMAGE="$previous"
    "${compose[@]}" up -d --no-deps --force-recreate --wait --wait-timeout 90 website || true
  fi
  exit 1
fi
