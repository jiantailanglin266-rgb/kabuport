// JSON-LD 生成の共通処理。画面表示と一致させ、架空の評価・断定を含めない。
import type { Company, Locale } from "@/types";
import { localizedUrl, siteName, siteUrl } from "@/lib/seo";
import { pick } from "@/lib/i18n";

type Json = Record<string, unknown>;

export function organizationLd(): Json {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteName(),
    url: siteUrl(),
    description: "Japan Equity Intelligence — 日本株の企業情報・分析プラットフォーム (デモ)",
  };
}

export function websiteLd(locale: Locale): Json {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName(),
    url: localizedUrl(locale),
    inLanguage: locale,
    potentialAction: {
      "@type": "SearchAction",
      target: `${localizedUrl(locale, "stocks")}?q={query}`,
      "query-input": "required name=query",
    },
  };
}

export function breadcrumbLd(items: { name: string; path: string }[], locale: Locale): Json {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: localizedUrl(locale, it.path),
    })),
  };
}

/** 企業ページ。将来性の断定や架空レビューは付けない (規約準拠)。 */
export function companyLd(company: Company, locale: Locale): Json {
  return {
    "@context": "https://schema.org",
    "@type": "Corporation",
    name: pick(locale, company.nameJa, company.nameEn),
    alternateName: pick(locale, company.nameEn, company.nameJa),
    tickerSymbol: company.code,
    url: company.website || localizedUrl(locale, `stocks/${company.code}`),
    description: pick(locale, company.descriptionJa, company.descriptionEn),
  };
}

export function faqLd(items: { q: string; a: string }[]): Json {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((it) => ({
      "@type": "Question",
      name: it.q,
      acceptedAnswer: { "@type": "Answer", text: it.a },
    })),
  };
}

/** <script type="application/ld+json"> 用に安全にシリアライズ。 */
export function jsonLdScript(data: Json | Json[]): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
