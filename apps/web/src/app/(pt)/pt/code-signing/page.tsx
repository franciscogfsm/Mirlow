import { ProsePage } from "@/components/pages/ProsePage";
import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata("pt", "codeSigning");

export default function Page() {
  return <ProsePage locale="pt" page="codeSigning" />;
}
