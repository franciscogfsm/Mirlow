import { Globe, Lock, RotateCw, Shield, ShieldCheck, Smartphone, Wifi, WifiOff } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { api } from "../lib/api";
import { useI18n } from "../lib/i18n";
import type { DiagnosticsState } from "../lib/useDiagnostics";
import { GlassButton } from "./controls";
import { Sheet } from "./Sheet";

function Item({
  icon,
  title,
  body,
  tone = "neutral",
  children,
}: {
  icon: ReactNode;
  title: string;
  body?: string;
  tone?: "neutral" | "warn" | "good";
  children?: ReactNode;
}) {
  const colour = tone === "warn" ? "text-warn" : tone === "good" ? "text-mint" : "text-soft";
  return (
    <li className="flex gap-3.5 border-b border-line py-4 last:border-b-0">
      <span className={`mt-0.5 shrink-0 ${colour}`}>{icon}</span>
      <div className="min-w-0">
        <h3 className="text-[14px] font-medium">{title}</h3>
        {body && <p className="mt-0.5 text-[12.5px] leading-snug text-soft">{body}</p>}
        {children && <div className="mt-3">{children}</div>}
      </div>
    </li>
  );
}

/**
 * Help for the one thing that goes wrong: the phone not seeing this PC.
 * What can be checked is checked, the likeliest causes come first, and every
 * fix goes through the same single "Fix it".
 */
export function HelpSheet({
  open,
  onOpenChange,
  state,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  state: DiagnosticsState;
}) {
  const { t, format } = useI18n();
  const h = t.help;
  const a = h.android;
  const { diagnostics, fixing, incomplete, refresh, fix } = state;

  useEffect(() => {
    if (open) refresh();
  }, [open, refresh]);

  const network = diagnostics?.network;
  const android = diagnostics?.android;
  // With the Wi-Fi off, Windows also reports Miracast as unavailable and the PC as offline; say only the cause.
  const wifiOff = android === "wifiOff" || Boolean(diagnostics?.wifiOff);
  const size = 18;
  const fixButton = (label: string) => (
    <GlassButton tone="accent" onClick={() => void fix()} disabled={fixing}>
      {fixing ? t.fix.working : label}
    </GlassButton>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={h.title} closeLabel={t.settings.close}>
      {incomplete && !fixing && (
        <p className="mb-1 rounded-2xl border border-line px-4 py-3 text-[12.5px] text-warn">
          {t.fix.declined}
        </p>
      )}
      <ul>
        {android === "listening" && (
          <Item tone="good" icon={<Smartphone size={size} />} title={a.ready} body={a.readyBody} />
        )}
        {android === "needsFeature" && (
          <Item
            tone="warn"
            icon={<Smartphone size={size} />}
            title={a.needsFeature.title}
            body={fixing ? t.fix.installing : incomplete ? a.needsFeature.failed : a.needsFeature.body}
          >
            <div className="flex flex-wrap gap-2">
              {fixButton(a.needsFeature.action)}
              {incomplete && (
                <GlassButton onClick={() => void api.openWindowsSettings("ms-settings:optionalfeatures")}>
                  {a.needsFeature.settings}
                </GlassButton>
              )}
            </div>
          </Item>
        )}
        {wifiOff && (
          <Item tone="warn" icon={<WifiOff size={size} />} title={a.wifiOff.title} body={a.wifiOff.body}>
            {fixButton(t.fix.action)}
          </Item>
        )}
        {android === "unsupported" && !wifiOff && (
          <Item icon={<Smartphone size={size} />} title={a.unsupported.title} body={a.unsupported.body} />
        )}
        {android === "disabled" && (
          <Item tone="warn" icon={<Smartphone size={size} />} title={a.disabled.title} body={a.disabled.body}>
            <GlassButton onClick={() => void api.openWindowsSettings("ms-settings:project")}>
              {a.disabled.action}
            </GlassButton>
          </Item>
        )}

        {diagnostics && !network && !wifiOff && (
          <Item
            tone="warn"
            icon={<WifiOff size={size} />}
            title={h.noNetwork.title}
            body={h.noNetwork.body}
          />
        )}

        {network?.category === "public" && (
          <Item
            tone="warn"
            icon={<Globe size={size} />}
            title={h.publicNetwork.title}
            body={h.publicNetwork.body}
          >
            {fixButton(t.fix.action)}
          </Item>
        )}

        {diagnostics?.firewallAllowed ? (
          <Item tone="good" icon={<ShieldCheck size={size} />} title={h.firewall.done} />
        ) : (
          <Item
            tone={diagnostics ? "warn" : "neutral"}
            icon={<Shield size={size} />}
            title={h.firewall.title}
            body={h.firewall.body}
          >
            {fixButton(h.firewall.action)}
          </Item>
        )}

        <Item
          icon={<Wifi size={size} />}
          title={h.sameNetwork.title}
          body={
            network
              ? `${h.sameNetwork.body} ${format(h.network, { name: network.name })}.`
              : h.sameNetwork.body
          }
        />

        <Item icon={<Lock size={size} />} title={h.vpn.title} body={h.vpn.body} />

        <Item icon={<RotateCw size={size} />} title={h.restart.title} body={h.restart.body}>
          <GlassButton
            onClick={() => {
              void api.restartEngine();
              onOpenChange(false);
            }}
          >
            {h.restart.action}
          </GlassButton>
        </Item>
      </ul>
    </Sheet>
  );
}
