"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type HTMLAttributes,
  type ReactNode,
  type Ref,
} from "react";
import { createDisplacementMap } from "./displacement";
import { trackLight } from "./light";

const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * Refraction needs an SVG filter used as a backdrop-filter, which only
 * Chromium-based engines render (that includes WebView2, which the desktop
 * app runs in). Everything else gets a frosted fallback.
 */
function detectRefraction(): boolean {
  if (typeof window === "undefined" || typeof CSS === "undefined") return false;
  const chromium =
    "chrome" in window || /\b(Chrome|Chromium|Edg)\//.test(window.navigator.userAgent);
  return chromium && CSS.supports("backdrop-filter", "url(#a)");
}

export interface LiquidGlassProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
  children?: ReactNode;
  /** Element to render. Defaults to `div`. */
  as?: ElementType;
  /** Corner radius in pixels. Use a large value for a pill. */
  radius?: number;
  /** Width of the curved rim that bends light, in pixels. */
  bezel?: number;
  /** Largest distance the rim shifts what is behind it, in pixels. */
  depth?: number;
  /** Softening of what is seen through the glass, in pixels. Keep it small. */
  frost?: number;
  /** Colour fringing at the rim, as a fraction of `depth`. */
  dispersion?: number;
  /** Follow the pointer with the highlights. */
  lit?: boolean;
  /** Class for the inner content wrapper. */
  contentClassName?: string;
  /** Passed through when rendering a button or a link. */
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  href?: string;
  target?: string;
  rel?: string;
  download?: boolean | string;
}

interface Size {
  width: number;
  height: number;
}

export const LiquidGlass = forwardRef(function LiquidGlass(
  {
    as: Tag = "div",
    radius = 24,
    bezel = 16,
    depth = 22,
    frost = 1.5,
    dispersion = 0.05,
    lit = true,
    className,
    contentClassName,
    style,
    children,
    ...rest
  }: LiquidGlassProps,
  forwardedRef: Ref<HTMLElement>,
) {
  const filterId = `lg-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const elementRef = useRef<HTMLElement | null>(null);
  const [size, setSize] = useState<Size | null>(null);
  const [refracts, setRefracts] = useState(false);
  const [map, setMap] = useState("");

  const setRefs = useCallback(
    (node: HTMLElement | null) => {
      elementRef.current = node;
      if (typeof forwardedRef === "function") forwardedRef(node);
      else if (forwardedRef) forwardedRef.current = node;
    },
    [forwardedRef],
  );

  useIsomorphicLayoutEffect(() => {
    setRefracts(detectRefraction());
  }, []);

  useIsomorphicLayoutEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const measure = () => {
      const width = Math.round(element.offsetWidth);
      const height = Math.round(element.offsetHeight);
      setSize((previous) =>
        previous && previous.width === width && previous.height === height
          ? previous
          : { width, height },
      );
    };
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!refracts || !size || size.width < 2 || size.height < 2) return;
    setMap(createDisplacementMap({ width: size.width, height: size.height, radius, bezel }));
  }, [refracts, size, radius, bezel]);

  useEffect(() => {
    const element = elementRef.current;
    if (!lit || !element) return;
    return trackLight(element);
  }, [lit]);

  const ready = refracts && map !== "" && size !== null;
  const scale = depth * 2;
  const fringe = scale * dispersion;

  const backdropStyle: CSSProperties = ready
    ? { backdropFilter: `url(#${filterId})`, WebkitBackdropFilter: `url(#${filterId})` }
    : {};

  return (
    <Tag
      ref={setRefs}
      className={className ? `lg ${className}` : "lg"}
      data-refracts={ready ? "" : undefined}
      style={{ ...style, borderRadius: radius }}
      {...rest}
    >
      {ready && (
        <svg className="lg-defs" aria-hidden="true" focusable="false">
          <filter
            id={filterId}
            x="0"
            y="0"
            width={size.width}
            height={size.height}
            filterUnits="userSpaceOnUse"
            primitiveUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feImage
              href={map}
              x="0"
              y="0"
              width={size.width}
              height={size.height}
              preserveAspectRatio="none"
              result="map"
            />
            <feGaussianBlur in="SourceGraphic" stdDeviation={frost} result="soft" />

            {/* Red, green and blue bend by slightly different amounts, which
                leaves a faint colour fringe along the rim, as real glass does. */}
            <feDisplacementMap
              in="soft"
              in2="map"
              scale={scale + fringe}
              xChannelSelector="R"
              yChannelSelector="G"
              result="bentRed"
            />
            <feColorMatrix
              in="bentRed"
              type="matrix"
              values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
              result="red"
            />
            <feDisplacementMap
              in="soft"
              in2="map"
              scale={scale}
              xChannelSelector="R"
              yChannelSelector="G"
              result="bentGreen"
            />
            <feColorMatrix
              in="bentGreen"
              type="matrix"
              values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"
              result="green"
            />
            <feDisplacementMap
              in="soft"
              in2="map"
              scale={scale - fringe}
              xChannelSelector="R"
              yChannelSelector="G"
              result="bentBlue"
            />
            <feColorMatrix
              in="bentBlue"
              type="matrix"
              values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"
              result="blue"
            />
            <feBlend in="red" in2="green" mode="screen" result="redGreen" />
            <feBlend in="redGreen" in2="blue" mode="screen" result="colour" />
            <feColorMatrix in="colour" type="saturate" values="1" />
          </filter>
        </svg>
      )}
      <span className="lg-backdrop" style={backdropStyle} aria-hidden="true" />
      <span className="lg-tint" aria-hidden="true" />
      <span className="lg-sheen" aria-hidden="true" />
      <span className="lg-rim" aria-hidden="true" />
      <span className={contentClassName ? `lg-content ${contentClassName}` : "lg-content"}>
        {children}
      </span>
    </Tag>
  );
});
