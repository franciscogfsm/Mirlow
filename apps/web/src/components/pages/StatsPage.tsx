"use client";

import { links } from "@mirlow/i18n";
import { Wordmark } from "@mirlow/ui";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

/** Written by scripts/stats.ps1 (npm run stats). */
// Exact case: raw.githubusercontent.com does not follow the repository's renamed spelling.
const source = "https://raw.githubusercontent.com/franciscogfsm/Mirlow/stats-data/stats.json";

type Item = {
  title: string;
  url: string;
  created: string;
  author: string;
  comments: number;
  votes?: number;
  answered?: boolean;
};
type List = { total: number; items: Item[] };
type Stats = {
  updated: string;
  stars: number;
  downloads: number;
  releases: { version: string; published: string | null; downloads: number }[];
  history: { date: string; downloads: number; stars: number }[];
  ideas: List;
  questions: List;
  issues: List;
};
type State = { status: "loading" } | { status: "error" } | { status: "ready"; stats: Stats };

const number = (value: number) => value.toLocaleString("en");
const DAYS = 30;

function ago(iso: string) {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 60) return `${Math.max(minutes, 1)} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours} h ago`;
  return `${Math.round(hours / 24)} days ago`;
}

/** Downloads on each day: the change in the running total since the day before. */
function perDay(history: Stats["history"]) {
  return history.slice(1).map((day, index) => ({
    date: day.date,
    downloads: Math.max(0, day.downloads - history[index]!.downloads),
  }));
}

function Section({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="mt-16">
      <div className="flex items-baseline justify-between gap-4 border-b border-line pb-3">
        <h2 className="text-[14px] text-faint">{title}</h2>
        {aside && <span className="text-[13px] text-faint">{aside}</span>}
      </div>
      {children}
    </section>
  );
}

function Tile({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-line px-4 py-3.5">
      <p className="text-[12.5px] text-faint">{label}</p>
      <p className="mt-1 text-[26px] font-semibold leading-tight tracking-[-0.03em] tabular-nums">{value}</p>
      {note && <p className="mt-0.5 text-[12px] text-soft">{note}</p>}
    </div>
  );
}

