import type { Locale } from "@mirlow/i18n";
import { en } from "./en";
import { pt } from "./pt";
import type { GuideId } from "./slugs";

export interface Guide {
  /** The page's heading. */
  title: string;
  /** A shorter name, for lists of guides. */
  short: string;
  /** What search results show: the title and the summary under it. */
  metaTitle: string;
  description: string;
  lead: string;
  /** Numbered instructions, when the guide is a how-to. */
  steps?: { title: string; body: string }[];
  sections: { title: string; body: string[] }[];
  faq: { q: string; a: string }[];
}

export type Guides = Record<GuideId, Guide>;

/** The day the guides were last revised, for search engines. */
export const guidesUpdated = "2026-10-13";

const guides: Record<Locale, Guides> = { en, pt };

export function getGuide(locale: Locale, id: GuideId): Guide {
  return guides[locale][id];
}
