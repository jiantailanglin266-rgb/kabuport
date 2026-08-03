import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Check, Minus } from "lucide-react";
import type { Locale } from "@/types";
import { LOCALES } from "@/types";
import { getDictionary, isLocale, pick } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbLd } from "@/lib/jsonld";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { AffiliateDisclosure, AdLink } from "@/components/AffiliateDisclosure";
import { JsonLd } from "@/components/JsonLd";
import brokersRaw from "@/data/brokers.json";

interface BrokerFull {
  slug: string; nameJa: string; nameEn: string; operator: string; registrationNumber: string;
  associations: string[]; spotFeeNote: string; nisa: boolean; usStocks: boolean; ipo: boolean;
  singleShares: boolean; pointInvest: boolean; creditCardTsumitate: boolean;
  officialUrl: string; isAffiliate: boolean; surveyedAt: string;
}
const brokers = brokersRaw as unknown as BrokerFull[];
const find = (slug: string) => brokers.find((b) => b.slug === slug);

export function generateStaticParams() {
  return LOCALES.flatMap((locale) => brokers.map((b) => ({ locale, slug: b.slug })));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const loc: Locale = isLocale(locale) ? locale : "ja";
  const b = find(slug);
  if (!b) return buildMetadata({ locale: loc, path: `brokers/${slug}`, title: slug, description: "", noindex: true });
  return buildMetadata({ locale: loc, path: `brokers/${slug}`, title: `${pick(loc, b.nameJa, b.nameEn)}${loc === "ja" ? "の特徴・手数料" : " features & fees"}`, description: b.spotFeeNote });
}

function Feature({ label, on, locale }: { label: string; on: boolean; locale: Locale }) {
  return (
    <div className="flex items-center justify-between border-b border-line/40 py-1.5">
      <span className="text-muted">{label}</span>
      {on ? <span className="inline-flex items-center gap-1 text-up"><Check size={14} />{locale === "ja" ? "対応" : "Yes"}</span> : <span className="inline-flex items-center gap-1 text-muted"><Minus size={14} />{locale === "ja" ? "非対応" : "No"}</span>}
    </div>
  );
}

export default async function BrokerDetailPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const loc = locale as Locale;
  const t = getDictionary(loc);
  const b = find(slug);
  if (!b) notFound();
  const ja = loc === "ja";
  const name = pick(loc, b.nameJa, b.nameEn);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <JsonLd data={breadcrumbLd([{ name: t.brand, path: "" }, { name: ja ? "証券会社比較" : "Brokers", path: "brokers" }, { name, path: `brokers/${slug}` }], loc)} />
      <Breadcrumbs items={[{ name: t.brand, path: "" }, { name: ja ? "証券会社比較" : "Brokers", path: "brokers" }, { name, path: `brokers/${slug}` }]} locale={loc} />

      <header className="rounded-2xl border border-line bg-card p-5">
        <h1 className="text-2xl font-bold text-ink">{name}</h1>
        <p className="mt-1 text-sm text-muted">{b.operator}</p>
        <p className="mt-3 text-sm text-ink">{b.spotFeeNote}</p>
        <div className="mt-3">
          <AdLink href={b.officialUrl} isAffiliate={b.isAffiliate} locale={loc}>{ja ? "公式サイトを見る" : "Visit official site"}</AdLink>
        </div>
      </header>

      <AffiliateDisclosure locale={loc} />

      <section className="rounded-2xl border border-line bg-card p-5 text-sm">
        <h2 className="mb-2 text-lg font-bold text-ink">{ja ? "サービス対応状況" : "Service coverage"}</h2>
        <Feature label={ja ? "新NISA" : "New NISA"} on={b.nisa} locale={loc} />
        <Feature label={ja ? "米国株" : "US stocks"} on={b.usStocks} locale={loc} />
        <Feature label="IPO" on={b.ipo} locale={loc} />
        <Feature label={ja ? "単元未満株" : "Odd-lot shares"} on={b.singleShares} locale={loc} />
        <Feature label={ja ? "ポイント投資" : "Point investing"} on={b.pointInvest} locale={loc} />
        <Feature label={ja ? "クレカ積立" : "Card accumulation"} on={b.creditCardTsumitate} locale={loc} />
      </section>

      <section className="rounded-2xl border border-line bg-card p-5 text-sm">
        <h2 className="mb-2 text-lg font-bold text-ink">{ja ? "登録・調査情報" : "Registration & survey"}</h2>
        <dl className="space-y-2">
          <div className="flex justify-between gap-4"><dt className="text-muted">{ja ? "金融商品取引業者登録番号" : "Registration no."}</dt><dd className="text-right text-ink">{b.registrationNumber}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-muted">{ja ? "加入協会" : "Associations"}</dt><dd className="text-right text-ink">{b.associations.join(", ")}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-muted">{ja ? "調査日" : "Surveyed"}</dt><dd className="text-right text-ink">{b.surveyedAt}</dd></div>
        </dl>
        <p className="mt-3 text-[11px] text-muted">{ja ? "本情報はサンプルです。登録番号・手数料・取扱商品は必ず公式情報でご確認ください。" : "Sample data. Verify registration, fees and products on the official site."}</p>
      </section>
    </div>
  );
}
