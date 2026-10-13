import { getDictionary, type Locale } from "@mirlow/i18n";
import { Hero } from "../home/Hero";
import { HowItWorks } from "../home/HowItWorks";
import { Faq, Features, FinalCta, Trust } from "../home/Sections";
import { Showcase } from "../home/Showcase";
import { SiteFrame } from "../site/SiteFrame";

export function HomePage({ locale }: { locale: Locale }) {
  const dictionary = getDictionary(locale);
  const t = dictionary.site;

  return (
    <SiteFrame locale={locale} page="home">
      <Hero t={t.hero} />
      <HowItWorks t={t.how} sheetLabel={t.hero.sceneSheet} />
      <Showcase t={t.showcase} app={dictionary.app} />
      <Features t={t.features} />
      <Trust t={t.trust} locale={locale} />
      <Faq t={t.faq} />
      <FinalCta t={t.finalCta} />
    </SiteFrame>
  );
}
