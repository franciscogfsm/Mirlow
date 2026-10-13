import { getDictionary, type Locale } from "@mirlow/i18n";
import { getGuide } from "@/content/guides";
import { guideIds } from "@/content/guides/slugs";
import { pageUrl } from "@/lib/site";

export const dynamic = "force-static";

function guideList(locale: Locale): string[] {
  return guideIds.map((id) => {
    const guide = getGuide(locale, id);
    return `- [${guide.title}](${pageUrl(locale, id)}): ${guide.description}`;
  });
}

/** A plain-text summary of the site for AI assistants and search tools (llmstxt.org). */
export function GET() {
  const site = getDictionary("en").site;
  const lines = [
    "# Mirlow",
    "",
    `> ${site.meta.description}`,
    "",
    "Mirlow is a free, open-source (GPL-3.0) AirPlay screen-mirroring receiver for Windows 10 and 11, built on UxPlay. It is an independent project, not affiliated with Apple.",
    "",
    "## Links",
    "",
    `- [Home](${pageUrl("en")})`,
    `- [Em português](${pageUrl("pt")})`,
    `- [Download for Windows](${pageUrl("en")})`,
    `- [Licences and source code](${pageUrl("en", "licenses")})`,
    `- [Privacy](${pageUrl("en", "privacy")})`,
    "",
    "## Guides",
    "",
    ...guideList("en"),
    "",
    "## Guias em português",
    "",
    ...guideList("pt"),
    "",
    "## Questions",
    "",
    ...site.faq.items.flatMap((item) => [`### ${item.q}`, "", item.a, ""]),
  ];
  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
