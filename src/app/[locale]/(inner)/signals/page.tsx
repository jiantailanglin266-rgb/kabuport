import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Activity, AlertTriangle, Calculator, Info } from "lucide-react";
import type { Locale } from "@/types";
import { getDictionary, isLocale, pick } from "@/lib/i18n";
import { buildMetadata, localizedUrl } from "@/lib/seo";
import { breadcrumbLd, faqLd, itemListLd } from "@/lib/jsonld";
import { getRsiEntries, type RsiEntry } from "@/lib/queries";
import { RSI_LOWER, RSI_PERIOD, RSI_UPPER, rsiStateLabel } from "@/lib/rsi";
import { formatDateTimeJst, formatRatio, formatYen } from "@/lib/format";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { Reveal } from "@/components/ui/Reveal";
import { Sparkline } from "@/components/Sparkline";
import { PriceChange } from "@/components/PriceChange";
import { RsiGauge, SignalBadge, SIGNAL_META } from "@/components/signals/RsiGauge";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const loc: Locale = isLocale(locale) ? locale : "ja";
  const ja = loc === "ja";
  return buildMetadata({
    locale: loc,
    path: "signals",
    title: ja ? `RSIシグナル銘柄抽出（日足RSI${RSI_PERIOD}）` : `RSI signal screen (daily RSI-${RSI_PERIOD})`,
    description: ja
      ? `日足RSI(${RSI_PERIOD})が${RSI_UPPER}を超えた銘柄／${RSI_LOWER}を下回った銘柄を、ルールベースで自動抽出。算出式を全公開しています（サンプルデータ）。`
      : `Rule-based screen for stocks whose daily RSI(${RSI_PERIOD}) exceeds ${RSI_UPPER} or falls below ${RSI_LOWER}. Formula fully disclosed (sample data).`,
  });
}

function SignalCard({ entry, locale }: { entry: RsiEntry; locale: Locale }) {
  const loc = locale;
  const ja = loc === "ja";
  const s = entry.summary;
  const name = pick(loc, s.company.nameJa, s.company.nameEn);
  const state = rsiStateLabel(entry.rsi);

  return (
    <Link href={`/${loc}/stocks/${s.company.code}`} className="card card-hover flex h-full flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-[15.5px] font-extrabold tracking-tight text-ink">{name}</h3>
          <div className="num mt-0.5 text-[11.5px] text-muted">
            {s.company.code} ・ {pick(loc, state.ja, state.en)}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="num text-[26px] font-extrabold leading-none text-ink">{entry.rsi?.toFixed(1) ?? "—"}</div>
          <div className="text-[9px] font-bold uppercase tracking-widest text-muted">RSI</div>
        </div>
      </div>

      <div className="mt-4">
        <RsiGauge value={entry.rsi} locale={loc} showScale={false} />
      </div>

      <div className="mt-4">
        <Sparkline
          data={entry.closes.slice(-45)}
          width={320}
          height={46}
          ariaLabel={`${name} ${ja ? "サンプル日足推移" : "sample daily trend"}`}
        />
      </div>

      <div className="mt-4 flex items-end justify-between rule-top">
        <span className="num text-[17px] font-extrabold text-ink">{formatYen(s.quote.price, loc)}</span>
        <PriceChange change={s.change} changePct={s.changePct} size="sm" />
      </div>
    </Link>
  );
}

