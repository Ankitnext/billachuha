#!/usr/bin/env bash
# Public branch/tag routing shared by this repository's CI jobs.
set -euo pipefail
: "${GITHUB_OUTPUT:?}" "${GITHUB_REPOSITORY:?}" "${GITHUB_REF:?}" "${GITHUB_SHA:?}" "${GITHUB_EVENT_NAME:?}" "${DEFAULT_BRANCH:?}"
environment=''
publish=false
if [[ "$GITHUB_EVENT_NAME" != pull_request ]]; then
  if [[ "$GITHUB_REF" == refs/heads/staging ]]; then environment=staging; publish=true
  elif [[ "$GITHUB_REF" == "refs/heads/$DEFAULT_BRANCH" ]]; then environment=production; publish=true
  elif [[ "$GITHUB_REF" == refs/tags/v* ]]; then publish=true
  fi
fi
image="ghcr.io/${GITHUB_REPOSITORY,,}"
{
  echo "environment=$environment"
  echo "publish=$publish"
  echo "image=$image"
  echo 'tags<<TAGS'
  echo "$image:sha-$GITHUB_SHA${environment:+-$environment}"
  if [[ -n "$environment" ]]; then echo "$image:$environment"; fi
  if [[ "$environment" == production ]]; then echo "$image:latest"; fi
  if [[ "$GITHUB_REF" == refs/tags/v* ]]; then echo "$image:${GITHUB_REF#refs/tags/}"; fi
  echo 'TAGS'
} >> "$GITHUB_OUTPUT"
