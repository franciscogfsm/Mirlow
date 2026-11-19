#!/usr/bin/env bash
# Downloads scrcpy's own Linux build (scrcpy, adb and the server, with no
# system dependencies) into apps/desktop/src-tauri/resources/scrcpy.
# Same version as scripts/fetch-scrcpy.ps1; change both together.
set -euo pipefail

VERSION=v5.0.1
SHA256=9f969d30cc574816077edecda65719c1c70b0aee1df1ba5fa00779ac07b8fd6e

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TARGET="$REPO/apps/desktop/src-tauri/resources/scrcpy"
if [ "$(cat "$TARGET/VERSION" 2>/dev/null)" = "$VERSION" ] && [ -x "$TARGET/scrcpy" ]; then
  echo "scrcpy $VERSION is already in place."
  exit 0
fi

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
NAME="scrcpy-linux-x86_64-$VERSION"
curl -fsSL -o "$WORK/scrcpy.tar.gz" "https://github.com/Genymobile/scrcpy/releases/download/$VERSION/$NAME.tar.gz"
echo "$SHA256  $WORK/scrcpy.tar.gz" | sha256sum -c --quiet
tar -xzf "$WORK/scrcpy.tar.gz" -C "$WORK"

rm -rf "$TARGET"
mkdir -p "$TARGET"
cp -a "$WORK/$NAME/." "$TARGET/"
curl -fsSL -o "$TARGET/LICENSE.txt" "https://raw.githubusercontent.com/Genymobile/scrcpy/$VERSION/LICENSE"
echo "$VERSION" > "$TARGET/VERSION"
ls "$TARGET"
