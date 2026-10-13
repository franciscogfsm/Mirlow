import { getDictionary, type Locale } from "@mirlow/i18n";
import { LiquidGlass, Wordmark } from "@mirlow/ui";
import Link from "next/link";
import { pagePath, type PageId } from "@/lib/site";
import { DownloadButton } from "./DownloadButton";
import { LanguageSwitcher } from "./LanguageSwitcher";

/** A single bar of glass that floats over the page and bends whatever scrolls beneath it. */
export function Nav({ locale, page }: { locale: Locale; page: PageId }) {
  const t = getDictionary(locale).site;
  const home = pagePath(locale);
  const sections = [
    { href: `${home}#how`, label: t.nav.how },
    { href: `${home}#features`, label: t.nav.features },
    { href: `${home}#faq`, label: t.nav.faq },
  ];

  return (
    <header className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <LiquidGlass
        radius={999}
        bezel={18}
        depth={26}
        frost={3}
        className="w-full max-w-[880px]"
        contentClassName="flex h-[60px] items-center justify-between gap-4 pl-6 pr-2.5"
      >
        <Link href={home} aria-label="Mirlow" className="rounded-full">
          <Wordmark size={19} gradient={false} />
        </Link>

        <nav className="hidden items-center gap-7 text-[14px] text-soft md:flex">
          {sections.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className="transition-colors duration-300 hover:text-ink"
            >
              {section.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2.5">
          <LanguageSwitcher locale={locale} page={page} label={t.nav.language} />
          <DownloadButton label={t.nav.download} size="small" />
        </div>
      </LiquidGlass>
    </header>
  );
}
