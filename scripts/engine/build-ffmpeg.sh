#!/usr/bin/env bash
# Builds the FFmpeg libraries the engine ships: the same version MSYS2's
# gst-libav was compiled against, with only the decoders the receiver uses.
#
# MSYS2's own FFmpeg links every codec it knows (x265, AV1 encoders, JPEG XL,
# Vulkan shader compilers, ...), which is most of the runtime's size and none
# of what an AirPlay receiver needs. This build is a drop-in replacement with
# the same DLL names and ABI, and no external libraries.
#
# Called by build-engine.sh. Prints nothing useful on its own; the DLLs end up
# in $FFMPEG_OUT/bin.
set -euo pipefail

FFMPEG_VERSION=9.0.2
# The same archive MSYS2's own recipe for this version checks against.
FFMPEG_SHA256=8c3850283eb25fa026482078a04051e0be17347b09ef81a0849bec15a96e002e
# H.264 and HEVC for the picture, AAC-ELD and ALAC for the sound.
FFMPEG_CONFIG=(
  --disable-static --enable-shared
  --disable-programs --disable-doc --disable-debug
  --disable-autodetect --disable-network --disable-avdevice
  --disable-everything
  --enable-decoder=h264,hevc,aac,alac
  --enable-parser=h264,hevc,aac
)

PKG=mingw-w64-ucrt-x86_64
WORK="${MIRLOW_BUILD_DIR:-$(cygpath -u "$LOCALAPPDATA")/MirlowBuild}/ffmpeg"
FFMPEG_OUT="$WORK/out"
STAMP="$FFMPEG_OUT/.built"
WANT="$FFMPEG_VERSION ${FFMPEG_CONFIG[*]}"

# gst-libav is used as MSYS2 built it, so the libraries under it have to be
# the version it was built for.
installed="$(pacman -Q "$PKG-ffmpeg" | awk '{print $2}')"
if [ "${installed%%-*}" != "$FFMPEG_VERSION" ]; then
  echo "MSYS2 has FFmpeg ${installed%%-*}, this script builds $FFMPEG_VERSION."
  echo "Update FFMPEG_VERSION and FFMPEG_SHA256 in scripts/engine/build-ffmpeg.sh to match."
  exit 1
fi

if [ -f "$STAMP" ] && [ "$(cat "$STAMP")" = "$WANT" ]; then
  echo "FFmpeg $FFMPEG_VERSION is already built"
  exit 0
fi

mkdir -p "$WORK"
cd "$WORK"
TARBALL="ffmpeg-$FFMPEG_VERSION.tar.xz"
[ -f "$TARBALL" ] || curl -fsSLO "https://ffmpeg.org/releases/$TARBALL"
echo "$FFMPEG_SHA256 *$TARBALL" | sha256sum -c -

rm -rf "ffmpeg-$FFMPEG_VERSION" "$FFMPEG_OUT"
tar -xf "$TARBALL"
cd "ffmpeg-$FFMPEG_VERSION"
./configure --prefix="$FFMPEG_OUT" "${FFMPEG_CONFIG[@]}"
make -j"$(nproc)"
make install

echo "$WANT" > "$STAMP"
