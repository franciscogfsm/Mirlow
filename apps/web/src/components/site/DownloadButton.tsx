import { links } from "@mirlow/i18n";
import { LiquidGlass } from "@mirlow/ui";
import { ArrowDown } from "lucide-react";

/**
 * The one call to action. Solid ink under glass: the only filled control on
 * the site, so there is never a question about what to press.
 */
export function DownloadButton({
  label,
  size = "large",
}: {
  label: string;
  size?: "large" | "small";
}) {
  const large = size === "large";
  return (
    <LiquidGlass
      as="a"
      href={links.download}
      radius={999}
      bezel={large ? 16 : 11}
      depth={large ? 22 : 14}
      frost={1}
      className="lg-press inline-block"
      style={{ ["--glass-tint" as string]: "var(--ink)" }}
      contentClassName={`cta-shine flex items-center gap-2.5 font-medium text-paper ${
        large ? "h-14 px-7 text-[16.5px]" : "h-10 px-4.5 text-[14px]"
      }`}
    >
      {label}
      <ArrowDown size={large ? 18 : 15} strokeWidth={2.2} aria-hidden="true" />
    </LiquidGlass>
  );
}
