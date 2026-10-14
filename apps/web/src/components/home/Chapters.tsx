import { type Dictionary, type Locale, release } from "@mirlow/i18n";
import {
  ArrowUpRight,
  Check,
  Expand,
  Gift,
  Laptop,
  Lock,
  Smartphone,
  Tablet,
  Volume2,
  Wifi,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { pagePath } from "@/lib/site";
import { CopyButton } from "../site/CopyButton";
import { DownloadButton } from "../site/DownloadButton";
import { Spotlight } from "../site/Spotlight";
import { Film } from "./Film";

type Site = Dictionary["site"];

/** Position in a chapter's entrance: elements with `rise` arrive in this order. */
const order = (position: number) => ({ "--i": position }) as CSSProperties;

const heading = "text-[clamp(2rem,3.5vw,3.3rem)] font-semibold leading-[1.04] tracking-[-0.04em]";
const textLink =
  "inline-flex items-center gap-1.5 text-[14.5px] font-medium text-ink underline decoration-line-strong underline-offset-[6px] transition-colors duration-300 hover:decoration-ink";

/** A chapter's box: a centred full-height frame when pinned, a padded section otherwise. */
function Frame({ children, className = "py-20" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`mx-auto w-full max-w-[1400px] px-6 pinned:flex pinned:h-full pinned:items-center pinned:px-14 pinned:pb-12 pinned:pt-[92px] ${className}`}
    >
      {children}
    </div>
  );
}

/** A heading on the left, the substance on the right. */
function Split({ lead, children }: { lead: ReactNode; children: ReactNode }) {
  return (
    <div className="grid w-full items-center gap-12 pinned:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] pinned:gap-16">
      <div>{lead}</div>
      {children}
    </div>
  );
}

/** Generic device outlines, in the order of the dictionary's `devices`. */
const deviceIcons: LucideIcon[] = [Smartphone, Tablet, Laptop, Smartphone];

/** The opening: what it is, the download, and the film that shows the rest. */
export function HeroChapter({ t, how }: { t: Site["hero"]; how: Site["how"] }) {
  return (
    <Frame className="pb-16 pt-[132px]">
      <div className="grid w-full items-center gap-12 pinned:grid-cols-[minmax(0,6fr)_minmax(0,7fr)] pinned:gap-14">
        <div className="flex flex-col items-center text-center pinned:items-start pinned:text-left">
          <h1 className="text-[clamp(2.6rem,7.6vw,4.6rem)] font-semibold leading-[1] tracking-[-0.045em] pinned:text-[clamp(2.5rem,3.9vw,3.9rem)]">
            <span className="rise block" style={order(1)}>
              {t.titleLine1}
            </span>
            <span className="rise block" style={order(2)}>
              {t.titleLine2} <span className="accent-word">{t.titleAccent}</span>
            </span>
          </h1>

          <p
            className="rise mt-6 max-w-[500px] text-[clamp(1.02rem,1.3vw,1.16rem)] leading-relaxed text-soft"
            style={order(3)}
          >
            {t.body}
          </p>

          <div className="rise mt-9 flex flex-wrap items-center justify-center gap-3 pinned:justify-start" style={order(4)}>
            <DownloadButton label={t.cta} />
          </div>
          <ul
            className="rise mt-5 flex flex-wrap justify-center gap-x-5 gap-y-2 text-[13.5px] text-soft pinned:justify-start"
            style={order(5)}
          >
            {t.promises.map((promise) => (
              <li key={promise} className="inline-flex items-center gap-1.5">
                <Check size={14} strokeWidth={2.2} className="text-ink" aria-hidden="true" />
                {promise}
              </li>
            ))}
          </ul>

          <div
            className="rise mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-2.5 border-t border-line pt-5 pinned:justify-start"
            style={order(6)}
          >
            <span className="w-full text-[13px] text-faint sm:w-auto">{t.worksWith}</span>
            <ul className="flex flex-wrap items-center justify-center gap-2">
              {t.devices.map((device, index) => {
                const Icon = deviceIcons[index] ?? Smartphone;
                return (
                  <li
                    key={device}
                    className="inline-flex h-8 items-center gap-1.5 rounded-full border border-line-strong bg-raised/60 pl-2.5 pr-3 text-[13px] font-medium"
                  >
                    <Icon size={14} strokeWidth={1.8} aria-hidden="true" />
                    {device}
                  </li>
                );
              })}
            </ul>
            <span className="w-full text-[13px] text-faint sm:w-auto">{t.requires}</span>
          </div>
        </div>

        <div className="rise" style={order(3)}>
          <Film
            labels={{
              ready: t.sceneReady,
              mirroring: t.sceneMirroring,
              scene: t.sceneLabel,
              sheet: t.sceneSheet,
              pause: t.pause,
              play: t.play,
            }}
            steps={how.steps}
          />
        </div>
      </div>
    </Frame>
  );
}

