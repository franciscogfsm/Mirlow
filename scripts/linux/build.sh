#!/usr/bin/env bash
# Builds the Linux package, Mirlow-amd64.deb, from the repository at $1 (a
# Windows checkout seen from WSL, say) into $1/release. The interface must
# already be built there (apps/desktop/dist); see scripts/build-linux.ps1.
#
# The work happens in a copy under $HOME: building in /mnt/c is slow, and the
# copy keeps its own node_modules and target.
#
# One-time setup on Ubuntu 24.04 (WSL works):
#   sudo apt install build-essential cmake ninja-build pkg-config libssl-dev libplist-dev \
#     libgstreamer1.0-dev libgstreamer-plugins-base1.0-dev libwebkit2gtk-4.1-dev \
#     libayatana-appindicator3-dev librsvg2-dev libxdo-dev libx11-dev rsync file curl
#   curl https://sh.rustup.rs | sh
set -euo pipefail

SOURCE="$(cd "${1:?usage: build.sh <repository>}" && pwd)"
WORK="${MIRLOW_LINUX_TREE:-$HOME/mirlow}"
export PATH="$HOME/.cargo/bin:$PATH"

[ -f "$SOURCE/apps/desktop/dist/index.html" ] || { echo "Build the interface first (npm run build in apps/desktop)."; exit 1; }

echo "== Copying the repository to $WORK"
mkdir -p "$WORK"
rsync -a --delete \
  --exclude .git --exclude node_modules --exclude target --exclude release \
  --exclude 'Mirlow TikTok' --exclude graphify-out \
  --exclude apps/desktop/src-tauri/resources/engine --exclude apps/desktop/src-tauri/resources/scrcpy \
  "$SOURCE/" "$WORK/"
cd "$WORK"

echo "== scrcpy"
bash scripts/linux/fetch-scrcpy.sh
ENGINE=apps/desktop/src-tauri/resources/engine/bin/mirlow-engine
if [ ! -x "$ENGINE" ] || [ "${MIRLOW_ENGINE:-}" = 1 ]; then
  echo "== Engine"
  bash scripts/linux/build-engine.sh
fi

echo "== Package"
[ -d node_modules/@tauri-apps/cli ] || npm ci --no-audit --no-fund --ignore-scripts
# The interface comes ready-built from the source tree.
(cd apps/desktop && node ../../node_modules/@tauri-apps/cli/tauri.js build --bundles deb \
  --config '{"build":{"beforeBuildCommand":""}}')

VERSION="$(node -p "require('./apps/desktop/src-tauri/tauri.conf.json').version")"
DEB="apps/desktop/src-tauri/target/release/bundle/deb/Mirlow_${VERSION}_amd64.deb"
mkdir -p "$SOURCE/release"
cp "$DEB" "$SOURCE/release/Mirlow-amd64.deb"
echo "Package: $SOURCE/release/Mirlow-amd64.deb ($(du -h "$DEB" | cut -f1))"
