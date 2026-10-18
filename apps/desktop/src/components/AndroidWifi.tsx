import { Check } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { api, type AndroidLink, type Qr } from "../lib/api";
import { takeSetupRequest, SETUP_EVENT } from "../lib/androidSetup";
import { useI18n } from "../lib/i18n";
import { useAndroidLink } from "../lib/useEngine";
import { GlassButton, Switch } from "./controls";

/** Dark modules on white, with the quiet border scanners need, whatever the theme. */
function QrCode({ qr, label }: { qr: Qr; label: string }) {
  const quiet = 3;
  const extent = qr.size + quiet * 2;
  let path = "";
  for (let y = 0; y < qr.size; y++) {
    for (let x = 0; x < qr.size; x++) {
      if (qr.modules[y * qr.size + x] === "1") path += `M${x + quiet} ${y + quiet}h1v1h-1z`;
    }
  }
  return (
    <svg
      role="img"
      aria-label={label}
      viewBox={`0 0 ${extent} ${extent}`}
      shapeRendering="crispEdges"
      className="h-44 w-44 rounded-xl bg-white"
    >
      <path d={path} fill="#000" />
    </svg>
  );
}

/**
 * A small drawing of the phone's screen, showing the row to tap. Rows are the
 * words Android itself uses, so what is seen here is what is looked for there.
 */
