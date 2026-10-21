#!/usr/bin/env bash
set -Eeuo pipefail

for required in KUBECONFIG_B64 SHIPIT_WEBHOOK_URL SHIPIT_WEBHOOK_SECRET SHIPIT_PROJECT_SLUG IMAGE_REF GITHUB_SHA GITHUB_RUN_ID GITHUB_RUN_ATTEMPT; do
  if [[ -z "${!required:-}" ]]; then
    echo "Required deployment setting is missing: $required" >&2
    exit 2
  fi
done

if [[ ! "$IMAGE_REF" =~ ^ghcr\.io/[a-zA-Z0-9._/-]+@sha256:[a-f0-9]{64}$ ]]; then
  echo "IMAGE_REF must be a digest-pinned ghcr.io image reference." >&2
  exit 2
fi

run_id="github-${GITHUB_RUN_ID}-${GITHUB_RUN_ATTEMPT}"
config_file=$(mktemp)
reported_final=false
trap 'exit_code=$?; rm -f "$config_file"; if [[ $exit_code -ne 0 && "$reported_final" != true ]]; then send_event FAILED "Deployment workflow failed before reporting a final status." || true; fi' EXIT

send_event() {
  local status=$1
  local message=$2
  local event_id="${run_id}-${status,,}"
  local body signature

  body=$(jq -cn \
    --arg eventId "$event_id" \
    --arg projectSlug "$SHIPIT_PROJECT_SLUG" \
    --arg environment PRODUCTION \
    --arg commitSha "$GITHUB_SHA" \
    --arg imageRef "$IMAGE_REF" \
    --arg status "$status" \
    --arg message "$message" \
    --arg occurredAt "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
    --arg runId "$run_id" \
    --argjson runAttempt "$GITHUB_RUN_ATTEMPT" \
    '{eventId:$eventId, projectSlug:$projectSlug, environment:$environment, commitSha:$commitSha, imageRef:$imageRef, status:$status, message:$message, occurredAt:$occurredAt, runId:$runId, runAttempt:$runAttempt}')
  signature=$(printf '%s' "$body" | openssl dgst -sha256 -hmac "$SHIPIT_WEBHOOK_SECRET" -hex | awk '{print $2}')
  curl --fail --silent --show-error --retry 3 --retry-all-errors --retry-delay 2 \
    -H 'content-type: application/json' \
    -H "x-shipit-signature: sha256=$signature" \
    --data-binary "$body" \
    "$SHIPIT_WEBHOOK_URL"
  printf '\n'
}

printf '%s' "$KUBECONFIG_B64" | base64 --decode > "$config_file"
chmod 600 "$config_file"
export KUBECONFIG="$config_file"

send_event RUNNING "Kubernetes rollout started for $IMAGE_REF"

if ./deploy/kubernetes/deploy.sh "$IMAGE_REF"; then
  send_event SUCCEEDED "Kubernetes rollout completed successfully for $IMAGE_REF"
  reported_final=true
else
  deploy_exit_code=$?
  send_event FAILED "Kubernetes rollout failed; inspect this GitHub Actions run for diagnostics."
  reported_final=true
  exit "$deploy_exit_code"
fi
