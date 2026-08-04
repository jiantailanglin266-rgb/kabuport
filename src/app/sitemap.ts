import type { MetadataRoute } from "next";
import { LOCALES } from "@/types";
import { localizedUrl } from "@/lib/seo";
import { listAllCodes, listIndustries, listThemes, listVideoIds } from "@/lib/queries";
import articlesRaw from "@/data/articles.json";
import glossaryRaw from "@/data/glossary.json";
import pathsRaw from "@/data/learning-paths.json";
import expertsRaw from "@/data/experts.json";
import brokersRaw from "@/data/brokers.json";
import { countByCategory, getCategories, getSources, listArticles, listNewsCompanies } from "@/lib/news";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPaths = ["", "stocks", "spotlight", "signals", "compare", "rankings", "industries", "themes", "dividends", "benefits", "earnings", "brokers", "videos", "news", "learn", "paths", "glossary", "experts", "data", "credits", "about"];
  const codes = listAllCodes();
  const slugs = articlesRaw.map((a) => a.slug);
  const industryCodes = listIndustries().map((i) => i.code);
  const themeSlugs = listThemes().map((th) => th.slug);

  const newsCounts = countByCategory();

  const entries: MetadataRoute.Sitemap = [];
  for (const locale of LOCALES) {
    for (const p of staticPaths) entries.push({ url: localizedUrl(locale, p), changeFrequency: "daily", priority: p === "" ? 1 : 0.7 });
    for (const code of codes) entries.push({ url: localizedUrl(locale, `stocks/${code}`), changeFrequency: "daily", priority: 0.8 });
    for (const c of industryCodes) entries.push({ url: localizedUrl(locale, `industries/${c}`), changeFrequency: "weekly", priority: 0.6 });
    for (const s of themeSlugs) entries.push({ url: localizedUrl(locale, `themes/${s}`), changeFrequency: "weekly", priority: 0.6 });
    for (const slug of slugs) entries.push({ url: localizedUrl(locale, `learn/${slug}`), changeFrequency: "monthly", priority: 0.5 });
    for (const p of pathsRaw) entries.push({ url: localizedUrl(locale, `paths/${p.slug}`), changeFrequency: "monthly", priority: 0.5 });
    for (const g of glossaryRaw) entries.push({ url: localizedUrl(locale, `glossary/${g.slug}`), changeFrequency: "monthly", priority: 0.5 });
    for (const e of expertsRaw) entries.push({ url: localizedUrl(locale, `experts/${e.slug}`), changeFrequency: "monthly", priority: 0.4 });
    for (const b of brokersRaw) entries.push({ url: localizedUrl(locale, `brokers/${b.slug}`), changeFrequency: "weekly", priority: 0.6 });
    for (const id of listVideoIds()) entries.push({ url: localizedUrl(locale, `videos/${id}`), changeFrequency: "weekly", priority: 0.5 });
    // ニュース: 記事・カテゴリー別・配信元別・企業別
    for (const a of listArticles()) entries.push({ url: localizedUrl(locale, `news/${a.slug}`), changeFrequency: "daily", priority: 0.6, lastModified: a.publishedAt });
    for (const c of getCategories()) {
      if ((newsCounts[c.slug] ?? 0) > 0) entries.push({ url: localizedUrl(locale, `news/category/${c.slug}`), changeFrequency: "daily", priority: 0.6 });
    }
    for (const s2 of getSources()) entries.push({ url: localizedUrl(locale, `news/source/${s2.slug}`), changeFrequency: "daily", priority: 0.5 });
    for (const c of listNewsCompanies()) entries.push({ url: localizedUrl(locale, `news/company/${c.code}`), changeFrequency: "daily", priority: 0.5 });
  }
  return entries;
}
