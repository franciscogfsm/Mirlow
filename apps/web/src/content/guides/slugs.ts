import type { Locale } from "@mirlow/i18n";

// The guides' addresses, apart from their text: this file is small enough to
// be imported anywhere, including the language switcher in the browser.

export const guideIds = ["iphone", "airplay", "ipad", "not-showing", "black-screen", "built-in"] as const;
export type GuideId = (typeof guideIds)[number];

/** The folder the guides live in, per language: `/guides/` and `/pt/guias/`. */
export const guidesSegment: Record<Locale, string> = { en: "guides", pt: "guias" };

/** Each guide's address in each language, written the way people search for it. */
export const guideSlugs: Record<GuideId, Record<Locale, string>> = {
  iphone: { en: "mirror-iphone-to-pc", pt: "espelhar-iphone-no-pc" },
  airplay: { en: "airplay-receiver-for-windows", pt: "airplay-para-windows" },
  ipad: { en: "mirror-ipad-to-pc", pt: "espelhar-ipad-no-pc" },
  "not-showing": {
    en: "pc-not-showing-in-screen-mirroring",
    pt: "pc-nao-aparece-na-projecao-do-ecra",
  },
  "black-screen": {
    en: "black-screen-when-mirroring-iphone",
    pt: "ecra-preto-ao-espelhar-iphone",
  },
  "built-in": { en: "does-windows-support-airplay", pt: "o-windows-tem-airplay" },
};

export function isGuideId(value: string): value is GuideId {
  return (guideIds as readonly string[]).includes(value);
}

export function guideIdFromSlug(locale: Locale, slug: string): GuideId | undefined {
  return guideIds.find((id) => guideSlugs[id][locale] === slug);
}
