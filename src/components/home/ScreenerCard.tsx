"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { RotateCcw, SlidersHorizontal } from "lucide-react";
import type { Locale } from "@/types";

export interface ScreenRow {
  code: string;
  name: string;
  per: number | null;
  pbr: number | null;
  roe: number | null;
  yieldPct: number | null;
  equityRatio: number | null;
  marketCapOku: number; // 億円
  revGrowth: number | null;
}

interface Cond {
  key: keyof Filters;
  labelJa: string;
  labelEn: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  dir: "lte" | "gte";
}

interface Filters {
  per: number;
  pbr: number;
  roe: number;
  yieldPct: number;
  equityRatio: number;
  marketCapOku: number;
  revGrowth: number;
}

const DEFAULTS: Filters = { per: 40, pbr: 8, roe: 0, yieldPct: 0, equityRatio: 0, marketCapOku: 0, revGrowth: 0 };

const CONDS: Cond[] = [
  { key: "per", labelJa: "PER 以下", labelEn: "P/E max", unit: "倍", min: 5, max: 60, step: 1, dir: "lte" },
  { key: "pbr", labelJa: "PBR 以下", labelEn: "P/B max", unit: "倍", min: 0.5, max: 10, step: 0.1, dir: "lte" },
  { key: "roe", labelJa: "ROE 以上", labelEn: "ROE min", unit: "%", min: 0, max: 30, step: 1, dir: "gte" },
  { key: "yieldPct", labelJa: "配当利回り 以上", labelEn: "Yield min", unit: "%", min: 0, max: 6, step: 0.1, dir: "gte" },
  { key: "equityRatio", labelJa: "自己資本比率 以上", labelEn: "Equity ratio min", unit: "%", min: 0, max: 80, step: 5, dir: "gte" },
  { key: "revGrowth", labelJa: "増収率 以上", labelEn: "Revenue growth min", unit: "%", min: 0, max: 20, step: 1, dir: "gte" },
  { key: "marketCapOku", labelJa: "時価総額 以上", labelEn: "Market cap min", unit: "億円", min: 0, max: 200000, step: 5000, dir: "gte" },
];

export function ScreenerCard({ rows, locale }: { rows: ScreenRow[]; locale: Locale }) {
  const [f, setF] = useState<Filters>(DEFAULTS);
  const ja = locale === "ja";

  const matched = useMemo(
    () =>
      rows.filter((r) => {
        if (r.per !== null && r.per > f.per) return false;
        if (r.pbr !== null && r.pbr > f.pbr) return false;
        if (f.roe > 0 && (r.roe ?? 0) < f.roe) return false;
        if (f.yieldPct > 0 && (r.yieldPct ?? 0) < f.yieldPct) return false;
        if (f.equityRatio > 0 && (r.equityRatio ?? 0) < f.equityRatio) return false;
        if (f.revGrowth > 0 && (r.revGrowth ?? 0) < f.revGrowth) return false;
        if (f.marketCapOku > 0 && r.marketCapOku < f.marketCapOku) return false;
        return true;
      }),
    [rows, f],
  );

  return (
    <div className="card overflow-hidden">
      <div className="grid gap-px bg-line lg:grid-cols-[1.4fr_1fr]">
        {/* 条件 */}
        <div className="bg-card p-6 sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 text-[15px] font-extrabold text-ink">
              <SlidersHorizontal size={16} className="text-gold-600" aria-hidden />
              {ja ? "投資条件で絞り込む" : "Filter by criteria"}
            </h3>
            <button
              onClick={() => setF(DEFAULTS)}
              className="inline-flex items-center gap-1 text-[12px] font-bold text-muted transition-colors hover:text-ink"
            >
              <RotateCcw size={12} /> {ja ? "リセット" : "Reset"}
            </button>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {CONDS.map((c) => (
              <label key={c.key} className="block">
                <span className="flex items-baseline justify-between">
                  <span className="text-[12px] font-bold text-ink-2">{ja ? c.labelJa : c.labelEn}</span>
                  <span className="num text-[12px] font-extrabold text-primary">
                    {c.key === "marketCapOku"
                      ? f[c.key] === 0
                        ? ja ? "指定なし" : "Any"
                        : `${f[c.key].toLocaleString()}${ja ? "億円" : "oku"}`
                      : `${f[c.key]}${c.unit}`}
                  </span>
                </span>
                <input
                  type="range"
                  min={c.min}
                  max={c.max}
                  step={c.step}
                  value={f[c.key]}
                  onChange={(e) => setF({ ...f, [c.key]: Number(e.target.value) })}
                  aria-label={ja ? c.labelJa : c.labelEn}
                  className="mt-2 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-line accent-primary"
                />
              </label>
            ))}
          </div>
        </div>

        {/* 結果 */}
        <div className="flex flex-col justify-between bg-bg p-6 sm:p-8">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-widest text-muted">{ja ? "該当銘柄" : "Matches"}</div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="num text-[46px] font-extrabold leading-none text-ink" aria-live="polite">
                {matched.length}
              </span>
              <span className="text-[13px] font-bold text-muted">/ {rows.length}{ja ? "銘柄" : ""}</span>
            </div>

            <ul className="mt-6 space-y-2">
              {matched.slice(0, 4).map((r) => (
                <li key={r.code}>
                  <Link
                    href={`/${locale}/stocks/${r.code}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-line bg-card px-4 py-3 transition-all duration-300 ease-smooth hover:-translate-y-0.5 hover:border-line-strong"
                  >
                    <span className="min-w-0 truncate text-[13px] font-bold text-ink">{r.name}</span>
                    <span className="num shrink-0 text-[11.5px] text-muted">
                      PER {r.per ? r.per.toFixed(1) : "—"} / {ja ? "利回り" : "Yld"} {r.yieldPct ? r.yieldPct.toFixed(2) : "—"}%
                    </span>
                  </Link>
                </li>
              ))}
              {matched.length === 0 && (
                <li className="rounded-xl border border-dashed border-line-strong px-4 py-6 text-center text-[12.5px] text-muted">
                  {ja ? "条件に合う銘柄がありません" : "No matches"}
                </li>
              )}
            </ul>
          </div>

          <Link href={`/${locale}/stocks#screener`} className="btn-navy mt-6 w-full">
            {ja ? "詳細スクリーニングへ" : "Open full screener"}
          </Link>
        </div>
      </div>
    </div>
  );
}
