import { links } from "@mirlow/i18n";
import { getVersion } from "@tauri-apps/api/app";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "../lib/i18n";
import { GlassButton } from "./controls";
import { Sheet } from "./Sheet";
import { WELCOME_KEY } from "./WelcomeSheet";

const VERSION_KEY = "mirlow.lastVersion";
const SESSIONS_KEY = "mirlow.sessions";
const ASKED_KEY = "mirlow.askedLove";
/** Sessions before asking whether Mirlow is any good: enough to have an opinion. */
const SESSIONS_BEFORE_ASKING = 4;

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
  const { t, format } = useI18n();
  const w = t.feedback.whatsNew;
  const [version, setVersion] = useState<string | null>(null);

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
      <div className="space-y-3 pt-2 text-[14px] leading-relaxed text-soft">
        {w.body.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
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
function LoveSheet({ mirroring }: { mirroring: boolean }) {
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

export function FeedbackSheets({ mirroring }: { mirroring: boolean }) {
  return (
    <>
      <WhatsNewSheet />
      <LoveSheet mirroring={mirroring} />
    </>
  );
}
