#!/usr/bin/env sh
# Runs after `astro build` (see package.json "postbuild").
#
# Writes the Markdown twin (index.md) next to every built index.html so
# functions/_middleware.js can answer `Accept: text/markdown` without converting
# HTML at request time. Needs Python 3 only; if it is missing the site still
# deploys, but Markdown negotiation degrades to HTML — `npm test` catches that.
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PY="${PYTHON:-python3}"

if ! command -v "$PY" >/dev/null 2>&1; then
  echo "postbuild: no $PY on PATH; skipping Markdown twins (HTML will be served to every client)." >&2
  exit 0
fi

exec "$PY" scripts/generate_markdown.py
