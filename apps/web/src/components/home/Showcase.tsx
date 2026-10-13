"use client";

import { format, type Dictionary } from "@mirlow/i18n";
import { LiquidGlass, Mark } from "@mirlow/ui";
import { Maximize, Minus, Settings, Unplug, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { Reveal } from "../site/Reveal";
import { PhoneScreen } from "./PhoneScreen";

type View = "waiting" | "mirroring" | "settings";
const VIEWS: View[] = ["waiting", "mirroring", "settings"];
const PC_NAME = "STUDIO-PC";

/**
 * A working miniature of the desktop app, built from the same glass, the same
 * tokens and the same words as the real one. The tabs switch between its
 * three screens; the picture inside "Mirroring" is the site's sample phone.
 */
function AppWindow({ view, app }: { view: View; app: Dictionary["app"] }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (view !== "mirroring") return;
    const timer = window.setInterval(() => setTick((value) => value + 1), 2200);
    return () => window.clearInterval(timer);
  }, [view]);

  const label =
    view === "mirroring" ? format(app.mirroring.from, { device: "iPhone" }) : app.status.ready;

  return (
    <div
      className="relative mx-auto flex w-full max-w-[400px] flex-col overflow-hidden rounded-[18px] border border-line-strong bg-paper shadow-[0_50px_120px_-40px_rgba(0,0,0,0.5)]"
      style={{ aspectRatio: "440 / 640" }}
    >
      <div className="pointer-events-none absolute -left-1/4 -top-1/4 h-2/3 w-2/3 rounded-full bg-[var(--glow-a)] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-1/4 -right-1/4 h-2/3 w-2/3 rounded-full bg-[var(--glow-c)] blur-3xl" />

      <div className="relative flex h-11 shrink-0 items-center justify-between pl-4 pr-2.5 text-soft">
        <span className="flex items-center gap-2 text-[12px] font-medium">
          <Mark size={18} className="text-ink" />
          <i className="block h-1.5 w-1.5 rounded-full bg-ink" />
          {label}
        </span>
        <span className="flex items-center gap-3">
          {view === "mirroring" && (
            <>
              <Unplug size={14} />
              <Maximize size={14} />
            </>
          )}
          <Settings size={15} />
          <Minus size={15} />
          <X size={15} />
        </span>
      </div>

      <div className="relative min-h-0 flex-1">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={view}
            className="absolute inset-0"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            {view === "waiting" && (
              <div className="flex h-full flex-col items-center justify-center px-6 pb-6 text-center">
                <div className="relative h-[150px] w-[150px]">
                  {[1, 0.76, 0.52].map((scale) => (
                    <i key={scale} className="signal-ring" style={{ transform: `scale(${scale})` }} />
                  ))}
                  {[0, 1.2, 2.4].map((delay) => (
                    <i key={delay} className="signal-pulse" style={{ animationDelay: `${delay}s` }} />
                  ))}
                  <LiquidGlass
                    radius={999}
                    bezel={18}
                    depth={20}
                    frost={0.5}
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                    style={{ width: 68, height: 68 }}
                    contentClassName="flex h-[68px] w-[68px] items-center justify-center"
                  >
                    <Mark size={30} />
                  </LiquidGlass>
                </div>
                <p className="mt-5 text-[20px] font-semibold tracking-[-0.03em]">{app.waiting.headline}</p>
                <p className="mt-4 text-[10.5px] font-medium uppercase tracking-[0.08em] text-faint">
                  {app.waiting.nameLabel}
                </p>
                <LiquidGlass
                  radius={999}
                  bezel={12}
                  depth={16}
                  frost={1}
                  className="mt-1.5"
                  contentClassName="px-4 py-2 text-[14px] font-semibold"
                >
                  {PC_NAME}
                </LiquidGlass>
                <ol className="mt-5 space-y-1.5 text-left text-[12px] text-soft">
                  {[app.waiting.step1, app.waiting.step2, format(app.waiting.step3, { name: PC_NAME })].map(
                    (step, index) => (
                      <li key={step} className="flex items-center gap-2.5">
                        <span className="flex h-4 w-4 items-center justify-center rounded-full border border-line-strong text-[9.5px] font-semibold text-ink">
                          {index + 1}
                        </span>
                        {step}
                      </li>
                    ),
                  )}
                </ol>
              </div>
            )}

            {view === "mirroring" && (
              <div className="flex h-full items-center justify-center px-2.5 pb-2.5">
                <div className="h-full aspect-[9/19.3] overflow-hidden rounded-[14px] bg-black shadow-[0_18px_50px_-12px_rgba(0,0,0,0.55)]">
                  <PhoneScreen tick={tick} />
                </div>
              </div>
            )}

            {view === "settings" && (
              <div className="h-full px-3 pb-3">
                <LiquidGlass
                  radius={22}
                  bezel={18}
                  depth={22}
                  frost={10}
                  className="h-full"
                  style={{ ["--glass-tint" as string]: "var(--glass-tint-panel)" }}
                  contentClassName="block h-full px-5 py-4"
                >
                  <p className="text-[17px] font-semibold tracking-[-0.02em]">{app.settings.title}</p>
                  <div className="border-b border-line py-3.5">
                    <p className="text-[13px] font-medium">{app.settings.name.label}</p>
                    <p className="text-[11.5px] text-soft">{app.settings.name.description}</p>
                    <div className="mt-2.5 flex h-9 items-center rounded-[10px] border border-line-strong bg-raised/60 px-3 text-[13px]">
                      {PC_NAME}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-4 border-b border-line py-3.5">
                    <span>
                      <span className="block text-[13px] font-medium">{app.settings.sound.label}</span>
                      <span className="block text-[11.5px] text-soft">{app.settings.sound.description}</span>
                    </span>
                    <i className="relative block h-[24px] w-[40px] shrink-0 rounded-full bg-ink">
                      <i className="absolute right-[2px] top-[2px] block h-5 w-5 rounded-full bg-paper" />
                    </i>
                  </div>
                  <div className="flex items-center justify-between gap-4 py-3.5">
                    <span className="text-[13px] font-medium">{app.settings.theme.label}</span>
                    <span className="flex rounded-full bg-ink/7 p-[3px] text-[11.5px] font-medium">
                      {[app.settings.theme.system, app.settings.theme.light, app.settings.theme.dark].map(
                        (option, index) => (
                          <span
                            key={option}
                            className={`rounded-full px-2.5 py-1 ${index === 0 ? "bg-raised text-ink shadow-sm" : "text-soft"}`}
                          >
                            {option}
                          </span>
                        ),
                      )}
                    </span>
                  </div>
                </LiquidGlass>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export function Showcase({ t, app }: { t: Dictionary["site"]["showcase"]; app: Dictionary["app"] }) {
  const [view, setView] = useState<View>("waiting");

  return (
    <section className="mx-auto max-w-[1120px] px-6 py-28 md:py-40">
      <div className="grid items-center gap-16 md:grid-cols-[1fr_minmax(0,420px)] md:gap-20">
        <Reveal>
          <p className="eyebrow">{t.eyebrow}</p>
          <h2 className="mt-4 text-[clamp(2rem,4.6vw,3.5rem)] font-semibold leading-[1.04] tracking-[-0.04em]">
            {t.title}
          </h2>
          <p className="mt-5 max-w-[440px] text-[17px] leading-relaxed text-soft">{t.body}</p>

          <div role="tablist" aria-label={t.eyebrow} className="mt-10 flex flex-col items-start gap-1">
            {VIEWS.map((each) => {
              const selected = each === view;
              return (
                <button
                  key={each}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setView(each)}
                  className="group flex cursor-pointer items-baseline gap-4 rounded-lg py-2 text-left"
                >
                  <span
                    className={`text-[1.5rem] font-semibold tracking-[-0.03em] transition-colors duration-500 ${
                      selected ? "text-ink" : "text-faint group-hover:text-soft"
                    }`}
                  >
                    {t.tabs[each]}
                  </span>
                  <span
                    className={`hidden max-w-[300px] text-[14px] leading-snug text-soft transition-opacity duration-500 sm:block ${
                      selected ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    {t.captions[each]}
                  </span>
                </button>
              );
            })}
          </div>
        </Reveal>

        <Reveal delay={0.15}>
          <div role="tabpanel" aria-label={t.tabs[view]}>
            <AppWindow view={view} app={app} />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
