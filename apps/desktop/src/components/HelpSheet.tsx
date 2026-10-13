import { Globe, Lock, RotateCw, Shield, ShieldCheck, Wifi, WifiOff } from "lucide-react";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { api, type Diagnostics } from "../lib/api";
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
