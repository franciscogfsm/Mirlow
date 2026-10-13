import { HomePage } from "@/components/pages/HomePage";
import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata("pt", "home");

export default function Page() {
  return <HomePage locale="pt" />;
}
