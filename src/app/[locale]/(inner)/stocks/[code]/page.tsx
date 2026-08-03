import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ForecastType, Locale } from "@/types";
import { getDictionary, isLocale, pick } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbLd, companyLd } from "@/lib/jsonld";
import { getStockDetail, getVideosForCode, listAllCodes, listStockSummaries } from "@/lib/queries";
import { VideoCard } from "@/components/video/VideoCard";
import { getProviders } from "@/lib/providers";
import { formatDate, formatNumber, formatRatio, formatYen, formatYenCompact } from "@/lib/format";
import { PriceChange } from "@/components/PriceChange";
import { MetricCard } from "@/components/MetricCard";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { RiskDisclosure } from "@/components/RiskDisclosure";
import { DataDelayBadge, DataSourceBadge, DataUpdatedAt } from "@/components/badges";
import { StockCard } from "@/components/StockCard";
import { JsonLd } from "@/components/JsonLd";

export function generateStaticParams() {
  return listAllCodes().map((code) => ({ code }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; code: string }> }): Promise<Metadata> {
  const { locale, code } = await params;
  const loc: Locale = isLocale(locale) ? locale : "ja";
  const detail = getStockDetail(code);
  if (!detail) return buildMetadata({ locale: loc, path: `stocks/${code}`, title: code, description: "Not found", noindex: true });
  const c = detail.summary.company;
  const name = pick(loc, c.nameJa, c.nameEn);
  return buildMetadata({
    locale: loc,
    path: `stocks/${code}`,
    title: `${name}（${code}）${loc === "ja" ? "の株価・業績・配当・株主優待" : " stock, earnings, dividends & benefits"}`,
    description: pick(loc, c.descriptionJa, c.descriptionEn),
  });
}

const forecastLabel = (f: ForecastType, loc: Locale) =>
  f === "actual" ? (loc === "ja" ? "実績" : "Actual") : f === "company_forecast" ? (loc === "ja" ? "会社予想" : "Company f/c") : loc === "ja" ? "外部予想" : "Analyst f/c";

