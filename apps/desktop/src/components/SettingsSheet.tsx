import { links, localeNames, locales } from "@mirlow/i18n";
import { getVersion } from "@tauri-apps/api/app";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useEffect, useState, type ReactNode } from "react";
import { api, type LanguageSetting, type RemoteStatus, type Settings, type ThemeSetting } from "../lib/api";
import { useI18n } from "../lib/i18n";
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

/** What to do next for mouse and keyboard, given where Bluetooth stands. */
function RemoteNote({ remote }: { remote: RemoteStatus }) {
  const { t, format } = useI18n();
  const c = t.settings.control;
  const pc = remote.pcName;
  const device = remote.host;
  let lines: string[];
  let action: ReactNode = null;
  switch (remote.state) {
    case "off":
    case "starting":
      lines = [c.starting];
      break;
    case "waiting":
      lines = [pc ? format(c.waiting, { pc }) : c.waitingUnknown, c.pointer];
      break;
    case "connected":
      lines = [device ? format(c.connected, { device }) : c.connectedUnknown, c.pointer];
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

export function SettingsSheet({
  open,
  onOpenChange,
  settings,
  remote,
  onChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: Settings;
  remote: RemoteStatus | null;
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
            onCheckedChange={(control) => onChange({ control })}
          />
        </div>
        {settings.control && remote && <RemoteNote remote={remote} />}
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
