"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { clsx } from "clsx";
import type { Industry, Locale } from "@/types";
import type { CompareModel } from "@/lib/queries";
import { getDictionary, pick } from "@/lib/i18n";
import { formatNumber, formatRatio, formatYen, formatYenCompact } from "@/lib/format";

const MAX = 4;

type Better = "high" | "low" | "none";
interface RowDef {
  key: string;
  label: (loc: Locale, t: ReturnType<typeof getDictionary>) => string;
  value: (m: CompareModel) => number | null;
  render: (m: CompareModel, loc: Locale) => string;
  better: Better;
}

const ROWS: RowDef[] = [
  { key: "price", label: (l, t) => t.common.price, value: (m) => m.price, render: (m, l) => formatYen(m.price, l), better: "none" },
  { key: "mcap", label: (l, t) => t.common.marketCap, value: (m) => m.marketCap, render: (m, l) => formatYenCompact(m.marketCap, l), better: "high" },
  { key: "per", label: (l, t) => t.common.per, value: (m) => m.per, render: (m) => (m.per ? `${formatNumber(m.per, 1)}倍` : "—"), better: "low" },
  { key: "pbr", label: (l, t) => t.common.pbr, value: (m) => m.pbr, render: (m) => (m.pbr ? `${formatNumber(m.pbr, 2)}倍` : "—"), better: "low" },
  { key: "roe", label: (l, t) => t.common.roe, value: (m) => m.roe, render: (m) => formatRatio(m.roe), better: "high" },
  { key: "yield", label: (l, t) => t.common.yield, value: (m) => m.yieldPct, render: (m) => formatRatio(m.yieldPct), better: "high" },
  { key: "opm", label: (l) => (l === "ja" ? "営業利益率" : "Op. margin"), value: (m) => m.operatingMargin, render: (m) => formatRatio(m.operatingMargin), better: "high" },
  { key: "payout", label: (l) => (l === "ja" ? "配当性向" : "Payout"), value: (m) => m.payoutPct, render: (m) => formatRatio(m.payoutPct), better: "none" },
  { key: "min", label: (l, t) => t.common.minInvestment, value: (m) => m.minInvestment, render: (m, l) => formatYenCompact(m.minInvestment, l), better: "low" },
  { key: "streak", label: (l) => (l === "ja" ? "連続増配" : "Div. streak"), value: (m) => m.consecutiveIncrease, render: (m, l) => (m.consecutiveIncrease ? `${m.consecutiveIncrease}${l === "ja" ? "年" : "y"}` : "—"), better: "high" },
];

export function StockCompare({ models, industries, locale }: { models: CompareModel[]; industries: Industry[]; locale: Locale }) {
  const t = getDictionary(locale);
  const [codes, setCodes] = useState<string[]>([]);

  useEffect(() => {
    const urlCodes = (new URLSearchParams(window.location.search).get("codes") || "").split(",").map((c) => c.trim()).filter(Boolean);
    const valid = urlCodes.filter((c) => models.some((m) => m.code === c)).slice(0, MAX);
    setCodes(valid.length ? valid : models.slice(0, 2).map((m) => m.code));
  }, [models]);

  const selected = useMemo(() => codes.map((c) => models.find((m) => m.code === c)).filter((m): m is CompareModel => !!m), [codes, models]);
  const available = models.filter((m) => !codes.includes(m.code));
  const industryName = (code: string) => industries.find((i) => i.code === code)?.[locale === "ja" ? "nameJa" : "nameEn"] ?? code;

  function add(code: string) { if (code && codes.length < MAX && !codes.includes(code)) setCodes([...codes, code]); }
  function remove(code: string) { setCodes(codes.filter((c) => c !== code)); }

  // 各行のベスト値を算出（ハイライト用）
  function bestCode(row: RowDef): string | null {
    if (row.better === "none") return null;
    let best: { code: string; v: number } | null = null;
    for (const m of selected) {
      const v = row.value(m);
      if (v === null) continue;
      if (!best || (row.better === "high" ? v > best.v : v < best.v)) best = { code: m.code, v };
    }
    return best?.code ?? null;
  }

  return (
    <div className="space-y-4">
      {codes.length < MAX && (
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted">{locale === "ja" ? "銘柄を追加" : "Add stock"}</label>
          <select
            value=""
            onChange={(e) => add(e.target.value)}
            className="rounded-lg border border-line bg-card px-2 py-1.5 text-sm text-ink outline-none focus:border-brand"
          >
            <option value="">{locale === "ja" ? "選択…" : "Select…"}</option>
            {available.map((m) => (
              <option key={m.code} value={m.code}>{pick(locale, m.nameJa, m.nameEn)}（{m.code}）</option>
            ))}
          </select>
          <span className="text-xs text-muted">{selected.length}/{MAX}</span>
        </div>
      )}

      {selected.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-card p-10 text-center text-muted">{locale === "ja" ? "比較する銘柄を追加してください" : "Add stocks to compare"}</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-card">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-line">
                <th scope="col" className="p-3 text-left text-xs text-muted">{locale === "ja" ? "項目" : "Metric"}</th>
                {selected.map((m) => (
                  <th key={m.code} scope="col" className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/${locale}/stocks/${m.code}`} className="font-semibold text-ink hover:text-brand">{pick(locale, m.nameJa, m.nameEn)}</Link>
                      <button onClick={() => remove(m.code)} aria-label={`${m.code} を削除`} className="text-muted hover:text-ink"><X size={13} /></button>
                    </div>
                    <div className="tabular text-xs font-normal text-muted">{m.code}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="tabular">
              {ROWS.map((row) => {
                const best = bestCode(row);
                return (
                  <tr key={row.key} className="border-b border-line/60 last:border-0">
                    <th scope="row" className="p-3 text-left font-medium text-muted">{row.label(locale, t)}</th>
                    {selected.map((m) => (
                      <td key={m.code} className={clsx("p-3 text-right", best === m.code ? "font-bold text-brand" : "text-ink")}>
                        {row.render(m, locale)}
                        {best === m.code && <span className="sr-only"> ({locale === "ja" ? "最良" : "best"})</span>}
                      </td>
                    ))}
                  </tr>
                );
              })}
              <tr className="border-b border-line/60">
                <th scope="row" className="p-3 text-left font-medium text-muted">{t.common.segment}</th>
                {selected.map((m) => <td key={m.code} className="p-3 text-right text-ink">{t.segments[m.segment] ?? m.segment}</td>)}
              </tr>
              <tr className="border-b border-line/60">
                <th scope="row" className="p-3 text-left font-medium text-muted">{t.common.industry}</th>
                {selected.map((m) => <td key={m.code} className="p-3 text-right text-ink">{industryName(m.industryCode)}</td>)}
              </tr>
              <tr>
                <th scope="row" className="p-3 text-left font-medium text-muted">{locale === "ja" ? "株主優待" : "Benefit"}</th>
                {selected.map((m) => <td key={m.code} className="p-3 text-right text-ink">{m.hasBenefit ? (locale === "ja" ? "あり" : "Yes") : (locale === "ja" ? "なし" : "No")}</td>)}
              </tr>
            </tbody>
          </table>
        </div>
      )}
      <p className="text-[11px] text-muted">{locale === "ja" ? "数値が高い/低いことは優劣を意味しません。定義・前提はサンプルです。" : "Higher/lower values do not imply superiority. Definitions are illustrative."}</p>
    </div>
  );
}
