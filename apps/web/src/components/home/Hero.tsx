"use client";

import type { Dictionary } from "@mirlow/i18n";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { DownloadButton } from "../site/DownloadButton";
import { HeroScene } from "./HeroScene";

const ease = [0.16, 1, 0.3, 1] as const;

export function Hero({ t }: { t: Dictionary["site"]["hero"] }) {
  const reduce = useReducedMotion();
  const sceneRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: sceneRef, offset: ["start end", "end start"] });
  // The scene drifts a little slower than the page, and settles as it leaves.
  const y = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [50, -50]);
  const scale = useTransform(scrollYProgress, [0, 0.45, 1], reduce ? [1, 1, 1] : [0.96, 1, 0.97]);

  const rise = (delay: number) => ({
    initial: reduce ? false : { opacity: 0, y: 26 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 1, delay, ease },
  });

  return (
    <section className="relative px-6 pb-10 pt-[150px] md:pt-[180px]">
      <div className="mx-auto flex max-w-[980px] flex-col items-center text-center">
        <motion.p className="eyebrow" {...rise(0)}>
          {t.eyebrow}
        </motion.p>

        <motion.h1
          className="mt-6 text-[clamp(2.7rem,8.2vw,6.4rem)] font-semibold leading-[0.98] tracking-[-0.045em]"
          {...rise(0.08)}
        >
          {t.titleLine1}
          <br />
          {t.titleLine2} <span className="accent-word">{t.titleAccent}</span>
        </motion.h1>

        <motion.p
          className="mt-7 max-w-[560px] text-[clamp(1.05rem,1.6vw,1.25rem)] leading-relaxed text-soft"
          {...rise(0.16)}
        >
          {t.body}
        </motion.p>

        <motion.div className="mt-10 flex flex-col items-center gap-4" {...rise(0.24)}>
          <DownloadButton label={t.cta} />
          <p className="text-[13.5px] text-faint">{t.note}</p>
        </motion.div>
      </div>

      <motion.div
        ref={sceneRef}
        className="mx-auto mt-16 max-w-[1080px] text-ink md:mt-24"
        style={{ y, scale }}
        initial={reduce ? false : { opacity: 0, y: 60 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.3, delay: 0.35, ease }}
      >
        <HeroScene
          labels={{
            ready: t.sceneReady,
            mirroring: t.sceneMirroring,
            scene: t.sceneLabel,
            sheet: t.sceneSheet,
          }}
        />
      </motion.div>
    </section>
  );
}
