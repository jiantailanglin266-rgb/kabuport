import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Locale } from "@/types";
import { getDictionary, isLocale, pick } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbLd } from "@/lib/jsonld";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { AffiliateDisclosure } from "@/components/AffiliateDisclosure";
import { BrokerCompare, type BrokerView } from "@/components/BrokerCompare";
import { JsonLd } from "@/components/JsonLd";
import brokersRaw from "@/data/brokers.json";

const brokers = brokersRaw as unknown as BrokerView[];

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const loc: Locale = isLocale(locale) ? locale : "ja";
  return buildMetadata({ locale: loc, path: "brokers", title: loc === "ja" ? "証券会社比較" : "Broker Comparison", description: loc === "ja" ? "日本株の証券会社を手数料・新NISA・米国株・IPO・単元未満株などで比較（サンプル・広告を含む）。" : "Compare Japanese brokers by fees, New NISA, US stocks, IPO and odd-lot (sample; contains ads)." });
}

export default async function BrokersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const loc = locale as Locale;
  const t = getDictionary(loc);
  const ja = loc === "ja";

  return (
    <div className="space-y-6">
      <JsonLd data={breadcrumbLd([{ name: t.brand, path: "" }, { name: ja ? "証券会社比較" : "Brokers", path: "brokers" }], loc)} />
      <Breadcrumbs items={[{ name: t.brand, path: "" }, { name: ja ? "証券会社比較" : "Brokers", path: "brokers" }]} locale={loc} />
      <div>
        <h1 className="text-2xl font-bold text-ink">{ja ? "証券会社比較" : "Broker comparison"}</h1>
        <p className="mt-1 text-sm text-muted">{t.common.sampleData} ・ {ja ? "最大4社を横並びで比較できます" : "Compare up to 4 brokers side by side"}</p>
      </div>

      <AffiliateDisclosure locale={loc} />

      <BrokerCompare brokers={brokers} locale={loc} />

      {/* 全社一覧 */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-ink">{ja ? "証券会社一覧" : "All brokers"}</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {brokers.map((b) => (
            <Link key={b.slug} href={`/${loc}/brokers/${b.slug}`} className="rounded-2xl border border-line bg-card p-4 hover:border-brand">
              <div className="font-semibold text-ink">{pick(loc, b.nameJa, b.nameEn)}</div>
              <div className="mt-1 text-xs text-muted">{b.spotFeeNote}</div>
              <div className="mt-2 flex flex-wrap gap-1 text-[10px]">
                {b.nisa && <span className="rounded bg-line/60 px-1.5 py-0.5 text-muted">NISA</span>}
                {b.usStocks && <span className="rounded bg-line/60 px-1.5 py-0.5 text-muted">{ja ? "米国株" : "US"}</span>}
                {b.ipo && <span className="rounded bg-line/60 px-1.5 py-0.5 text-muted">IPO</span>}
                {b.singleShares && <span className="rounded bg-line/60 px-1.5 py-0.5 text-muted">{ja ? "単元未満株" : "Odd-lot"}</span>}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 評価基準の開示 */}
      <section className="rounded-2xl border border-line bg-card p-5 text-sm">
        <h2 className="text-lg font-bold text-ink">{ja ? "比較・評価基準" : "How we compare"}</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
          <li>{ja ? "評価は手数料・取扱商品・新NISA/iDeCo対応・ツール・サポート等の客観項目に基づきます。" : "Based on objective items: fees, product lineup, New NISA/iDeCo, tools and support."}</li>
          <li>{ja ? "調査日を各社に明記し、情報源は各社公式情報とします。" : "Survey date shown per broker; sources are each broker's official information."}</li>
          <li>{ja ? "広告報酬額のみで順位を決定しません（利益相反の開示）。" : "Rankings are never decided by ad revenue alone (conflict-of-interest disclosure)."}</li>
          <li>{ja ? "本デモの各社情報はサンプルであり、実在の登録番号・手数料ではありません。" : "Broker details here are sample data, not real registration numbers or fees."}</li>
        </ul>
      </section>
    </div>
  );
}
