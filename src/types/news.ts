// ニュース機能のドメイン型。RSS配信データは外部入力として扱い、
// 記事全文は保持しない（タイトル・概要・配信元・元記事リンクのみ）。

export interface NewsCategoryRef {
  slug: string;
  confidence: number;
}

export interface NewsCompanyRef {
  code: string;
  name?: string;
  matchType: "security_code" | "company_name" | "alias" | string;
  confidence: number;
  isManual?: boolean;
}

export interface NewsArticle {
  id: string;
  sourceId: string;
  sourceName: string;
  sourceSlug: string;
  externalId: string | null;
  title: string;
  slug: string;
  summary: string;
  originalUrl: string;
  canonicalUrl: string | null;
  imageUrl: string | null;
  authorName: string | null;
  publishedAt: string;
  externalUpdatedAt: string | null;
  fetchedAt: string;
  language: string;
  contentHash: string;
  urlHash: string | null;
  importanceScore: number;
  status: "published" | "hidden" | string;
  isFeatured: boolean;
  isBreaking: boolean;
  isDuplicate: boolean;
  duplicateOfId: string | null;
  isDemo: boolean;
  categories: NewsCategoryRef[];
  companies: NewsCompanyRef[];
}

export interface NewsSource {
  id: string;
  name: string;
  slug: string;
  feedUrl: string;
  siteUrl: string;
  language: string;
  defaultCategory?: string;
  isActive: boolean;
  fetchIntervalMinutes: number;
  priority: number;
  trustLevel?: number;
  imageUsageAllowed: boolean;
  commercialUseAllowed?: boolean;
  termsNote?: string;
  lastFetchedAt?: string;
  lastSuccessAt?: string;
  lastErrorAt?: string;
  consecutiveErrors: number;
}

export interface NewsCategory {
  slug: string;
  nameJa: string;
  nameEn: string;
  sortOrder: number;
  isActive: boolean;
}

export interface RssFetchLog {
  id: string;
  sourceId: string;
  sourceName: string;
  startedAt: string;
  completedAt: string | null;
  status: "success" | "error" | "paused" | string;
  httpStatus: number | null;
  itemsReceived: number;
  itemsCreated: number;
  itemsUpdated: number;
  itemsSkipped: number;
  errorMessage: string | null;
}

export interface NewsDataset {
  generatedAt: string;
  isDemo: boolean;
  /** ok=全件成功 / partial=一部失敗 / error=全件失敗 / demo=配信元未設定 */
  status: "ok" | "partial" | "error" | "demo" | string;
  message: string | null;
  sources: NewsSource[];
  categories: NewsCategory[];
  articles: NewsArticle[];
}

export interface NewsFilters {
  q?: string;
  category?: string;
  source?: string;
  company?: string;
  from?: string;
  to?: string;
  featuredOnly?: boolean;
  breakingOnly?: boolean;
  sort?: "newest" | "importance" | "oldest";
}
