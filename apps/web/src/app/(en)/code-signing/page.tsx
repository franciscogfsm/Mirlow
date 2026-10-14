import { ProsePage } from "@/components/pages/ProsePage";
import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata("en", "codeSigning");

export default function Page() {
  return <ProsePage locale="en" page="codeSigning" />;
}
