import { getDictionary, type Locale } from "@mirlow/i18n";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { getGuide } from "@/content/guides";
import { guideIds, type GuideId } from "@/content/guides/slugs";
import { guideSchema, guidesSchema } from "@/lib/schema";
import { pagePath } from "@/lib/site";
import { DownloadButton } from "../site/DownloadButton";
import { JsonLd } from "../site/JsonLd";
import { SiteFrame } from "../site/SiteFrame";

const pageHeading = "text-[clamp(2.2rem,5vw,3.4rem)] font-semibold leading-[1.05] tracking-[-0.04em]";
const crumb = "transition-colors duration-300 hover:text-ink";

/** A row of guides to go to next: a name, and an arrow that leans in on hover. */
function GuideLinks({ locale, ids }: { locale: Locale; ids: readonly GuideId[] }) {
  return (
    <ul className="mt-5 border-t border-line-strong">
      {ids.map((id) => {
        const guide = getGuide(locale, id);
        return (
          <li key={id} className="border-b border-line">
            <Link
              href={pagePath(locale, id)}
              className="group flex items-center justify-between gap-6 py-4 text-[1.05rem] font-medium tracking-[-0.015em] text-ink"
            >
              {guide.title}
              <ArrowRight
                size={17}
                strokeWidth={1.8}
                aria-hidden="true"
                className="shrink-0 text-faint transition-transform duration-500 ease-fluid group-hover:translate-x-1 group-hover:text-ink"
              />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** The download, offered once the reader knows what it is for. */
function Download({ locale }: { locale: Locale }) {
  const site = getDictionary(locale).site;
  return (
    <div className="mt-9 flex flex-col items-start gap-4">
      <DownloadButton label={site.hero.cta} />
      <p className="!mt-0 text-[13.5px] !text-faint">{site.finalCta.note}</p>
    </div>
  );
}

/** One guide: the answer first, then the steps, the detail and the usual questions. */
export function GuidePage({ locale, id }: { locale: Locale; id: GuideId }) {
  const site = getDictionary(locale).site;
  const guide = getGuide(locale, id);

  return (
    <SiteFrame locale={locale} page={id}>
      <JsonLd data={guideSchema(locale, id)} />
      <article className="prose-page mx-auto max-w-[720px] px-6 pb-32 pt-[150px]">
        <nav aria-label={site.guides.title} className="flex flex-wrap gap-x-2.5 text-[13.5px] text-faint">
          <Link className={crumb} href={pagePath(locale)}>
            Mirlow
          </Link>
          <span aria-hidden="true">/</span>
          <Link className={crumb} href={pagePath(locale, "guides")}>
            {site.guides.title}
          </Link>
        </nav>

        <h1 className={`mt-6 ${pageHeading}`}>{guide.title}</h1>
        <p className="!mt-8 text-[1.2rem] leading-relaxed !text-ink">{guide.lead}</p>
        <Download locale={locale} />

        {guide.steps && (
          <section>
            <h2>{site.guides.steps}</h2>
            <ol className="mt-5 border-t border-line-strong">
              {guide.steps.map((step, index) => (
                <li key={step.title} className="flex gap-5 border-b border-line py-5">
                  <span className="w-6 shrink-0 pt-[3px] font-mono text-[12px] text-faint" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="text-[1.05rem] font-semibold tracking-[-0.015em]">{step.title}</h3>
                    <p className="!mt-1.5">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}

        {guide.sections.map((section) => (
          <section key={section.title}>
            <h2>{section.title}</h2>
            {section.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </section>
        ))}

        <section>
          <h2>{site.guides.questions}</h2>
          {guide.faq.map((item) => (
            <div key={item.q} className="mt-6">
              <h3 className="text-[1.05rem] font-semibold tracking-[-0.015em]">{item.q}</h3>
              <p className="!mt-1.5">{item.a}</p>
            </div>
          ))}
        </section>

        <section>
          <h2>{site.guides.ctaTitle}</h2>
          <p>{site.guides.ctaBody}</p>
          <Download locale={locale} />
        </section>

        <section>
          <h2>{site.guides.more}</h2>
          <GuideLinks locale={locale} ids={guideIds.filter((each) => each !== id)} />
        </section>
      </article>
    </SiteFrame>
  );
}

/** Every guide, one line each. */
export function GuidesPage({ locale }: { locale: Locale }) {
  const site = getDictionary(locale).site;

  return (
    <SiteFrame locale={locale} page="guides">
      <JsonLd data={guidesSchema(locale)} />
      <article className="prose-page mx-auto max-w-[720px] px-6 pb-32 pt-[170px]">
        <h1 className={pageHeading}>{site.guides.title}</h1>
        <p className="!mt-8 text-[1.2rem] leading-relaxed !text-ink">{site.guides.intro}</p>

        <ul className="mt-12 border-t border-line-strong">
          {guideIds.map((id) => {
            const guide = getGuide(locale, id);
            return (
              <li key={id} className="border-b border-line">
                <Link href={pagePath(locale, id)} className="group block py-6">
                  <h2 className="!mt-0 flex items-center justify-between gap-6 text-ink">
                    {guide.title}
                    <ArrowRight
                      size={17}
                      strokeWidth={1.8}
                      aria-hidden="true"
                      className="shrink-0 text-faint transition-transform duration-500 ease-fluid group-hover:translate-x-1 group-hover:text-ink"
                    />
                  </h2>
                  <p className="!mt-2 max-w-[600px]">{guide.description}</p>
                </Link>
              </li>
            );
          })}
        </ul>

        <section>
          <h2>{site.guides.ctaTitle}</h2>
          <p>{site.guides.ctaBody}</p>
          <Download locale={locale} />
        </section>
      </article>
    </SiteFrame>
  );
}
