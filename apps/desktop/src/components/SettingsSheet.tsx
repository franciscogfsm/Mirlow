import { links, localeNames, locales } from "@mirlow/i18n";
import { getVersion } from "@tauri-apps/api/app";
import { openUrl } from "@tauri-apps/plugin-opener";
import { Check, ChevronRight } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import {
  api,
  type LanguageSetting,
  type RemoteStatus,
  type Settings,
  type Support,
  type ThemeSetting,
} from "../lib/api";
import { useI18n } from "../lib/i18n";
import { AndroidWifiSetting } from "./AndroidWifi";
import { Segmented, Switch } from "./controls";
import { Sheet } from "./Sheet";

function Row({
  label,
  description,
  htmlFor,
  children,
}: {
  label: string;
  description?: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-5 border-b border-line py-4 last:border-b-0">
      <div className="min-w-0">
        <label htmlFor={htmlFor} className="block text-[14px] font-medium">
          {label}
        </label>
        {description && <p className="mt-0.5 text-[12.5px] leading-snug text-soft">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function LinkButton({
  href,
  onClick,
  children,
}: {
  href?: string;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick ?? (() => href && void openUrl(href))}
      className="cursor-pointer rounded-sm text-soft underline decoration-line-strong underline-offset-[3px] transition-colors hover:text-ink"
    >
      {children}
    </button>
  );
}

/**
 * The way through pairing, one numbered step at a time. The steps a
 * connection proves done are ticked off, so it is plain what comes next.
 */
type Phone = "iphone" | "android";

function PairingGuide({ remote, android }: { remote: RemoteStatus; android: boolean }) {
  const { t, format } = useI18n();
  const c = t.settings.control;
  const connected = remote.state === "connected";
  // The steps for whichever phone is mirroring, or the iPhone's to begin with.
  const [phone, setPhone] = useState<Phone>(android ? "android" : "iphone");
  useEffect(() => {
    if (android) setPhone("android");
  }, [android]);
  const title = connected
    ? remote.host
      ? format(c.connectedTitle, { device: remote.host })
      : c.connectedTitleUnknown
    : c.waitingTitle;
  // Where AssistiveTouch is, one tap at a time, the way the iPhone names it.
  const path = c.steps.pointerPath;
  const assistiveTouch = (
    <>
      <span className="mt-1.5 flex flex-wrap items-center gap-1">
        {path.map((place, index) => (
          <span key={place} className="flex items-center gap-1">
            <span
              className={`rounded-md px-1.5 py-0.5 text-[11.5px] font-medium ${
                index === path.length - 1 ? "bg-mint/20 text-mint" : "bg-ink/10 text-ink"
              }`}
            >
              {place}
            </span>
            {index < path.length - 1 && <ChevronRight size={12} className="text-faint" aria-hidden="true" />}
          </span>
        ))}
      </span>
      <span className="mt-1.5 block text-faint">{c.steps.pointerSiri}</span>
    </>
  );
  const steps: { text: string; done: boolean; more?: ReactNode }[] =
    phone === "iphone"
      ? [
          {
            text: remote.pcName ? format(c.steps.pair, { pc: remote.pcName }) : c.steps.pairUnknown,
            done: connected,
          },
          { text: c.steps.confirm, done: connected },
          { text: c.steps.pointer, done: false, more: assistiveTouch },
          { text: c.steps.use, done: false },
        ]
      : [
          {
            text: remote.pcName ? format(c.android.pair, { pc: remote.pcName }) : c.android.pairUnknown,
            done: connected,
          },
          { text: c.android.confirm, done: connected },
          { text: c.android.use, done: false },
        ];

  return (
    <div className="mt-3 rounded-xl bg-raised/60 px-3.5 py-3 text-[12.5px] leading-snug" role="status">
      <div className="flex items-center justify-between gap-3">
        <p className="flex min-w-0 items-center gap-2 font-medium text-ink">
          <span
            className={`h-1.5 w-1.5 shrink-0 rounded-full ${connected ? "bg-mint" : "bg-faint animate-pulse"}`}
          />
          {title}
        </p>
        <Segmented<Phone>
          label={c.phone}
          value={phone}
          onChange={setPhone}
          options={[
            { value: "iphone", label: c.iphone },
            { value: "android", label: c.android.name },
          ]}
        />
      </div>
      <ol className="mt-2.5 space-y-2">
        {steps.map((step, index) => (
          <li key={step.text} className={`flex gap-2.5 ${step.done ? "text-faint" : "text-soft"}`}>
            <span
              className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full text-[10.5px] font-semibold ${
                step.done ? "bg-mint/20 text-mint" : "bg-ink/10 text-ink"
              }`}
            >
              {step.done ? <Check size={11} strokeWidth={3} /> : index + 1}
            </span>
            <span className="min-w-0">
              <span className={step.done ? "line-through decoration-faint/60" : undefined}>{step.text}</span>
              {step.more}
            </span>
          </li>
        ))}
      </ol>
      {connected && <p className="mt-2.5 text-faint">{phone === "iphone" ? c.stuck : c.android.stuck}</p>}
    </div>
  );
}

/** What to do next for mouse and keyboard, given where Bluetooth stands. */
function RemoteNote({ remote, android }: { remote: RemoteStatus; android: boolean }) {
  const { t } = useI18n();
  const c = t.settings.control;
  let lines: string[];
  let action: ReactNode = null;
  switch (remote.state) {
    case "waiting":
    case "connected":
      return <PairingGuide remote={remote} android={android} />;
    case "off":
    case "starting":
      lines = [c.starting];
      break;
    case "bluetoothOff":
      lines = [c.bluetoothOff];
      action = (
        <LinkButton onClick={() => void api.openWindowsSettings("ms-settings:bluetooth")}>
          {c.openBluetooth}
        </LinkButton>
      );
      break;
    case "noBluetooth":
      lines = [c.noBluetooth];
      break;
    case "unsupported":
      lines = [c.unsupported];
      break;
  }
  return (
    <div className="mt-3 space-y-1.5 rounded-xl bg-raised/60 px-3.5 py-3 text-[12.5px] leading-snug text-soft">
      {lines.map((line) => (
        <p key={line}>{line}</p>
      ))}
      {action && <p>{action}</p>}
    </div>
  );
}

/**
 * Whether this PC can do mouse and keyboard at all, found out on its own,
 * shown while the feature is off so nobody has to try it to learn.
 */
function SupportLine({ support }: { support: Support }) {
  const { t } = useI18n();
  const c = t.settings.control;
  const tone = support === "supported" ? "bg-mint" : support === "checking" ? "bg-faint" : "bg-warn";
  const text = {
    checking: c.checking,
    supported: c.supported,
    bluetoothOff: c.bluetoothOff,
    noBluetooth: c.noBluetooth,
    unsupported: c.unsupported,
  }[support];
  return (
    <div className="mt-2.5 flex items-start gap-2 text-[12.5px] leading-snug text-soft" role="status">
      <span className={`mt-1.25 h-1.5 w-1.5 shrink-0 rounded-full ${tone}`} />
      <p>
        {text}
        {support === "bluetoothOff" && (
          <>
            {" "}
            <LinkButton onClick={() => void api.openWindowsSettings("ms-settings:bluetooth")}>
              {c.openBluetooth}
            </LinkButton>
          </>
        )}
      </p>
    </div>
  );
}

export function SettingsSheet({
  open,
  onOpenChange,
  settings,
  remote,
  android,
  onChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: Settings;
  remote: RemoteStatus | null;
  /** An Android phone is mirroring, so its steps come first. */
  android: boolean;
  onChange: (patch: Partial<Settings>) => void;
}) {
  const { t, format } = useI18n();
  const s = t.settings;
  const [name, setName] = useState(settings.name);
  const [version, setVersion] = useState("");

  useEffect(() => setName(settings.name), [settings.name]);
  useEffect(() => {
    getVersion().then(setVersion, () => {});
  }, []);

  const commitName = () => {
    const next = name.trim();
    if (next && next !== settings.name) onChange({ name: next });
    else setName(settings.name);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={s.title} closeLabel={s.close}>
      <div className="border-b border-line py-4">
        <label htmlFor="receiver-name" className="block text-[14px] font-medium">
          {s.name.label}
        </label>
        <p className="mt-0.5 text-[12.5px] text-soft">{s.name.description}</p>
        <input
          id="receiver-name"
          value={name}
          maxLength={40}
          spellCheck={false}
          autoComplete="off"
          placeholder={s.name.placeholder}
          onChange={(event) => setName(event.target.value)}
          onBlur={commitName}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur();
          }}
          className="mt-3 h-10 w-full rounded-xl border border-line-strong bg-raised/60 px-3.5 text-[14px] outline-none transition-colors placeholder:text-faint focus:border-accent"
        />
      </div>

      <Row label={s.sound.label} description={s.sound.description} htmlFor="setting-sound">
        <Switch
          id="setting-sound"
          checked={settings.sound}
          onCheckedChange={(sound) => onChange({ sound })}
        />
      </Row>

      <Row
        label={s.compatibility.label}
        description={s.compatibility.description}
        htmlFor="setting-compatibility"
      >
        <Switch
          id="setting-compatibility"
          checked={settings.compatibility}
          onCheckedChange={(compatibility) => onChange({ compatibility })}
        />
      </Row>

      <AndroidWifiSetting />

      <div className="border-b border-line py-4">
        <div className="flex items-center justify-between gap-5">
          <div className="min-w-0">
            <label htmlFor="setting-control" className="block text-[14px] font-medium">
              {s.control.label}
            </label>
            <p className="mt-0.5 text-[12.5px] leading-snug text-soft">{s.control.description}</p>
          </div>
          <Switch
            id="setting-control"
            checked={settings.control}
            // Nothing to turn on without a capable adapter; turning off always works.
            disabled={
              !settings.control && (remote?.support === "noBluetooth" || remote?.support === "unsupported")
            }
            onCheckedChange={(control) => onChange({ control })}
          />
        </div>
        {settings.control && (
          <div className="mt-4">
            <label htmlFor="setting-speed" className="block text-[13px] font-medium">
              {s.control.speed}
            </label>
            <div className="mt-2 flex items-center gap-3 text-[11.5px] text-faint">
              <span>{s.control.slower}</span>
              <input
                id="setting-speed"
                type="range"
                min={1}
                max={10}
                step={1}
                value={settings.pointerSpeed}
                onChange={(event) => onChange({ pointerSpeed: Number(event.target.value) })}
                className="h-1.5 min-w-0 flex-1 cursor-pointer accent-accent"
              />
              <span>{s.control.faster}</span>
            </div>
            <p className="mt-1.5 text-[11.5px] text-faint">{s.control.speedHint}</p>
          </div>
        )}
        {remote &&
          (settings.control ? <RemoteNote remote={remote} android={android} /> : <SupportLine support={remote.support} />)}
      </div>

      <Row label={s.theme.label}>
        <Segmented<ThemeSetting>
          label={s.theme.label}
          value={settings.theme}
          onChange={(theme) => onChange({ theme })}
          options={[
            { value: "system", label: s.theme.system },
            { value: "light", label: s.theme.light },
            { value: "dark", label: s.theme.dark },
          ]}
        />
      </Row>

      <Row label={s.language.label}>
        <Segmented<LanguageSetting>
          label={s.language.label}
          value={settings.language}
          onChange={(language) => onChange({ language })}
          options={[
            { value: "system", label: s.language.system },
            ...locales.map((locale) => ({ value: locale, label: localeNames[locale] })),
          ]}
        />
      </Row>

      <footer className="pt-6 text-[12px] leading-relaxed text-soft">
        <p>{s.about.free}</p>
        <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
          <LinkButton href={links.repository}>{s.about.source}</LinkButton>
          <LinkButton href={links.licenses}>{s.about.licenses}</LinkButton>
        </p>
        <p className="mt-3 text-faint">
          {version && `${format(s.about.version, { version })} · `}
          {s.about.disclaimer}
        </p>
      </footer>
    </Sheet>
  );
}
