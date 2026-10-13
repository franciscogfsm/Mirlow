# Third-party notices

Mirlow is free software, licensed under the GNU General Public License,
version 3 or (at your option) any later version. The full text is in
[`LICENSE`](LICENSE). Mirlow is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY, to the extent permitted by law.

Mirlow is built from, and distributed together with, the software below.

## AirPlay engine

**UxPlay** — <https://github.com/FDH2/UxPlay> — GPL-3.0.
Mirlow builds UxPlay from the commit recorded in `engine/UXPLAY_COMMIT` with
the patches in `engine/patches/` applied. Those patches are the complete set of
changes; they are installed with the app in `engine/licenses/uxplay/`.

UxPlay itself incorporates earlier work, including RPiPlay, AirplayServer,
shairplay and playfair (GPL-3.0 and LGPL-2.1), llhttp (MIT), and a minimal mDNS
responder. See UxPlay's own README and LICENSE for the full history and
attributions.

## Libraries shipped with the engine

The installer contains unmodified binaries of GStreamer and its plugins
(LGPL-2.1-or-later), OpenSSL (Apache-2.0), libplist (LGPL-2.1-or-later), GLib
(LGPL-2.1-or-later) and the libraries those depend on, all as packaged by the
[MSYS2](https://www.msys2.org) project for its UCRT64 environment.

**FFmpeg** — <https://ffmpeg.org> — LGPL-2.1-or-later. Mirlow builds FFmpeg
itself, from the unmodified release archive, with only the decoders it uses
(H.264, HEVC, AAC and ALAC) and no external libraries. The version and the
exact configuration are in `scripts/engine/build-ffmpeg.sh`.

The exact list for each build — package, version, licence and project URL — is
generated at build time into `engine/THIRD-PARTY-RUNTIME.md`, which is
installed with the app and attached to every release. The licence texts for
those packages are installed in `engine/licenses/`.

## Desktop application

The Mirlow window is built with [Tauri](https://tauri.app) (MIT or Apache-2.0),
[React](https://react.dev) (MIT), [Motion](https://motion.dev) (MIT),
[Radix UI](https://www.radix-ui.com) (MIT), [Tailwind CSS](https://tailwindcss.com)
(MIT), [Lucide](https://lucide.dev) icons (ISC), and the Rust crates listed in
`apps/desktop/src-tauri/Cargo.lock`, each under its own permissive licence.
On Windows it uses the Microsoft Edge WebView2 Runtime, which is a component of
Windows and is governed by Microsoft's terms.

## Getting the source code

The complete corresponding source for Mirlow — the application, the engine
integration, the UxPlay revision and patches, and the scripts that build and
package everything — is in the Mirlow repository:

<https://github.com/franciscogfsm/mirlow>

Each release is tagged, so the source for any installer can be checked out by
its version number. The sources of the MSYS2-packaged libraries are published
by MSYS2 (<https://github.com/msys2/MINGW-packages>, with source archives at
<https://repo.msys2.org/mingw/sources/>), and FFmpeg's by the FFmpeg project
(<https://ffmpeg.org/releases/>). If you cannot obtain any of them
there, open an issue on the Mirlow repository and we will provide the source
for the versions we distributed, for at least three years after that release.

## Trademarks

Mirlow is an independent project. It is not affiliated with, endorsed by, or
certified by Apple Inc. AirPlay, iPhone, iPad and Mac are trademarks of Apple
Inc. Windows is a trademark of the Microsoft group of companies. These names
are used only to describe what Mirlow works with.
