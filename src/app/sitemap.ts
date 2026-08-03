import type { MetadataRoute } from "next";
import { LOCALES } from "@/types";
import { localizedUrl } from "@/lib/seo";
import { listAllCodes, listIndustries, listThemes } from "@/lib/queries";
import articlesRaw from "@/data/articles.json";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPaths = ["", "stocks", "rankings", "industries", "themes", "earnings", "learn", "about"];
  const codes = listAllCodes();
  const slugs = articlesRaw.map((a) => a.slug);
  const industryCodes = listIndustries().map((i) => i.code);
  const themeSlugs = listThemes().map((th) => th.slug);

  const entries: MetadataRoute.Sitemap = [];
  for (const locale of LOCALES) {
    for (const p of staticPaths) entries.push({ url: localizedUrl(locale, p), changeFrequency: "daily", priority: p === "" ? 1 : 0.7 });
    for (const code of codes) entries.push({ url: localizedUrl(locale, `stocks/${code}`), changeFrequency: "daily", priority: 0.8 });
    for (const c of industryCodes) entries.push({ url: localizedUrl(locale, `industries/${c}`), changeFrequency: "weekly", priority: 0.6 });
    for (const s of themeSlugs) entries.push({ url: localizedUrl(locale, `themes/${s}`), changeFrequency: "weekly", priority: 0.6 });
    for (const slug of slugs) entries.push({ url: localizedUrl(locale, `learn/${slug}`), changeFrequency: "monthly", priority: 0.5 });
  }
  return entries;
}
