import { getDictionary, localeTags, locales, type Locale } from "@mirlow/i18n";
import type { Metadata } from "next";
import { asset, basePath, pagePath, siteUrl, type PageId } from "./site";

function absolute(locale: Locale, page: PageId): string {
  return `${siteUrl}${basePath}${pagePath(locale, page)}`;
}

const openGraphLocales: Record<Locale, string> = { en: "en_GB", pt: "pt_PT" };

/** Title, description, canonical URL and hreflang alternates for one page in one language. */
export function buildMetadata(locale: Locale, page: PageId): Metadata {
  const site = getDictionary(locale).site;
  const title =
    page === "home"
      ? site.meta.title
      : `${page === "privacy" ? site.privacy.title : site.licenses.title} — Mirlow`;
  const description =
    page === "home"
      ? site.meta.description
      : page === "privacy"
        ? site.privacy.intro
        : site.licenses.intro;

  const languages: Record<string, string> = { "x-default": absolute("en", page) };
  for (const each of locales) languages[localeTags[each]] = absolute(each, page);

  return {
    title,
    description,
    applicationName: "Mirlow",
    alternates: { canonical: absolute(locale, page), languages },
    icons: { icon: asset("/favicon.svg"), apple: asset("/icon.png") },
    openGraph: {
      type: "website",
      siteName: "Mirlow",
      title,
      description,
      url: absolute(locale, page),
      locale: openGraphLocales[locale],
      alternateLocale: locales.filter((each) => each !== locale).map((each) => openGraphLocales[each]),
      images: [{ url: `${siteUrl}${asset("/og.png")}`, width: 1200, height: 630, alt: site.meta.ogAlt }],
    },
    twitter: { card: "summary_large_image", title, description, images: [`${siteUrl}${asset("/og.png")}`] },
  };
}
