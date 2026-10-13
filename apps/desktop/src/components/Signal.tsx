import { LiquidGlass, Mark } from "@mirlow/ui";
import { motion } from "motion/react";

export type SignalMode = "idle" | "ready" | "active";

const RINGS = [1, 0.78, 0.56];

/**
 * The centrepiece of the waiting screen: a glass disc sending rings outward.
 * Still while starting, a slow pulse when ready, quicker once a device is
 * connecting. The rings pass behind the disc, so its rim visibly bends them.
 */
export function Signal({ mode }: { mode: SignalMode }) {
  const pulses = mode === "idle" ? 0 : 3;
  const period = mode === "active" ? 1.8 : 3.6;

  return (
    <div className="relative h-[232px] w-[232px] shrink-0" aria-hidden="true">
      {RINGS.map((scale) => (
        <div
          key={scale}
          className="signal-ring transition-opacity duration-700"
          style={{ transform: `scale(${scale})`, opacity: mode === "idle" ? 0.45 : 1 }}
        />
      ))}
      {Array.from({ length: pulses }, (_, index) => (
        <div
          key={`${mode}-${index}`}
          className="signal-pulse"
          style={{
            animationDuration: `${period}s`,
            animationDelay: `${(index * period) / pulses}s`,
            borderColor: mode === "active" ? "var(--mint)" : undefined,
          }}
        />
      ))}

      <motion.div
        className="absolute left-1/2 top-1/2"
        style={{ x: "-50%", y: "-50%" }}
        animate={mode === "idle" ? { scale: [1, 0.96, 1] } : { scale: 1 }}
        transition={
          mode === "idle"
            ? { duration: 2.4, repeat: Infinity, ease: "easeInOut" }
            : { type: "spring", stiffness: 260, damping: 22 }
        }
      >
        <LiquidGlass
          radius={999}
          bezel={26}
          depth={26}
          frost={0.5}
          style={{ width: 104, height: 104 }}
          contentClassName="flex h-[104px] w-[104px] items-center justify-center"
        >
          <Mark size={44} gradient />
        </LiquidGlass>
      </motion.div>
    </div>
  );
}
