import { links, news } from "@mirlow/i18n";
import { getVersion } from "@tauri-apps/api/app";
import { openUrl } from "@tauri-apps/plugin-opener";
import { Coffee } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "../lib/i18n";
import { GlassButton } from "./controls";
import { Sheet } from "./Sheet";
import { WELCOME_KEY } from "./WelcomeSheet";

const VERSION_KEY = "mirlow.lastVersion";
const SESSIONS_KEY = "mirlow.sessions";
const ASKED_KEY = "mirlow.askedLove";
const SUPPORT_KEY = "mirlow.supportSeen";
/** Sessions before asking whether Mirlow is any good: enough to have an opinion. */
const SESSIONS_BEFORE_ASKING = 4;
/** Never mention a coffee to someone who has only just tried it. */
const SESSIONS_BEFORE_SUPPORT = 2;

function read(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {}
}

/** "1.10.2" -> "1.10": patch releases are fixes, not news. */
const feature = (version: string) => version.split(".").slice(0, 2).join(".");

/**
 * Once per feature release, after the updater has installed it: what changed,
 * and where to ask for what comes next.
 */
function WhatsNewSheet() {
  const { t, format, locale } = useI18n();
  const w = t.feedback.whatsNew;
  const [version, setVersion] = useState<string | null>(null);
  // Only this release's list: an older one would describe changes the user already had.
  const items = version && news.version === feature(version) ? news[locale] : [];

  useEffect(() => {
    void getVersion().then((current) => {
      const last = read(VERSION_KEY);
      write(VERSION_KEY, current);
      // A new install gets the welcome note instead. Before 1.10 no version was
      // recorded, so a welcome already seen means this is an update.
      const updated = last ? feature(last) !== feature(current) : read(WELCOME_KEY) === "1";
      if (updated) setVersion(current);
    }, () => {});
  }, []);

  const close = () => setVersion(null);
  return (
    <Sheet
      open={version !== null}
      onOpenChange={(open) => !open && close()}
      title={format(w.title, { version: version ?? "" })}
      closeLabel={t.settings.close}
    >
      {items.length === 0 && <p className="pt-2 text-[14px] leading-relaxed text-soft">{w.updated}</p>}
      {items.length > 0 && (
        <ul className="mt-2 space-y-2.5 text-[14px] leading-relaxed">
          {items.map((item) => (
            <li key={item} className="flex gap-3">
              <span className="mt-[0.6em] size-1.5 shrink-0 rounded-full bg-ink" aria-hidden="true" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-5 text-[14px] leading-relaxed text-soft">{w.ask}</p>
      <div className="mt-6 flex flex-wrap gap-2">
        <GlassButton tone="accent" onClick={() => void openUrl(links.idea)}>
          {t.feedback.idea}
        </GlassButton>
        <GlassButton onClick={() => version && void openUrl(links.changes(version))}>{w.changes}</GlassButton>
        <GlassButton onClick={close}>{w.close}</GlassButton>
      </div>
    </Sheet>
  );
}

/**
 * Asked once, after a few mirroring sessions have ended: happy people are
 * pointed at a star and a share, unhappy ones at somewhere to say why.
 */
function LoveSheet({ mirroring, onSupport }: { mirroring: boolean; onSupport: () => void }) {
  const { t } = useI18n();
  const l = t.feedback.love;
  const [step, setStep] = useState<"closed" | "ask" | "yes" | "no">("closed");
  const [copied, setCopied] = useState(false);
  const was = useRef(mirroring);

  useEffect(() => {
    const started = mirroring && !was.current;
    const ended = !mirroring && was.current;
    was.current = mirroring;
    if (started) write(SESSIONS_KEY, String(Number(read(SESSIONS_KEY) ?? 0) + 1));
    if (ended && read(ASKED_KEY) !== "1" && Number(read(SESSIONS_KEY) ?? 0) >= SESSIONS_BEFORE_ASKING) {
      write(ASKED_KEY, "1");
      setStep("ask");
    } else if (ended && read(SUPPORT_KEY) !== "1" && Number(read(SESSIONS_KEY) ?? 0) >= SESSIONS_BEFORE_SUPPORT) {
      onSupport();
    }
  }, [mirroring]);

  const title = step === "yes" ? l.yesTitle : step === "no" ? l.noTitle : l.title;
  return (
    <Sheet
      open={step !== "closed"}
      onOpenChange={(open) => !open && setStep("closed")}
      title={title}
      closeLabel={t.settings.close}
    >
      {step === "yes" && <p className="pt-2 text-[14px] leading-relaxed text-soft">{l.yesBody}</p>}
      {step === "no" && <p className="pt-2 text-[14px] leading-relaxed text-soft">{l.noBody}</p>}
      <div className="mt-6 flex flex-wrap gap-2">
        {step === "ask" && (
          <>
            <GlassButton tone="accent" onClick={() => setStep("yes")}>
              {l.yes}
            </GlassButton>
            <GlassButton onClick={() => setStep("no")}>{l.no}</GlassButton>
          </>
        )}
        {step === "yes" && (
          <>
            <GlassButton tone="accent" onClick={() => void openUrl(links.repository)}>
              {l.star}
            </GlassButton>
            <GlassButton
              onClick={() =>
                void navigator.clipboard.writeText(links.website).then(() => setCopied(true), () => {})
              }
            >
              {copied ? l.copied : l.share}
            </GlassButton>
          </>
        )}
        {step === "no" && (
          <>
            <GlassButton tone="accent" onClick={() => void openUrl(links.bug)}>
              {t.feedback.bug}
            </GlassButton>
            <GlassButton onClick={() => void openUrl(links.idea)}>{t.feedback.idea}</GlassButton>
          </>
        )}
      </div>
    </Sheet>
  );
}

/**
 * The milestone and a note from the maker. Comes up by itself once, after a
 * mirroring session, and stays reachable from Settings.
 */
export function SupportSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { t } = useI18n();
  const s = t.feedback.support;
  const still = useReducedMotion();

  useEffect(() => {
    if (open) write(SUPPORT_KEY, "1");
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={s.title} closeLabel={t.settings.close}>
      <div className="py-7 text-center">
        <p className="text-[12.5px] text-soft">{s.eyebrow}</p>
        <p className="mt-1 text-[68px] font-semibold leading-none tracking-[-0.05em] tabular-nums">
          <span className="sr-only">{s.milestone}</span>
          <span aria-hidden="true">
            {Array.from(s.milestone).map((digit, index) => (
              <motion.span
                key={index}
                className="inline-block"
                initial={still ? false : { opacity: 0, y: 26, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ delay: 0.12 + index * 0.07, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              >
                {digit}
              </motion.span>
            ))}
          </span>
        </p>
        <p className="mt-2 text-[14px] font-medium">{s.unit}</p>
      </div>
      <div className="space-y-3 border-t border-line pt-5 text-[14px] leading-relaxed text-soft">
        {s.body.map((line) => (
          <p key={line}>{line}</p>
        ))}
        <p className="text-ink">{t.welcome.signature}</p>
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        <GlassButton tone="accent" onClick={() => void openUrl(links.coffee)}>
          <Coffee size={15} aria-hidden="true" />
          {s.coffee}
        </GlassButton>
        <GlassButton onClick={() => onOpenChange(false)}>{s.later}</GlassButton>
      </div>
    </Sheet>
  );
}

export function FeedbackSheets({ mirroring, onSupport }: { mirroring: boolean; onSupport: () => void }) {
  return (
    <>
      <WhatsNewSheet />
      <LoveSheet mirroring={mirroring} onSupport={onSupport} />
    </>
  );
}
