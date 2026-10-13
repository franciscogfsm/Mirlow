"use client";

import { Mark } from "@mirlow/ui";
import { Pause, Play } from "lucide-react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { PhoneScreen } from "./PhoneScreen";
import { useChapterActive } from "./Stage";

type Beat = "open" | "choose" | "connect" | "mirror";

/**
 * The film's shots, in order. `step` is which of the three steps under the
 * picture the shot belongs to. The camera looks at the point (`fx`, `fy`), as
 * fractions of the scene, from `zoom` times closer than the whole scene.
 */
const BEATS: { name: Beat; ms: number; step: number; zoom: number; fx: number; fy: number }[] = [
  { name: "open", ms: 2800, step: 0, zoom: 1.22, fx: 0.57, fy: 0.4 },
  { name: "choose", ms: 3200, step: 1, zoom: 2.05, fx: 0.17, fy: 0.76 },
  { name: "connect", ms: 1800, step: 1, zoom: 0.82, fx: 0.5, fy: 0.5 },
  { name: "mirror", ms: 7000, step: 2, zoom: 0.89, fx: 0.5, fy: 0.5 },
];
const LAST = BEATS.length - 1;
const CARD_EVERY_MS = 2200;
const PC_NAME = "STUDIO-PC";

const u = (value: number) => `${value}cqw`;
const spring = { type: "spring", stiffness: 210, damping: 26 } as const;
const glide = { duration: 1.35, ease: [0.65, 0, 0.35, 1] } as const;

/** Steps through the beats while `playing`, and picks up where it left off after a pause. */
function useTimeline(playing: boolean) {
  const [index, setIndex] = useState(0);
  const elapsed = useRef({ index: 0, ms: 0 });

  useEffect(() => {
    if (!playing) return;
    if (elapsed.current.index !== index) elapsed.current = { index, ms: 0 };
    const started = performance.now();
    let advanced = false;
    const timer = window.setTimeout(
      () => {
        advanced = true;
        setIndex((index + 1) % BEATS.length);
      },
      BEATS[index]!.ms - elapsed.current.ms,
    );
    return () => {
      window.clearTimeout(timer);
      if (!advanced) elapsed.current.ms += performance.now() - started;
    };
  }, [index, playing]);

  return [index, setIndex] as const;
}

export interface FilmLabels {
  ready: string;
  mirroring: string;
  scene: string;
  sheet: string;
  pause: string;
  play: string;
}

/**
 * A short film of the whole product, drawn live instead of played from a
 * file: Mirlow waits on the PC, the camera moves in on the phone as the PC is
 * chosen, pulls back as the signal crosses over, and settles on the phone's
 * screen appearing on the PC. It has no frame and no player; the three steps
 * underneath are its captions, its progress bar and its chapter buttons.
 */
