import { LiquidGlass } from "@mirlow/ui";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { GlassButton } from "../components/controls";
import { Signal, type SignalMode } from "../components/Signal";
import { api, type Status } from "../lib/api";
import { useI18n } from "../lib/i18n";
import { useAndroidLink } from "../lib/useEngine";
import type { DiagnosticsState, Issue } from "../lib/useDiagnostics";

type Device = "iphone" | "android";

const DEVICE_KEY = "mirlow-device";

function savedDevice(): Device {
  try {
    return localStorage.getItem(DEVICE_KEY) === "android" ? "android" : "iphone";
  } catch {
    return "iphone";
  }
}

/** Two tabs, one per kind of phone, so the steps shown are the right ones. */
function DeviceSwitch({ value, onChange }: { value: Device; onChange: (device: Device) => void }) {
  const { t } = useI18n();
  return (
    <div role="tablist" className="mt-6 flex rounded-full border border-line p-0.5 text-[12.5px] font-medium">
      {(["iphone", "android"] as const).map((device) => (
        <button
          key={device}
          type="button"
          role="tab"
          aria-selected={value === device}
          onClick={() => onChange(device)}
          className={`relative h-7 cursor-pointer rounded-full px-4 transition-colors duration-300 ${
            value === device ? "text-ink" : "text-faint hover:text-soft"
          }`}
        >
          {value === device && (
            <motion.span
              layoutId="device-pill"
              className="absolute inset-0 rounded-full bg-line"
              transition={{ type: "spring", stiffness: 500, damping: 40 }}
            />
          )}
          <span className="relative">{t.waiting[device]}</span>
        </button>
      ))}
    </div>
  );
}

/**
 * The issues that matter for this kind of phone. A public network only hides
 * the PC from AirPlay, and an iPhone minds the Wi-Fi being off only when the
 * PC has no other network (on Ethernet it is fine).
 */
function issuesFor(device: Device, state: DiagnosticsState): Issue[] {
  return state.issues.filter((issue) => {
    if (device === "android") return issue !== "network";
    if (issue === "wifi") return !state.diagnostics?.network;
    return issue === "firewall" || issue === "network";
  });
}

/**
 * What stops a phone from finding this PC, said plainly, with one button that
 * sorts all of it out. Only what matters for the chosen phone is shown.
 */
function FixCard({ device, state }: { device: Device; state: DiagnosticsState }) {
  const { t } = useI18n();
  const { diagnostics, fixing, incomplete, fix } = state;
  const issues = issuesFor(device, state);
  const android = diagnostics?.android;

  // With the Wi-Fi off, Windows also reports Miracast as unavailable; the Wi-Fi comes first.
  if (device === "android" && android === "unsupported" && !issues.includes("wifi")) {
    return <p className="mt-5 max-w-[320px] text-[12px] text-faint">{t.fix.unsupported}</p>;
  }
  if (device === "android" && android === "disabled") {
    return (
      <div className="mt-5 flex max-w-[320px] flex-col items-center gap-3">
        <p className="text-[12px] text-soft">{t.fix.disabled}</p>
        <GlassButton onClick={() => void api.openWindowsSettings("ms-settings:project")}>
          {t.fix.disabledAction}
        </GlassButton>
      </div>
    );
  }
  if (issues.length === 0) return null;

  const installing = fixing && issues.includes("wirelessDisplay");
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="mt-5 w-full max-w-[320px] rounded-2xl border border-line px-4 py-3.5 text-left"
    >
      <p className="text-[13px] font-medium">{t.fix.title}</p>
      <ul className="mt-2 space-y-1 text-[12.5px] text-soft">
        {issues.map((issue) => (
          <li key={issue} className="flex items-center gap-2">
            <span className="h-1 w-1 shrink-0 rounded-full bg-current" />
            {t.fix[issue]}
          </li>
        ))}
      </ul>
      {(installing || (incomplete && !fixing)) && (
        <p className="mt-2 text-[12px] text-faint">{installing ? t.fix.installing : t.fix.declined}</p>
      )}
      <GlassButton tone="accent" className="mt-3 w-full" onClick={() => void fix()} disabled={fixing}>
        {fixing ? t.fix.working : t.fix.action}
      </GlassButton>
    </motion.div>
  );
}

interface Copy {
  headline: string;
  body?: string;
  mode: SignalMode;
}

/**
 * Everything short of a picture: starting, ready, a device connecting, sound
 * only, and recovering. One layout, so moving between them is a change of
 * words and rhythm, never a change of screen.
 */
