import { useCallback, useEffect, useState } from "react";
import { api, type RemoteStatus, type Settings, type Status } from "./api";

/** The engine's live status, straight from the backend. `null` until first known. */
export function useEngineStatus(): Status | null {
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    let active = true;
    let unlisten: (() => void) | undefined;

    // Subscribe before asking for the current value, so no change is missed.
    api
      .onStatus((next) => active && setStatus(next))
      .then((stop) => {
        if (active) unlisten = stop;
        else stop();
      });
    api.getStatus().then((current) => active && setStatus((seen) => seen ?? current));

    return () => {
      active = false;
      unlisten?.();
    };
  }, []);

  return status;
}

/** Whether a phone is connected over Bluetooth for mouse and keyboard. `null` until first known. */
export function useRemoteStatus(): RemoteStatus | null {
  const [status, setStatus] = useState<RemoteStatus | null>(null);

  useEffect(() => {
    let active = true;
    let unlisten: (() => void) | undefined;

    api
      .onRemoteStatus((next) => active && setStatus(next))
      .then((stop) => {
        if (active) unlisten = stop;
        else stop();
      });
    api.getRemoteStatus().then((current) => active && setStatus((seen) => seen ?? current));

    return () => {
      active = false;
      unlisten?.();
    };
  }, []);

  return status;
}

export function useSettings(): [Settings | null, (patch: Partial<Settings>) => void] {
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    api.getSettings().then(setSettings);
  }, []);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((current) => {
      if (!current) return current;
      const next = { ...current, ...patch };
      // The backend may adjust what it is given (an empty name, for one).
      api.updateSettings(next).then(setSettings, () => setSettings(current));
      return next;
    });
  }, []);

  return [settings, update];
}
