import { getDictionary, locales, type Locale } from "@mirlow/i18n";
import type { Metadata } from "next";
import { getGuide } from "@/content/guides";
import { asset, languageAlternates, pageUrl, siteUrl, type PageId } from "./site";

const openGraphLocales: Record<Locale, string> = { en: "en_GB", pt: "pt_PT" };

/** What a page is called and how it is summarised, in search results and when shared. */
export function describePage(locale: Locale, page: PageId): { title: string; description: string } {
  const site = getDictionary(locale).site;
  switch (page) {
    case "home":
      return { title: site.meta.title, description: site.meta.description };
    case "privacy":
      return { title: `${site.privacy.title} — Mirlow`, description: site.privacy.intro };
    case "licenses":
      return { title: `${site.licenses.title} — Mirlow`, description: site.licenses.intro };
    case "guides":
      return { title: site.guides.metaTitle, description: site.guides.intro };
    default: {
      const guide = getGuide(locale, page);
      return { title: guide.metaTitle, description: guide.description };
    }
  }
}

/** Title, description, canonical URL and hreflang alternates for one page in one language. */
export function buildMetadata(locale: Locale, page: PageId): Metadata {
  const site = getDictionary(locale).site;
  const { title, description } = describePage(locale, page);
  const url = pageUrl(locale, page);
  const image = `${siteUrl}${asset("/og.png")}`;
  const fixed = page === "home" || page === "privacy" || page === "licenses" || page === "guides";

  return {
    title,
    description,
    applicationName: "Mirlow",
    category: "technology",
    alternates: { canonical: url, languages: languageAlternates(page) },
    icons: { icon: asset("/favicon.svg"), apple: asset("/icon.png") },
    robots: {
      index: true,
      follow: true,
      googleBot: { "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
    },
    openGraph: {
      type: fixed ? "website" : "article",
      siteName: "Mirlow",
      title,
      description,
      url,
      locale: openGraphLocales[locale],
      alternateLocale: locales.filter((each) => each !== locale).map((each) => openGraphLocales[each]),
      images: [{ url: image, width: 1200, height: 630, alt: site.meta.ogAlt }],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}