export function WaitingView({
  status,
  onRename,
  onOpenHelp,
  onSetUpAndroid,
  diagnostics,
}: {
  status: Status;
  onRename: () => void;
  onOpenHelp: () => void;
  /** Opens the settings onto pairing an Android phone over Wi-Fi. */
  onSetUpAndroid: () => void;
  diagnostics: DiagnosticsState;
}) {
  const { t, format } = useI18n();
  const link = useAndroidLink();
  // Paired Android phones on the network, one click from mirroring.
  const phones = link?.enabled && !link.mirroring ? link.phones : [];
  const [phone, setPhone] = useState<Device>(savedDevice);
  const chooseDevice = (next: Device) => {
    setPhone(next);
    try {
      localStorage.setItem(DEVICE_KEY, next);
    } catch {
      // Remembering the choice is a nicety.
    }
  };
  const device = status.client?.name;

  const copy: Copy = (() => {
    switch (status.phase) {
      case "starting":
        return { headline: t.starting.headline, body: t.starting.body, mode: "idle" };
      case "recovering":
        return { headline: t.recovering.headline, body: t.recovering.body, mode: "idle" };
      case "connecting":
      case "mirroring":
        return {
          headline: device
            ? format(t.connecting.headline, { device })
            : t.connecting.headlineUnknown,
          body: status.client?.pin
            ? format(t.connecting.pin, { pin: status.client.pin })
            : t.connecting.body,
          mode: "active",
        };
      case "audio":
        return {
          headline: device ? format(t.audio.headline, { device }) : t.audio.headlineUnknown,
          body: t.audio.body,
          mode: "active",
        };
      default:
        return { headline: t.waiting.headline, mode: "ready" };
    }
  })();

  const ready = status.phase === "ready";
  const choose = format(t.waiting.step3, { name: status.name });
  const steps =
    phone === "android"
      ? [t.waiting.androidStep1, t.waiting.androidStep2, choose]
      : [t.waiting.step1, t.waiting.step2, choose];
  const showFix =
    issuesFor(phone, diagnostics).length > 0 ||
    (phone === "android" &&
      (diagnostics.diagnostics?.android === "unsupported" || diagnostics.diagnostics?.android === "disabled"));

  return (
    <div className="flex h-full flex-col items-center px-8 pb-5">
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center">
        {/* Smaller once ready, to make room for the steps, and smaller still when something needs fixing. */}
        <motion.div
          className="flex shrink-0 items-center justify-center"
          initial={false}
          animate={{ height: ready ? (showFix ? 120 : 176) : 232 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.div
            initial={false}
            animate={{ scale: ready ? (showFix ? 0.52 : 0.76) : 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <Signal mode={copy.mode} />
          </motion.div>
        </motion.div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={status.phase === "mirroring" ? "connecting" : status.phase}
            className={`${ready ? "mt-3" : "mt-7"} flex flex-col items-center text-center`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="text-[25px] font-semibold leading-tight tracking-[-0.03em]">
              {copy.headline}
            </h1>
            {copy.body && (
              <p className="mt-2 max-w-[300px] text-[13.5px] text-soft">{copy.body}</p>
            )}

            {ready && (
              <>
                {!showFix && (
                  <p className="mt-5 text-[12px] font-medium uppercase tracking-[0.08em] text-faint">
                    {t.waiting.nameLabel}
                  </p>
                )}
                <LiquidGlass
                  as="button"
                  type="button"
                  radius={999}
                  bezel={14}
                  depth={20}
                  frost={1}
                  className={`lg-press ${showFix ? "mt-4" : "mt-2"} max-w-full`}
                  contentClassName="block max-w-[320px] truncate px-5 py-2.5 text-[16px] font-semibold tracking-[-0.01em]"
                  onClick={onRename}
                  title={t.settings.name.description}
                >
                  {status.name}
                </LiquidGlass>

                {phones.length > 0 && (
                  <div className="mt-5 flex flex-col items-center gap-2">
                    <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-faint">
                      {t.wifi.ready}
                    </p>
                    {phones.map((phone) => (
                      <GlassButton
                        key={phone.serial}
                        tone="accent"
                        onClick={() => void api.androidMirror(phone.serial).catch(() => {})}
                      >
                        {format(t.wifi.mirror, { device: phone.name })}
                      </GlassButton>
                    ))}
                  </div>
                )}

                <DeviceSwitch value={phone} onChange={chooseDevice} />

                <ol className="mt-5 space-y-2 text-left text-[13.5px] text-soft">
                  {steps.map((step, index) => (
                    <li key={step} className="flex items-center gap-3">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-line-strong text-[11px] font-semibold text-ink">
                        {index + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
                {showFix ? (
                  <FixCard device={phone} state={diagnostics} />
                ) : (
                  <p className="mt-5 max-w-[300px] text-[12px] text-faint">
                    {phone === "android" ? t.waiting.androidHint : t.waiting.hint}
                    {phone === "android" && link?.available && phones.length === 0 && (
                      <button
                        type="button"
                        onClick={onSetUpAndroid}
                        className="mt-2 block w-full cursor-pointer rounded-sm text-soft underline decoration-line-strong underline-offset-[3px] transition-colors hover:text-ink"
                      >
                        {t.wifi.setUp}
                      </button>
                    )}
                  </p>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <button
        type="button"
        data-help
        onClick={onOpenHelp}
        className={`h-8 cursor-pointer rounded-full px-3 text-[12.5px] text-faint transition-all duration-500 hover:text-ink ${
          ready ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        tabIndex={ready ? 0 : -1}
      >
        {t.help.toggle}
      </button>
    </div>
  );
}
