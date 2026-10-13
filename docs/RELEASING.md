# Releasing Mirlow

A release is a tagged commit, an installer attached to a GitHub Release, and
the website pointing at it.

## 1. Build

```powershell
# set the same version in apps\desktop\src-tauri\tauri.conf.json,
# apps\desktop\src-tauri\Cargo.toml and the package.json files, then:
.\scripts\build-installer.ps1 -Engine
```

This leaves three files in `.\release\`:

- `Mirlow-Setup-x64.exe` — the installer
- `THIRD-PARTY-RUNTIME.md` — the exact libraries bundled in this build
- `SHA256SUMS.txt` — checksums

## 2. Test

Install it on a PC (ideally one that has never had development tools on it)
and go through [`VALIDATION.md`](VALIDATION.md) with a real iPhone. Also check:

- a desktop shortcut and a Start menu entry were created;
- Windows did **not** show a firewall prompt on first launch (the installer
  adds the rule);
- uninstalling removes the app, the shortcut and the firewall rule.

## 3. Publish

```powershell
git tag v0.1.0
git push origin main --tags
gh release create v0.1.0 `
  .\release\Mirlow-Setup-x64.exe `
  .\release\THIRD-PARTY-RUNTIME.md `
  .\release\SHA256SUMS.txt `
  --title "Mirlow 0.1.0" --notes "First release."
```

Then upload `Mirlow-Setup-x64.exe` to <https://www.virustotal.com>. The
website's "Open the VirusTotal report" link is built from the installer's
checksum (the build wrote it to `packages/i18n/src/release.ts`), so the link
shows "not found" until that exact file has been uploaded once. Read the
report before promoting the release: unsigned installers sometimes get a few
false positives, which is one more reason to sign (see below). Commit
`release.ts` and deploy the site together with the release, so the checksum
on the site is the one people download.

The website's download button links to
`…/releases/latest/download/Mirlow-Setup-x64.exe`, so it follows the newest
release automatically. Keep that file name.

Publishing the tag together with the binaries is what satisfies the GPL's
source requirement: the tag is the exact source of that installer, including
the UxPlay commit (as a submodule) and the patches.

## 4. Website

The site is static. `.github/workflows/pages.yml` builds and publishes it to
GitHub Pages on every push to `main` that touches it. One-time setup: in the
repository's **Settings → Pages**, set **Source** to **GitHub Actions**.

### Vercel

`vercel.json` at the root of the repository holds the build settings, so
there is nothing to configure: in Vercel choose **Add New → Project**, import
the repository and press **Deploy** (or run `npx vercel --prod` from the
repository root). Leave **Root Directory** empty. Canonical links follow the
project's production domain; set `NEXT_PUBLIC_SITE_URL` in the project's
environment variables to use a different address.

### Anywhere else

To host it elsewhere (Cloudflare Pages, Netlify, any static host):

```powershell
$env:NEXT_PUBLIC_SITE_URL = "https://your-domain.example"   # no trailing slash
npm run build:web                                          # output: apps\web\out
```

If the repository or the site moves, update `packages/i18n/src/links.ts`.

### Search engines

The build writes `sitemap.xml`, `robots.txt` and `llms.txt` for whatever
address the site is built for. After the first deploy, tell the search engines
the site exists; nothing appears in results until they have crawled it:

1. In [Google Search Console](https://search.google.com/search-console) add
   the site as a **URL prefix** property and choose the **HTML tag** method.
   Copy the tag's `content` value into an environment variable named
   `GOOGLE_SITE_VERIFICATION` (in Vercel: **Settings → Environment
   Variables**), redeploy, then press **Verify**.
2. Submit `https://your-domain/sitemap.xml` under **Sitemaps**.
3. Do the same in [Bing Webmaster Tools](https://www.bing.com/webmasters)
   with `BING_SITE_VERIFICATION`, or import the site from Search Console.

The guides live in `apps/web/src/content/guides/`. To add one, add its
address to `slugs.ts` and its text to `en.ts` and `pt.ts`; the page, its
metadata, the sitemap entry and the footer link follow from that.

## Code signing

The installer is not signed. Windows SmartScreen will therefore warn people
who download it ("Windows protected your PC") until the file has built up
reputation, and some antivirus products are suspicious of unsigned installers.
Signing is the single most valuable thing to add before promoting Mirlow
widely. Options:

- [SignPath Foundation](https://signpath.org) signs open-source projects for
  free;
- Azure Trusted Signing, or a certificate from a certificate authority.

Tauri signs during the build once `bundle.windows.signCommand` (or a
certificate thumbprint) is set in `tauri.conf.json`.

## About protecting the executable

Mirlow is licensed under the GPL, as UxPlay requires, so its source is public
by design and obfuscating the binary would achieve nothing. The release build
is optimised, stripped of debug symbols and LZMA-compressed for size. What
keeps users safe is different: a signed installer, an app that makes no
internet connections, a firewall rule that covers only the engine, and source
anyone can audit.
