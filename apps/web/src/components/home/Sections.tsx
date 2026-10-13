import { type Dictionary, type Locale, links, release } from "@mirlow/i18n";
import { ArrowUpRight, Expand, Gift, Lock, Volume2, Wifi, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { pagePath } from "../../lib/site";
import { DownloadButton } from "../site/DownloadButton";
import { Reveal } from "../site/Reveal";

const featureIcons: LucideIcon[] = [Wifi, Volume2, Expand, Lock, Gift];

/** What Mirlow does, as a plain ruled list. No cards: the content is the design. */
export function Features({ t }: { t: Dictionary["site"]["features"] }) {
  return (
    <section id="features" className="mx-auto max-w-[1120px] px-6 py-28 md:py-40">
      <Reveal className="max-w-[720px]">
        <p className="eyebrow">{t.eyebrow}</p>
        <h2 className="mt-4 text-[clamp(2rem,4.6vw,3.5rem)] font-semibold leading-[1.04] tracking-[-0.04em]">
          {t.title}
        </h2>
      </Reveal>

      <ul className="mt-16 border-t border-line-strong">
        {t.items.map((item, index) => {
          const Icon = featureIcons[index] ?? Wifi;
          return (
            <Reveal
              as="li"
              key={item.title}
              delay={index * 0.06}
              className="group grid gap-3 border-b border-line py-8 md:grid-cols-[64px_minmax(0,340px)_1fr] md:items-baseline md:gap-8 md:py-9"
            >
              <Icon
                size={24}
                strokeWidth={1.6}
                className="text-faint transition-colors duration-500 group-hover:text-ink md:translate-y-1"
                aria-hidden="true"
              />
              <h3 className="text-[1.5rem] font-semibold tracking-[-0.03em]">{item.title}</h3>
              <p className="max-w-[520px] text-[16.5px] leading-relaxed text-soft">{item.body}</p>
            </Reveal>
          );
        })}
      </ul>
    </section>
  );
}

/**
 * Why the download can be trusted, in terms a visitor can check for
 * themselves: the source, an independent scan of this exact file, and its
 * checksum. Nothing here is a claim about a scan result.
 */
export function Trust({ t, locale }: { t: Dictionary["site"]["trust"]; locale: Locale }) {
  const targets = [
    { href: links.repository, external: true },
    { href: `https://www.virustotal.com/gui/file/${release.sha256}`, external: true },
    { href: pagePath(locale, "privacy"), external: false },
  ];
  const action =
    "mt-5 inline-flex items-center gap-1.5 text-[15px] font-medium text-ink underline decoration-line-strong underline-offset-[6px] transition-colors duration-300 hover:decoration-ink";

  return (
    <section id="trust" className="mx-auto max-w-[1120px] px-6 py-28 md:py-40">
      <Reveal className="max-w-[720px]">
        <p className="eyebrow">{t.eyebrow}</p>
        <h2 className="mt-4 text-[clamp(2rem,4.6vw,3.5rem)] font-semibold leading-[1.04] tracking-[-0.04em]">
          {t.title}
        </h2>
        <p className="mt-6 max-w-[600px] text-[17px] leading-relaxed text-soft">{t.body}</p>
      </Reveal>

      <ul className="mt-16 grid border-t border-line-strong md:grid-cols-3">
        {t.items.map((item, index) => {
          const target = targets[index];
          return (
            <Reveal
              as="li"
              key={item.title}
              delay={index * 0.08}
              className="flex flex-col items-start border-b border-line py-9 md:border-b-0 md:border-l md:px-8 md:first:border-l-0 md:first:pl-0 md:last:pr-0"
            >
              <span className="font-mono text-[12px] text-faint" aria-hidden="true">
                0{index + 1}
              </span>
              <h3 className="mt-4 text-[1.5rem] font-semibold tracking-[-0.03em]">{item.title}</h3>
              <p className="mt-3 text-[16px] leading-relaxed text-soft">{item.body}</p>
              {target &&
                (target.external ? (
                  <a href={target.href} target="_blank" rel="noreferrer" className={action}>
                    {item.action}
                    <ArrowUpRight size={15} strokeWidth={1.8} aria-hidden="true" />
                  </a>
                ) : (
                  <Link href={target.href} className={action}>
                    {item.action}
                  </Link>
                ))}
            </Reveal>
          );
        })}
      </ul>

      <Reveal delay={0.1} className="border-y border-line py-7 md:border-t-line-strong">
        <p className="text-[13.5px] text-faint">{t.checksumLabel.replace("{version}", release.version)}</p>
        <code className="mt-2 block select-all break-all font-mono text-[14px] leading-relaxed text-ink">
          {release.sha256}
        </code>
        <p className="mt-2 text-[13.5px] text-faint">{t.checksumHint}</p>
      </Reveal>
    </section>
  );
}

/** Questions and answers. Native disclosure elements: keyboard and screen-reader behaviour for free. */
export function Faq({ t }: { t: Dictionary["site"]["faq"] }) {
  return (
    <section id="faq" className="mx-auto max-w-[1120px] px-6 py-28 md:py-40">
      <div className="grid gap-12 md:grid-cols-[minmax(0,340px)_1fr] md:gap-20">
        <Reveal>
          <p className="eyebrow">{t.eyebrow}</p>
          <h2 className="mt-4 text-[clamp(2rem,4.6vw,3.5rem)] font-semibold leading-[1.04] tracking-[-0.04em]">
            {t.title}
          </h2>
        </Reveal>

        <Reveal delay={0.1} className="border-t border-line-strong">
          {t.items.map((item) => (
            <details key={item.q} className="group border-b border-line">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 text-[1.15rem] font-medium tracking-[-0.015em] [&::-webkit-details-marker]:hidden">
                {item.q}
                <span
                  className="relative h-4 w-4 shrink-0 text-soft transition-transform duration-500 ease-fluid group-open:rotate-45"
                  aria-hidden="true"
                >
                  <i className="absolute left-0 top-1/2 block h-px w-full bg-current" />
                  <i className="absolute left-1/2 top-0 block h-full w-px bg-current" />
                </span>
              </summary>
              <p className="max-w-[640px] pb-7 text-[16px] leading-relaxed text-soft">{item.a}</p>
            </details>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

export function FinalCta({ t }: { t: Dictionary["site"]["finalCta"] }) {
  return (
    <section className="px-6 pb-36 pt-20 md:pb-48 md:pt-28">
      <Reveal className="mx-auto flex max-w-[900px] flex-col items-center text-center">
        <h2 className="text-[clamp(2.4rem,7vw,5.4rem)] font-semibold leading-[1] tracking-[-0.045em]">
          {t.title}
          <br />
          <span className="accent-word">{t.accent}</span>
        </h2>
        <p className="mt-7 text-[1.15rem] text-soft">{t.body}</p>
        <div className="mt-10">
          <DownloadButton label={t.cta} />
        </div>
        <p className="mt-4 text-[13.5px] text-faint">{t.note}</p>
      </Reveal>
    </section>
  );
}