export function Film({
  labels,
  steps,
}: {
  labels: FilmLabels;
  steps: { title: string; body: string }[];
}) {
  const reduce = useReducedMotion();
  const viewRef = useRef<HTMLDivElement>(null);
  const inView = useInView(viewRef, { amount: 0.3 });
  const active = useChapterActive();
  const [wanted, setWanted] = useState(true);
  const [nonce, setNonce] = useState(0);
  const [tick, setTick] = useState(0);

  const playing = wanted && inView && active && !reduce;
  const [index, setIndex] = useTimeline(playing);
  // With reduced motion there is no film, only its last frame.
  const beat = BEATS[reduce ? LAST : index]!;
  const phase = beat.name;
  const linked = phase === "connect" || phase === "mirror";

  useEffect(() => {
    if (phase !== "mirror" || !playing) return;
    const timer = window.setInterval(() => setTick((value) => value + 1), CARD_EVERY_MS);
    return () => window.clearInterval(timer);
  }, [phase, playing]);

  const jump = (step: number) => {
    setIndex(BEATS.findIndex((each) => each.step === step));
    setNonce((value) => value + 1);
    setWanted(true);
  };

  return (
    <div>
      <div className="relative">
        <div
          ref={viewRef}
          role="img"
          aria-label={labels.scene}
          className="film-view relative w-full overflow-hidden text-ink"
          style={{ aspectRatio: "16 / 10.6" }}
        >
          {/* The camera: the whole scene moves and scales under a fixed view. */}
          <motion.div
            className="absolute inset-0 flex items-center"
            initial={false}
            animate={{
              scale: beat.zoom,
              x: `${(0.5 - beat.fx) * beat.zoom * 100}%`,
              y: `${(0.5 - beat.fy) * beat.zoom * 100}%`,
            }}
            transition={glide}
          >
            <div className="relative w-full" style={{ aspectRatio: "16 / 10.4", containerType: "inline-size" }}>
              {/* The PC */}
              <div className="absolute right-0 top-0 w-[86%]">
                <div
                  className="relative overflow-hidden border border-white/15 bg-[#0b0b0b] shadow-[0_40px_120px_-30px_rgba(0,0,0,0.55)]"
                  style={{ aspectRatio: "16 / 10", borderRadius: u(1.9), padding: u(0.7) }}
                >
                  <div
                    className="relative h-full w-full overflow-hidden"
                    style={{
                      borderRadius: u(1.3),
                      background:
                        "radial-gradient(70% 90% at 72% 18%, #4a4a4a 0%, #262626 38%, #111 72%, #0a0a0a 100%)",
                    }}
                  >
                    {/* A hint of a taskbar, so it reads as a Windows desktop. */}
                    <div
                      className="absolute inset-x-0 bottom-0 flex items-center justify-center bg-black/45"
                      style={{ height: u(2.7), gap: u(0.9) }}
                    >
                      {[0, 1, 2, 3, 4].map((dot) => (
                        <i
                          key={dot}
                          className={`block ${dot === 2 ? "bg-white" : "bg-white/30"}`}
                          style={{ width: u(1.15), height: u(1.15), borderRadius: u(0.3) }}
                        />
                      ))}
                    </div>

                    {/* The Mirlow window */}
                    <motion.div
                      className="absolute left-1/2 top-[46%] flex flex-col overflow-hidden border border-white/14 bg-[#101010] text-white shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]"
                      style={{ x: "-50%", y: "-50%", borderRadius: u(1.5), height: "80%" }}
                      initial={false}
                      animate={{ aspectRatio: phase === "mirror" ? 0.5 : 0.69 }}
                      transition={spring}
                    >
                      <div
                        className="flex shrink-0 items-center"
                        style={{ height: u(3), paddingInline: u(1.1), gap: u(0.7) }}
                      >
                        <Mark size={14} style={{ width: u(1.5), height: u(1.5) }} />
                        <i className="block rounded-full bg-white" style={{ width: u(0.42), height: u(0.42) }} />
                        <span className="text-white/60" style={{ fontSize: u(0.95) }}>
                          {phase === "mirror" ? labels.mirroring : labels.ready}
                        </span>
                      </div>

                      <div className="relative min-h-0 flex-1">
                        <AnimatePresence initial={false}>
                          {phase === "mirror" ? (
                            <motion.div
                              key="picture"
                              className="absolute inset-0"
                              style={{ padding: `0 ${u(0.7)} ${u(0.7)}` }}
                              initial={{ opacity: 0, scale: 0.92 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ ...spring, opacity: { duration: 0.45 } }}
                            >
                              <div className="h-full w-full overflow-hidden" style={{ borderRadius: u(1.05) }}>
                                <PhoneScreen tick={tick} />
                              </div>
                            </motion.div>
                          ) : (
                            <motion.div
                              key="waiting"
                              className="absolute inset-0 flex flex-col items-center justify-center"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0, scale: 0.96 }}
                              transition={{ duration: 0.4 }}
                            >
                              <div className="relative" style={{ width: u(11), height: u(11) }}>
                                {[1, 0.74, 0.5].map((scale) => (
                                  <i
                                    key={scale}
                                    className="absolute inset-0 rounded-full border border-white/18"
                                    style={{ transform: `scale(${scale})` }}
                                  />
                                ))}
                                {[0, 1.2, 2.4].map((delay) => (
                                  <i
                                    key={delay}
                                    className="signal-pulse"
                                    style={{
                                      borderColor: "#fff",
                                      animationDelay: `${delay}s`,
                                      animationDuration: phase === "connect" ? "1.5s" : "3.6s",
                                    }}
                                  />
                                ))}
                                <span
                                  className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-white/8"
                                  style={{ width: u(4.4), height: u(4.4) }}
                                >
                                  <Mark size={20} style={{ width: u(2), height: u(2) }} />
                                </span>
                              </div>
                              <p
                                className="font-semibold tracking-tight"
                                style={{ fontSize: u(1.45), marginTop: u(1.5) }}
                              >
                                {labels.ready}
                              </p>
                              <span
                                className="rounded-full border border-white/18 bg-white/6 font-medium"
                                style={{ fontSize: u(0.95), padding: `${u(0.45)} ${u(1.1)}`, marginTop: u(0.9) }}
                              >
                                {PC_NAME}
                              </span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  </div>
                </div>
                {/* Stand */}
                <div
                  className="mx-auto bg-gradient-to-b from-[#1a1a1a] to-[#3a3a3a]"
                  style={{ width: u(9), height: u(3.4) }}
                />
                <div className="mx-auto bg-[#2a2a2a]" style={{ width: u(22), height: u(0.7), borderRadius: u(0.6) }} />
              </div>

              {/* The signal between them */}
              <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 1000 650" fill="none">
                <motion.path
                  d="M150 372 C 170 190, 330 120, 470 205"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeDasharray="2 9"
                  initial={false}
                  animate={{ opacity: linked ? 0.75 : 0, pathLength: linked ? 1 : 0 }}
                  transition={{ duration: linked ? 1.1 : 0.4, ease: [0.16, 1, 0.3, 1] }}
                />
                {linked &&
                  !reduce &&
                  [0, 0.5, 1].map((delay) => (
                    <motion.circle
                      key={delay}
                      r="3.2"
                      fill="currentColor"
                      initial={{ offsetDistance: "0%", opacity: 0 }}
                      animate={{ offsetDistance: "100%", opacity: [0, 1, 1, 0] }}
                      transition={{ duration: 1.5, delay, repeat: Infinity, ease: "linear" }}
                      style={{ offsetPath: 'path("M150 372 C 170 190, 330 120, 470 205")' }}
                    />
                  ))}
              </svg>

              {/* The phone */}
              <motion.div
                className="absolute bottom-0 left-[1.5%] w-[21.5%]"
                initial={false}
                animate={{ rotate: phase === "choose" ? -2 : -5, y: linked ? -6 : 0 }}
                transition={glide}
              >
                <div
                  className="relative bg-[#0a0a0a] shadow-[0_30px_70px_-18px_rgba(0,0,0,0.6)] ring-1 ring-white/20"
                  style={{ aspectRatio: "9 / 19.3", borderRadius: u(3.3), padding: u(0.62) }}
                >
                  <div className="relative h-full w-full overflow-hidden" style={{ borderRadius: u(2.75) }}>
                    <PhoneScreen tick={tick} />
                    <i
                      className="absolute left-1/2 block -translate-x-1/2 rounded-full bg-black"
                      style={{ top: u(0.75), width: u(5.4), height: u(1.5) }}
                    />

                    {/* Screen Mirroring sheet, as opened from Control Centre */}
                    <AnimatePresence>
                      {phase === "choose" && (
                        <motion.div
                          className="absolute inset-0 flex items-end bg-black/35"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3, delay: 0.35 }}
                        >
                          <motion.div
                            className="w-full bg-white/92 text-[#0a0a0a]"
                            style={{ margin: u(0.9), borderRadius: u(1.9), padding: u(1.3) }}
                            initial={{ y: "115%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "115%" }}
                            transition={{ ...spring, delay: 0.4 }}
                          >
                            <div className="flex items-center" style={{ gap: u(0.7), fontSize: u(1.2) }}>
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                style={{ width: u(1.6), height: u(1.6) }}
                              >
                                <rect x="3" y="4" width="13" height="10" rx="2" />
                                <rect x="8" y="10" width="13" height="10" rx="2" fill="white" />
                              </svg>
                              <b className="font-semibold">{labels.sheet}</b>
                            </div>
                            <motion.div
                              className="relative flex items-center justify-between font-medium"
                              style={{
                                marginTop: u(1),
                                borderRadius: u(1.1),
                                padding: `${u(0.85)} ${u(1)}`,
                                fontSize: u(1.12),
                              }}
                              initial={{ backgroundColor: "rgba(10,10,10,0.06)", color: "#0a0a0a" }}
                              animate={{ backgroundColor: "rgba(10,10,10,1)", color: "#ffffff" }}
                              transition={{ delay: 1.9, duration: 0.25 }}
                            >
                              {PC_NAME}
                              <motion.svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                style={{ width: u(1.3), height: u(1.3) }}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 2 }}
                              >
                                <path d="M5 12.5l4.5 4.5L19 7.5" />
                              </motion.svg>
                              {/* The tap */}
                              <motion.i
                                className="absolute left-[62%] top-1/2 block rounded-full bg-black/30 ring-1 ring-white/70"
                                style={{ width: u(2.6), height: u(2.6), x: "-50%", y: "-50%" }}
                                initial={{ opacity: 0, scale: 1.7 }}
                                animate={{ opacity: [0, 1, 1, 0], scale: [1.7, 1, 0.78, 1.25] }}
                                transition={{ delay: 1.35, duration: 0.9, times: [0, 0.4, 0.62, 1] }}
                              />
                            </motion.div>
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {!reduce && (
          <button
            type="button"
            onClick={() => setWanted((value) => !value)}
            aria-label={wanted ? labels.pause : labels.play}
            className="absolute bottom-[7%] right-[5%] flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-line-strong bg-raised/70 text-soft opacity-60 transition-opacity duration-300 hover:opacity-100 focus-visible:opacity-100"
          >
            {wanted ? <Pause size={13} aria-hidden="true" /> : <Play size={13} aria-hidden="true" />}
          </button>
        )}
      </div>

      <ol className="mt-2 grid grid-cols-3 gap-4 md:gap-6">
        {steps.map((step, at) => {
          const current = !reduce && at === beat.step;
          const state = reduce || at < beat.step ? "done" : current ? "run" : "idle";
          const ms = BEATS.reduce((sum, each) => (each.step === at ? sum + each.ms : sum), 0);
          return (
            <li key={step.title}>
              <button
                type="button"
                disabled={!!reduce}
                onClick={() => jump(at)}
                aria-current={current ? "step" : undefined}
                className={`block w-full text-left transition-opacity duration-700 enabled:cursor-pointer ${
                  reduce || current ? "opacity-100" : "opacity-45 hover:opacity-80"
                }`}
              >
                <span className="relative block h-px overflow-hidden bg-line-strong">
                  <span
                    key={`${state}-${nonce}`}
                    className="film-fill"
                    data-state={state}
                    style={{ animationDuration: `${ms}ms`, animationPlayState: playing ? "running" : "paused" }}
                  />
                </span>
                <span className="mt-3.5 flex items-baseline gap-2.5">
                  <span className="font-serif text-[1.15rem] italic leading-none text-faint">{at + 1}</span>
                  <span className="text-[15px] font-semibold leading-tight tracking-[-0.015em]">{step.title}</span>
                </span>
                <span className="mt-1.5 hidden text-[13.5px] leading-snug text-soft sm:block">{step.body}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
