#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 ghcr.io/OWNER/IMAGE:TAG_OR_DIGEST" >&2
  exit 2
fi

image_ref=$1
if [[ ! "$image_ref" =~ ^ghcr\.io/[a-zA-Z0-9._/-]+(:[a-zA-Z0-9_][a-zA-Z0-9_.-]*|@sha256:[a-f0-9]{64})$ ]]; then
  echo "Image must be a tagged or digest-pinned ghcr.io reference." >&2
  exit 2
fi

script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
manifest="$script_dir/app.yaml"
rendered_manifest=$(mktemp)
trap 'rm -f "$rendered_manifest"' EXIT

sed "s#ghcr.io/example/shiplt-sample-app:latest#$image_ref#g" "$manifest" > "$rendered_manifest"

kubectl apply -f "$rendered_manifest"

if ! kubectl -n shipit-demo rollout status deployment/sample-app --timeout=180s; then
  echo "Deployment did not become ready. Recent diagnostics:" >&2
  kubectl -n shipit-demo get pods -o wide >&2 || true
  kubectl -n shipit-demo describe deployment/sample-app >&2 || true
  kubectl -n shipit-demo logs deployment/sample-app --all-containers=true --tail=100 >&2 || true
  exit 1
fi

echo "Sample app is ready with image $image_ref"
