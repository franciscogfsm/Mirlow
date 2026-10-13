import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GuidePage } from "@/components/pages/GuidePage";
import { guideIdFromSlug, guideIds, guideSlugs } from "@/content/guides/slugs";
import { buildMetadata } from "@/lib/metadata";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return guideIds.map((id) => ({ slug: guideSlugs[id].pt }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = guideIdFromSlug("pt", (await params).slug);
  return id ? buildMetadata("pt", id) : {};
}

export default async function Page({ params }: Props) {
  const id = guideIdFromSlug("pt", (await params).slug);
  if (!id) notFound();
  return <GuidePage locale="pt" id={id} />;
}
