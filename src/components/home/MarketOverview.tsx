import { ArrowUpRight, Building2, ExternalLink } from "lucide-react";
import type { Locale } from "@/types";
import type { DatasetMeta } from "@/types/market";
import { pick } from "@/lib/i18n";
import { formatNumber } from "@/lib/format";
import { Reveal } from "@/components/ui/Reveal";
import { DataProvenanceLine, FreshnessBadge } from "@/components/data/DataStatus";
import { SectionHeading } from "./SectionHeading";

/**
 * マーケット概況。
 * 日経平均・TOPIX等の指数値は、無料で正式に取得・再配信できないため数値を掲載しない。
 * 代わりに各指数の公式ページへのリンクカードを提示する（架空値は表示しない）。
 */
const OFFICIAL_INDEX_LINKS: { id: string; ja: string; en: string; operator: string; url: string }[] = [
  { id: "nikkei225", ja: "日経平均株価", en: "Nikkei 225", operator: "日本経済新聞社", url: "https://indexes.nikkei.co.jp/nkave" },
  { id: "topix", ja: "TOPIX", en: "TOPIX", operator: "JPX総研", url: "https://www.jpx.co.jp/markets/indices/topix/" },
  { id: "jpx", ja: "JPX 指数一覧", en: "JPX indices", operator: "日本取引所グループ", url: "https://www.jpx.co.jp/markets/indices/" },
  { id: "boj", ja: "為替・金利（日本銀行）", en: "FX & rates (BOJ)", operator: "日本銀行", url: "https://www.boj.or.jp/statistics/index.htm" },
];

export function MarketOverview({
  meta,
  breadth,
  locale,
}: {
  meta: DatasetMeta;
  breadth: { advancing: number; declining: number; unchanged: number; marketDataDate: string | null } | null;
  locale: Locale;
}) {
  const ja = locale === "ja";

  return (
    <section className="shell py-16 sm:py-20" aria-labelledby="market-overview">
      <SectionHeading
        eyebrow="Market Overview"
        title={ja ? "マーケット概況" : "Market overview"}
        description={
          ja
            ? "指数値は、無料で正式に再配信できるデータ元が無いため掲載していません。各指数の公式サイトでご確認ください。"
            : "Index levels are not shown because no freely redistributable official source is available. Please check each index's official site."
        }
      />
      <h2 id="market-overview" className="sr-only">
        {ja ? "マーケット概況" : "Market overview"}
      </h2>

      {/* 騰落銘柄数（実データがある場合のみ） */}
      {breadth ? (
        <Reveal>
          <div className="card mb-6 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h3 className="text-[15px] font-extrabold text-ink">{ja ? "騰落銘柄数" : "Advancers / decliners"}</h3>
              <FreshnessBadge meta={meta} locale={locale} />
            </div>
            <dl className="mt-4 grid grid-cols-3 gap-4">
              {[
                { label: ja ? "値上がり" : "Advancing", v: breadth.advancing, cls: "text-up", mark: "▲" },
                { label: ja ? "値下がり" : "Declining", v: breadth.declining, cls: "text-down", mark: "▼" },
                { label: ja ? "変わらず" : "Unchanged", v: breadth.unchanged, cls: "text-muted", mark: "±" },
              ].map((it) => (
                <div key={it.label} className="rounded-2xl border border-line bg-bg p-4">
                  <dt className="text-[11.5px] font-bold text-muted">{it.label}</dt>
                  <dd className={`num mt-1 text-[24px] font-extrabold ${it.cls}`}>
                    <span aria-hidden>{it.mark}</span> {formatNumber(it.v)}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="mt-4 border-t border-line pt-3">
              <DataProvenanceLine meta={meta} locale={locale} />
            </div>
          </div>
        </Reveal>
      ) : (
        <Reveal>
          <div className="card mb-6 flex flex-col items-start gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-[15px] font-extrabold text-ink">{ja ? "市場データは準備中です" : "Market data is being prepared"}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
                {ja
                  ? "正式なデータ元への接続と利用条件の確認が完了するまで、株価・指数の数値は掲載しません。"
                  : "Prices and index levels are withheld until official data sources and their terms are confirmed."}
              </p>
            </div>
            <span className="chip shrink-0">{ja ? "データ準備中" : "Preparing"}</span>
          </div>
        </Reveal>
      )}

      {/* 公式サイトへのリンクカード */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {OFFICIAL_INDEX_LINKS.map((it, i) => (
          <Reveal key={it.id} delay={i * 60}>
            <a
              href={it.url}
              target="_blank"
              rel="noopener noreferrer"
              className="card card-hover group flex h-full flex-col justify-between p-5"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-[14px] font-extrabold leading-snug text-ink">{pick(locale, it.ja, it.en)}</h3>
                  <ArrowUpRight size={15} className="shrink-0 text-muted transition-colors group-hover:text-gold-600" aria-hidden />
                </div>
                <p className="mt-1.5 inline-flex items-center gap-1 text-[11.5px] text-muted">
                  <Building2 size={11} aria-hidden />
                  {it.operator}
                </p>
              </div>
              <span className="mt-4 inline-flex items-center gap-1 text-[11.5px] font-bold text-primary">
                <ExternalLink size={11} aria-hidden />
                {ja ? "公式サイトで確認" : "View official site"}
              </span>
            </a>
          </Reveal>
        ))}
      </div>

      <p className="mt-5 text-[11.5px] leading-relaxed text-muted">
        {ja
          ? "※ 指数の算出・配信はそれぞれの算出主体に帰属します。当サイトは指数値の再配信を行いません。"
          : "Index calculation and distribution belong to their respective operators. This site does not redistribute index values."}
      </p>
    </section>
  );
}
