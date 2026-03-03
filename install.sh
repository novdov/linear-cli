#!/usr/bin/env bash
set -euo pipefail

INSTALL_DIR="${1:-/usr/local/bin}"

if ! command -v bun &>/dev/null; then
  echo "Error: bun is required but not installed." >&2
  exit 1
fi

echo "Installing dependencies..."
bun install

echo "Building binary..."
bun run build

echo "Installing to ${INSTALL_DIR}..."
mkdir -p "$INSTALL_DIR"
cp dist/linear "$INSTALL_DIR/linear"
chmod +x "$INSTALL_DIR/linear"

echo "Done. Run 'linear --help' to get started."