const featureIcons: LucideIcon[] = [Wifi, Volume2, Expand, Lock, Gift];

/** What Mirlow does, as a small grid: two wide cards, then three narrow ones. */
export function FeaturesChapter({ t }: { t: Site["features"] }) {
  return (
    <Frame>
      <Split
        lead={
          <>
            <p className="eyebrow rise" style={order(0)}>
              {t.eyebrow}
            </p>
            <h2 className={`rise mt-4 ${heading}`} style={order(1)}>
              {t.title}
            </h2>
          </>
        }
      >
        <ul className="grid gap-3 sm:grid-cols-6">
          {t.items.map((item, index) => {
            const Icon = featureIcons[index] ?? Wifi;
            return (
              <li
                key={item.title}
                className={`rise ${index < 2 ? "sm:col-span-3" : "sm:col-span-2"}`}
                style={order(2 + index)}
              >
                <Spotlight className="h-full">
                  <div className="relative flex h-full flex-col p-6">
                    {index === 0 && (
                      <div className="absolute right-5 top-5 h-[84px] w-[84px]" aria-hidden="true">
                        {[1, 0.7, 0.42].map((scale) => (
                          <i key={scale} className="signal-ring" style={{ transform: `scale(${scale})` }} />
                        ))}
                        {[0, 1.8].map((delay) => (
                          <i key={delay} className="signal-pulse" style={{ animationDelay: `${delay}s` }} />
                        ))}
                      </div>
                    )}
                    {index === 1 && (
                      <div className="eq absolute right-6 top-6 opacity-70" aria-hidden="true">
                        {[0, 0.35, 0.15, 0.6, 0.25, 0.5].map((delay) => (
                          <i key={delay} style={{ animationDelay: `-${delay}s` }} />
                        ))}
                      </div>
                    )}
                    <span className="flex h-10 w-10 items-center justify-center rounded-[12px] border border-line-strong bg-raised/70">
                      <Icon size={19} strokeWidth={1.7} aria-hidden="true" />
                    </span>
                    <h3 className="mt-6 text-[1.2rem] font-semibold tracking-[-0.025em]">{item.title}</h3>
                    <p className="mt-1.5 text-[15px] leading-relaxed text-soft">{item.body}</p>
                  </div>
                </Spotlight>
              </li>
            );
          })}
        </ul>
      </Split>
    </Frame>
  );
}

/**
 * Why the download can be trusted, in terms a visitor can check for
 * themselves: the source, an independent scan of this exact file, and its
 * checksum. Nothing here is a claim about a scan result.
 */
