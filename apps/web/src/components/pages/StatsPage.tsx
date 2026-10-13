"use client";

import { links } from "@mirlow/i18n";
import { Wordmark } from "@mirlow/ui";
import Link from "next/link";
import { useEffect, useState } from "react";

const installer = "Mirlow-Setup-x64.exe";
const api = `${links.repository.replace("github.com", "api.github.com/repos")}/releases?per_page=100`;

type Release = { version: string; published: string; downloads: number };
type State = { status: "loading" } | { status: "error" } | { status: "ready"; releases: Release[] };

type ApiRelease = {
  tag_name: string;
  published_at: string | null;
  draft: boolean;
  assets: { name: string; download_count: number }[];
};

/**
 * How many times the installer has been downloaded. GitHub counts this for
 * every release file, so the page only reads its public API from the browser:
 * nothing is tracked by the site itself.
 */
export function StatsPage() {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    fetch(api, { headers: { Accept: "application/vnd.github+json" } })
      .then((response) => (response.ok ? response.json() : Promise.reject(response.status)))
      .then((data: ApiRelease[]) => {
        if (cancelled) return;
        const releases = data
          .filter((each) => !each.draft)
          .map((each) => ({
            version: each.tag_name,
            published: each.published_at ?? "",
            downloads: each.assets.find((asset) => asset.name === installer)?.download_count ?? 0,
          }));
        setState({ status: "ready", releases });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const total =
    state.status === "ready" ? state.releases.reduce((sum, each) => sum + each.downloads, 0) : null;

  return (
    <main className="mx-auto flex min-h-screen max-w-[560px] flex-col px-6 pb-24 pt-16">
      <Link href="/" aria-label="Mirlow">
        <Wordmark size={18} gradient={false} />
      </Link>

      <p className="mt-24 text-[14px] text-faint">Installer downloads</p>
      <p
        className="mt-3 text-[clamp(4.5rem,18vw,8rem)] font-semibold leading-none tracking-[-0.05em] tabular-nums"
        aria-live="polite"
      >
        {total === null ? "—" : total.toLocaleString("en")}
      </p>

      {state.status === "error" && (
        <p className="mt-8 text-[15px] leading-relaxed text-soft">
          GitHub did not return the numbers. They appear once the repository is public and has a
          release, and GitHub allows 60 requests an hour from one address.
        </p>
      )}

      {state.status === "ready" && state.releases.length > 0 && (
        <ul className="mt-14 border-t border-line">
          {state.releases.map((each) => (
            <li
              key={each.version}
              className="flex items-baseline justify-between gap-6 border-b border-line py-4 text-[15px]"
            >
              <span>
                {each.version}
                {each.published && (
                  <span className="ml-3 text-[13px] text-faint">{each.published.slice(0, 10)}</span>
                )}
              </span>
              <span className="tabular-nums text-soft">{each.downloads.toLocaleString("en")}</span>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-10 text-[13px] leading-relaxed text-faint">
        Counted by GitHub, live. Every download of the installer counts, including repeats, so this
        is an upper bound on the number of people.
      </p>
    </main>
  );
}
