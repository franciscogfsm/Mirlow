import { LiquidGlass } from "@mirlow/ui";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import type { ButtonHTMLAttributes, ReactNode } from "react";

/** A pill of glass you can press. */
export function GlassButton({
  children,
  className = "",
  tone = "neutral",
  ...props
}: {
  children: ReactNode;
  className?: string;
  tone?: "neutral" | "accent";
  onClick?: () => void;
  disabled?: boolean;
  "aria-label"?: string;
  title?: string;
}) {
  return (
    <LiquidGlass
      as="button"
      type="button"
      radius={999}
      bezel={11}
      depth={16}
      frost={1.2}
      className={`lg-press disabled:pointer-events-none disabled:opacity-50 ${className}`}
      contentClassName={`flex h-9 items-center justify-center gap-2 px-4 text-[13px] font-medium ${
        tone === "accent" ? "text-accent" : "text-ink"
      }`}
      {...props}
    >
      {children}
    </LiquidGlass>
  );
}

/** A round glass button holding a single icon. */
export function GlassIconButton({
  children,
  label,
  onClick,
  size = 34,
}: {
  children: ReactNode;
  label: string;
  onClick?: () => void;
  size?: number;
}) {
  return (
    <LiquidGlass
      as="button"
      type="button"
      radius={999}
      bezel={9}
      depth={12}
      frost={1.2}
      className="lg-press shrink-0"
      style={{ width: size, height: size }}
      contentClassName="flex h-full w-full items-center justify-center text-ink"
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      {children}
    </LiquidGlass>
  );
}

/** A quiet icon button for window chrome, with no glass of its own. */
export function ChromeButton({
  label,
  danger = false,
  compact = false,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; danger?: boolean; compact?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`flex items-center justify-center rounded-full text-soft transition-colors duration-200 hover:text-ink ${
        compact ? "h-[26px] w-[26px]" : "h-8 w-8"
      } ${danger ? "hover:bg-danger/15 hover:text-danger" : "hover:bg-ink/8"}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Switch({
  checked,
  onCheckedChange,
  id,
  disabled,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  id: string;
  disabled?: boolean;
}) {
  return (
    <SwitchPrimitive.Root
      id={id}
      checked={checked}
      disabled={disabled}
      onCheckedChange={onCheckedChange}
      className="relative h-[26px] w-[44px] shrink-0 cursor-pointer rounded-full disabled:cursor-not-allowed disabled:opacity-40 bg-ink/14 shadow-[inset_0_1px_2px_rgba(0,0,0,0.12)] transition-colors duration-300 ease-fluid data-[state=checked]:bg-accent"
    >
      <SwitchPrimitive.Thumb className="block h-[22px] w-[22px] translate-x-[2px] rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.3)] transition-[transform,background-color] duration-300 ease-fluid data-[state=checked]:translate-x-[20px] data-[state=checked]:bg-(--on-accent)" />
    </SwitchPrimitive.Root>
  );
}

/** A small set of mutually exclusive choices, shown side by side. */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex rounded-full bg-ink/7 p-[3px]">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={`h-7 cursor-pointer rounded-full px-3 text-[12.5px] font-medium transition-all duration-300 ease-fluid ${
              selected
                ? "bg-raised text-ink shadow-[0_1px_3px_rgba(0,0,0,0.14)]"
                : "text-soft hover:text-ink"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
