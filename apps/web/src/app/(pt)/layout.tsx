import type { ReactNode } from "react";
import { RootShell } from "@/components/RootShell";

export default function Layout({ children }: { children: ReactNode }) {
  return <RootShell locale="pt">{children}</RootShell>;
}
