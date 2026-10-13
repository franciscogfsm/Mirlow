import type { Dictionary } from "@mirlow/i18n";
import { Mark } from "@mirlow/ui";
import type { ReactNode } from "react";
import { Reveal } from "../site/Reveal";
import { PhoneScreen } from "./PhoneScreen";

/** A small drawing for each step. Decorative: the words beside it say the same thing. */
function Figure({ children }: { children: ReactNode }) {
  return (
    <div
      className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-[22px] border border-line bg-raised/50"
      aria-hidden="true"
    >
      {children}
    </div>
  );
}

function OpenFigure() {
  return (
    <Figure>
      <div className="relative h-[46%] aspect-square">
        {[1, 0.72, 0.46].map((scale) => (
          <i key={scale} className="signal-ring" style={{ transform: `scale(${scale})` }} />
        ))}
        {[0, 1.2, 2.4].map((delay) => (
          <i key={delay} className="signal-pulse" style={{ animationDelay: `${delay}s` }} />
        ))}
        <span className="absolute left-1/2 top-1/2 flex h-[38%] w-[38%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-ink text-paper">
          <Mark size={22} />
        </span>
      </div>
    </Figure>
  );
}

function ChooseFigure({ label }: { label: string }) {
  return (
    <Figure>
      <div className="w-[62%] rounded-[18px] border border-line-strong bg-raised p-3.5 shadow-[0_18px_40px_-18px_rgba(0,0,0,0.35)]">
        <div className="flex items-center gap-2 text-[12.5px] font-semibold">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="13" height="10" rx="2" />
            <rect x="8" y="10" width="13" height="10" rx="2" className="fill-raised" />
          </svg>
          {label}
        </div>
        <div className="mt-3 flex items-center justify-between rounded-[11px] bg-ink px-3 py-2.5 text-[12.5px] font-medium text-paper">
          STUDIO-PC
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </div>
        <div className="mt-1.5 rounded-[11px] px-3 py-2.5 text-[12.5px] text-faint">Living Room TV</div>
      </div>
    </Figure>
  );
}

function SeeFigure() {
  return (
    <Figure>
      <div className="flex h-[74%] items-end gap-[7%]">
        <div className="h-[62%] aspect-[9/19.3] overflow-hidden rounded-[13%/6%] bg-ink p-[3px]">
          <div className="h-full w-full overflow-hidden rounded-[11%/5.2%]">
            <PhoneScreen tick={1} />
          </div>
        </div>
        <div className="h-full aspect-[9/19.3] overflow-hidden rounded-[14px] border border-line-strong bg-ink p-1 shadow-[0_18px_40px_-18px_rgba(0,0,0,0.4)]">
          <div className="h-full w-full overflow-hidden rounded-[10px]">
            <PhoneScreen tick={1} />
          </div>
        </div>
      </div>
    </Figure>
  );
}

export function HowItWorks({ t, sheetLabel }: { t: Dictionary["site"]["how"]; sheetLabel: string }) {
  const figures = [<OpenFigure key="open" />, <ChooseFigure key="choose" label={sheetLabel} />, <SeeFigure key="see" />];

  return (
    <section id="how" className="mx-auto max-w-[1120px] px-6 py-28 md:py-40">
      <Reveal className="max-w-[640px]">
        <p className="eyebrow">{t.eyebrow}</p>
        <h2 className="mt-4 text-[clamp(2rem,4.6vw,3.5rem)] font-semibold leading-[1.04] tracking-[-0.04em]">
          {t.title}
        </h2>
      </Reveal>

      <ol className="mt-16 grid gap-10 md:grid-cols-3 md:gap-7">
        {t.steps.map((step, index) => (
          <Reveal as="li" key={step.title} delay={index * 0.12}>
            {figures[index]}
            <p className="mt-7 font-serif text-[2rem] italic leading-none text-faint">{index + 1}</p>
            <h3 className="mt-3 text-[1.3rem] font-semibold tracking-[-0.02em]">{step.title}</h3>
            <p className="mt-2 text-[15.5px] leading-relaxed text-soft">{step.body}</p>
          </Reveal>
        ))}
      </ol>
    </section>
  );
}
