import {
  format,
  getDictionary,
  matchLocale,
  type Dictionary,
  type Locale,
} from "@mirlow/i18n";
import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { LanguageSetting } from "./api";

interface I18n {
  locale: Locale;
  t: Dictionary["app"];
  brand: Dictionary["brand"];
  format: typeof format;
}

const I18nContext = createContext<I18n | null>(null);

export function resolveLocale(setting: LanguageSetting): Locale {
  return setting === "system" ? matchLocale(navigator.languages) : setting;
}

export function I18nProvider({
  language,
  children,
}: {
  language: LanguageSetting;
  children: ReactNode;
}) {
  const value = useMemo<I18n>(() => {
    const locale = resolveLocale(language);
    const dictionary = getDictionary(locale);
    return { locale, t: dictionary.app, brand: dictionary.brand, format };
  }, [language]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18n {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used inside <I18nProvider>");
  return value;
}
