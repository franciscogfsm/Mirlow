"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

/** Same query as the `pinned` variant in globals.css. */
const PINNED =
  "(min-width: 1024px) and (min-height: 700px) and (prefers-reduced-motion: no-preference)";

const ChapterContext = createContext(true);

/** Whether the chapter this component sits in is the one on screen. */
export function useChapterActive(): boolean {
  return useContext(ChapterContext);
}

export interface Chapter {
  /** Also the fragment that links to it, as in `/#features`. */
  id: string;
  label: string;
  node: ReactNode;
}

/**
 * The home page as one fixed view. Where there is room, the view pins to the
 * viewport and scrolling changes which chapter is in it, so the visitor stays
 * in one place while the content passes by. On small screens, or when less
 * motion is preferred, the chapters are ordinary sections one after another;
 * that choice is made in CSS, so the markup is the same either way.
 */
export function Stage({ chapters, cue }: { chapters: Chapter[]; cue: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [pinned, setPinned] = useState(false);
  const count = chapters.length;

  const scrollToChapter = useCallback(
    (target: number, behavior: ScrollBehavior) => {
      const element = ref.current;
      if (!element) return;
      const top = element.getBoundingClientRect().top + window.scrollY;
      const step = (element.offsetHeight - window.innerHeight) / (count - 1);
      window.scrollTo({ top: top + target * step, behavior });
    },
    [count],
  );

  useEffect(() => {
    const media = window.matchMedia(PINNED);
    let frame = 0;
    const update = () => {
      frame = 0;
      setPinned(media.matches);
      const element = ref.current;
      if (!element || !media.matches) return;
      const step = (element.offsetHeight - window.innerHeight) / (count - 1);
      const offset = -element.getBoundingClientRect().top;
      setIndex(Math.max(0, Math.min(count - 1, Math.round(offset / step))));
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    media.addEventListener("change", schedule);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      media.removeEventListener("change", schedule);
    };
  }, [count]);

  // While pinned, a chapter has no position of its own to jump to, so links to
  // `#features` and the like are turned into a scroll to that chapter's place.
  useEffect(() => {
    const go = (hash: string, behavior: ScrollBehavior) => {
      const target = chapters.findIndex((chapter) => `#${chapter.id}` === hash);
      if (target < 0 || !window.matchMedia(PINNED).matches) return false;
      scrollToChapter(target, behavior);
      return true;
    };
    if (window.location.hash) go(window.location.hash, "instant");

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element).closest?.<HTMLAnchorElement>("a[href*='#']");
      if (!link || link.target === "_blank") return;
      const url = new URL(link.href);
      if (url.origin !== window.location.origin || url.pathname !== window.location.pathname) return;
      if (go(url.hash, "smooth")) {
        event.preventDefault();
        window.history.replaceState(null, "", url.hash);
      }
    };
    const onHashChange = () => go(window.location.hash, "instant");
    document.addEventListener("click", onClick, true);
    window.addEventListener("hashchange", onHashChange);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("hashchange", onHashChange);
    };
  }, [chapters, scrollToChapter]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--chapter", String(pinned ? index : 0));
    return () => {
      root.style.removeProperty("--chapter");
    };
  }, [index, pinned]);

  return (
    <div ref={ref} className="stage" style={{ "--chapters": count } as CSSProperties}>
      {chapters.map((chapter, at) => (
        <i key={chapter.id} className="stage-snap" style={{ "--at": at } as CSSProperties} aria-hidden="true" />
      ))}

      <div className="stage-view">
        {chapters.map((chapter, at) => (
          <section
            key={chapter.id}
            id={chapter.id}
            className="chapter"
            data-state={at === index ? "active" : at < index ? "past" : "future"}
            // Keyboard focus moving into a chapter brings that chapter on screen.
            onFocusCapture={() => {
              if (pinned && at !== index) scrollToChapter(at, "instant");
            }}
          >
            <ChapterContext.Provider value={!pinned || at === index}>{chapter.node}</ChapterContext.Provider>
          </section>
        ))}

        <div className="absolute right-4 top-1/2 z-10 hidden -translate-y-1/2 flex-col pinned:flex">
          {chapters.map((chapter, at) => (
            <button
              key={chapter.id}
              type="button"
              aria-label={chapter.label}
              aria-current={at === index ? "true" : undefined}
              onClick={() => scrollToChapter(at, "smooth")}
              className="group relative flex h-7 w-7 cursor-pointer items-center justify-center"
            >
              <i
                className={`block w-[5px] rounded-full bg-ink transition-all duration-500 ease-fluid ${
                  at === index ? "h-5 opacity-100" : "h-[5px] opacity-25 group-hover:opacity-60"
                }`}
              />
              <span className="pointer-events-none absolute right-8 whitespace-nowrap rounded-full border border-line bg-raised px-2.5 py-1 text-[12px] font-medium text-soft opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
                {chapter.label}
              </span>
            </button>
          ))}
        </div>

        <div
          aria-hidden="true"
          className={`pointer-events-none absolute bottom-5 left-12 hidden items-center gap-3 text-[11.5px] font-medium uppercase tracking-[0.16em] text-faint transition-opacity duration-700 pinned:flex ${
            index === 0 ? "opacity-100" : "opacity-0"
          }`}
        >
          <i className="cue-line" />
          {cue}
        </div>
      </div>
    </div>
  );
}