function DailyChart({ days }: { days: { date: string; downloads: number }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const shown = days.slice(-DAYS);
  if (shown.length === 0) {
    return (
      <p className="py-6 text-[14px] text-soft">
        Daily numbers start from the first snapshot. Check back tomorrow.
      </p>
    );
  }
  const max = Math.max(1, ...shown.map((day) => day.downloads));
  const active = hover === null ? null : shown[hover];
  return (
    <div className="pt-6">
      <p className="h-5 text-[13px] text-soft tabular-nums" aria-live="polite">
        {active ? `${active.date} · ${number(active.downloads)} downloads` : `Peak: ${number(max)} in a day`}
      </p>
      <div className="mt-3 flex h-40 items-end gap-[2px] border-b border-line" onMouseLeave={() => setHover(null)}>
        {shown.map((day, index) => (
          <button
            key={day.date}
            type="button"
            aria-label={`${day.date}: ${day.downloads} downloads`}
            onMouseEnter={() => setHover(index)}
            onFocus={() => setHover(index)}
            onBlur={() => setHover(null)}
            className="flex h-full min-w-0 flex-1 cursor-default items-end outline-none"
          >
            <span
              className={`block w-full rounded-t-[4px] bg-ink transition-opacity duration-200 ${
                hover === null || hover === index ? "opacity-100" : "opacity-30"
              }`}
              style={{ height: `${Math.max((day.downloads / max) * 100, day.downloads ? 2 : 0.5)}%` }}
            />
          </button>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[12px] text-faint tabular-nums">
        <span>{shown[0]!.date}</span>
        <span>{shown[shown.length - 1]!.date}</span>
      </div>
    </div>
  );
}

function Feed({ list, empty, badge }: { list: Item[]; empty: string; badge?: (item: Item) => ReactNode }) {
  if (list.length === 0) return <p className="py-5 text-[14px] text-soft">{empty}</p>;
  return (
    <ul>
      {list.map((item) => (
        <li key={item.url} className="border-b border-line">
          <a href={item.url} className="flex items-baseline gap-4 py-3.5 transition-colors hover:text-ink">
            {badge && <span className="w-12 shrink-0 text-[13px] tabular-nums text-soft">{badge(item)}</span>}
            <span className="min-w-0 flex-1">
              <span className="block text-[15px]">{item.title}</span>
              <span className="mt-0.5 block text-[12.5px] text-faint">
                {item.author} · {ago(item.created)} · {item.comments} {item.comments === 1 ? "reply" : "replies"}
              </span>
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}

/**
 * Everything about how Mirlow is doing, for the maintainer: downloads, stars,
 * and what people are asking for. Reads a file that `npm run stats` publishes,
 * so the page itself tracks no one.
 */
export function StatsPage() {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    fetch(source, { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : Promise.reject(response.status)))
      .then((stats: Stats) => !cancelled && setState({ status: "ready", stats }))
      .catch(() => !cancelled && setState({ status: "error" }));
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = state.status === "ready" ? state.stats : null;
  const days = stats ? perDay(stats.history) : [];
  const sum = (count: number) => days.slice(-count).reduce((total, day) => total + day.downloads, 0);
  const unanswered = stats?.questions.items.filter((item) => !item.answered) ?? [];
  const questions = stats
    ? [...unanswered, ...stats.questions.items.filter((item) => item.answered)]
    : [];

  return (
    <main className="mx-auto flex min-h-screen max-w-[720px] flex-col px-6 pb-24 pt-16">
      <div className="flex items-center justify-between gap-4">
        <Link href="/" aria-label="Mirlow">
          <Wordmark size={18} gradient={false} />
        </Link>
        {stats && <span className="text-[13px] text-faint">Updated {ago(stats.updated)}</span>}
      </div>

      <p className="mt-20 text-[14px] text-faint">Installer downloads</p>
      <p
        className="mt-3 text-[clamp(4.5rem,18vw,8rem)] font-semibold leading-none tracking-[-0.05em] tabular-nums"
        aria-live="polite"
      >
        {stats ? number(stats.downloads) : "—"}
      </p>

      {state.status === "error" && (
        <p className="mt-8 text-[15px] leading-relaxed text-soft">
          The numbers aren't there yet. Run “npm run stats” in the repository to publish them.
        </p>
      )}

      {stats && (
        <>
          <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Tile label="Today" value={days.length ? number(days[days.length - 1]!.downloads) : "—"} />
            <Tile label="Last 7 days" value={days.length ? number(sum(7)) : "—"} />
            <Tile label="GitHub stars" value={number(stats.stars)} />
            <Tile
              label="Unanswered"
              value={number(unanswered.length)}
              note={unanswered.length ? "questions waiting" : "all caught up"}
            />
          </div>

          <Section title="Downloads per day" aside={`last ${DAYS} days`}>
            <DailyChart days={days} />
          </Section>

          <Section title="Ideas, most voted first" aside={<a href={links.community}>{stats.ideas.total} total</a>}>
            <Feed
              list={stats.ideas.items.slice(0, 15)}
              empty="No ideas yet. They show up here as soon as someone posts one."
              badge={(item) => `▲ ${item.votes ?? 0}`}
            />
          </Section>

          <Section title="Questions, unanswered first" aside={`${stats.questions.total} total`}>
            <Feed
              list={questions.slice(0, 15)}
              empty="No questions yet."
              badge={(item) => (item.answered ? "✓" : "New")}
            />
          </Section>

          <Section title="Open problems" aside={<a href={links.issues}>{stats.issues.total} open</a>}>
            <Feed list={stats.issues.items} empty="Nothing reported. Nice." />
          </Section>

          <Section title="Downloads by version">
            <ul>
              {stats.releases.map((each) => (
                <li
                  key={each.version}
                  className="flex items-baseline justify-between gap-6 border-b border-line py-3.5 text-[15px]"
                >
                  <span>
                    {each.version}
                    {each.published && (
                      <span className="ml-3 text-[13px] text-faint">{each.published.slice(0, 10)}</span>
                    )}
                  </span>
                  <span className="tabular-nums text-soft">{number(each.downloads)}</span>
                </li>
              ))}
            </ul>
          </Section>

          <p className="mt-10 text-[13px] leading-relaxed text-faint">
            Counted by GitHub, collected each time “npm run stats” runs. Every download of the installer counts,
            including repeats and automatic updates, so this is an upper bound on the number of people.
          </p>
        </>
      )}
    </main>
  );
}
