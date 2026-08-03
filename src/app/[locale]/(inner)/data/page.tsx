import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AlertTriangle, CheckCircle2, CircleDashed, Database, ExternalLink } from "lucide-react";
import type { Locale } from "@/types";
import { FRESHNESS_LABEL } from "@/types/market";
import { getDictionary, isLocale, pick } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo";
import { getDataset } from "@/lib/dataset";
import { formatDateTimeJst, formatNumber } from "@/lib/format";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { DataProvenanceLine } from "@/components/data/DataStatus";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const loc: Locale = isLocale(locale) ? locale : "ja";
  const ja = loc === "ja";
  return buildMetadata({
    locale: loc,
    path: "data",
    title: ja ? "データの取り扱いについて" : "About our data",
    description: ja
      ? "KABUPORTが使用するデータ元、遅延状況、更新頻度、公開範囲、利用条件の確認状況について。"
      : "Data sources, delay, update frequency, publication scope and terms-verification status for KABUPORT.",
  });
}

export default async function DataPolicyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const loc = locale as Locale;
  const t = getDictionary(loc);
  const ja = loc === "ja";
  const { meta } = getDataset();
  const freshness = FRESHNESS_LABEL[meta.freshness] ?? FRESHNESS_LABEL.unknown;

  const sources = meta.sources ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <Breadcrumbs items={[{ name: t.brand, path: "" }, { name: ja ? "データについて" : "About data", path: "data" }]} locale={loc} />

      <header>
        <span className="eyebrow">
          <span className="h-px w-6 bg-gold-600" aria-hidden />
          Data Policy
        </span>
        <h1 className="mt-2.5 text-[28px] font-extrabold tracking-tight text-ink sm:text-[32px]">
          {ja ? "データの取り扱いについて" : "About our data"}
        </h1>
        <p className="mt-3 text-[14px] leading-relaxed text-muted">
          {ja
            ? "当サイトは、無料で正式に利用できる公開データのみを使用します。リアルタイム株価の配信契約は結んでいないため、リアルタイム値は掲載しません。"
            : "We use only officially available free public data. We have no real-time distribution contract, so no real-time prices are shown."}
        </p>
      </header>

      {/* 現在の状態 */}
      <section className="card card-pad">
        <h2 className="flex items-center gap-2 text-[16px] font-extrabold text-ink">
          <Database size={17} className="text-gold-600" aria-hidden />
          {ja ? "現在のデータ接続状況" : "Current data status"}
        </h2>
        {meta.isFallback ? (
          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-gold/30 bg-gold/8 p-4">
            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-gold-600" aria-hidden />
            <p className="text-[13px] leading-relaxed text-ink-2">
              {ja
                ? "株価・財務・開示の実データは未接続です。銘柄ページ等に表示されている数値は、画面設計を確認するための開発用サンプルであり、実際の市場価格ではありません。"
                : "Real price, financial and disclosure data is not connected. Figures on stock pages are development samples, not actual market prices."}
              {meta.warning ? ` ${meta.warning}` : ""}
            </p>
          </div>
        ) : (
          <dl className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-line bg-bg p-4">
              <dt className="text-[11.5px] font-bold text-muted">{ja ? "遅延状況" : "Freshness"}</dt>
              <dd className="mt-1 text-[15px] font-extrabold text-ink">{pick(loc, freshness.ja, freshness.en)}</dd>
            </div>
            <div className="rounded-2xl border border-line bg-bg p-4">
              <dt className="text-[11.5px] font-bold text-muted">{ja ? "データ基準日" : "As of"}</dt>
              <dd className="num mt-1 text-[15px] font-extrabold text-ink">{meta.marketDataDate ?? "—"}</dd>
            </div>
            <div className="rounded-2xl border border-line bg-bg p-4">
              <dt className="text-[11.5px] font-bold text-muted">{ja ? "銘柄数" : "Stocks"}</dt>
              <dd className="num mt-1 text-[15px] font-extrabold text-ink">
                {meta.counts?.stocks ? formatNumber(meta.counts.stocks) : "—"}
              </dd>
            </div>
          </dl>
        )}
        <div className="mt-4 border-t border-line pt-3">
          <DataProvenanceLine meta={meta} locale={loc} />
          {meta.lastSuccessfulUpdateAt && (
            <p className="num mt-1 text-[11px] text-muted">
              {ja ? "最終成功更新" : "Last successful update"}: {formatDateTimeJst(meta.lastSuccessfulUpdateAt, loc)}
            </p>
          )}
        </div>
      </section>

      {/* データ元と公開可否 */}
      <section className="card card-pad">
        <h2 className="text-[16px] font-extrabold text-ink">{ja ? "使用するデータ元と公開可否" : "Sources and publication status"}</h2>
        <p className="mt-2 text-[12.5px] leading-relaxed text-muted">
          {ja
            ? "取得できることと、公開サイトへ掲載してよいことは別問題です。利用規約で公開・再配信の可否を確認できたデータ元のみを掲載対象とし、未確認のものは掲載しません。"
            : "Being able to fetch data is not the same as being allowed to publish it. Only sources whose terms permit publication are displayed."}
        </p>
        <ul className="mt-5 space-y-3">
          {sources.map((s) => (
            <li key={s.id} className="rounded-2xl border border-line bg-bg p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[14px] font-extrabold text-ink hover:text-primary"
                >
                  {s.name} <ExternalLink size={12} aria-hidden />
                </a>
                <span
                  className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-bold ${
                    s.publicRedistributionConfirmed
                      ? "border-success/30 bg-success/10 text-success"
                      : "border-gold/40 bg-gold/10 text-gold-600"
                  }`}
                >
                  {s.publicRedistributionConfirmed ? <CheckCircle2 size={12} /> : <CircleDashed size={12} />}
                  {s.publicRedistributionConfirmed
                    ? ja ? "公開掲載: 確認済" : "Publication: confirmed"
                    : ja ? "公開掲載: 未確認" : "Publication: unverified"}
                </span>
              </div>
              <p className="mt-2 text-[12.5px] leading-relaxed text-muted">{s.note}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* 株価チャートの表示方法 */}
      <section className="card card-pad">
        <h2 className="text-[16px] font-extrabold text-ink">{ja ? "株価チャートの表示方法" : "How price charts are shown"}</h2>
        <p className="mt-3 text-[13px] leading-relaxed text-muted">
          {ja
            ? "当サイトは株価データを保持・再配信していません。日経225・為替・個別銘柄のチャートは、TradingView が提供する公式の無料埋め込みウィジェットを表示しています（動画の埋め込みと同じ仕組みで、データのライセンス処理は提供元が行います）。"
            : "This site does not store or redistribute price data. Charts are rendered via TradingView's free official embed widgets, with data licensing handled by the provider."}
        </p>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[12.5px] leading-relaxed text-muted">
          <li>{ja ? "提供元のブランド表示を保持しています（無料利用の条件）。" : "Provider branding is retained, as required for free use."}</li>
          <li>{ja ? "ウィジェットは表示領域に入ってから読み込みます（初期表示の高速化）。" : "Widgets load only when scrolled into view."}</li>
          <li>
            {ja
              ? "ウィジェット利用時は提供元へ通信が発生します（第三者のプライバシーポリシーが適用されます）。"
              : "Using the widget sends requests to the provider, under their own privacy policy."}
          </li>
          <li>{ja ? "価格には遅延が生じる場合があり、即時性は保証されません。" : "Prices may be delayed; timeliness is not guaranteed."}</li>
        </ul>
      </section>

      {/* J-Quantsの位置づけ */}
      <section className="card card-pad">
        <h2 className="text-[16px] font-extrabold text-ink">{ja ? "J-Quants データの位置づけ" : "How J-Quants data is used"}</h2>
        <p className="mt-3 text-[13px] leading-relaxed text-muted">
          {ja
            ? "J-Quants API の無料プランは 12週間遅延 のデータです。当サイトではこれを「最新株価」としては一切使用せず、過去チャート・財務・決算履歴といった履歴用途に限定して扱います。表示する場合は必ず「12週間遅延」「データ基準日」を明記します。"
            : "The J-Quants free plan provides 12-week delayed data. We never present it as a current price; it is used only for historical charts, financials and results history, always labeled with the delay and as-of date."}
        </p>
      </section>

      {/* 更新頻度 */}
      <section className="card card-pad">
        <h2 className="text-[16px] font-extrabold text-ink">{ja ? "更新頻度" : "Update schedule"}</h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[13px] leading-relaxed text-muted">
          <li>{ja ? "毎朝 6:00（日本時間）" : "Daily at 06:00 JST"}</li>
          <li>{ja ? "平日 18:30（日本時間）" : "Weekdays at 18:30 JST"}</li>
          <li>{ja ? "土曜 7:00（日本時間・全件更新）" : "Saturdays at 07:00 JST (full refresh)"}</li>
          <li>
            {ja
              ? "取得に失敗した場合は、前回正常に取得できたデータを表示し続けます（データが消えることはありません）。"
              : "If a fetch fails, the last successful dataset stays live — data is never wiped."}
          </li>
        </ul>
      </section>

      {/* 免責 */}
      <section className="card card-pad">
        <h2 className="text-[16px] font-extrabold text-ink">{ja ? "免責事項" : "Disclaimer"}</h2>
        <p className="mt-3 text-[13px] leading-relaxed text-muted">
          {ja
            ? "本サイトに掲載する情報は、情報提供を目的としたものであり、投資勧誘・投資助言を目的とするものではありません。掲載情報の正確性、完全性、即時性を保証するものではありません。投資判断は利用者ご自身の責任で行ってください。株価情報には遅延が生じる場合があります。"
            : "Information on this site is provided for informational purposes only and is not investment solicitation or advice. We do not guarantee accuracy, completeness or timeliness. Make investment decisions at your own responsibility. Price information may be delayed."}
        </p>
      </section>
    </div>
  );
}
