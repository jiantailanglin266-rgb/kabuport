"use client";
import { useState } from "react";
import Link from "next/link";
import { clsx } from "clsx";
import type { Locale } from "@/types";

export interface RankRow {
  code: string;
  name: string;
  segment: string;
  price: string;
  changePct: number;
  metric: string;
}

export interface RankTab {
  key: string;
  label: string;
  metricLabel: string;
  rows: RankRow[];
}

/** 人気ランキング。タブ切替はクライアント、データはサーバーで整形済み（軽量）。 */
export function RankingTabs({ tabs, locale }: { tabs: RankTab[]; locale: Locale }) {
  const [active, setActive] = useState(tabs[0]?.key ?? "");
  const current = tabs.find((t) => t.key === active) ?? tabs[0];
  const ja = locale === "ja";
  if (!current) return null;

  return (
    <div className="card overflow-hidden">
      {/* タブ */}
      <div role="tablist" aria-label={ja ? "ランキング種別" : "Ranking type"} className="scroll-x flex gap-1 overflow-x-auto border-b border-line p-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={t.key === active}
            onClick={() => setActive(t.key)}
            className={clsx(
              "whitespace-nowrap rounded-lg px-4 py-2.5 text-[13px] font-bold transition-all duration-200",
              t.key === active ? "bg-navy text-white shadow-card" : "text-muted hover:bg-bg hover:text-ink",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* テーブル */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px]">
          <caption className="sr-only">{current.label}</caption>
          <thead>
            <tr className="border-b border-line text-[11px] uppercase tracking-wide text-muted">
              <th scope="col" className="w-12 py-3 pl-5 text-left font-bold">#</th>
              <th scope="col" className="py-3 text-left font-bold">{ja ? "銘柄" : "Stock"}</th>
              <th scope="col" className="py-3 text-right font-bold">{ja ? "株価" : "Price"}</th>
              <th scope="col" className="py-3 text-right font-bold">{ja ? "前日比" : "Change"}</th>
              <th scope="col" className="py-3 pr-5 text-right font-bold">{current.metricLabel}</th>
            </tr>
          </thead>
          <tbody>
            {current.rows.map((r, i) => {
              const up = r.changePct >= 0;
              return (
                <tr key={r.code} className="border-b border-line/60 transition-colors last:border-0 hover:bg-bg">
                  <td className="num py-3.5 pl-5 text-[12px] font-bold text-muted">{i + 1}</td>
                  <td className="py-3.5">
                    <Link href={`/${locale}/stocks/${r.code}`} className="text-[13.5px] font-bold text-ink hover:text-primary">
                      {r.name}
                    </Link>
                    <div className="num mt-0.5 text-[11px] text-muted">
                      {r.code} ・ {r.segment}
                    </div>
                  </td>
                  <td className="num py-3.5 text-right text-[13.5px] font-bold text-ink">{r.price}</td>
                  <td className="py-3.5 text-right">
                    <span className={clsx("num text-[13px] font-extrabold", up ? "text-up" : "text-down")}>
                      {up ? "▲" : "▼"} {up ? "+" : ""}
                      {r.changePct.toFixed(2)}%
                    </span>
                    <span className="sr-only">{up ? (ja ? "上昇" : "up") : ja ? "下落" : "down"}</span>
                  </td>
                  <td className="num py-3.5 pr-5 text-right text-[13px] font-bold text-ink-2">{r.metric}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-line px-5 py-3.5">
        <span className="text-[11px] text-muted">
          {ja ? "集計対象: 掲載サンプル銘柄 / 更新: デモ固定" : "Universe: sample stocks / demo snapshot"}
        </span>
        <Link href={`/${locale}/rankings`} className="text-[12.5px] font-bold text-primary hover:underline">
          {ja ? "すべてのランキング →" : "All rankings →"}
        </Link>
      </div>
    </div>
  );
}
