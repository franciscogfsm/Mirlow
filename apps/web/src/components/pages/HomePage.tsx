import { getDictionary, type Locale } from "@mirlow/i18n";
import { FaqChapter, FeaturesChapter, FinalChapter, HeroChapter, TrustChapter } from "../home/Chapters";
import { homeSchema } from "@/lib/schema";
import { Stage } from "../home/Stage";
import { JsonLd } from "../site/JsonLd";
import { SiteFrame } from "../site/SiteFrame";

export function HomePage({ locale }: { locale: Locale }) {
  const t = getDictionary(locale).site;

  return (
    <SiteFrame locale={locale} page="home">
      <JsonLd data={homeSchema(locale)} />
      <Stage
        cue={t.hero.scroll}
        chapters={[
          { id: "how", label: t.nav.how, node: <HeroChapter t={t.hero} how={t.how} /> },
          { id: "features", label: t.nav.features, node: <FeaturesChapter t={t.features} /> },
          { id: "trust", label: t.trust.eyebrow, node: <TrustChapter t={t.trust} locale={locale} /> },
          { id: "faq", label: t.nav.faq, node: <FaqChapter t={t.faq} /> },
          { id: "download", label: t.nav.download, node: <FinalChapter t={t.finalCta} /> },
        ]}
      />
    </SiteFrame>
  );
}
