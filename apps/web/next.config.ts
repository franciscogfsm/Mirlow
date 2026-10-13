import type { NextConfig } from "next";

// The site is exported as plain static files, so it can be hosted anywhere
// for free. When it is served from a sub-path (a GitHub Pages project site,
// for instance), set NEXT_PUBLIC_BASE_PATH to that path, e.g. "/mirlow".
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

// The site's public address, for absolute links in metadata. Set
// NEXT_PUBLIC_SITE_URL to choose it; on Vercel it otherwise follows the
// project's production domain.
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "https://franciscogfsm.github.io");

const config: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath,
  env: {
    NEXT_PUBLIC_SITE_URL: siteUrl,
    // On Vercel the download goes through the site's own /download/ address,
    // which vercel.json forwards to the newest installer.
    NEXT_PUBLIC_DOWNLOAD_URL: process.env.VERCEL ? `${basePath}/download/` : "",
  },
  images: { unoptimized: true },
  transpilePackages: ["@mirlow/ui", "@mirlow/i18n"],
  reactStrictMode: true,
  // Lets the dev server be opened as 127.0.0.1 as well as localhost.
  allowedDevOrigins: ["127.0.0.1"],
};

export default config;
