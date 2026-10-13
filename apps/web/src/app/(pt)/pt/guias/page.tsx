import { GuidesPage } from "@/components/pages/GuidePage";
import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata("pt", "guides");

export default function Page() {
  return <GuidesPage locale="pt" />;
}
