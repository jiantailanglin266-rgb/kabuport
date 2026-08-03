// canonical / hreflang / metadata 生成の共通処理。ページ間で矛盾させない。
import type { Metadata } from "next";
import { LOCALES, type Locale } from "@/types";

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3240").replace(/\/$/, "");
}

export function siteName(): string {
  return process.env.NEXT_PUBLIC_SITE_NAME || "KABUPORT";
}

/** ロケール付き絶対URL。path は先頭スラッシュ不要 (例: "stocks/7203")。 */
export function localizedUrl(locale: Locale, path = ""): string {
  const clean = path.replace(/^\//, "");
  return `${siteUrl()}/${locale}${clean ? `/${clean}` : ""}`;
}

/** hreflang の alternates.languages を生成 (x-default 付き)。 */
export function hreflangAlternates(path = ""): Record<string, string> {
  const langs: Record<string, string> = {};
  for (const l of LOCALES) langs[l] = localizedUrl(l, path);
  langs["x-default"] = localizedUrl("ja", path);
  return langs;
}

interface BuildMetaArgs {
  locale: Locale;
  path?: string;
  title: string;
  description: string;
  noindex?: boolean;
}

/** 全ページ共通のメタデータ生成。self-canonical + hreflang + OGP。 */
export function buildMetadata({ locale, path = "", title, description, noindex }: BuildMetaArgs): Metadata {
  const url = localizedUrl(locale, path);
  const fullTitle = title.includes(siteName()) ? title : `${title} | ${siteName()}`;
  return {
    // absolute にして root layout の title.template による二重付与を防ぐ
    title: { absolute: fullTitle },
    description,
    alternates: {
      canonical: url,
      languages: hreflangAlternates(path),
    },
    robots: noindex ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: siteName(),
      locale: locale === "ja" ? "ja_JP" : "en_US",
      type: "website",
    },
    twitter: { card: "summary_large_image", title: fullTitle, description },
  };
}
