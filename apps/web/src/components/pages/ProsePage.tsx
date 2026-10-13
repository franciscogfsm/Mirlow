import { getDictionary, links, type Locale } from "@mirlow/i18n";
import Link from "next/link";
import { pagePath } from "@/lib/site";
import { SiteFrame } from "../site/SiteFrame";

/** The two text pages, privacy and licences: a title, a lead, and plain sections. */
export function ProsePage({ locale, page }: { locale: Locale; page: "privacy" | "licenses" }) {
  const site = getDictionary(locale).site;
  const t = site[page];

  return (
    <SiteFrame locale={locale} page={page}>
      <article className="prose-page mx-auto max-w-[680px] px-6 pb-32 pt-[170px]">
        <h1 className="text-[clamp(2.2rem,5vw,3.4rem)] font-semibold leading-[1.05] tracking-[-0.04em]">
          {t.title}
        </h1>
        {"updated" in t && <p className="!mt-4 text-[14px] !text-faint">{t.updated}</p>}
        <p className="!mt-8 text-[1.2rem] leading-relaxed !text-ink">{t.intro}</p>

        {t.sections.map((section) => (
          <section key={section.title}>
            <h2>{section.title}</h2>
            <p>{section.body}</p>
          </section>
        ))}

        <p className="!mt-14 flex flex-wrap gap-x-8 gap-y-3 text-[15px]">
          {"viewSource" in t && (
            <a className="underline underline-offset-4 hover:text-ink" href={links.repository}>
              {t.viewSource}
            </a>
          )}
          <Link className="underline underline-offset-4 hover:text-ink" href={pagePath(locale)}>
            {site.licenses.back}
          </Link>
        </p>
      </article>
    </SiteFrame>
  );
}
