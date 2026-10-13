import { en, type Dictionary } from "./en";
import { pt } from "./pt";

export type { Dictionary };
export { links } from "./links";

export const locales = ["en", "pt"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export const dictionaries: Record<Locale, Dictionary> = { en, pt };

/** BCP 47 tags, for `lang` attributes and hreflang. */
export const localeTags: Record<Locale, string> = { en: "en", pt: "pt-PT" };

/** Each language's own name, for the language switcher. */
export const localeNames: Record<Locale, string> = { en: "English", pt: "Português" };

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}

/** Picks the best supported locale from a list such as `navigator.languages`. */
export function matchLocale(preferred: readonly string[] | undefined): Locale {
  for (const tag of preferred ?? []) {
    const base = tag.toLowerCase().split("-")[0];
    if (isLocale(base)) return base;
  }
  return defaultLocale;
}

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

/** Replaces `{name}` placeholders in a translated string. */
export function format(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}
export { release } from "./release";
