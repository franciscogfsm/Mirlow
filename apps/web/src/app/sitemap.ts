import { locales } from "@mirlow/i18n";
import type { MetadataRoute } from "next";
import { guidesUpdated } from "@/content/guides";
import { indexedPages, languageAlternates, pageUrl } from "@/lib/site";

export const dynamic = "force-static";

/** Every page in every language, each pointing at its translations. */
export default function sitemap(): MetadataRoute.Sitemap {
  return indexedPages.flatMap((page) =>
    locales.map((locale) => ({
      url: pageUrl(locale, page),
      lastModified: guidesUpdated,
      changeFrequency: "monthly" as const,
      priority: page === "home" ? 1 : page === "privacy" || page === "licenses" ? 0.3 : 0.8,
      alternates: { languages: languageAlternates(page) },
    })),
  );
}
