# Developing Mirlow

Everything here is for Windows 10 or 11, 64-bit.

## Prerequisites

| Tool | Why | Install |
| --- | --- | --- |
| Node.js 20.19 or newer | The app's interface and the website | <https://nodejs.org> |
| Rust (stable, **GNU** toolchain) | The desktop app | See below |
| MSYS2 | Builds the AirPlay engine and supplies its libraries | <https://www.msys2.org>, default location `C:\msys64` |
| Git | Source and the UxPlay submodule | <https://git-scm.com> |

Rust, with the GNU toolchain (it links with MinGW, which MSYS2 already
provides, so the multi-gigabyte Windows SDK is not needed):

```powershell
winget install Rustlang.Rustup
rustup default stable-x86_64-pc-windows-gnu
```

The scripts add `%USERPROFILE%\.cargo\bin` and `C:\msys64\ucrt64\bin` to the
PATH themselves. When you run `npm run dev:desktop` directly, both need to be
on your PATH (the second provides `windres` and `dlltool`).

## Commands

Run from the repository root.

```powershell
npm install                               # JavaScript dependencies for everything

.\scripts\build-engine.ps1 -InstallDeps   # build the engine (installs MSYS2 packages first)
.\scripts\build-engine.ps1                # rebuild the engine later

npm run dev:desktop                       # run the app with hot reload
npm run dev:web                           # run the website at http://localhost:5184
npm run typecheck                         # TypeScript, all packages
npm run build:web                         # static site into apps\web\out

.\scripts\build-installer.ps1             # the installer, into .\release\
```

`build-engine.ps1` copies UxPlay to a work folder, applies `engine/patches`,
builds it with CMake and Ninja, and assembles a self-contained runtime (the
engine, the GStreamer plugins it uses, every DLL those need, and their licence
texts) in `apps/desktop/src-tauri/resources/engine`. That folder is generated
and not committed.

### If the repository is in a synced folder

Rust's build output is several gigabytes of small files. In OneDrive or
Dropbox, point it elsewhere before building:

```powershell
$env:CARGO_TARGET_DIR = "$env:LOCALAPPDATA\MirlowBuild\cargo-target"
```

`build-installer.ps1` does this for you.

## Working on the interface without a phone

Two development-only tools. Neither is included in release builds.

**Interface preview.** With `npm run dev -w @mirlow/desktop` running, open
<http://127.0.0.1:5183/preview.html> in Edge or Chrome. The backend is replaced
by canned answers, and the address chooses the state:

```
preview.html?phase=ready&theme=dark&lang=pt
preview.html?phase=connecting
preview.html?phase=error
preview.html?phase=ready&sheet=settings
preview.html?phase=ready&sheet=help&network=public
```

**Stand-in engine.** `scripts/dev/fake-engine.c` speaks the engine's protocol
and opens a real Direct3D 11 window showing a test pattern: a device connects,
shows a portrait picture, rotates to landscape and back, and disconnects, on a
loop. It exercises the window adoption, layout and resizing code for real.

```bash
# in an MSYS2 UCRT64 shell
gcc -o fake-engine.exe scripts/dev/fake-engine.c $(pkg-config --cflags --libs gstreamer-1.0)
```

```powershell
$env:MIRLOW_DEV_ENGINE_EXE = "C:\path\to\fake-engine.exe"
npm run dev:desktop
```

Only debug builds read `MIRLOW_DEV_ENGINE_EXE`.

## How the pieces talk

```
iPhone ── AirPlay over the local network ──▶ mirlow-engine.exe (UxPlay)
                                               │  stdout: "@@mirlow <event> …"
                                               │  stdin closing = "please exit"
                                               ▼
                              engine.rs (supervisor, in the Tauri backend)
                                               │  event "engine:status"
                                               ▼
                                   React interface (App.tsx)
                                               │  command "layout_video"
                                               ▼
                       video.rs positions the engine's Direct3D window
```

Events the engine prints (see `engine/patches/0001-…`): `ready`, `client`,
`connections`, `video-codec`, `video-size`, `video-reset`.

## Updating UxPlay

```powershell
git -C engine/uxplay fetch
git -C engine/uxplay checkout <commit>
git -C engine/uxplay rev-parse HEAD > engine/UXPLAY_COMMIT
.\scripts\build-engine.ps1
```

If a patch no longer applies, the build stops and says which. Re-create it
against the new source and run [`VALIDATION.md`](VALIDATION.md) again.
`engine/patches/README.md` explains what each patch is for; patch 0002 fixes a
discovery bug in UxPlay's Windows build that is worth offering upstream.

## Things to know

- **Dev server ports** are 5183 (app) and 5184 (site), deliberately above 5000:
  Windows with Hyper-V or WSL reserves blocks of lower ports.
- **Refraction** in the Liquid Glass material uses an SVG filter as a
  `backdrop-filter`, which only Chromium-based engines render. That covers the
  app (WebView2) and Chrome/Edge on the site; Safari and Firefox get frosted
  glass.
- **CSS layers.** Unlayered CSS beats every Tailwind utility. The shared glass
  styles and each app's base styles are therefore placed in the `components`
  layer.
- **Installer size** is dominated by FFmpeg and the codecs MSYS2 links it
  against. A leaner FFmpeg build would shrink it considerably.
