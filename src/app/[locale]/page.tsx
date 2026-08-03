import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CalendarClock, FileText, Gift, TrendingUp } from "lucide-react";
import type { Locale } from "@/types";
import { getDictionary, isLocale, pick } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo";
import { organizationLd, websiteLd, faqLd } from "@/lib/jsonld";
import {
  getBenefitStocks, getIndices, getRanking, getRecentDisclosures, getUpcomingEarnings,
} from "@/lib/queries";
import { getProviders } from "@/lib/providers";
import * as m from "@/lib/metrics";
import { formatDate, formatNumber, formatRatio } from "@/lib/format";
import { StockCard } from "@/components/StockCard";
import { PriceChange } from "@/components/PriceChange";
import { RiskDisclosure } from "@/components/RiskDisclosure";
import { JsonLd } from "@/components/JsonLd";
import faqsRaw from "@/data/faqs.json";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const loc: Locale = isLocale(locale) ? locale : "ja";
  const t = getDictionary(loc);
  return buildMetadata({ locale: loc, path: "", title: `${t.brand} — ${t.tagline}`, description: t.subtagline });
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const loc = locale as Locale;
  const t = getDictionary(loc);

  const indices = getIndices();
  const gainers = getRanking("gainers", 4);
  const losers = getRanking("losers", 4);
  const highYield = getRanking("yield", 4);
  const benefits = getBenefitStocks().slice(0, 4);
  const earnings = getUpcomingEarnings(6);
  const disclosures = getRecentDisclosures(6);
  const learnArticles = (await import("@/data/articles.json")).default;
  const companyName = (code: string) => {
    const c = getProviders().company.getCompany(code);
    return c ? pick(loc, c.nameJa, c.nameEn) : code;
  };
  const faqs = (faqsRaw as { qJa: string; aJa: string; qEn: string; aEn: string }[]).map((f) => ({
    q: pick(loc, f.qJa, f.qEn),
    a: pick(loc, f.aJa, f.aEn),
  }));

  return (
    <div className="space-y-12">
      <JsonLd data={[organizationLd(), websiteLd(loc), faqLd(faqs)]} />

      {/* Hero */}
      <section className="grid-bg -mx-4 rounded-b-3xl bg-gradient-to-br from-navy-900 via-navy to-navy-700 px-4 py-14 text-white">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-medium">
            <TrendingUp size={13} /> Japan Equity Intelligence
          </span>
          <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">{t.tagline}</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-white/80 sm:text-base">{t.subtagline}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href={`/${loc}/stocks`} className="inline-flex items-center gap-1 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-navy hover:bg-white/90">
              {t.cta.findStocks} <ArrowRight size={15} />
            </Link>
            <Link href={`/${loc}/rankings#yield`} className="rounded-full border border-white/40 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10">
              {t.cta.highYield}
            </Link>
            <Link href={`/${loc}/earnings`} className="rounded-full border border-white/40 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10">
              {t.cta.earnings}
            </Link>
          </div>
          <p className="mt-4 text-[11px] text-white/60">{t.common.sampleData} ・ {t.home.disclaimerShort}</p>
        </div>
      </section>

      {/* 主要指数 */}
      <Section title={t.home.indices} badge={<SampleTag t={t} />}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {indices.map((idx) => {
            const change = idx.value - idx.previousClose;
            const pct = m.priceChangePercent(idx.value, idx.previousClose);
            return (
              <div key={idx.id} className="rounded-2xl border border-line bg-card p-3">
                <div className="truncate text-xs text-muted">{pick(loc, idx.nameJa, idx.nameEn)}</div>
                <div className="tabular mt-1 text-base font-bold text-ink">{formatNumber(idx.value, 1)}</div>
                <PriceChange change={change} changePct={pct} size="sm" />
              </div>
            );
          })}
        </div>
      </Section>

      {/* 値上がり / 値下がり */}
      <div className="grid gap-8 lg:grid-cols-2">
        <Section title={t.home.gainers} href={`/${loc}/rankings#gainers`}>
          <div className="grid gap-3 sm:grid-cols-2">
            {gainers.map((s) => <StockCard key={s.company.code} s={s} locale={loc} />)}
          </div>
        </Section>
        <Section title={t.home.losers} href={`/${loc}/rankings#losers`}>
          <div className="grid gap-3 sm:grid-cols-2">
            {losers.map((s) => <StockCard key={s.company.code} s={s} locale={loc} />)}
          </div>
        </Section>
      </div>

      {/* 高配当 */}
      <Section title={t.home.highYield} href={`/${loc}/rankings#yield`}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {highYield.map((s) => <StockCard key={s.company.code} s={s} locale={loc} />)}
        </div>
      </Section>

      {/* 優待 + 決算 + 開示 */}
      <div className="grid gap-8 lg:grid-cols-3">
        <Section title={t.home.benefits} href={`/${loc}/benefits`}>
          <ul className="space-y-2">
            {benefits.map((s) => (
              <li key={s.company.code}>
                <Link href={`/${loc}/stocks/${s.company.code}`} className="flex items-center gap-2 rounded-xl border border-line bg-card p-3 text-sm hover:border-brand">
                  <Gift size={15} className="text-brand" />
                  <span className="min-w-0 flex-1 truncate text-ink">{pick(loc, s.company.nameJa, s.company.nameEn)}</span>
                  <span className="tabular text-xs text-muted">{formatRatio(s.valuation?.dividendYield)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Section>

        <Section title={t.home.earnings} href={`/${loc}/earnings`}>
          <ul className="space-y-2">
            {earnings.map((e, i) => (
              <li key={`${e.code}-${i}`} className="flex items-center gap-2 rounded-xl border border-line bg-card p-3 text-sm">
                <CalendarClock size={15} className="text-brand" />
                <span className="tabular text-xs text-muted">{formatDate(e.scheduledDate, loc)}</span>
                <Link href={`/${loc}/stocks/${e.code}`} className="min-w-0 flex-1 truncate text-ink hover:text-brand">{companyName(e.code)}</Link>
                {e.announced && <span className="rounded bg-emerald-100 px-1.5 text-[10px] text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">{loc === "ja" ? "発表済" : "done"}</span>}
              </li>
            ))}
          </ul>
        </Section>

        <Section title={t.home.disclosures}>
          <ul className="space-y-2">
            {disclosures.map((d, i) => (
              <li key={`${d.code}-${i}`} className="rounded-xl border border-line bg-card p-3 text-sm">
                <div className="flex items-center gap-2 text-[11px] text-muted">
                  <FileText size={12} /> {formatDate(d.publishedAt, loc)}
                  <Link href={`/${loc}/stocks/${d.code}`} className="hover:text-brand">{d.code}</Link>
                </div>
                <div className="mt-0.5 line-clamp-2 text-ink">{pick(loc, d.titleJa, d.titleEn)}</div>
              </li>
            ))}
          </ul>
        </Section>
      </div>

      {/* 学習記事 */}
      <Section title={t.home.articles} href={`/${loc}/learn`}>
        <div className="grid gap-3 sm:grid-cols-3">
          {learnArticles.map((a) => (
            <Link key={a.slug} href={`/${loc}/learn/${a.slug}`} className="rounded-2xl border border-line bg-card p-4 hover:border-brand">
              <div className="text-[11px] text-muted">{a.category} ・ {a.readingMinutes}min</div>
              <div className="mt-1 font-semibold text-ink">{pick(loc, a.titleJa, a.titleEn)}</div>
              <p className="mt-1 line-clamp-2 text-sm text-muted">{pick(loc, a.summaryJa, a.summaryEn)}</p>
            </Link>
          ))}
        </div>
      </Section>

      {/* FAQ */}
      <Section title="FAQ">
        <div className="divide-y divide-line rounded-2xl border border-line bg-card">
          {faqs.map((f, i) => (
            <details key={i} className="group p-4">
              <summary className="cursor-pointer list-none font-medium text-ink marker:hidden">{f.q}</summary>
              <p className="mt-2 text-sm text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </Section>

      <RiskDisclosure locale={loc} />
    </div>
  );
}

function Section({ title, href, badge, children }: { title: string; href?: string; badge?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold text-ink">{title}{badge}</h2>
        {href && (
          <Link href={href} className="inline-flex items-center gap-0.5 text-sm text-brand hover:underline">
            <ArrowRight size={14} />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

function SampleTag({ t }: { t: ReturnType<typeof getDictionary> }) {
  return <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">{t.common.sampleData}</span>;
}
