import Link from "next/link";
import type { Locale } from "@/types";
import type { HeatmapCell } from "@/lib/queries";
import { pick } from "@/lib/i18n";
import { formatYenCompact } from "@/lib/format";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "./SectionHeading";

/** TradingView風の業種ヒートマップ。時価総額でタイルサイズ、平均騰落率で濃淡。 */
export function SectorHeatmap({ cells, locale }: { cells: HeatmapCell[]; locale: Locale }) {
  const ja = locale === "ja";
  const max = Math.max(...cells.map((c) => c.totalMarketCap), 1);

  // 時価総額の相対規模でタイルの占有幅を決める（上位は大きく）
  const span = (v: number) => {
    const r = v / max;
    if (r > 0.55) return "col-span-2 row-span-2";
    if (r > 0.22) return "col-span-2";
    return "";
  };

  return (
    <section className="shell py-16 sm:py-20">
      <SectionHeading
        eyebrow="Sector Heatmap"
        title={ja ? "業種別ヒートマップ" : "Sector heatmap"}
        description={
          ja
            ? "タイルの大きさは時価総額、色の濃さは平均騰落率（掲載銘柄の単純平均）。クリックで業種ページへ移動します。"
            : "Tile size reflects market cap; color intensity reflects average change (simple mean of listed stocks). Click to open a sector."
        }
        href={`/${locale}/industries`}
        hrefLabel={ja ? "業種一覧へ" : "All industries"}
      />

      <Reveal>
        <div className="grid auto-rows-[92px] grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
          {cells.map((c) => {
            const up = c.avgChangePct >= 0;
            const mag = Math.min(1, Math.abs(c.avgChangePct) / 1.8);
            const bg = up ? `rgba(231,76,60,${0.12 + mag * 0.6})` : `rgba(0,182,122,${0.12 + mag * 0.6})`;
            const strong = mag > 0.45;
            return (
              <Link
                key={c.code}
                href={`/${locale}/industries/${c.code}`}
                className={`group relative flex flex-col justify-between overflow-hidden rounded-xl p-3.5 transition-transform duration-300 ease-smooth hover:-translate-y-0.5 hover:ring-2 hover:ring-navy/25 ${span(c.totalMarketCap)}`}
                style={{ background: bg }}
              >
                <div>
                  <div className={`truncate text-[12px] font-extrabold ${strong ? "text-white" : "text-ink"}`}>
                    {pick(locale, c.nameJa, c.nameEn)}
                  </div>
                  <div className={`num text-[10px] font-semibold ${strong ? "text-white/70" : "text-ink-2/70"}`}>
                    {c.count}{ja ? "銘柄" : " stocks"} ・ {formatYenCompact(c.totalMarketCap, locale)}
                  </div>
                </div>
                <div className={`num text-[15px] font-extrabold ${strong ? "text-white" : "text-ink"}`}>
                  {up ? "▲" : "▼"} {up ? "+" : ""}
                  {c.avgChangePct.toFixed(2)}%
                </div>
              </Link>
            );
          })}
        </div>
      </Reveal>

      <p className="mt-4 text-[11.5px] text-muted">
        {ja
          ? "※ 色は騰落方向を示しますが、▲▼と数値を併記しており色のみに依存しません。すべてサンプルデータです。"
          : "Colors indicate direction but are always paired with ▲▼ and figures. All sample data."}
      </p>
    </section>
  );
}
