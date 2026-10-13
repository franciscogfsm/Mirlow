import type { Metadata } from "next";
import { StatsPage } from "@/components/pages/StatsPage";

// For the maintainer: not linked from the site and kept out of search results.
export const metadata: Metadata = {
  title: "Downloads — Mirlow",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <StatsPage />;
}
