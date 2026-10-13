import { ProsePage } from "@/components/pages/ProsePage";
import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata("en", "privacy");

export default function Page() {
  return <ProsePage locale="en" page="privacy" />;
}
