import { useCallback, useEffect, useState } from "react";
import { api, type Diagnostics } from "./api";

/** Something that stops a phone from finding this PC, and that "Fix it" puts right. */
export type Issue = "wifi" | "wirelessDisplay" | "firewall" | "network";

export function issuesOf(diagnostics: Diagnostics | null): Issue[] {
  if (!diagnostics) return [];
  const issues: Issue[] = [];
  if (diagnostics.wifiOff || diagnostics.android === "wifiOff") issues.push("wifi");
  if (diagnostics.android === "needsFeature") issues.push("wirelessDisplay");
  if (!diagnostics.firewallAllowed) issues.push("firewall");
  if (diagnostics.network?.category === "public") issues.push("network");
  return issues;
}

/** How often to look again while the PC waits for a phone. */
const REFRESH_MS = 15_000;

export interface DiagnosticsState {
  diagnostics: Diagnostics | null;
  issues: Issue[];
  fixing: boolean;
  /** The last fix left something unresolved. */
  incomplete: boolean;
  refresh: () => void;
  fix: () => Promise<void>;
}

/**
 * What stands between a phone and this PC, kept current while `active`, and
 * the one action that clears it.
 */
export function useDiagnostics(active: boolean): DiagnosticsState {
  const [diagnostics, setDiagnostics] = useState<Diagnostics | null>(null);
  const [fixing, setFixing] = useState(false);
  const [incomplete, setIncomplete] = useState(false);

  const refresh = useCallback(() => {
    api.getDiagnostics().then(setDiagnostics, () => {});
  }, []);

  useEffect(() => {
    if (!active) return;
    refresh();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, REFRESH_MS);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
    };
  }, [active, refresh]);

  const fix = useCallback(async () => {
    setFixing(true);
    setIncomplete(false);
    const after = await api.fixAll().catch(() => null);
    if (after) setDiagnostics(after);
    setIncomplete(!after || issuesOf(after).length > 0);
    setFixing(false);
  }, []);

  return { diagnostics, issues: issuesOf(diagnostics), fixing, incomplete, refresh, fix };
}
