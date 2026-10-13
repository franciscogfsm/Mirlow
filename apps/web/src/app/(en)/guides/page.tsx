import { GuidesPage } from "@/components/pages/GuidePage";
import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata("en", "guides");

export default function Page() {
  return <GuidesPage locale="en" />;
}
