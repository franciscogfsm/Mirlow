import { LiquidGlass } from "@mirlow/ui";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";
import { ChromeButton } from "./controls";

/**
 * A panel of glass that rises from the bottom of the window. Used for
 * settings and for help, so the main screen never has to carry either.
 */
export function Sheet({
  open,
  onOpenChange,
  title,
  closeLabel,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  closeLabel: string;
  children: ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-40 bg-paper/35"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              />
            </Dialog.Overlay>
            <Dialog.Content
              asChild
              forceMount
              aria-describedby={undefined}
              // Focus the panel itself, not its close button, when it opens.
              onOpenAutoFocus={(event) => {
                event.preventDefault();
                (event.currentTarget as HTMLElement | null)?.focus();
              }}
            >
              <motion.div
                tabIndex={-1}
                className="fixed inset-x-3 bottom-3 top-14 z-50 mx-auto flex max-w-[460px] flex-col outline-none"
                initial={{ y: 36, scale: 0.97 }}
                animate={{ y: 0, scale: 1 }}
                exit={{ y: 28, scale: 0.98, opacity: 0 }}
                transition={{ type: "spring", stiffness: 360, damping: 34, mass: 0.9 }}
              >
                <LiquidGlass
                  radius={28}
                  bezel={22}
                  depth={30}
                  frost={12}
                  className="flex min-h-0 flex-1 flex-col"
                  contentClassName="flex min-h-0 flex-1 flex-col"
                  style={{ ["--glass-tint" as string]: "var(--glass-tint-panel)" }}
                >
                  <header className="flex items-center justify-between px-6 pb-2 pt-5">
                    <Dialog.Title className="text-[19px] font-semibold tracking-[-0.02em]">
                      {title}
                    </Dialog.Title>
                    <Dialog.Close asChild>
                      <ChromeButton label={closeLabel}>
                        <X size={16} strokeWidth={2} />
                      </ChromeButton>
                    </Dialog.Close>
                  </header>
                  <div className="scroll-quiet min-h-0 flex-1 overflow-y-auto px-6 pb-6">
                    {children}
                  </div>
                </LiquidGlass>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
