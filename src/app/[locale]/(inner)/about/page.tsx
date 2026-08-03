import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Locale } from "@/types";
import { getDictionary, isLocale } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { RiskDisclosure } from "@/components/RiskDisclosure";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const loc: Locale = isLocale(locale) ? locale : "ja";
  const t = getDictionary(loc);
  return buildMetadata({ locale: loc, path: "about", title: loc === "ja" ? "サイトについて・各種方針" : "About & Policies", description: loc === "ja" ? "運営方針・編集方針・情報源・広告開示・リスク・免責・利用規約・プライバシー。" : "Editorial policy, sources, ad disclosure, risk, disclaimer, terms and privacy." });
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const loc = locale as Locale;
  const t = getDictionary(loc);
  const ja = loc === "ja";

  const sections: { id: string; title: string; body: string }[] = [
    { id: "company", title: ja ? "運営会社" : "Company", body: ja ? "本サイトはデモ環境です。実運用時は運営会社名・所在地・連絡先を記載します。" : "This is a demo environment. In production, the operating company, address and contact are shown here." },
    { id: "editorial", title: ja ? "編集方針" : "Editorial policy", body: ja ? "客観的なデータと一般的な教育情報を提供し、特定銘柄の売買推奨は行いません。数値は出典・基準日・実績/予想・連結/単体を区別して表示します。" : "We provide objective data and general education, never buy/sell recommendations. Figures distinguish source, as-of date, actual/forecast and consolidated/non-consolidated." },
    { id: "sources", title: ja ? "情報源" : "Data sources", body: ja ? "本デモの株価・財務・配当・優待・開示はすべてサンプルデータです。実運用時はJPX/EDINET/TDnet等の一次情報や適法なデータAPIを出典として明示します。" : "All prices, financials, dividends, benefits and disclosures in this demo are sample data. In production we cite primary sources (JPX/EDINET/TDnet) or licensed data APIs." },
    { id: "disclosure", title: ja ? "広告・アフィリエイト開示" : "Ad & affiliate disclosure", body: ja ? "証券会社比較等にアフィリエイトリンクを含む場合があります。ランキングは評価基準・調査日・情報源・利益相反を公開し、広告報酬額のみで順位を決定しません。" : "Broker comparisons may include affiliate links. Rankings disclose criteria, survey date, sources and conflicts of interest, and are never decided by ad revenue alone." },
    { id: "risk", title: ja ? "リスク開示" : "Risk disclosure", body: ja ? "株式投資には元本損失の可能性があります。過去の実績は将来を保証しません。詳細は下部の注意をご覧ください。" : "Equity investing risks loss of principal; past results do not guarantee the future. See the notice below." },
    { id: "correction", title: ja ? "訂正ポリシー" : "Correction policy", body: ja ? "誤りのご指摘は各ページの導線からご連絡ください。確認のうえ修正し、更新履歴を残します。" : "Report errors via the link on each page. We verify, fix and keep an update history." },
    { id: "terms", title: ja ? "利用規約" : "Terms of use", body: ja ? "本サイトの情報は一般的な情報提供を目的とし、投資助言ではありません。利用者は自己責任で投資判断を行うものとします。" : "Information here is general and not investment advice. Users make decisions at their own responsibility." },
    { id: "privacy", title: ja ? "プライバシーポリシー" : "Privacy policy", body: ja ? "ポートフォリオ等の個人データは本人以外に公開しません（実運用時に詳細を記載）。" : "Personal data such as portfolios is never shared (details provided in production)." },
    { id: "disclaimer", title: ja ? "免責事項" : "Disclaimer", body: ja ? "情報の正確性・完全性・即時性を保証しません。株価データには遅延が生じる場合があります。" : "We do not guarantee accuracy, completeness or timeliness. Price data may be delayed." },
  ];

  return (
    <div className="space-y-8">
      <Breadcrumbs items={[{ name: t.brand, path: "" }, { name: ja ? "サイトについて" : "About", path: "about" }]} locale={loc} />
      <h1 className="text-2xl font-bold text-ink">{ja ? "サイトについて・各種方針" : "About & Policies"}</h1>
      <div className="grid gap-4">
        {sections.map((s) => (
          <section key={s.id} id={s.id} className="scroll-mt-24 rounded-2xl border border-line bg-card p-5">
            <h2 className="text-lg font-bold text-ink">{s.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
          </section>
        ))}
      </div>
      <RiskDisclosure locale={loc} />
    </div>
  );
}
