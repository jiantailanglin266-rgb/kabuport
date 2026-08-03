import type { Locale } from "@/types";
import type { HeatmapCell } from "@/lib/queries";
import type { StockSummary } from "@/lib/queries";
import { pick } from "@/lib/i18n";
import { priceSeries } from "@/lib/series";
import { formatNumber } from "@/lib/format";

/**
 * ヒーロー右側の「大型モニター風」ダッシュボード。
 * すべてサーバーで決定的に描画し、動きはCSSのみ（JSゼロ / CLSゼロ）。
 */
export function HeroDashboard({
  indices,
  heatmap,
  ranking,
  locale,
}: {
  indices: { nameJa: string; nameEn: string; value: number; pct: number }[];
  heatmap: HeatmapCell[];
  ranking: StockSummary[];
  locale: Locale;
}) {
  const ja = locale === "ja";

  // ローソク足（決定的サンプル）
  const raw = priceSeries("nikkei225-hero", 37800, 39800, 39250, 26);
  const candles = raw.slice(1).map((close, i) => {
    const open = raw[i]!;
    const drift = ((i % 5) - 2) * 12;
    const high = Math.max(open, close) + 26 + Math.abs(drift);
    const low = Math.min(open, close) - 22 - Math.abs(drift) / 2;
    return { open, close, high, low };
  });
  const cMin = Math.min(...candles.map((c) => c.low));
  const cMax = Math.max(...candles.map((c) => c.high));
  const cRange = cMax - cMin || 1;
  const W = 560;
  const H = 190;
  const step = W / candles.length;
  const y = (v: number) => H - ((v - cMin) / cRange) * H;

  // 折れ線（終値）
  const linePath = candles
    .map((c, i) => `${i === 0 ? "M" : "L"}${(i * step + step / 2).toFixed(1)},${y(c.close).toFixed(1)}`)
    .join(" ");

  return (
    <div className="relative">
      {/* 外枠：モニター筐体 */}
      <div className="overflow-hidden rounded-3xl border border-white/12 bg-navy-700/70 shadow-[0_30px_80px_-30px_rgba(0,0,0,.7)] backdrop-blur-sm">
        {/* 上部バー */}
        <div className="flex items-center gap-3 border-b border-white/10 bg-white/[0.03] px-5 py-3">
          <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gold">
            <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-gold" aria-hidden />
            {ja ? "マーケットボード" : "Market board"}
          </span>
          <span className="ml-auto rounded-md border border-white/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-white/50">
            Sample Data
          </span>
        </div>

        <div className="grid gap-px bg-white/8 sm:grid-cols-2">
          {/* 指数タイル */}
          <div className="col-span-full grid grid-cols-2 gap-px bg-white/8 sm:grid-cols-4">
            {indices.slice(0, 4).map((it) => {
              const up = it.pct >= 0;
              return (
                <div key={it.nameEn} className="bg-navy-700 px-4 py-3.5">
                  <div className="truncate text-[10px] font-semibold text-white/45">{pick(locale, it.nameJa, it.nameEn)}</div>
                  <div className="num mt-1 text-[17px] font-extrabold text-white">{formatNumber(it.value, 1)}</div>
                  <div className={`num mt-0.5 text-[11px] font-bold ${up ? "text-up" : "text-down"}`}>
                    {up ? "▲" : "▼"} {up ? "+" : ""}
                    {it.pct.toFixed(2)}%
                  </div>
                </div>
              );
            })}
          </div>

          {/* ローソク足チャート */}
          <div className="col-span-full bg-navy-700 p-5">
            <div className="mb-3 flex items-baseline justify-between">
              <div>
                <div className="text-[11px] font-bold text-white/50">{ja ? "日経平均株価" : "Nikkei 225"}</div>
                <div className="num text-[24px] font-extrabold leading-tight text-white">39,250.50</div>
              </div>
              <div className="flex gap-1">
                {["1D", "1W", "1M", "1Y"].map((p, i) => (
                  <span
                    key={p}
                    className={`rounded-md px-2 py-1 text-[10px] font-bold ${i === 2 ? "bg-gold text-navy" : "text-white/40"}`}
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>

            <svg viewBox={`0 0 ${W} ${H}`} className="h-[150px] w-full sm:h-[190px]" role="img" aria-label={ja ? "日経平均のサンプルチャート" : "Sample Nikkei chart"}>
              <defs>
                <linearGradient id="heroArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1E88E5" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#1E88E5" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* グリッド */}
              {[0.25, 0.5, 0.75].map((g) => (
                <line key={g} x1="0" x2={W} y1={H * g} y2={H * g} stroke="rgba(255,255,255,.07)" strokeWidth="1" />
              ))}
              {/* ローソク */}
              {candles.map((c, i) => {
                const x = i * step + step / 2;
                const up = c.close >= c.open;
                const color = up ? "#E74C3C" : "#00B67A";
                const top = y(Math.max(c.open, c.close));
                const bottom = y(Math.min(c.open, c.close));
                return (
                  <g key={i} className="animate-grow-bar" style={{ transformOrigin: `${x}px ${H}px`, animationDelay: `${i * 26}ms` }}>
                    <line x1={x} x2={x} y1={y(c.high)} y2={y(c.low)} stroke={color} strokeWidth="1.1" opacity="0.75" />
                    <rect
                      x={x - step * 0.28}
                      y={top}
                      width={step * 0.56}
                      height={Math.max(1.5, bottom - top)}
                      fill={color}
                      opacity="0.92"
                      rx="1"
                    />
                  </g>
                );
              })}
              {/* 終値ライン */}
              <path
                d={`${linePath} L${W},${H} L0,${H} Z`}
                fill="url(#heroArea)"
                opacity="0.85"
              />
              <path
                d={linePath}
                fill="none"
                stroke="#4BA3EC"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeDasharray="1200"
                className="animate-draw-line"
              />
            </svg>
          </div>

          {/* 業種ヒートマップ（ミニ） */}
          <div className="bg-navy-700 p-5">
            <div className="mb-3 text-[11px] font-bold text-white/50">{ja ? "業種別ヒートマップ" : "Sector heatmap"}</div>
            <div className="grid grid-cols-3 gap-1.5">
              {heatmap.slice(0, 9).map((c) => {
                const up = c.avgChangePct >= 0;
                const mag = Math.min(1, Math.abs(c.avgChangePct) / 2);
                const bg = up ? `rgba(231,76,60,${0.16 + mag * 0.55})` : `rgba(0,182,122,${0.16 + mag * 0.55})`;
                return (
                  <div key={c.code} className="rounded-md px-2 py-2.5" style={{ background: bg }}>
                    <div className="truncate text-[9px] font-bold text-white/85">{pick(locale, c.nameJa, c.nameEn)}</div>
                    <div className="num text-[11px] font-extrabold text-white">
                      {up ? "+" : ""}
                      {c.avgChangePct.toFixed(2)}%
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ランキング + 出来高 */}
          <div className="bg-navy-700 p-5">
            <div className="mb-3 text-[11px] font-bold text-white/50">{ja ? "値上がり率ランキング" : "Top gainers"}</div>
            <ul className="space-y-2.5">
              {ranking.slice(0, 4).map((s, i) => (
                <li key={s.company.code} className="flex items-center gap-2.5">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded bg-white/10 text-[10px] font-extrabold text-gold">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[12px] font-semibold text-white/85">
                    {pick(locale, s.company.nameJa, s.company.nameEn)}
                  </span>
                  <span className="num text-[11.5px] font-extrabold text-up">
                    ▲ +{(s.changePct ?? 0).toFixed(2)}%
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-4 rule-top border-white/10">
              <div className="flex items-end justify-between">
                <span className="text-[10px] font-semibold text-white/45">{ja ? "東証プライム 売買代金" : "Prime turnover"}</span>
                <span className="num text-[13px] font-extrabold text-white">4.12{ja ? "兆円" : "T"}</span>
              </div>
              <div className="mt-2 flex h-8 items-end gap-1">
                {[38, 52, 44, 66, 58, 74, 62, 88, 70, 96, 82, 100].map((v, i) => (
                  <span
                    key={i}
                    className="animate-grow-bar flex-1 rounded-sm bg-gradient-to-t from-primary/25 to-primary"
                    style={{ height: `${v}%`, transformOrigin: "bottom", animationDelay: `${i * 55}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 浮遊スコアカード */}
      <div className="absolute -bottom-6 -left-4 hidden animate-float-y rounded-2xl border border-white/12 bg-navy-600/95 px-5 py-4 shadow-lift backdrop-blur-md lg:block">
        <div className="text-[10px] font-bold uppercase tracking-widest text-gold">{ja ? "定量スコア" : "Quant score"}</div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="num text-[28px] font-extrabold leading-none text-white">86</span>
          <span className="text-[11px] font-bold text-white/50">/ 100</span>
        </div>
        <div className="mt-2 h-1.5 w-32 overflow-hidden rounded-full bg-white/12">
          <span className="block h-full w-[86%] rounded-full bg-gradient-to-r from-gold to-gold-400" />
        </div>
      </div>
    </div>
  );
}