export function TrustChapter({ t, locale }: { t: Site["trust"]; locale: Locale }) {
  const targets = [
    { href: pagePath(locale, "licenses"), external: false },
    { href: `https://www.virustotal.com/gui/file/${release.sha256}`, external: true },
    { href: pagePath(locale, "privacy"), external: false },
  ];

  return (
    <Frame>
      <Split
        lead={
          <>
            <p className="eyebrow rise" style={order(0)}>
              {t.eyebrow}
            </p>
            <h2 className={`rise mt-4 ${heading}`} style={order(1)}>
              {t.title}
            </h2>
            <p className="rise mt-5 max-w-[440px] text-[16px] leading-relaxed text-soft" style={order(2)}>
              {t.body}
            </p>
          </>
        }
      >
        <div>
          <ul className="grid gap-3 sm:grid-cols-3">
            {t.items.map((item, index) => {
              const target = targets[index];
              return (
                <li key={item.title} className="rise" style={order(3 + index)}>
                  <Spotlight className="h-full">
                    <div className="flex h-full flex-col items-start p-6">
                      <span className="font-mono text-[12px] text-faint" aria-hidden="true">
                        0{index + 1}
                      </span>
                      <h3 className="mt-4 text-[1.2rem] font-semibold tracking-[-0.025em]">{item.title}</h3>
                      <p className="mb-5 mt-1.5 text-[14.5px] leading-relaxed text-soft">{item.body}</p>
                      {target &&
                        (target.external ? (
                          <a href={target.href} target="_blank" rel="noreferrer" className={`mt-auto ${textLink}`}>
                            {item.action}
                            <ArrowUpRight size={15} strokeWidth={1.8} aria-hidden="true" />
                          </a>
                        ) : (
                          <Link href={target.href} className={`mt-auto ${textLink}`}>
                            {item.action}
                          </Link>
                        ))}
                    </div>
                  </Spotlight>
                </li>
              );
            })}
          </ul>

          <div className="rise mt-3" style={order(6)}>
            <Spotlight>
              <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-[13px] text-faint">{t.checksumLabel.replace("{version}", release.version)}</p>
                  <code className="mt-1.5 block select-all break-all font-mono text-[13px] leading-relaxed text-ink">
                    {release.sha256}
                  </code>
                  <p className="mt-1.5 text-[13px] text-faint">{t.checksumHint}</p>
                </div>
                <CopyButton value={release.sha256} label={t.copy} done={t.copied} />
              </div>
            </Spotlight>
          </div>
        </div>
      </Split>
    </Frame>
  );
}

/** Questions and answers. Native disclosure elements, one open at a time. */
export function FaqChapter({ t }: { t: Site["faq"] }) {
  return (
    <Frame>
      <Split
        lead={
          <>
            <p className="eyebrow rise" style={order(0)}>
              {t.eyebrow}
            </p>
            <h2 className={`rise mt-4 ${heading}`} style={order(1)}>
              {t.title}
            </h2>
          </>
        }
      >
        <div className="faq rise border-t border-line-strong" style={order(2)}>
          {t.items.map((item) => (
            <details key={item.q} name="faq" className="group border-b border-line">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-[15px] text-[1.05rem] font-medium tracking-[-0.015em] [&::-webkit-details-marker]:hidden">
                {item.q}
                <span
                  className="relative h-3.5 w-3.5 shrink-0 text-soft transition-transform duration-500 ease-fluid group-open:rotate-45"
                  aria-hidden="true"
                >
                  <i className="absolute left-0 top-1/2 block h-px w-full bg-current" />
                  <i className="absolute left-1/2 top-0 block h-full w-px bg-current" />
                </span>
              </summary>
              <p className="max-w-[640px] pb-5 text-[15px] leading-relaxed text-soft">{item.a}</p>
            </details>
          ))}
        </div>
      </Split>
    </Frame>
  );
}

/** The close: the promise once more, and the download. */
export function FinalChapter({ t }: { t: Site["finalCta"] }) {
  return (
    <Frame className="pb-32 pt-16">
      <div className="mx-auto flex max-w-[900px] flex-col items-center text-center">
        <h2 className="text-[clamp(2.4rem,6.4vw,5.2rem)] font-semibold leading-[1] tracking-[-0.045em]">
          <span className="rise block" style={order(0)}>
            {t.title}
          </span>
          <span className="rise accent-word block" style={order(1)}>
            {t.accent}
          </span>
        </h2>
        <p className="rise mt-7 text-[1.15rem] text-soft" style={order(2)}>
          {t.body}
        </p>
        <div className="rise mt-10" style={order(3)}>
          <DownloadButton label={t.cta} />
        </div>
        <p className="rise mt-4 text-[13.5px] text-faint" style={order(4)}>
          {t.note}
        </p>
      </div>
    </Frame>
  );
}
