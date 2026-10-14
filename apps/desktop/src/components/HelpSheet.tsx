import { Globe, Lock, RotateCw, Shield, ShieldCheck, Smartphone, Wifi, WifiOff } from "lucide-react";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { api, type AndroidStatus, type Diagnostics } from "../lib/api";
import { useI18n } from "../lib/i18n";
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

type FirewallState = "idle" | "working" | "failed";

/** Whether Android phones can find this PC, and the fix when they can't. */
function AndroidItem({ status, onChange }: { status: AndroidStatus; onChange: () => void }) {
  const { t } = useI18n();
  const a = t.help.android;
  const [install, setInstall] = useState<FirewallState>("idle");
  const size = 18;

  const run = async () => {
    setInstall("working");
    const next = await api.installWirelessDisplay().catch(() => null);
    setInstall(next === "listening" ? "idle" : "failed");
    onChange();
  };

  switch (status) {
    case "listening":
      return <Item tone="good" icon={<Smartphone size={size} />} title={a.ready} body={a.readyBody} />;
    case "needsFeature":
      return (
        <Item
          tone="warn"
          icon={<Smartphone size={size} />}
          title={a.needsFeature.title}
          body={install === "failed" ? a.needsFeature.failed : a.needsFeature.body}
        >
          {install === "failed" ? (
            <GlassButton onClick={() => void api.openWindowsSettings("ms-settings:optionalfeatures")}>
              {a.needsFeature.settings}
            </GlassButton>
          ) : (
            <GlassButton tone="accent" onClick={run} disabled={install === "working"}>
              {install === "working" ? a.needsFeature.working : a.needsFeature.action}
            </GlassButton>
          )}
        </Item>
      );
    case "wifiOff":
      return <Item tone="warn" icon={<WifiOff size={size} />} title={a.wifiOff.title} body={a.wifiOff.body} />;
    case "unsupported":
      return <Item icon={<Smartphone size={size} />} title={a.unsupported.title} body={a.unsupported.body} />;
    case "disabled":
      return (
        <Item tone="warn" icon={<Smartphone size={size} />} title={a.disabled.title} body={a.disabled.body}>
          <GlassButton onClick={() => void api.openWindowsSettings("ms-settings:project")}>
            {a.disabled.action}
          </GlassButton>
        </Item>
      );
    default:
      return null;
  }
}

/**
 * Help for the one thing that goes wrong: the iPhone not seeing this PC.
 * What can be checked is checked, and the likeliest causes come first.
 */
export function HelpSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t, format } = useI18n();
  const h = t.help;
  const [diagnostics, setDiagnostics] = useState<Diagnostics | null>(null);
  const [firewall, setFirewall] = useState<FirewallState>("idle");

  const refresh = useCallback(() => {
    api.getDiagnostics().then(setDiagnostics, () => {});
  }, []);

  useEffect(() => {
    if (!open) return;
    setFirewall("idle");
    refresh();
  }, [open, refresh]);

  const allow = async () => {
    setFirewall("working");
    const allowed = await api.allowFirewall().catch(() => false);
    setFirewall(allowed ? "idle" : "failed");
    refresh();
  };

  const network = diagnostics?.network;
  const size = 18;

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={h.title} closeLabel={t.settings.close}>
      <ul>
        {diagnostics && <AndroidItem status={diagnostics.android} onChange={refresh} />}

        {diagnostics && !network && (
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
            <GlassButton onClick={() => void api.openNetworkSettings()}>
              {h.publicNetwork.action}
            </GlassButton>
          </Item>
        )}

        {diagnostics?.firewallAllowed ? (
          <Item tone="good" icon={<ShieldCheck size={size} />} title={h.firewall.done} />
        ) : (
          <Item
            tone={diagnostics ? "warn" : "neutral"}
            icon={<Shield size={size} />}
            title={h.firewall.title}
            body={firewall === "failed" ? h.firewall.failed : h.firewall.body}
          >
            <GlassButton tone="accent" onClick={allow} disabled={firewall === "working"}>
              {firewall === "working" ? h.firewall.working : h.firewall.action}
            </GlassButton>
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
