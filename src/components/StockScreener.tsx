"use client";
import { useEffect, useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";
import type { Industry, Locale, MarketSegment } from "@/types";
import type { StockSummary } from "@/lib/queries";
import { getDictionary } from "@/lib/i18n";
import { StockCard } from "./StockCard";

type SortKey = "marketCap" | "yield" | "per" | "change";

export function StockScreener({
  summaries,
  industries,
  locale,
}: {
  summaries: StockSummary[];
  industries: Industry[];
  locale: Locale;
}) {
  const t = getDictionary(locale);
  const [q, setQ] = useState("");

  // ヘッダー検索フォーム等からの ?q= を初期値に反映 (静的エクスポート下でもクライアントで処理)。
  useEffect(() => {
    const urlQ = new URLSearchParams(window.location.search).get("q");
    if (urlQ) setQ(urlQ);
  }, []);
  const [segment, setSegment] = useState<MarketSegment | "all">("all");
  const [industry, setIndustry] = useState<string>("all");
  const [minYield, setMinYield] = useState<number>(0);
  const [maxPer, setMaxPer] = useState<number>(0);
  const [maxInvest, setMaxInvest] = useState<number>(0);
  const [sort, setSort] = useState<SortKey>("marketCap");

  const industryLabel = (code: string) =>
    industries.find((i) => i.code === code)?.[locale === "ja" ? "nameJa" : "nameEn"] ?? code;

  const results = useMemo(() => {
    const kw = q.trim().toLowerCase();
    let list = summaries.filter((s) => {
      const c = s.company;
      if (kw) {
        const hay = [c.code, c.nameJa, c.nameEn, c.nameKana].join(" ").toLowerCase();
        if (!hay.includes(kw)) return false;
      }
      if (segment !== "all" && c.segment !== segment) return false;
      if (industry !== "all" && c.industryCode !== industry) return false;
      if (minYield > 0 && (s.valuation?.dividendYield ?? 0) < minYield) return false;
      if (maxPer > 0 && (s.valuation?.per ?? Infinity) > maxPer) return false;
      if (maxInvest > 0 && (s.minInvestment ?? Infinity) > maxInvest) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      switch (sort) {
        case "yield":
          return (b.valuation?.dividendYield ?? -1) - (a.valuation?.dividendYield ?? -1);
        case "per":
          return (a.valuation?.per ?? Infinity) - (b.valuation?.per ?? Infinity);
        case "change":
          return (b.changePct ?? -Infinity) - (a.changePct ?? -Infinity);
        default:
          return b.quote.marketCap - a.quote.marketCap;
      }
    });
    return list;
  }, [summaries, q, segment, industry, minYield, maxPer, maxInvest, sort]);

  function reset() {
    setQ("");
    setSegment("all");
    setIndustry("all");
    setMinYield(0);
    setMaxPer(0);
    setMaxInvest(0);
    setSort("marketCap");
  }

  const field = "rounded-lg border border-line bg-card px-2 py-1.5 text-sm text-ink outline-none focus:border-brand";

  return (
    <div className="grid gap-6 md:grid-cols-[280px_1fr]">
      <aside id="screener" className="h-max rounded-2xl border border-line bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-ink">{t.screener.filters}</h2>
          <button onClick={reset} className="inline-flex items-center gap-1 text-xs text-muted hover:text-ink">
            <RotateCcw size={12} /> {t.screener.reset}
          </button>
        </div>
        <div className="grid gap-3">
          <label className="grid gap-1 text-xs text-muted">
            {t.common.searchPlaceholder}
            <input value={q} onChange={(e) => setQ(e.target.value)} className={field} placeholder="7203 / トヨタ" />
          </label>
          <label className="grid gap-1 text-xs text-muted">
            {t.common.segment}
            <select value={segment} onChange={(e) => setSegment(e.target.value as MarketSegment | "all")} className={field}>
              <option value="all">{t.common.all}</option>
              <option value="prime">{t.segments.prime}</option>
              <option value="standard">{t.segments.standard}</option>
              <option value="growth">{t.segments.growth}</option>
            </select>
          </label>
          <label className="grid gap-1 text-xs text-muted">
            {t.common.industry}
            <select value={industry} onChange={(e) => setIndustry(e.target.value)} className={field}>
              <option value="all">{t.common.all}</option>
              {industries.map((i) => (
                <option key={i.code} value={i.code}>
                  {industryLabel(i.code)}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-xs text-muted">
            {t.common.yield} ≥ (%)
            <input type="number" min={0} step={0.5} value={minYield || ""} onChange={(e) => setMinYield(Number(e.target.value) || 0)} className={field} />
          </label>
          <label className="grid gap-1 text-xs text-muted">
            {t.common.per} ≤ ({locale === "ja" ? "倍" : "x"})
            <input type="number" min={0} step={1} value={maxPer || ""} onChange={(e) => setMaxPer(Number(e.target.value) || 0)} className={field} />
          </label>
          <label className="grid gap-1 text-xs text-muted">
            {t.common.minInvestment} ≤ ({locale === "ja" ? "円" : "JPY"})
            <input type="number" min={0} step={10000} value={maxInvest || ""} onChange={(e) => setMaxInvest(Number(e.target.value) || 0)} className={field} />
          </label>
          <label className="grid gap-1 text-xs text-muted">
            {locale === "ja" ? "並び替え" : "Sort"}
            <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className={field}>
              <option value="marketCap">{t.common.marketCap}</option>
              <option value="yield">{t.common.yield}</option>
              <option value="per">{t.common.per}</option>
              <option value="change">{t.common.change}</option>
            </select>
          </label>
        </div>
      </aside>

      <div>
        <div className="mb-3 text-sm text-muted" aria-live="polite">
          <span className="tabular font-semibold text-ink">{results.length}</span> {t.screener.results}
        </div>
        {results.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-card p-10 text-center text-muted">{t.common.noResults}</div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {results.map((s) => (
              <StockCard key={s.company.code} s={s} locale={locale} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
