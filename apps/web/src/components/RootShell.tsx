import { defaultLocale, localeTags, type Locale } from "@mirlow/i18n";
import { Geist, Instrument_Serif } from "next/font/google";
import type { ReactNode } from "react";
import { basePath } from "@/lib/site";
import "@/app/globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: "italic",
  variable: "--font-instrument",
  display: "swap",
});

/**
 * Sends a first-time visitor whose browser prefers Portuguese to the
 * Portuguese pages. It runs before anything is painted, only on English
 * pages, at most once per visit, and never overrides a language the visitor
 * picked themselves.
 */
const detectLanguage = `(function(){try{
var chosen=localStorage.getItem("mirlow-locale");
var first=((navigator.languages&&navigator.languages[0])||navigator.language||"").toLowerCase();
var wanted=chosen||(first.indexOf("pt")===0?"pt":"en");
if(wanted!=="pt"||sessionStorage.getItem("mirlow-detected"))return;
sessionStorage.setItem("mirlow-detected","1");
var base=${JSON.stringify(basePath)};
var path=location.pathname.slice(base.length)||"/";
location.replace(base+"/pt"+path+location.search+location.hash);
}catch(e){}})();`;

/** The document shared by every page; each language has its own root layout that renders it. */
export function RootShell({ locale, children }: { locale: Locale; children: ReactNode }) {
  return (
    <html lang={localeTags[locale]} className={`${geist.variable} ${instrument.variable}`}>
      <head>
        <meta name="color-scheme" content="light dark" />
        <meta name="theme-color" content="#f3f3f0" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#08090b" media="(prefers-color-scheme: dark)" />
        {locale === defaultLocale && <script dangerouslySetInnerHTML={{ __html: detectLanguage }} />}
      </head>
      <body>{children}</body>
    </html>
  );
}
