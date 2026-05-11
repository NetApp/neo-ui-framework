#!/usr/bin/env bash

set -euo pipefail

export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"

if ! command -v nvm >/dev/null 2>&1; then
  if [ -s "$NVM_DIR/nvm.sh" ]; then
    # shellcheck disable=SC1090
    . "$NVM_DIR/nvm.sh"
  fi
fi

if ! command -v nvm >/dev/null 2>&1; then
  echo "Error: nvm is required to run builds."
  echo "Install nvm and retry, or run the build from a shell where nvm is already loaded."
  exit 1
fi

nvm use 22 >/dev/null

if [[ "$(node -v)" != v22.* ]]; then
  echo "Error: expected Node 22 after 'nvm use 22', got $(node -v)."
  exit 1
fi

tsc -b
vite build --mode production