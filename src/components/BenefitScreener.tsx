"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { RotateCcw } from "lucide-react";
import type { BenefitCategory, Locale } from "@/types";
import type { BenefitEntry } from "@/lib/queries";
import { getDictionary, pick } from "@/lib/i18n";
import { formatRatio, formatYenCompact } from "@/lib/format";

const CATEGORY_LABEL: Record<BenefitCategory, { ja: string; en: string }> = {
  food: { ja: "食品", en: "Food" },
  dining: { ja: "外食", en: "Dining" },
  shopping: { ja: "買い物", en: "Shopping" },
  voucher: { ja: "金券", en: "Voucher" },
  travel: { ja: "旅行", en: "Travel" },
  leisure: { ja: "レジャー", en: "Leisure" },
  daily: { ja: "日用品", en: "Daily goods" },
  beauty: { ja: "美容", en: "Beauty" },
  catalog: { ja: "カタログ", en: "Catalog" },
  ownproduct: { ja: "自社製品", en: "Own product" },
};

type SortKey = "total" | "benefit" | "dividend" | "investment";

export function BenefitScreener({ entries, locale }: { entries: BenefitEntry[]; locale: Locale }) {
  const t = getDictionary(locale);
  const [month, setMonth] = useState<number | 0>(0);
  const [category, setCategory] = useState<BenefitCategory | "all">("all");
  const [maxInvest, setMaxInvest] = useState<number>(0);
  const [sort, setSort] = useState<SortKey>("total");

  const months = useMemo(() => {
    const set = new Set<number>();
    entries.forEach((e) => e.summary.benefit?.recordMonths.forEach((m) => set.add(m)));
    return [...set].sort((a, b) => a - b);
  }, [entries]);

  const rows = useMemo(() => {
    let list = entries.filter((e) => {
      const b = e.summary.benefit!;
      if (month !== 0 && !b.recordMonths.includes(month)) return false;
      if (category !== "all" && b.category !== category) return false;
      if (maxInvest > 0 && (e.requiredInvestment ?? Infinity) > maxInvest) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      switch (sort) {
        case "benefit":
          return (b.benefitYield ?? -1) - (a.benefitYield ?? -1);
        case "dividend":
          return (b.dividendYield ?? -1) - (a.dividendYield ?? -1);
        case "investment":
          return (a.requiredInvestment ?? Infinity) - (b.requiredInvestment ?? Infinity);
        default:
          return (b.totalYield ?? -1) - (a.totalYield ?? -1);
      }
    });
    return list;
  }, [entries, month, category, maxInvest, sort]);

  const field = "rounded-lg border border-line bg-card px-2 py-1.5 text-sm text-ink outline-none focus:border-brand";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-line bg-card p-4">
        <label className="grid gap-1 text-xs text-muted">
          {locale === "ja" ? "権利確定月" : "Record month"}
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className={field}>
            <option value={0}>{t.common.all}</option>
            {months.map((m) => (
              <option key={m} value={m}>{m}{locale === "ja" ? "月" : ""}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-xs text-muted">
          {locale === "ja" ? "カテゴリー" : "Category"}
          <select value={category} onChange={(e) => setCategory(e.target.value as BenefitCategory | "all")} className={field}>
            <option value="all">{t.common.all}</option>
            {(Object.keys(CATEGORY_LABEL) as BenefitCategory[]).map((c) => (
              <option key={c} value={c}>{pick(locale, CATEGORY_LABEL[c].ja, CATEGORY_LABEL[c].en)}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-xs text-muted">
          {locale === "ja" ? "必要投資額 ≤ (円)" : "Investment ≤ (JPY)"}
          <input type="number" min={0} step={50000} value={maxInvest || ""} onChange={(e) => setMaxInvest(Number(e.target.value) || 0)} className={field} />
        </label>
        <label className="grid gap-1 text-xs text-muted">
          {locale === "ja" ? "並び替え" : "Sort"}
          <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className={field}>
            <option value="total">{locale === "ja" ? "総合利回り" : "Total yield"}</option>
            <option value="benefit">{locale === "ja" ? "優待利回り" : "Benefit yield"}</option>
            <option value="dividend">{t.common.yield}</option>
            <option value="investment">{locale === "ja" ? "必要投資額" : "Investment"}</option>
          </select>
        </label>
        <button
          onClick={() => { setMonth(0); setCategory("all"); setMaxInvest(0); setSort("total"); }}
          className="ml-auto inline-flex items-center gap-1 text-xs text-muted hover:text-ink"
        >
          <RotateCcw size={12} /> {t.screener.reset}
        </button>
      </div>

      <div className="text-sm text-muted" aria-live="polite">
        <span className="tabular font-semibold text-ink">{rows.length}</span> {t.screener.results}
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-card p-10 text-center text-muted">{t.common.noResults}</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-card">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-line text-xs text-muted">
                <th scope="col" className="p-3 text-left">{locale === "ja" ? "銘柄" : "Stock"}</th>
                <th scope="col" className="p-3 text-left">{locale === "ja" ? "優待内容" : "Benefit"}</th>
                <th scope="col" className="p-3 text-right">{locale === "ja" ? "必要投資額" : "Investment"}</th>
                <th scope="col" className="p-3 text-right">{t.common.yield}</th>
                <th scope="col" className="p-3 text-right">{locale === "ja" ? "優待利回り" : "Benefit yld"}</th>
                <th scope="col" className="p-3 text-right">{locale === "ja" ? "総合利回り" : "Total yld"}</th>
              </tr>
            </thead>
            <tbody className="tabular">
              {rows.map((e) => {
                const s = e.summary;
                const b = s.benefit!;
                return (
                  <tr key={s.company.code} className="border-b border-line/60 last:border-0">
                    <td className="p-3">
                      <Link href={`/${locale}/stocks/${s.company.code}`} className="font-medium text-ink hover:text-brand">
                        {pick(locale, s.company.nameJa, s.company.nameEn)}
                      </Link>
                      <div className="text-xs text-muted">{s.company.code} ・ {b.recordMonths.map((m) => `${m}${locale === "ja" ? "月" : ""}`).join(",")}</div>
                    </td>
                    <td className="max-w-[220px] p-3 text-left text-ink">
                      <span className="mr-1 rounded bg-line/50 px-1.5 py-0.5 text-[10px] text-muted">{pick(locale, CATEGORY_LABEL[b.category].ja, CATEGORY_LABEL[b.category].en)}</span>
                      {pick(locale, b.contentJa, b.contentEn)}
                    </td>
                    <td className="p-3 text-right text-ink">{formatYenCompact(e.requiredInvestment, locale)}</td>
                    <td className="p-3 text-right text-ink">{formatRatio(e.dividendYield)}</td>
                    <td className="p-3 text-right text-ink">{formatRatio(e.benefitYield)}</td>
                    <td className="p-3 text-right font-semibold text-ink">{formatRatio(e.totalYield)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-[11px] text-muted">{locale === "ja" ? "優待内容・利回りはサンプルです。優待は変更・廃止の可能性があり、公式情報をご確認ください。" : "Benefits and yields are sample data and may change; check official sources."}</p>
    </div>
  );
}
