// ニュースデータセットの読み込みと絞り込み。
// 静的エクスポートのため、ビルド時にファイルシステムから読む（サーバー専用）。
import "server-only";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type {
  NewsArticle, NewsCategory, NewsDataset, NewsFilters, NewsSource, RssFetchLog,
} from "@/types/news";

const DIR = join(process.cwd(), "public", "data", "news");

const EMPTY: NewsDataset = {
  generatedAt: "",
  isDemo: true,
  status: "demo",
  message: "ニュースデータがまだ生成されていません。",
  sources: [],
  categories: [],
  articles: [],
};

let cached: NewsDataset | null = null;
let cachedLogs: RssFetchLog[] | null = null;

export function getNewsDataset(): NewsDataset {
  if (cached) return cached;
  try {
    cached = JSON.parse(readFileSync(join(DIR, "index.json"), "utf8")) as NewsDataset;
  } catch {
    cached = EMPTY;
  }
  return cached;
}

export function getFetchLogs(): RssFetchLog[] {
  if (cachedLogs) return cachedLogs;
  try {
    cachedLogs = (JSON.parse(readFileSync(join(DIR, "logs.json"), "utf8")).logs ?? []) as RssFetchLog[];
  } catch {
    cachedLogs = [];
  }
  return cachedLogs;
}

/** 表示対象の記事（重複記事は代表記事に集約するため一覧からは除外）。 */
export function listArticles(filters: NewsFilters = {}): NewsArticle[] {
  const { articles } = getNewsDataset();
  const q = filters.q?.trim().toLowerCase();

  let list = articles.filter((a) => a.status === "published" && !a.isDuplicate);

  if (filters.category) list = list.filter((a) => a.categories.some((c) => c.slug === filters.category));
  if (filters.source) list = list.filter((a) => a.sourceSlug === filters.source);
  if (filters.company) list = list.filter((a) => a.companies.some((c) => c.code === filters.company));
  if (filters.featuredOnly) list = list.filter((a) => a.isFeatured);
  if (filters.breakingOnly) list = list.filter((a) => a.isBreaking);
  if (filters.from) list = list.filter((a) => a.publishedAt >= filters.from!);
  if (filters.to) list = list.filter((a) => a.publishedAt <= filters.to!);
  if (q) {
    list = list.filter((a) =>
      [a.title, a.summary, a.sourceName, ...a.companies.map((c) => `${c.code} ${c.name ?? ""}`)]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }

  const sort = filters.sort ?? "newest";
  return [...list].sort((a, b) => {
    if (sort === "importance") return b.importanceScore - a.importanceScore;
    if (sort === "oldest") return a.publishedAt.localeCompare(b.publishedAt);
    return b.publishedAt.localeCompare(a.publishedAt);
  });
}

export function getArticleBySlug(slug: string): NewsArticle | undefined {
  return getNewsDataset().articles.find((a) => a.slug === slug);
}

/** 同じニュースを報じた他の配信元（重複として紐付けられた記事）。 */
export function getDuplicatesOf(articleId: string): NewsArticle[] {
  return getNewsDataset().articles.filter((a) => a.isDuplicate && a.duplicateOfId === articleId);
}

/** 関連ニュース: 同一カテゴリー優先、次に同一関連企業。 */
export function getRelatedArticles(article: NewsArticle, limit = 4): NewsArticle[] {
  const pool = listArticles().filter((a) => a.id !== article.id);
  const catSlugs = new Set(article.categories.map((c) => c.slug));
  const codes = new Set(article.companies.map((c) => c.code));

  const scored = pool.map((a) => {
    let score = 0;
    for (const c of a.categories) if (catSlugs.has(c.slug)) score += 2;
    for (const c of a.companies) if (codes.has(c.code)) score += 3;
    return { a, score };
  });
  return scored
    .filter((s) => s.score > 0)
    .sort((x, y) => y.score - x.score || y.a.publishedAt.localeCompare(x.a.publishedAt))
    .slice(0, limit)
    .map((s) => s.a);
}

export function getCategories(): NewsCategory[] {
  return getNewsDataset().categories.filter((c) => c.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getCategory(slug: string): NewsCategory | undefined {
  return getNewsDataset().categories.find((c) => c.slug === slug);
}

export function getSources(): NewsSource[] {
  return [...getNewsDataset().sources].sort((a, b) => b.priority - a.priority);
}

export function getSource(slug: string): NewsSource | undefined {
  return getNewsDataset().sources.find((s) => s.slug === slug);
}

/** 記事に紐付いている企業の一覧（企業別ページの生成に使う）。 */
export function listNewsCompanies(): { code: string; name: string; count: number }[] {
  const map = new Map<string, { code: string; name: string; count: number }>();
  for (const a of listArticles()) {
    for (const c of a.companies) {
      const cur = map.get(c.code) ?? { code: c.code, name: c.name ?? c.code, count: 0 };
      cur.count++;
      if (c.name) cur.name = c.name;
      map.set(c.code, cur);
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
}

/** カテゴリー別の件数（タブ表示用）。 */
export function countByCategory(): Record<string, number> {
  const out: Record<string, number> = {};
  for (const a of listArticles()) for (const c of a.categories) out[c.slug] = (out[c.slug] ?? 0) + 1;
  return out;
}

export function categoryLabel(slug: string, locale: "ja" | "en"): string {
  const c = getCategory(slug);
  if (!c) return slug;
  return locale === "ja" ? c.nameJa : c.nameEn;
}