export default async function SignalsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const loc = locale as Locale;
  const t = getDictionary(loc);
  const ja = loc === "ja";

  const entries = getRsiEntries();
  const sells = entries.filter((e) => e.signal === "sell");
  const buys = entries.filter((e) => e.signal === "buy");
  const neutrals = entries.filter((e) => e.signal === "neutral");
  const asOf = entries[0]?.summary.quote.provenance;

  const faqs = [
    {
      q: ja ? "RSIとは何ですか？" : "What is RSI?",
      a: ja
        ? `RSI（相対力指数）は、一定期間の値上がり幅と値下がり幅の比率から算出する0〜100のテクニカル指標です。本ページでは日足・${RSI_PERIOD}日間のWilder方式で算出しています。`
        : `RSI measures the ratio of average gains to average losses over a period, on a 0–100 scale. This page uses Wilder's ${RSI_PERIOD}-day method on daily closes.`,
    },
    {
      q: ja ? "シグナルは売買の推奨ですか？" : "Are the signals recommendations?",
      a: ja
        ? "いいえ。公開されたしきい値（75超／25未満）に機械的に一致した銘柄を抽出しているだけであり、売買の推奨・投資助言ではありません。RSIは将来の値動きを予測するものではなく、逆張り指標として機能しない相場局面（強いトレンド継続時など）もあります。"
        : "No. These are stocks that mechanically match a disclosed threshold (>75 / <25). They are not recommendations or investment advice, and RSI does not predict future prices.",
    },
    {
      q: ja ? "しきい値は変更できますか？" : "Can the thresholds change?",
      a: ja
        ? `本ページは上限${RSI_UPPER}・下限${RSI_LOWER}で固定して抽出しています。一般には70/30が使われることも多く、しきい値の選び方で結果は大きく変わります。`
        : `This page uses ${RSI_UPPER}/${RSI_LOWER}. 70/30 is also common, and results change substantially with the thresholds.`,
    },
  ];

  return (
    <div className="space-y-10">
      <JsonLd
        data={[
          breadcrumbLd([{ name: t.brand, path: "" }, { name: ja ? "RSIシグナル" : "RSI signals", path: "signals" }], loc),
          faqLd(faqs),
          itemListLd(
            ja ? "RSIシグナル抽出銘柄" : "RSI signal matches",
            [...sells, ...buys].map((e) => ({
              name: pick(loc, e.summary.company.nameJa, e.summary.company.nameEn),
              url: localizedUrl(loc, `stocks/${e.summary.company.code}`),
            })),
          ),
        ]}
      />
      <Breadcrumbs items={[{ name: t.brand, path: "" }, { name: ja ? "RSIシグナル" : "RSI signals", path: "signals" }]} locale={loc} />

      {/* ヘッダー */}
      <section className="bg-hero relative overflow-hidden rounded-3xl px-6 py-10 text-white sm:px-10">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-50" aria-hidden />
        <div className="relative max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-widest text-gold">
            <Activity size={13} /> {ja ? "テクニカル自動抽出" : "Technical screen"}
          </span>
          <h1 className="mt-4 text-[28px] font-extrabold leading-snug tracking-tight sm:text-[36px]">
            {ja ? `日足RSIシグナル銘柄` : "Daily RSI signal screen"}
          </h1>
          <p className="mt-3 text-[14px] leading-relaxed text-white/70">
            {ja
              ? `日足RSI(${RSI_PERIOD})が ${RSI_UPPER} を超えた銘柄を「売りシグナル」、${RSI_LOWER} を下回った銘柄を「買いシグナル」として、ルールに機械的に一致する銘柄を自動抽出しています。`
              : `Stocks whose daily RSI(${RSI_PERIOD}) exceeds ${RSI_UPPER} are flagged as a sell signal, and those below ${RSI_LOWER} as a buy signal — a purely mechanical rule match.`}
          </p>

          {/* サマリー */}
          <dl className="mt-7 grid max-w-lg grid-cols-3 gap-4">
            {[
              { k: "sell" as const, n: sells.length },
              { k: "buy" as const, n: buys.length },
              { k: "neutral" as const, n: neutrals.length },
            ].map(({ k, n }) => (
              <div key={k} className="rounded-2xl border border-white/12 bg-white/5 px-4 py-3.5">
                <dt className="text-[10.5px] font-bold text-white/55">{pick(loc, SIGNAL_META[k].ja, SIGNAL_META[k].en)}</dt>
                <dd className="num mt-1 text-[26px] font-extrabold leading-none text-white">
                  {n}
                  <span className="ml-1 text-[11px] font-bold text-white/45">{ja ? "銘柄" : ""}</span>
                </dd>
              </div>
            ))}
          </dl>

          <p className="mt-6 rounded-xl bg-amber-400/15 px-3.5 py-2.5 text-[11.5px] leading-relaxed text-amber-100">
            <AlertTriangle size={12} className="mr-1 inline-block align-middle" aria-hidden />
            {ja
              ? "⚠ これは公開ルールに機械的に一致した銘柄の抽出結果であり、売買の推奨・投資助言ではありません。RSIは将来の値動きを予測しません。株価・日足はすべてサンプル（架空）データです。"
              : "⚠ A mechanical rule match, not a recommendation or investment advice. RSI does not predict future prices. All prices and daily series are sample data."}
          </p>
        </div>
      </section>

      {/* 算出方法の開示 */}
      <section className="card card-pad">
        <h2 className="flex items-center gap-2 text-[16px] font-extrabold text-ink">
          <Calculator size={17} className="text-gold-600" aria-hidden />
          {ja ? "算出方法（全公開）" : "Methodology (fully disclosed)"}
        </h2>
        <div className="mt-4 grid gap-6 md:grid-cols-2">
          <ol className="space-y-2.5 text-[13px] leading-relaxed text-muted">
            <li>
              <b className="text-ink">1.</b>{" "}
              {ja
                ? `日足終値の前日比を、値上がり幅と値下がり幅に分解します。`
                : "Split day-over-day changes in closing prices into gains and losses."}
            </li>
            <li>
              <b className="text-ink">2.</b>{" "}
              {ja
                ? `直近${RSI_PERIOD}日の平均値上がり幅・平均値下がり幅を Wilder方式で平滑化します。`
                : `Smooth the ${RSI_PERIOD}-day average gain and average loss using Wilder's method.`}
            </li>
            <li>
              <b className="text-ink">3.</b> RSI = 100 − 100 ÷ (1 + {ja ? "平均値上がり幅" : "avg gain"} ÷ {ja ? "平均値下がり幅" : "avg loss"})
            </li>
            <li>
              <b className="text-ink">4.</b>{" "}
              {ja
                ? `RSI > ${RSI_UPPER} → 売りシグナル、RSI < ${RSI_LOWER} → 買いシグナル（境界値ちょうどは中立）。`
                : `RSI > ${RSI_UPPER} → sell signal; RSI < ${RSI_LOWER} → buy signal (exact boundary is neutral).`}
            </li>
          </ol>
          <div className="rounded-2xl border border-line bg-bg p-4 text-[12px] leading-relaxed text-muted">
            <b className="text-ink">{ja ? "データについて" : "About the data"}</b>
            <p className="mt-2">
              {ja
                ? "本デモの日足終値は、各銘柄の52週レンジ内の位置（中期の傾き）と直近の前日比（短期の勢い）から決定的に生成したサンプル系列です。実際の値動きではありません。実データ接続後は、取得した日足終値でそのまま同じ計算式が適用されます。"
                : "Daily closes here are a deterministic sample series derived from each stock's 52-week range position and recent daily change — not actual price history. Once live data is connected, the same formula runs on real closes."}
            </p>
            <p className="num mt-3 text-[11px]">
              {ja ? "データ基準" : "As of"}: {formatDateTimeJst(asOf?.fetchedAt, loc)} ・ {ja ? "出典" : "Source"}: {asOf?.source}
            </p>
          </div>
        </div>
      </section>

      {/* 売りシグナル */}
      <section>
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <h2 className="section-title">{ja ? `売りシグナル（RSI > ${RSI_UPPER}）` : `Sell signals (RSI > ${RSI_UPPER})`}</h2>
          <SignalBadge signal="sell" locale={loc} size="sm" />
          <span className="num text-[13px] font-bold text-muted">{sells.length}{ja ? "銘柄" : ""}</span>
        </div>
        {sells.length === 0 ? (
          <div className="card p-10 text-center text-muted">{ja ? "条件に一致する銘柄はありません" : "No matches"}</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {sells.map((e, i) => (
              <Reveal key={e.summary.company.code} delay={i * 60}>
                <SignalCard entry={e} locale={loc} />
              </Reveal>
            ))}
          </div>
        )}
      </section>

      {/* 買いシグナル */}
      <section>
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <h2 className="section-title">{ja ? `買いシグナル（RSI < ${RSI_LOWER}）` : `Buy signals (RSI < ${RSI_LOWER})`}</h2>
          <SignalBadge signal="buy" locale={loc} size="sm" />
          <span className="num text-[13px] font-bold text-muted">{buys.length}{ja ? "銘柄" : ""}</span>
        </div>
        {buys.length === 0 ? (
          <div className="card p-10 text-center text-muted">{ja ? "条件に一致する銘柄はありません" : "No matches"}</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {buys.map((e, i) => (
              <Reveal key={e.summary.company.code} delay={i * 60}>
                <SignalCard entry={e} locale={loc} />
              </Reveal>
            ))}
          </div>
        )}
      </section>

      {/* 全銘柄一覧 */}
      <section>
        <h2 className="section-title mb-5">{ja ? "掲載銘柄のRSI一覧" : "RSI across all listed stocks"}</h2>
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <caption className="sr-only">{ja ? "銘柄別RSI一覧" : "RSI by stock"}</caption>
              <thead>
                <tr className="border-b border-line text-[11px] uppercase tracking-wide text-muted">
                  <th scope="col" className="py-3.5 pl-5 text-left font-bold">{ja ? "銘柄" : "Stock"}</th>
                  <th scope="col" className="py-3.5 text-right font-bold">{ja ? "株価" : "Price"}</th>
                  <th scope="col" className="py-3.5 text-right font-bold">{ja ? "前日比" : "Change"}</th>
                  <th scope="col" className="py-3.5 text-right font-bold">RSI</th>
                  <th scope="col" className="w-[190px] py-3.5 text-left font-bold">{ja ? "水準" : "Level"}</th>
                  <th scope="col" className="py-3.5 pr-5 text-right font-bold">{ja ? "判定" : "Signal"}</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => {
                  const s = e.summary;
                  const state = rsiStateLabel(e.rsi);
                  return (
                    <tr key={s.company.code} className="border-b border-line/60 transition-colors last:border-0 hover:bg-bg">
                      <td className="py-3.5 pl-5">
                        <Link href={`/${loc}/stocks/${s.company.code}`} className="text-[13.5px] font-bold text-ink hover:text-primary">
                          {pick(loc, s.company.nameJa, s.company.nameEn)}
                        </Link>
                        <div className="num mt-0.5 text-[11px] text-muted">
                          {s.company.code} ・ {t.segments[s.company.segment] ?? s.company.segment}
                        </div>
                      </td>
                      <td className="num py-3.5 text-right text-[13.5px] font-bold text-ink">{formatYen(s.quote.price, loc)}</td>
                      <td className="py-3.5 text-right">
                        <PriceChange change={s.change} changePct={s.changePct} size="sm" />
                      </td>
                      <td className="num py-3.5 text-right text-[15px] font-extrabold text-ink">{e.rsi?.toFixed(1) ?? "—"}</td>
                      <td className="py-3.5 pl-4 pr-6">
                        <RsiGauge value={e.rsi} locale={loc} showScale={false} />
                        <span className="mt-1 block text-[10.5px] text-muted">{pick(loc, state.ja, state.en)}</span>
                      </td>
                      <td className="py-3.5 pr-5 text-right">
                        <SignalBadge signal={e.signal} locale={loc} size="sm" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center gap-2 border-t border-line px-5 py-3.5">
            <Info size={13} className="shrink-0 text-muted" aria-hidden />
            <p className="text-[11.5px] text-muted">
              {ja
                ? `集計対象: 掲載サンプル銘柄 ${entries.length}件 / 指標: 日足RSI(${RSI_PERIOD}) Wilder方式 / 更新: デモ固定`
                : `Universe: ${entries.length} sample stocks / Metric: daily RSI(${RSI_PERIOD}), Wilder / Demo snapshot`}
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section>
        <h2 className="section-title mb-5">FAQ</h2>
        <div className="card overflow-hidden">
          {faqs.map((f, i) => (
            <details key={i} className="group border-b border-line last:border-0">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-[13.5px] font-bold text-ink marker:hidden hover:bg-bg">
                {f.q}
                <span className="shrink-0 text-muted transition-transform duration-300 group-open:rotate-45" aria-hidden>+</span>
              </summary>
              <p className="px-5 pb-5 text-[13px] leading-relaxed text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <p className="rounded-2xl border border-line bg-card p-5 text-[11.5px] leading-relaxed text-muted">
        {ja
          ? "本ページの抽出結果は、公開されたテクニカル指標のしきい値に機械的に一致した銘柄を表示するものであり、売買を推奨するものではありません。テクニカル指標は過去の値動きから計算されるもので、将来の株価を予測するものではありません。株式投資には元本損失の可能性があります。投資判断はご自身の責任で行ってください。"
          : "Results show stocks that mechanically match a disclosed technical threshold and are not a recommendation to buy or sell. Technical indicators are computed from past prices and do not predict future prices. Investing carries the risk of loss of principal."}
      </p>
    </div>
  );
}