function PhoneScreen({
  title,
  rows,
  target,
  badge,
  toggles = [],
}: {
  title: string;
  rows: string[];
  /** The row to tap. */
  target: number;
  /** Said on the row to tap, such as how many times. */
  badge?: string;
  /** Rows drawn with a switch, turned on. */
  toggles?: number[];
}) {
  return (
    <div
      aria-hidden="true"
      className="w-[118px] shrink-0 rounded-[18px] border-[3px] border-ink/15 bg-paper px-1.5 pb-3 pt-1.5"
    >
      <div className="mx-auto mb-2 h-1 w-8 rounded-full bg-ink/15" />
      <p className="mb-1.5 truncate px-1 text-[10.5px] font-semibold text-ink">{title}</p>
      <div className="space-y-1">
        {rows.map((row, index) => {
          const isTarget = index === target;
          return (
            <div
              key={row}
              className={`relative flex h-[22px] items-center justify-between gap-1 rounded-md px-1.5 text-[8.5px] leading-none ${
                isTarget ? "bg-accent/15 font-semibold text-ink ring-1 ring-accent" : "bg-ink/5 text-soft"
              }`}
            >
              <span className="truncate">{row}</span>
              {toggles.includes(index) && (
                <span className="flex h-2.5 w-4.5 shrink-0 items-center justify-end rounded-full bg-accent px-px">
                  <span className="h-2 w-2 rounded-full bg-white" />
                </span>
              )}
              {isTarget && badge && (
                <span className="shrink-0 rounded-full bg-accent px-1 text-[8px] font-bold text-white">{badge}</span>
              )}
              {isTarget && (
                <motion.span
                  className="absolute -bottom-1 right-3 h-3 w-3 rounded-full bg-accent/50"
                  animate={{ scale: [0.6, 1.25, 0.6], opacity: [0.9, 0.3, 0.9] }}
                  transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const STEPS = 3;

/**
 * The one-time setup, a step at a time: Developer options, Wireless
 * debugging, then the code that pairs the phone with this PC. Each step
 * shows the phone's own screen and the row to tap.
 */
function Tutorial({ link, onClose }: { link: AndroidLink; onClose: () => void }) {
  const { t, format } = useI18n();
  const w = t.settings.wifi;
  const g = w.tutorial;
  const p = g.phone;
  const [step, setStep] = useState(Number(new URLSearchParams(location.search).get("step") ?? 0)); // TEMP-PREVIEW
  const [code, setCode] = useState("");
  const { pairing } = link;
  const qr = pairing.state === "waiting" ? pairing.qr : null;

  // The code is made when it is needed, so it does not run out while the
  // first steps are done.
  useEffect(() => {
    if (step === STEPS - 1 && pairing.state === "idle") void api.androidPair();
  }, [step, pairing.state]);

  const status: { text: string; tone: string; retry?: boolean } | null = (() => {
    switch (pairing.state) {
      case "waiting":
        return { text: w.waiting, tone: "bg-faint animate-pulse" };
      case "searching":
        return { text: w.searching, tone: "bg-faint animate-pulse" };
      case "pairing":
        return { text: w.pairing, tone: "bg-accent animate-pulse" };
      case "paired":
        return { text: w.paired, tone: "bg-mint" };
      case "refused":
        return { text: w.refused, tone: "bg-warn", retry: true };
      case "notFound":
        return { text: w.notFound, tone: "bg-warn", retry: true };
      default:
        return null;
    }
  })();

  const submit = () => {
    const digits = code.replace(/\D/g, "");
    if (digits.length >= 6) void api.androidPairCode(digits);
  };

  const pages = [
    {
      title: g.developer.title,
      body: g.developer.body,
      picture: (
        <PhoneScreen
          title={p.aboutPhone}
          rows={[p.deviceName, p.model, p.androidVersion, p.buildNumber]}
          target={3}
          badge="×7"
        />
      ),
    },
    {
      title: g.wireless.title,
      body: g.wireless.body,
      picture: (
        <PhoneScreen
          title={p.developerOptions}
          rows={[p.usbDebugging, p.wirelessDebugging, p.stayAwake]}
          target={1}
          toggles={[1]}
        />
      ),
    },
    {
      title: g.scan.title,
      body: g.scan.body,
      picture: (
        <PhoneScreen
          title={p.wirelessDebugging}
          rows={[p.useWireless, p.pairQr, p.pairCode]}
          target={1}
          toggles={[0]}
        />
      ),
    },
  ];
  const page = pages[step] ?? pages[0]!;
  const last = step === STEPS - 1;

  return (
    <div className="mt-3 overflow-hidden rounded-xl bg-raised/60 px-3.5 py-3 text-[12.5px] leading-snug">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-faint">
            {format(g.step, { n: String(step + 1) })}
          </p>
          <p className="mt-0.5 text-[13.5px] font-semibold text-ink">{page.title}</p>
          <div className="mt-2.5 flex items-start gap-3.5">
            {page.picture}
            <p className="min-w-0 pt-1 text-soft">{page.body}</p>
          </div>

          {last && (
            <>
              <div className="mt-3.5 flex justify-center">
                {qr ? (
                  <QrCode qr={qr} label={g.scan.title} />
                ) : pairing.state === "paired" ? (
                  <span className="flex h-44 w-44 items-center justify-center rounded-xl bg-mint/15 text-mint">
                    <Check size={40} strokeWidth={2.5} />
                  </span>
                ) : (
                  <span className="h-44 w-44 animate-pulse rounded-xl bg-ink/5" />
                )}
              </div>
              {status && (
                <p className="mt-2.5 flex items-center justify-center gap-2 text-center text-soft" role="status">
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${status.tone}`} />
                  {status.text}
                </p>
              )}
              {pairing.state !== "paired" && (
                <>
                  <p className="mt-3 text-faint">{w.codeLabel}</p>
                  <form
                    className="mt-2 flex gap-2"
                    onSubmit={(event) => {
                      event.preventDefault();
                      submit();
                    }}
                  >
                    <input
                      value={code}
                      inputMode="numeric"
                      autoComplete="off"
                      maxLength={8}
                      placeholder={w.codePlaceholder}
                      aria-label={w.codePlaceholder}
                      onChange={(event) => setCode(event.target.value)}
                      className="h-9 min-w-0 flex-1 rounded-xl border border-line-strong bg-raised/60 px-3 text-[14px] tracking-[0.2em] outline-none transition-colors placeholder:tracking-normal placeholder:text-faint focus:border-accent"
                    />
                    <GlassButton tone="accent" disabled={code.replace(/\D/g, "").length < 6} onClick={submit}>
                      {w.pair}
                    </GlassButton>
                  </form>
                </>
              )}
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {step === 0 && (
        <button
          type="button"
          onClick={() => setStep(STEPS - 1)}
          className="mt-3 cursor-pointer rounded-sm text-faint underline decoration-line-strong underline-offset-[3px] transition-colors hover:text-ink"
        >
          {g.skip}
        </button>
      )}

      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex gap-1.5" aria-hidden="true">
          {pages.map((_, index) => (
            <span
              key={index}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === step ? "w-4 bg-accent" : index < step ? "w-1.5 bg-accent/50" : "w-1.5 bg-ink/15"
              }`}
            />
          ))}
        </div>
        <div className="flex gap-2">
          {last && status?.retry && <GlassButton onClick={() => void api.androidPair()}>{w.retry}</GlassButton>}
          {step > 0 && pairing.state !== "paired" && (
            <GlassButton onClick={() => setStep(step - 1)}>{g.back}</GlassButton>
          )}
          {last ? (
            <GlassButton onClick={onClose}>{pairing.state === "paired" ? t.settings.close : w.cancel}</GlassButton>
          ) : (
            <GlassButton tone="accent" onClick={() => setStep(step + 1)}>
              {g.next}
            </GlassButton>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Android over Wi-Fi in the settings: on or off, the phones ready to mirror,
 * and the one-time setup that pairs a phone.
 */
export function AndroidWifiSetting() {
  const { t } = useI18n();
  const w = t.settings.wifi;
  const link = useAndroidLink();
  const [guide, setGuide] = useState(false);
  const block = useRef<HTMLDivElement>(null);

  const startSetup = () => setGuide(true);
  const closeSetup = () => {
    setGuide(false);
    void api.androidCancelPairing();
  };

  // Asked for from the home screen: open straight onto the setup.
  useEffect(() => {
    const open = () => {
      if (!takeSetupRequest()) return;
      startSetup();
      requestAnimationFrame(() => block.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    };
    open();
    window.addEventListener(SETUP_EVENT, open);
    return () => window.removeEventListener(SETUP_EVENT, open);
  }, []);

  // Paired: the phone appears in the list, and the guide can step aside.
  useEffect(() => {
    if (!guide || link?.pairing.state !== "paired" || link.phones.length === 0) return;
    const timer = window.setTimeout(() => {
      setGuide(false);
      void api.androidCancelPairing();
    }, 1600);
    return () => window.clearTimeout(timer);
  }, [guide, link?.pairing.state, link?.phones.length]);

  if (!link) return null;
  const showGuide = guide;

  return (
    <div ref={block} className="scroll-mt-4 border-b border-line py-4">
      <div className="flex items-center justify-between gap-5">
        <div className="min-w-0">
          <label htmlFor="setting-android-wifi" className="block text-[14px] font-medium">
            {w.label}
          </label>
          <p className="mt-0.5 text-[12.5px] leading-snug text-soft">
            {link.available ? w.description : w.unavailable}
          </p>
        </div>
        <Switch
          id="setting-android-wifi"
          checked={link.enabled}
          disabled={!link.available}
          onCheckedChange={(enabled) => {
            if (!enabled) setGuide(false);
            void api.androidEnable(enabled);
          }}
        />
      </div>

      {link.enabled && (
        <div className="mt-3 text-[12.5px] leading-snug">
          {link.phones.length > 0 ? (
            <ul className="space-y-1.5">
              {link.phones.map((phone) => {
                const mirroring = link.mirroring === phone.serial;
                return (
                  <li
                    key={phone.serial}
                    className="flex items-center justify-between gap-3 rounded-xl bg-raised/60 py-1.5 pl-3.5 pr-1.5"
                  >
                    <span className="flex min-w-0 items-center gap-2 font-medium text-ink">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-mint" />
                      <span className="truncate">{phone.name}</span>
                    </span>
                    <GlassButton
                      tone="accent"
                      disabled={mirroring}
                      onClick={() => void api.androidMirror(phone.serial).catch(() => {})}
                    >
                      {mirroring ? w.mirroring : w.mirror}
                    </GlassButton>
                  </li>
                );
              })}
            </ul>
          ) : (
            !showGuide && <p className="text-soft">{w.none}</p>
          )}
          {link.phones.length > 0 && <p className="mt-2 text-faint">{w.shortcuts}</p>}
        </div>
      )}

      {showGuide ? (
        <Tutorial link={link} onClose={closeSetup} />
      ) : (
        link.available && (
          <div className="mt-3 flex flex-col items-start gap-2">
            <GlassButton onClick={startSetup}>{link.phones.length > 0 ? w.setUpAnother : w.setUp}</GlassButton>
            {link.enabled && <p className="text-[12px] leading-snug text-faint">{w.tip}</p>}
          </div>
        )
      )}
    </div>
  );
}
