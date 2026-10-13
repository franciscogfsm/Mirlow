import { defaultLocale, type Locale } from "@mirlow/i18n";

/** Public address of the site, without a trailing slash. Used for absolute links in metadata. */
export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://franciscogfsm.github.io"
).replace(/\/$/, "");

export const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export type PageId = "home" | "privacy" | "licenses";

const pagePaths: Record<PageId, string> = {
  home: "",
  privacy: "privacy/",
  licenses: "licenses/",
};

/**
 * The route for a page in a language. English lives at the root and other
 * languages under their code: `/privacy/` and `/pt/privacy/`.
 */
export function pagePath(locale: Locale, page: PageId = "home"): string {
  const prefix = locale === defaultLocale ? "/" : `/${locale}/`;
  return `${prefix}${pagePaths[page]}`;
}

/** A file in `public/`, with the base path applied. */
export function asset(path: string): string {
  return `${basePath}${path}`;
}
