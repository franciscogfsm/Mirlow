import { defaultLocale, localeTags, locales, type Locale } from "@mirlow/i18n";
import { guideIds, guideSlugs, guidesSegment, type GuideId } from "@/content/guides/slugs";

/** Public address of the site, without a trailing slash. Used for absolute links in metadata. */
export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://franciscogfsm.github.io"
).replace(/\/$/, "");

export const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

type FixedPage = "home" | "privacy" | "licenses";

/** A page of the site: one of the fixed ones, the list of guides, or a single guide. */
export type PageId = FixedPage | "guides" | GuideId;

const fixedPaths: Record<FixedPage, string> = {
  home: "",
  privacy: "privacy/",
  licenses: "licenses/",
};

/** Every page that search engines should know about, most important first. */
export const indexedPages: PageId[] = ["home", "guides", ...guideIds, "privacy", "licenses"];

/**
 * The route for a page in a language. English lives at the root and other
 * languages under their code: `/privacy/` and `/pt/privacy/`. Guides also have
 * their address translated: `/guides/mirror-iphone-to-pc/` and
 * `/pt/guias/espelhar-iphone-no-pc/`.
 */
export function pagePath(locale: Locale, page: PageId = "home"): string {
  const prefix = locale === defaultLocale ? "/" : `/${locale}/`;
  if (page === "guides") return `${prefix}${guidesSegment[locale]}/`;
  if (page in fixedPaths) return `${prefix}${fixedPaths[page as FixedPage]}`;
  return `${prefix}${guidesSegment[locale]}/${guideSlugs[page as GuideId][locale]}/`;
}

/** The full public address of a page. */
export function pageUrl(locale: Locale, page: PageId = "home"): string {
  return `${siteUrl}${basePath}${pagePath(locale, page)}`;
}

/**
 * The same page in every language, keyed by hreflang. Portuguese is listed
 * twice so that Portuguese speakers outside Portugal are sent to it too.
 */
export function languageAlternates(page: PageId): Record<string, string> {
  const languages: Record<string, string> = { "x-default": pageUrl(defaultLocale, page) };
  for (const each of locales) languages[localeTags[each]] = pageUrl(each, page);
  languages.pt = pageUrl("pt", page);
  return languages;
}

/** A file in `public/`, with the base path applied. */
export function asset(path: string): string {
  return `${basePath}${path}`;
}
