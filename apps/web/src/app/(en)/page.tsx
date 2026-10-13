import { HomePage } from "@/components/pages/HomePage";
import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata("en", "home");

export default function Page() {
  return <HomePage locale="en" />;
}