export default async function StockDetailPage({ params }: { params: Promise<{ locale: string; code: string }> }) {
  const { locale, code } = await params;
  if (!isLocale(locale)) notFound();
  const loc = locale as Locale;
  const t = getDictionary(loc);
  const detail = getStockDetail(code);
  if (!detail) notFound();

  const { summary: s, financials, disclosures } = detail;
  const c = s.company;
  const q = s.quote;
  const v = s.valuation;
  const d = s.dividend;
  const b = s.benefit;
  const name = pick(loc, c.nameJa, c.nameEn);
  const seg = t.segments[c.segment] ?? c.segment;
  const peers = listStockSummaries().filter((p) => p.company.industryCode === c.industryCode && p.company.code !== c.code).slice(0, 3);
  const videos = getVideosForCode(code, 3);
  const industry = getProviders().company.listIndustries().find((i) => i.code === c.industryCode);
  const industryName = industry ? pick(loc, industry.nameJa, industry.nameEn) : c.industryCode;

  return (
    <div className="space-y-8">
      <JsonLd data={[companyLd(c, loc), breadcrumbLd([{ name: t.brand, path: "" }, { name: t.nav.stocks, path: "stocks" }, { name, path: `stocks/${code}` }], loc)]} />
      <Breadcrumbs items={[{ name: t.brand, path: "" }, { name: t.nav.stocks, path: "stocks" }, { name: `${name} (${code})`, path: `stocks/${code}` }]} locale={loc} />

      {/* ヘッダー */}
      <header className="rounded-2xl border border-line bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-muted">
              <span className="tabular rounded bg-line/50 px-1.5 py-0.5 font-medium text-ink">{code}</span>
              <span>{seg}</span>
              <DataSourceBadge provenance={q.provenance} locale={loc} />
              <DataDelayBadge provenance={q.provenance} locale={loc} />
            </div>
            <h1 className="mt-1 text-2xl font-bold text-ink">{name}</h1>
            <div className="text-sm text-muted">{pick(loc, c.nameEn, c.nameJa)}</div>
          </div>
          <div className="text-right">
            <div className="tabular text-3xl font-bold text-ink">{formatYen(q.price, loc)}</div>
            <PriceChange change={s.change} changePct={s.changePct} size="lg" />
          </div>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-ink/90">{pick(loc, c.descriptionJa, c.descriptionEn)}</p>
        <div className="mt-3 border-t border-line pt-2">
          <DataUpdatedAt provenance={q.provenance} locale={loc} />
          <p className="mt-1 text-[11px] text-muted">{t.common.realtimeNotGuaranteed}. {t.common.notInvestmentAdvice}.</p>
        </div>
      </header>

      {/* 主要指標 */}
      <section>
        <SectionTitle>{loc === "ja" ? "主要指標" : "Key metrics"}</SectionTitle>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <MetricCard label={t.common.marketCap} value={formatYenCompact(q.marketCap, loc)} />
          <MetricCard label={t.common.per} value={v?.per ? `${formatNumber(v.per, 1)}倍` : "—"} note={loc === "ja" ? "実績" : "actual"} />
          <MetricCard label={t.common.pbr} value={v?.pbr ? `${formatNumber(v.pbr, 2)}倍` : "—"} />
          <MetricCard label={t.common.yield} value={formatRatio(v?.dividendYield)} note={loc === "ja" ? "予想" : "f/c"} />
          <MetricCard label={t.common.roe} value={formatRatio(financials[0]?.roe)} />
          <MetricCard label={t.common.minInvestment} value={formatYenCompact(s.minInvestment, loc)} note={`${formatNumber(q.tradingUnit)}${loc === "ja" ? "株" : "sh"}`} />
        </div>
        {v && <p className="mt-2 text-[11px] text-muted">{loc === "ja" ? "算出基準" : "Basis"}: {v.basis}</p>}
      </section>

      {/* 株価詳細 */}
      <section>
        <SectionTitle>{loc === "ja" ? "株価情報" : "Price data"}</SectionTitle>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 rounded-2xl border border-line bg-card p-4 text-sm sm:grid-cols-4">
          <Row k={loc === "ja" ? "始値" : "Open"} val={formatYen(q.open, loc)} />
          <Row k={loc === "ja" ? "高値" : "High"} val={formatYen(q.high, loc)} />
          <Row k={loc === "ja" ? "安値" : "Low"} val={formatYen(q.low, loc)} />
          <Row k={loc === "ja" ? "前日終値" : "Prev close"} val={formatYen(q.previousClose, loc)} />
          <Row k={t.common.volume} val={`${formatNumber(q.volume)}`} />
          <Row k={loc === "ja" ? "売買代金" : "Value"} val={formatYenCompact(q.tradingValue, loc)} />
          <Row k={loc === "ja" ? "52週高値" : "52w high"} val={formatYen(q.week52High, loc)} />
          <Row k={loc === "ja" ? "52週安値" : "52w low"} val={formatYen(q.week52Low, loc)} />
        </dl>
      </section>

      {/* 業績推移 */}
      <section>
        <SectionTitle>{loc === "ja" ? "業績推移（連結）" : "Financials (consolidated)"}</SectionTitle>
        <div className="overflow-x-auto rounded-2xl border border-line bg-card">
          <table className="w-full min-w-[520px] text-right text-sm">
            <caption className="sr-only">{name} {loc === "ja" ? "業績推移" : "financial history"}</caption>
            <thead>
              <tr className="border-b border-line text-xs text-muted">
                <th scope="col" className="p-3 text-left">{loc === "ja" ? "決算期" : "FY"}</th>
                <th scope="col" className="p-3">{loc === "ja" ? "売上高" : "Revenue"}</th>
                <th scope="col" className="p-3">{loc === "ja" ? "営業利益" : "Op. income"}</th>
                <th scope="col" className="p-3">{loc === "ja" ? "純利益" : "Net income"}</th>
                <th scope="col" className="p-3">EPS</th>
                <th scope="col" className="p-3">ROE</th>
              </tr>
            </thead>
            <tbody className="tabular">
              {financials.map((f) => (
                <tr key={f.fiscalYear} className="border-b border-line/60 last:border-0">
                  <th scope="row" className="p-3 text-left font-medium text-ink">
                    {f.fiscalYear}
                    <span className="ml-1 rounded bg-line/50 px-1 text-[10px] text-muted">{forecastLabel(f.forecastType, loc)}</span>
                  </th>
                  <td className="p-3 text-ink">{formatYenCompact(f.revenue, loc)}</td>
                  <td className="p-3 text-ink">{formatYenCompact(f.operatingIncome, loc)}</td>
                  <td className="p-3 text-ink">{formatYenCompact(f.netIncome, loc)}</td>
                  <td className="p-3 text-ink">{formatNumber(f.eps, 1)}</td>
                  <td className="p-3 text-ink">{formatRatio(f.roe)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[11px] text-muted">{loc === "ja" ? "実績と会社予想を区別して表示。すべてサンプルデータ。" : "Actual vs company forecast distinguished. All sample data."}</p>
      </section>

      {/* 配当・優待 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <SectionTitle>{loc === "ja" ? "配当" : "Dividends"}</SectionTitle>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 rounded-2xl border border-line bg-card p-4 text-sm">
            <Row k={loc === "ja" ? "年間配当（予想）" : "Annual (f/c)"} val={d ? formatYen(d.annualDividend, loc) : "—"} />
            <Row k={t.common.yield} val={formatRatio(d?.yieldPct)} />
            <Row k={loc === "ja" ? "配当性向" : "Payout"} val={formatRatio(d?.payoutRatioPct)} />
            <Row k={loc === "ja" ? "連続増配" : "Consec. increase"} val={d?.consecutiveIncreaseYears ? `${d.consecutiveIncreaseYears}${loc === "ja" ? "年" : "y"}` : "—"} />
            <Row k={loc === "ja" ? "権利落ち日" : "Ex-date"} val={formatDate(d?.exRightsDate, loc)} />
            <Row k={loc === "ja" ? "権利確定日" : "Record date"} val={formatDate(d?.recordDate, loc)} />
          </dl>
          {d?.policy && <p className="mt-2 text-[11px] text-muted">{loc === "ja" ? "方針" : "Policy"}: {d.policy}</p>}
        </section>

        <section>
          <SectionTitle>{loc === "ja" ? "株主優待" : "Shareholder benefits"}</SectionTitle>
          {b ? (
            <div className="rounded-2xl border border-line bg-card p-4 text-sm">
              <div className="font-medium text-ink">{pick(loc, b.contentJa, b.contentEn)}</div>
              <dl className="mt-2 grid grid-cols-2 gap-x-6 gap-y-2">
                <Row k={loc === "ja" ? "必要株数" : "Shares"} val={`${formatNumber(b.requiredShares)}`} />
                <Row k={loc === "ja" ? "権利確定月" : "Record month"} val={b.recordMonths.map((mo) => `${mo}${loc === "ja" ? "月" : ""}`).join(", ")} />
                {b.longTermCondition && <Row k={loc === "ja" ? "長期保有" : "Long-term"} val={b.longTermCondition} />}
                {b.shippingTiming && <Row k={loc === "ja" ? "発送時期" : "Shipping"} val={b.shippingTiming} />}
              </dl>
              <p className="mt-2 text-[11px] text-muted">{loc === "ja" ? "優待内容は変更・廃止の可能性があります。公式情報をご確認ください。" : "Benefits may change or end. Check official info."}</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-line bg-card p-6 text-center text-sm text-muted">{loc === "ja" ? "株主優待の登録はありません（サンプル）" : "No benefit on record (sample)"}</div>
          )}
        </section>
      </div>

      {/* 適時開示 */}
      {disclosures.length > 0 && (
        <section>
          <SectionTitle>{loc === "ja" ? "適時開示・ニュース" : "Disclosures & news"}</SectionTitle>
          <ul className="divide-y divide-line rounded-2xl border border-line bg-card">
            {disclosures.map((dc, i) => (
              <li key={i} className="flex items-center gap-3 p-3 text-sm">
                <span className="tabular text-xs text-muted">{formatDate(dc.publishedAt, loc)}</span>
                <span className="text-ink">{pick(loc, dc.titleJa, dc.titleEn)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 関連動画 */}
      {videos.length > 0 && (
        <section>
          <SectionTitle>{loc === "ja" ? "関連動画" : "Related videos"}</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-3">
            {videos.map((v) => (
              <VideoCard key={v.id} video={v} locale={loc} compact />
            ))}
          </div>
          <p className="mt-2 text-[11px] text-muted">
            {loc === "ja" ? "動画はサンプル（モック）データです。" : "Videos are mock sample data."}
          </p>
        </section>
      )}

      {/* 同業他社 */}
      {peers.length > 0 && (
        <section>
          <SectionTitle>{loc === "ja" ? "同業他社" : "Peers"}</SectionTitle>
          <div className="grid gap-3 sm:grid-cols-3">
            {peers.map((p) => <StockCard key={p.company.code} s={p} locale={loc} />)}
          </div>
        </section>
      )}

      {/* 企業情報 */}
      <section>
        <SectionTitle>{loc === "ja" ? "企業情報" : "Company profile"}</SectionTitle>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 rounded-2xl border border-line bg-card p-4 text-sm sm:grid-cols-3">
          <Row k={t.common.industry} val={industryName} href={`/${loc}/industries/${c.industryCode}`} />
          <Row k={loc === "ja" ? "本社" : "HQ"} val={c.hqPrefecture} />
          <Row k={loc === "ja" ? "設立" : "Founded"} val={formatDate(c.foundedOn, loc)} />
          <Row k={loc === "ja" ? "上場" : "Listed"} val={formatDate(c.listedOn, loc)} />
          <Row k={loc === "ja" ? "決算月" : "FY-end"} val={`${c.fiscalYearEndMonth}${loc === "ja" ? "月" : ""}`} />
          <Row k={loc === "ja" ? "従業員" : "Employees"} val={c.employees ? formatNumber(c.employees) : "—"} />
        </dl>
        {c.website && (
          <p className="mt-2 text-xs">
            <Link href={c.website} className="text-brand hover:underline" target="_blank" rel="noopener noreferrer nofollow">{loc === "ja" ? "公式サイト" : "Official site"} ↗</Link>
          </p>
        )}
      </section>

      <RiskDisclosure locale={loc} />
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-3 text-lg font-bold text-ink">{children}</h2>;
}

function Row({ k, val, href }: { k: string; val: string; href?: string }) {
  return (
    <div className="flex justify-between gap-2 border-b border-line/40 py-1 last:border-0">
      <dt className="text-muted">{k}</dt>
      <dd className="tabular text-right font-medium text-ink">
        {href ? <Link href={href} className="text-brand hover:underline">{val}</Link> : val}
      </dd>
    </div>
  );
}
