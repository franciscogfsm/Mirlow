# Mirlow

**Your iPhone. On your PC. Just like that.**

Mirlow turns a Windows PC into a wireless screen for an iPhone, iPad or Mac,
using the Screen Mirroring that is already built into those devices. Open
Mirlow, pick the PC on the phone, and the phone's screen and sound are on the
PC. No app on the phone, no account, no cable. Free and open source.

Mirlow is an independent project. It is not affiliated with, endorsed by, or
certified by Apple Inc.

## How it is built

| Part | Where | What it is |
| --- | --- | --- |
| Desktop app | [`apps/desktop`](apps/desktop) | Tauri 2 (Rust) and React. The window, the notification-area icon, settings and diagnostics. |
| Engine integration | [`apps/desktop/src-tauri/src`](apps/desktop/src-tauri/src) | Runs and supervises the AirPlay engine, and places its video window inside the app. |
| AirPlay engine | [`engine`](engine) | [UxPlay](https://github.com/FDH2/UxPlay) at a pinned commit, plus two small [patches](engine/patches). Mirlow does not reimplement the protocol. |
| Website | [`apps/web`](apps/web) | Next.js, exported as static files. English and European Portuguese. |
| Design system | [`packages/ui`](packages/ui) | Colour tokens, the logo, and the Liquid Glass material used by both the app and the site. |
| Translations | [`packages/i18n`](packages/i18n) | One set of strings for the app and the site. |
| Build scripts | [`scripts`](scripts) | Build the engine, assemble its runtime, build the installer. |

Three decisions shape the rest:

- **Nothing to install besides Mirlow.** The installer carries the engine and
  every library it needs (GStreamer, FFmpeg and their dependencies). UxPlay is
  built with its internal mDNS responder, so Apple's Bonjour is not required.
- **The picture is drawn natively.** Video is decoded and rendered with
  Direct3D 11 by GStreamer, in a window that belongs to the engine. Mirlow
  adopts that window as a child of its own and lays it out; the web view never
  touches video frames. See [`video.rs`](apps/desktop/src-tauri/src/video.rs).
- **The engine tells Mirlow what is happening.** A patch makes UxPlay print one
  machine-readable line per state change, so the interface reflects real
  connections, real picture sizes and real disconnections. Nothing in the app
  is simulated.

## What has and has not been verified

Verified on Windows 11 (the machine this was built on):

- The engine builds, and runs from its bundled runtime with no MSYS2,
  GStreamer or Bonjour on the PATH.
- It advertises `_airplay._tcp` and `_raop._tcp` over mDNS on the Wi-Fi
  interface (observed with an independent mDNS listener).
- Mirlow starts it, tracks its state, restarts it after a crash, stops it
  cleanly on exit, and the engine never outlives the app.
- A real Direct3D 11 video window from another process is adopted, sized to
  the picture's proportions, follows portrait/landscape changes, and is
  released on disconnect (exercised with the development stand-in engine).
- The website builds, in both languages, with language detection and hreflang.
- The installer builds.

**Not verified here, because it needs an Apple device:** discovery from a real
iPhone, an actual mirroring session, sound, and input passing through the
picture to the window. Run [`docs/VALIDATION.md`](docs/VALIDATION.md) before
relying on it or publishing a release.

## Quick start

```powershell
git clone --recurse-submodules https://github.com/franciscogfsm/mirlow
cd mirlow
npm install
.\scripts\build-engine.ps1 -InstallDeps   # once: builds the AirPlay engine
npm run dev:desktop                       # the app
npm run dev:web                           # the website, at http://localhost:5184
```

Prerequisites and everything else are in
[`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md). Building the installer and
publishing a release are in [`docs/RELEASING.md`](docs/RELEASING.md).

## Licence

Mirlow is free software under the [GNU General Public License v3.0 or
later](LICENSE), the licence of the UxPlay engine it is built on. The software
shipped with it, and how to get all the source, are listed in
[`THIRD-PARTY-NOTICES.md`](THIRD-PARTY-NOTICES.md).

The licence covers the code. It does not cover the name "Mirlow" or the
Mirlow logo: a modified version has to be distributed under a different name
and its own branding, and must not suggest that it is the original.
