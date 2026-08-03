import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LineChart, Sparkles } from "lucide-react";
import type { Locale } from "@/types";
import { getDictionary, isLocale, pick } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbLd, itemListLd } from "@/lib/jsonld";
import { localizedUrl } from "@/lib/seo";
import { getSpotlightStocks } from "@/lib/queries";
import { formatRatio, formatYen } from "@/lib/format";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PriceChange } from "@/components/PriceChange";
import { Sparkline } from "@/components/Sparkline";
import { RiskDisclosure } from "@/components/RiskDisclosure";
import { DataSourceBadge } from "@/components/badges";
import { JsonLd } from "@/components/JsonLd";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const loc: Locale = isLocale(locale) ? locale : "ja";
  return buildMetadata({
    locale: loc,
    path: "spotlight",
    title: loc === "ja" ? "チャート注目銘柄（テクニカル・スクリーン）" : "Chart Spotlight (Technical Screen)",
    description: loc === "ja" ? "52週レンジ内の位置・高値への近さ・前日比から算出した客観スコアで、チャート的に注目される日本株をピックアップ（サンプルデータ・売買推奨ではありません）。" : "Japanese stocks in technical focus by an objective score (52-week range position, proximity to highs, daily momentum). Sample data; not a recommendation.",
  });
}

export default async function SpotlightPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const loc = locale as Locale;
  const t = getDictionary(loc);
  const ja = loc === "ja";
  const picks = getSpotlightStocks(8);

  return (
    <div className="space-y-6">
      <JsonLd data={[
        breadcrumbLd([{ name: t.brand, path: "" }, { name: ja ? "チャート注目銘柄" : "Chart Spotlight", path: "spotlight" }], loc),
        itemListLd(ja ? "チャート注目銘柄" : "Chart Spotlight", picks.map((p) => ({ name: pick(loc, p.summary.company.nameJa, p.summary.company.nameEn), url: localizedUrl(loc, `stocks/${p.summary.company.code}`) }))),
      ]} />
      <Breadcrumbs items={[{ name: t.brand, path: "" }, { name: ja ? "チャート注目銘柄" : "Chart Spotlight", path: "spotlight" }]} locale={loc} />

      {/* ヒーロー */}
      <section className="grid-bg -mx-4 rounded-b-3xl bg-gradient-to-br from-navy-900 via-navy to-navy-700 px-4 py-10 text-white">
        <div className="mx-auto max-w-3xl">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-medium"><Sparkles size={13} /> {ja ? "テクニカル・スクリーン" : "Technical screen"}</span>
          <h1 className="mt-3 text-2xl font-bold sm:text-3xl">{ja ? "チャート注目銘柄" : "Chart Spotlight"}</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/80">
            {ja
              ? "52週レンジ内の位置・高値への近さ・前日比の勢いから算出した客観スコアで、チャート的に注目度の高い銘柄を機械的に抽出しています。"
              : "An objective score from 52-week range position, proximity to highs and daily momentum surfaces stocks in technical focus."}
          </p>
          <p className="mt-3 rounded-lg bg-amber-400/15 px-3 py-2 text-[12px] text-amber-100">
            {ja ? "⚠ これは客観データによる自動スクリーンであり、売買を推奨するものではありません。株価・チャートはすべてサンプル（架空）データです。" : "⚠ This is an automated objective screen, not a buy/sell recommendation. All prices and charts are sample data."}
          </p>
        </div>
      </section>

      {/* 算出基準の開示 */}
      <section className="rounded-2xl border border-line bg-card p-4 text-sm">
        <h2 className="flex items-center gap-2 font-semibold text-ink"><LineChart size={16} /> {ja ? "スコアの算出基準" : "How the score is computed"}</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
          <li>{ja ? "52週レンジ内の位置（高値圏ほど高い）… 50%" : "Position within the 52-week range (higher near highs) — 50%"}</li>
          <li>{ja ? "52週高値への近さ（高値に近いほど高い）… 30%" : "Proximity to the 52-week high — 30%"}</li>
          <li>{ja ? "前日比の勢い… 20%" : "Daily momentum vs. previous close — 20%"}</li>
          <li>{ja ? "算出は決定的（同じ入力で同じ結果）。閲覧数や人気度は含みません。" : "Deterministic; excludes views and popularity."}</li>
        </ul>
      </section>

      {/* 銘柄カード */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {picks.map((p, i) => {
          const s = p.summary;
          const first = p.series[0]!;
          const lastV = p.series[p.series.length - 1]!;
          const seriesPct = ((lastV - first) / first) * 100;
          const name = pick(loc, s.company.nameJa, s.company.nameEn);
          return (
            <Link key={s.company.code} href={`/${loc}/stocks/${s.company.code}`} className="flex flex-col gap-2 rounded-2xl border border-line bg-card p-4 transition hover:border-brand hover:shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-brand/10 text-[11px] font-bold text-brand">{i + 1}</span>
                    <span className="truncate font-semibold text-ink">{name}</span>
                  </div>
                  <div className="tabular text-xs text-muted">{s.company.code} ・ {t.segments[s.company.segment] ?? s.company.segment}</div>
                </div>
                <span className="shrink-0 rounded-md bg-navy px-2 py-0.5 text-[11px] font-bold text-white" title={ja ? "注目度スコア" : "Score"}>{p.score.toFixed(0)}</span>
              </div>
              <Sparkline data={p.series} width={220} height={48} ariaLabel={`${name} ${ja ? "サンプル値動き" : "sample trend"} ${seriesPct >= 0 ? "+" : ""}${seriesPct.toFixed(1)}%`} />
              <div className="flex items-end justify-between">
                <div className="tabular text-lg font-bold text-ink">{formatYen(s.quote.price, loc)}</div>
                <PriceChange change={s.change} changePct={s.changePct} size="sm" />
              </div>
              <dl className="grid grid-cols-2 gap-1 text-[11px] text-muted">
                <div><dt>{ja ? "52週高値からの乖離" : "From 52w high"}</dt><dd className="tabular font-medium text-ink">{formatRatio(((s.quote.price - s.quote.week52High) / s.quote.week52High) * 100)}</dd></div>
                <div><dt>{t.common.yield}</dt><dd className="tabular font-medium text-ink">{formatRatio(s.valuation?.dividendYield)}</dd></div>
              </dl>
              <div className="mt-1"><DataSourceBadge provenance={s.quote.provenance} locale={loc} /></div>
            </Link>
          );
        })}
      </section>

      <RiskDisclosure locale={loc} />
    </div>
  );
}
