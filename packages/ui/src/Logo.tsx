import { useId, type SVGProps } from "react";

/**
 * The Mirlow mark: one stroke that rises, dips and rises again, an "m" drawn
 * as a wave meeting its own reflection. It reads as a signal, as a mirror
 * image, and as the initial.
 */
export interface MarkProps extends Omit<SVGProps<SVGSVGElement>, "children"> {
  size?: number;
  /** Let the stroke fade along its length, as if lit from the top left. */
  gradient?: boolean;
}

export function Mark({ size = 24, gradient = false, ...rest }: MarkProps) {
  const id = `mark-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {gradient && (
        <defs>
          <linearGradient id={id} x1="4" y1="6" x2="20" y2="19" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="currentColor" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0.55" />
          </linearGradient>
        </defs>
      )}
      <path
        d="M5 17.5V11a3.5 3.5 0 0 1 7 0v4.5M12 11a3.5 3.5 0 0 1 7 0v6.5"
        stroke={gradient ? `url(#${id})` : "currentColor"}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export interface WordmarkProps {
  size?: number;
  className?: string;
  gradient?: boolean;
}

/**
 * Mark and name together. The name is real text, so it is selectable and read aloud once.
 * The mark is cropped to its stroke and sat on the text baseline at x-height, so it lines
 * up with the lowercase letters instead of floating in its 24-unit box.
 */
export function Wordmark({ size = 20, className, gradient = true }: WordmarkProps) {
  const markHeight = size * 0.56;
  return (
    <span
      className={className}
      style={{ display: "inline-flex", alignItems: "baseline", gap: size * 0.34 }}
    >
      <Mark
        gradient={gradient}
        viewBox="3.8 6.3 16.4 12.4"
        width={markHeight * (16.4 / 12.4)}
        height={markHeight}
        style={{ overflow: "visible" }}
      />
      <span
        style={{
          fontSize: size,
          fontWeight: 600,
          letterSpacing: "-0.035em",
          lineHeight: 1,
        }}
      >
        mirlow
      </span>
    </span>
  );
}
