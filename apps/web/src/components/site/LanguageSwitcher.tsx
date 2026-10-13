"use client";

import { locales, localeTags, type Locale } from "@mirlow/i18n";
import Link from "next/link";
import { pagePath, type PageId } from "@/lib/site";

/**
 * Two letters per language, the current one in full ink. Choosing one is
 * remembered, so automatic detection never overrides it afterwards.
 */
export function LanguageSwitcher({
  locale,
  page,
  label,
}: {
  locale: Locale;
  page: PageId;
  label: string;
}) {
  return (
    <nav aria-label={label} className="flex items-center gap-0.5 text-[13px] font-medium">
      {locales.map((each) => {
        const current = each === locale;
        return (
          <Link
            key={each}
            href={pagePath(each, page)}
            hrefLang={localeTags[each]}
            lang={localeTags[each]}
            aria-current={current ? "true" : undefined}
            onClick={() => {
              try {
                localStorage.setItem("mirlow-locale", each);
              } catch {
                // Private browsing: the choice simply is not remembered.
              }
            }}
            className={`rounded-full px-2 py-1 uppercase tracking-wide transition-colors duration-300 ${
              current ? "text-ink" : "text-faint hover:text-ink"
            }`}
          >
            {each}
          </Link>
        );
      })}
    </nav>
  );
}
