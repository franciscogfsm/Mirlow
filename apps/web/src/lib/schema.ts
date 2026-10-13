import { getDictionary, links, localeTags, locales, release, type Locale } from "@mirlow/i18n";
import { getGuide, guidesUpdated } from "@/content/guides";
import { guideIds, type GuideId } from "@/content/guides/slugs";
import { describePage } from "./metadata";
import { asset, pageUrl, siteUrl } from "./site";

// Structured data (schema.org) that tells search engines what each page is:
// an application, a set of questions, a set of instructions. It only restates
// what the page already says; there are no ratings or reviews to report.

type Node = Record<string, unknown>;

const image = `${siteUrl}${asset("/og.png")}`;
const publisher = { "@type": "Organization", name: "Mirlow", url: pageUrl("en"), logo: `${siteUrl}${asset("/icon.png")}` };

function graph(nodes: Node[]): Node {
  return { "@context": "https://schema.org", "@graph": nodes };
}

function questions(url: string, items: readonly { q: string; a: string }[]): Node {
  return {
    "@type": "FAQPage",
    "@id": `${url}#faq`,
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

function application(locale: Locale): Node {
  const site = getDictionary(locale).site;
  return {
    "@type": "SoftwareApplication",
    "@id": `${pageUrl(locale)}#app`,
    name: "Mirlow",
    description: site.meta.description,
    url: pageUrl(locale),
    image,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Windows 10, Windows 11",
    softwareVersion: release.version,
    downloadUrl: links.download,
    license: "https://www.gnu.org/licenses/gpl-3.0.html",
    isAccessibleForFree: true,
    inLanguage: locales.map((each) => localeTags[each]),
    offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
    sameAs: [links.repository],
    publisher,
  };
}

/** The home page: the site, the application, how to use it, and its questions. */
export function homeSchema(locale: Locale): Node {
  const site = getDictionary(locale).site;
  const url = pageUrl(locale);
  return graph([
    { "@type": "WebSite", "@id": `${pageUrl("en")}#site`, name: "Mirlow", url: pageUrl("en"), inLanguage: locales.map((each) => localeTags[each]) },
    application(locale),
    {
      "@type": "HowTo",
      "@id": `${url}#how`,
      name: `${site.hero.titleLine1} ${site.hero.titleLine2}`,
      inLanguage: localeTags[locale],
      step: site.how.steps.map((step, index) => ({
        "@type": "HowToStep",
        position: index + 1,
        name: step.title,
        text: step.body,
      })),
    },
    questions(url, site.faq.items),
  ]);
}

function breadcrumbs(locale: Locale, trail: { name: string; url: string }[]): Node {
  return {
    "@type": "BreadcrumbList",
    itemListElement: [{ name: "Mirlow", url: pageUrl(locale) }, ...trail].map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/** The list of guides. */
export function guidesSchema(locale: Locale): Node {
  const site = getDictionary(locale).site;
  const url = pageUrl(locale, "guides");
  return graph([
    breadcrumbs(locale, [{ name: site.guides.title, url }]),
    {
      "@type": "ItemList",
      "@id": `${url}#list`,
      itemListElement: guideIds.map((id, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: getGuide(locale, id).title,
        url: pageUrl(locale, id),
      })),
    },
  ]);
}

/** One guide: an article, its instructions if it has any, and its questions. */
export function guideSchema(locale: Locale, id: GuideId): Node {
  const site = getDictionary(locale).site;
  const guide = getGuide(locale, id);
  const url = pageUrl(locale, id);
  const nodes: Node[] = [
    breadcrumbs(locale, [
      { name: site.guides.title, url: pageUrl(locale, "guides") },
      { name: guide.short, url },
    ]),
    {
      "@type": "TechArticle",
      "@id": `${url}#article`,
      headline: guide.title,
      description: describePage(locale, id).description,
      inLanguage: localeTags[locale],
      mainEntityOfPage: url,
      image,
      datePublished: guidesUpdated,
      dateModified: guidesUpdated,
      author: publisher,
      publisher,
      about: { "@id": `${pageUrl(locale)}#app` },
    },
    questions(url, guide.faq),
  ];
  if (guide.steps) {
    nodes.push({
      "@type": "HowTo",
      "@id": `${url}#steps`,
      name: guide.title,
      description: guide.lead,
      inLanguage: localeTags[locale],
      tool: [{ "@type": "HowToTool", name: "Mirlow" }],
      step: guide.steps.map((step, index) => ({
        "@type": "HowToStep",
        position: index + 1,
        name: step.title,
        text: step.body,
      })),
    });
  }
  return graph(nodes);
}
