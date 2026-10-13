"use client";

import { Mark } from "@mirlow/ui";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { PhoneScreen } from "./PhoneScreen";

type Phase = "ready" | "choosing" | "connecting" | "mirroring";

/** How long the demonstration stays in each phase before moving on, in milliseconds. */
const TIMELINE: [Phase, number][] = [
  ["ready", 2400],
  ["choosing", 1900],
  ["connecting", 1500],
  ["mirroring", 8800],
];
const CARD_EVERY_MS = 2200;
const PC_NAME = "STUDIO-PC";

const u = (value: number) => `${value}cqw`;
const spring = { type: "spring", stiffness: 210, damping: 26 } as const;

/**
 * The hero's demonstration, played on a loop: Mirlow waits on the PC, the PC
 * is chosen on the phone, a signal crosses over, and the phone's screen
 * appears on the PC and keeps pace with it. Everything is drawn in units of
 * the scene's own width, so it holds together from phone to desktop sizes.
 */
export function HeroScene({ labels }: { labels: { ready: string; mirroring: string; scene: string; sheet: string } }) {
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("ready");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (reduce) {
      setPhase("mirroring");
      return;
    }
    let index = 0;
    let timer = 0;
    const next = () => {
      const [name, duration] = TIMELINE[index % TIMELINE.length]!;
      setPhase(name);
      index += 1;
      timer = window.setTimeout(next, duration);
    };
    next();
    return () => window.clearTimeout(timer);
  }, [reduce]);

  useEffect(() => {
    if (phase !== "mirroring" || reduce) return;
    const timer = window.setInterval(() => setTick((value) => value + 1), CARD_EVERY_MS);
    return () => window.clearInterval(timer);
  }, [phase, reduce]);

  const linked = phase === "connecting" || phase === "mirroring";

  return (
    <div
      role="img"
      aria-label={labels.scene}
      className="relative mx-auto w-full max-w-[1080px]"
      style={{ aspectRatio: "16 / 10.4", containerType: "inline-size" }}
    >
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
              className="absolute inset-x-0 bottom-0 flex items-center justify-center bg-black/45 backdrop-blur-md"
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
              animate={{ aspectRatio: phase === "mirroring" ? 0.5 : 0.69 }}
              transition={spring}
            >
              <div className="flex shrink-0 items-center" style={{ height: u(3), paddingInline: u(1.1), gap: u(0.7) }}>
                <Mark size={14} style={{ width: u(1.5), height: u(1.5) }} />
                <i className="block rounded-full bg-white" style={{ width: u(0.42), height: u(0.42) }} />
                <span className="text-white/60" style={{ fontSize: u(0.95) }}>
                  {phase === "mirroring" ? labels.mirroring : labels.ready}
                </span>
              </div>

              <div className="relative min-h-0 flex-1">
                <AnimatePresence initial={false}>
                  {phase === "mirroring" ? (
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
                              animationDuration: phase === "connecting" ? "1.5s" : "3.6s",
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
                      <p className="font-semibold tracking-tight" style={{ fontSize: u(1.45), marginTop: u(1.5) }}>
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
        <div className="mx-auto bg-gradient-to-b from-[#1a1a1a] to-[#3a3a3a]" style={{ width: u(9), height: u(3.4) }} />
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
        animate={{ rotate: -5, y: linked ? -6 : 0 }}
        transition={spring}
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
              {phase === "choosing" && (
                <motion.div
                  className="absolute inset-0 flex items-end bg-black/35"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.div
                    className="w-full bg-white/88 text-[#0a0a0a] backdrop-blur-xl"
                    style={{ margin: u(0.9), borderRadius: u(1.9), padding: u(1.3) }}
                    initial={{ y: "110%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "110%" }}
                    transition={spring}
                  >
                    <div className="flex items-center" style={{ gap: u(0.7), fontSize: u(1.2) }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: u(1.6), height: u(1.6) }}>
                        <rect x="3" y="4" width="13" height="10" rx="2" />
                        <rect x="8" y="10" width="13" height="10" rx="2" fill="white" />
                      </svg>
                      <b className="font-semibold">{labels.sheet}</b>
                    </div>
                    <motion.div
                      className="flex items-center justify-between font-medium"
                      style={{ marginTop: u(1), borderRadius: u(1.1), padding: `${u(0.85)} ${u(1)}`, fontSize: u(1.12) }}
                      initial={{ backgroundColor: "rgba(10,10,10,0.06)", color: "#0a0a0a" }}
                      animate={{ backgroundColor: "rgba(10,10,10,1)", color: "#ffffff" }}
                      transition={{ delay: 1.05, duration: 0.25 }}
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
                        transition={{ delay: 1.15 }}
                      >
                        <path d="M5 12.5l4.5 4.5L19 7.5" />
                      </motion.svg>
                    </motion.div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
