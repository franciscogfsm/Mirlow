import { Check } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
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

function Step({ index, children }: { index: number; children: ReactNode }) {
  return (
    <li className="flex gap-2.5 text-soft">
      <span className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-ink/10 text-[10.5px] font-semibold text-ink">
        {index}
      </span>
      <span className="min-w-0">{children}</span>
    </li>
  );
}

/** The one-time setup: the phone trusts this PC, by QR code or by pairing code. */
function PairingGuide({ link, onClose }: { link: AndroidLink; onClose: () => void }) {
  const { t } = useI18n();
  const w = t.settings.wifi;
  const [code, setCode] = useState("");
  const { pairing } = link;
  const qr = pairing.state === "waiting" ? pairing.qr : null;

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

  return (
    <div className="mt-3 rounded-xl bg-raised/60 px-3.5 py-3 text-[12.5px] leading-snug">
      <ol className="space-y-2">
        <Step index={1}>{w.steps.developer}</Step>
        <Step index={2}>{w.steps.wireless}</Step>
        <Step index={3}>{w.steps.scan}</Step>
      </ol>

      <div className="mt-3 flex justify-center">
        {qr ? (
          <QrCode qr={qr} label={w.steps.scan} />
        ) : pairing.state === "paired" ? (
          <span className="flex h-44 w-44 items-center justify-center rounded-xl bg-mint/15 text-mint">
            <Check size={40} strokeWidth={2.5} />
          </span>
        ) : (
          <span className="h-44 w-44 rounded-xl bg-ink/5" />
        )}
      </div>

      {status && (
        <p className="mt-3 flex items-center justify-center gap-2 text-center text-soft" role="status">
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

      <div className="mt-3 flex justify-end gap-2">
        {status?.retry && <GlassButton onClick={() => void api.androidPair()}>{w.retry}</GlassButton>}
        <GlassButton onClick={onClose}>{pairing.state === "paired" ? t.settings.close : w.cancel}</GlassButton>
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

  const startSetup = () => {
    setGuide(true);
    void api.androidPair();
  };
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
  const showGuide = guide && link.pairing.state !== "idle";

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
        <PairingGuide link={link} onClose={closeSetup} />
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
