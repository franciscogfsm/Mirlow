import { getDictionary, links, type Locale } from "@mirlow/i18n";
import { Wordmark } from "@mirlow/ui";
import Link from "next/link";
import type { ReactNode } from "react";
import { pagePath, type PageId } from "@/lib/site";
import { Nav } from "./Nav";

/** What every page shares: the backdrop, the navigation and the footer. */
export function SiteFrame({
  locale,
  page,
  children,
}: {
  locale: Locale;
  page: PageId;
  children: ReactNode;
}) {
  const t = getDictionary(locale).site;

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-paper"
      >
        {t.nav.skip}
      </a>

      <div className="backdrop" aria-hidden="true">
        <div className="glow glow-a" />
        <div className="glow glow-b" />
        <div className="glow glow-c" />
      </div>

      <Nav locale={locale} page={page} />
      <main id="main">{children}</main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-[1120px] flex-col gap-8 px-6 py-12 md:flex-row md:items-start md:justify-between">
          <div className="max-w-[440px]">
            <Wordmark size={18} gradient={false} />
            <p className="mt-4 text-[13px] leading-relaxed text-faint">{t.footer.disclaimer}</p>
          </div>
          <nav className="flex flex-wrap gap-x-7 gap-y-3 text-[14px] text-soft">
            <Link className="transition-colors hover:text-ink" href={pagePath(locale, "privacy")}>
              {t.footer.privacy}
            </Link>
            <Link className="transition-colors hover:text-ink" href={pagePath(locale, "licenses")}>
              {t.footer.licenses}
            </Link>
            <a className="transition-colors hover:text-ink" href={links.repository}>
              {t.footer.source}
            </a>
            <a className="transition-colors hover:text-ink" href={links.releases}>
              {t.footer.releases}
            </a>
          </nav>
        </div>
        <p className="mx-auto max-w-[1120px] px-6 pb-10 text-[13px] text-faint">{t.footer.rights}</p>
      </footer>
    </>
  );
}
