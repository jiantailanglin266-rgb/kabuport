"use client";
import { useEffect, useMemo, useState } from "react";
import { RotateCcw, Search } from "lucide-react";
import { clsx } from "clsx";
import type { Locale } from "@/types";
import type { NewsArticle, NewsCategory, NewsSource } from "@/types/news";
import { NewsCard } from "./NewsCard";

const PER_PAGE = 12;
type Sort = "newest" | "importance" | "oldest";

/**
 * ニュース一覧の検索・絞り込み・並び替え・ページネーション。
 * 静的サイトのため絞り込みはクライアント側で行い、条件はURLクエリへ反映する。
 * カテゴリー別・配信元別・企業別には、インデックス可能な個別ページを別途用意している。
 */
export function NewsBrowser({
  articles,
  categories,
  sources,
  categoryLabels,
  counts,
  locale,
  now,
}: {
  articles: NewsArticle[];
  categories: NewsCategory[];
  sources: NewsSource[];
  categoryLabels: Record<string, string>;
  counts: Record<string, number>;
  locale: Locale;
  now: number;
}) {
  const ja = locale === "ja";
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("all");
  const [source, setSource] = useState("all");
  const [from, setFrom] = useState("");
  const [sort, setSort] = useState<Sort>("newest");
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [breakingOnly, setBreakingOnly] = useState(false);
  const [page, setPage] = useState(1);

  // URLクエリから初期状態を復元
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setQ(p.get("q") ?? "");
    setCategory(p.get("category") ?? "all");
    setSource(p.get("source") ?? "all");
    setFrom(p.get("from") ?? "");
    const s = p.get("sort");
    if (s === "importance" || s === "oldest" || s === "newest") setSort(s);
    setFeaturedOnly(p.get("featured") === "1");
    setBreakingOnly(p.get("breaking") === "1");
    setPage(Math.max(1, Number(p.get("page") ?? "1") || 1));
  }, []);

  // 条件をURLへ反映（履歴を汚さないよう replaceState）
  useEffect(() => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (category !== "all") p.set("category", category);
    if (source !== "all") p.set("source", source);
    if (from) p.set("from", from);
    if (sort !== "newest") p.set("sort", sort);
    if (featuredOnly) p.set("featured", "1");
    if (breakingOnly) p.set("breaking", "1");
    if (page > 1) p.set("page", String(page));
    const qs = p.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, [q, category, source, from, sort, featuredOnly, breakingOnly, page]);

  const filtered = useMemo(() => {
    const kw = q.trim().toLowerCase();
    const list = articles.filter((a) => {
      if (category !== "all" && !a.categories.some((c) => c.slug === category)) return false;
      if (source !== "all" && a.sourceSlug !== source) return false;
      if (featuredOnly && !a.isFeatured) return false;
      if (breakingOnly && !a.isBreaking) return false;
      if (from && a.publishedAt < from) return false;
      if (kw) {
        const hay = [a.title, a.summary, a.sourceName, ...a.companies.map((c) => `${c.code} ${c.name ?? ""}`)]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(kw)) return false;
      }
      return true;
    });
    return [...list].sort((a, b) => {
      if (sort === "importance") return b.importanceScore - a.importanceScore;
      if (sort === "oldest") return a.publishedAt.localeCompare(b.publishedAt);
      return b.publishedAt.localeCompare(a.publishedAt);
    });
  }, [articles, q, category, source, from, sort, featuredOnly, breakingOnly]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const current = Math.min(page, totalPages);
  const shown = filtered.slice((current - 1) * PER_PAGE, current * PER_PAGE);

  const reset = () => {
    setQ("");
    setCategory("all");
    setSource("all");
    setFrom("");
    setSort("newest");
    setFeaturedOnly(false);
    setBreakingOnly(false);
    setPage(1);
  };

  const field = "h-11 rounded-xl border border-line bg-bg px-3 text-[13px] text-ink outline-none focus:border-primary/60";
  const chip = (active: boolean) =>
    clsx(
      "shrink-0 rounded-xl px-3.5 py-2 text-[12.5px] font-bold transition-all duration-200",
      active ? "bg-navy text-white shadow-card" : "border border-line bg-card text-ink-2 hover:border-line-strong hover:text-ink",
    );

  return (
    <div className="space-y-6">
      {/* 検索・絞り込み */}
      <div className="card p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              type="search"
              aria-label={ja ? "ニュースを検索" : "Search news"}
              placeholder={ja ? "キーワード・企業名・証券コードで検索" : "Search by keyword, company or ticker"}
              className={clsx(field, "w-full pl-10")}
            />
          </div>
          <select value={source} onChange={(e) => { setSource(e.target.value); setPage(1); }} aria-label={ja ? "配信元" : "Source"} className={field}>
            <option value="all">{ja ? "すべての配信元" : "All sources"}</option>
            {sources.map((s) => (
              <option key={s.slug} value={s.slug}>{s.name}</option>
            ))}
          </select>
          <input
            type="date"
            value={from}
            onChange={(e) => { setFrom(e.target.value); setPage(1); }}
            aria-label={ja ? "この日以降" : "From date"}
            className={field}
          />
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label={ja ? "並び替え" : "Sort"} className={field}>
            <option value="newest">{ja ? "新着順" : "Newest"}</option>
            <option value="importance">{ja ? "重要度順" : "Importance"}</option>
            <option value="oldest">{ja ? "古い順" : "Oldest"}</option>
          </select>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-ink-2">
            <input type="checkbox" checked={featuredOnly} onChange={(e) => { setFeaturedOnly(e.target.checked); setPage(1); }} className="accent-navy" />
            {ja ? "重要ニュースのみ" : "Key news only"}
          </label>
          <label className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-ink-2">
            <input type="checkbox" checked={breakingOnly} onChange={(e) => { setBreakingOnly(e.target.checked); setPage(1); }} className="accent-navy" />
            {ja ? "速報のみ" : "Breaking only"}
          </label>
          <button onClick={reset} className="ml-auto inline-flex items-center gap-1 text-[12px] font-bold text-muted hover:text-ink">
            <RotateCcw size={12} /> {ja ? "条件をリセット" : "Reset"}
          </button>
        </div>

        {/* カテゴリータブ */}
        <div className="scroll-x mt-4 flex gap-2 overflow-x-auto pb-1">
          <button onClick={() => { setCategory("all"); setPage(1); }} className={chip(category === "all")}>
            {ja ? "すべて" : "All"} <span className="num ml-1 opacity-60">{articles.length}</span>
          </button>
          {categories
            .filter((c) => (counts[c.slug] ?? 0) > 0)
            .map((c) => (
              <button key={c.slug} onClick={() => { setCategory(c.slug); setPage(1); }} className={chip(category === c.slug)}>
                {ja ? c.nameJa : c.nameEn} <span className="num ml-1 opacity-60">{counts[c.slug]}</span>
              </button>
            ))}
        </div>
      </div>

      <div className="flex items-center justify-between text-[13px] text-muted" aria-live="polite">
        <span>
          <span className="num font-extrabold text-ink">{filtered.length}</span> {ja ? "件のニュース" : "articles"}
        </span>
        {totalPages > 1 && (
          <span className="num text-[12px]">
            {current} / {totalPages} {ja ? "ページ" : ""}
          </span>
        )}
      </div>

      {shown.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-[14px] font-bold text-ink">{ja ? "条件に合うニュースがありません" : "No matching news"}</p>
          <p className="mt-1.5 text-[12.5px] text-muted">
            {ja ? "キーワードや絞り込み条件を変更してお試しください。" : "Try changing your keywords or filters."}
          </p>
          <button onClick={reset} className="btn-outline mt-5 h-10 px-5 text-[13px]">
            {ja ? "条件をリセット" : "Reset filters"}
          </button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((a) => (
            <NewsCard key={a.id} article={a} locale={locale} categoryLabels={categoryLabels} now={now} />
          ))}
        </div>
      )}

      {/* ページネーション（無限スクロールに依存しない） */}
      {totalPages > 1 && (
        <nav className="flex flex-wrap items-center justify-center gap-2" aria-label={ja ? "ページ送り" : "Pagination"}>
          <button
            onClick={() => setPage(Math.max(1, current - 1))}
            disabled={current === 1}
            className="h-10 rounded-xl border border-line bg-card px-4 text-[13px] font-bold text-ink disabled:opacity-40"
          >
            {ja ? "前へ" : "Prev"}
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - current) <= 1)
            .map((p, i, arr) => (
              <span key={p} className="flex items-center gap-2">
                {i > 0 && arr[i - 1] !== p - 1 && <span className="text-muted">…</span>}
                <button
                  onClick={() => setPage(p)}
                  aria-current={p === current ? "page" : undefined}
                  className={clsx(
                    "num h-10 w-10 rounded-xl text-[13px] font-bold transition-colors",
                    p === current ? "bg-navy text-white" : "border border-line bg-card text-ink hover:border-line-strong",
                  )}
                >
                  {p}
                </button>
              </span>
            ))}
          <button
            onClick={() => setPage(Math.min(totalPages, current + 1))}
            disabled={current === totalPages}
            className="h-10 rounded-xl border border-line bg-card px-4 text-[13px] font-bold text-ink disabled:opacity-40"
          >
            {ja ? "次へ" : "Next"}
          </button>
        </nav>
      )}
    </div>
  );
}
