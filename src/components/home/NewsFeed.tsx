import Link from "next/link";
import { FileText, Newspaper } from "lucide-react";
import type { Disclosure, Locale } from "@/types";
import { pick } from "@/lib/i18n";
import { formatDate } from "@/lib/format";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "./SectionHeading";

export interface NewsItem {
  id: string;
  category: string;
  publishedAt: string;
  titleJa: string;
  titleEn: string;
  summaryJa: string;
  summaryEn: string;
  source: string;
}

const CATEGORY: Record<string, { ja: string; en: string; grad: string }> = {
  market: { ja: "マーケット", en: "Markets", grad: "from-navy-600 to-primary/70" },
  earnings: { ja: "決算", en: "Earnings", grad: "from-navy-700 to-navy-400" },
  policy: { ja: "金利・政策", en: "Policy", grad: "from-navy to-navy-500" },
  dividend: { ja: "配当", en: "Dividends", grad: "from-navy-600 to-gold-600/70" },
  ipo: { ja: "IPO", en: "IPO", grad: "from-navy-700 to-primary/60" },
};

function timeLabel(iso: string, locale: Locale) {
  const d = new Date(iso);
  const hh = d.toLocaleTimeString(locale === "ja" ? "ja-JP" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Tokyo",
  });
  return `${formatDate(iso, locale)} ${hh}`;
}

export function NewsFeed({
  news,
  disclosures,
  locale,
}: {
  news: NewsItem[];
  disclosures: Disclosure[];
  locale: Locale;
}) {
  const ja = locale === "ja";
  const [lead, ...rest] = news;
  if (!lead) return null;
  const leadCat = CATEGORY[lead.category] ?? CATEGORY.market!;

  return (
    <section id="news" className="shell scroll-mt-28 py-16 sm:py-20">
      <SectionHeading
        eyebrow="Market News"
        title={ja ? "最新マーケットニュース" : "Latest market news"}
        description={ja ? "市場動向・決算・政策・配当・IPOの最新トピック（すべてサンプル記事）。" : "Markets, earnings, policy, dividends and IPO topics (all sample articles)."}
      />

      <div className="grid gap-6 lg:grid-cols-[1.55fr_1fr]">
        {/* 記事 */}
        <div className="grid gap-5">
          {/* リード記事 */}
          <Reveal as="article">
            <div className="card card-hover overflow-hidden">
              <div className={`relative h-44 bg-gradient-to-br ${leadCat.grad} sm:h-56`}>
                <div className="absolute inset-0 bg-grid opacity-60" aria-hidden />
                <svg className="absolute inset-0 h-full w-full opacity-30" viewBox="0 0 400 160" preserveAspectRatio="none" aria-hidden>
                  <path d="M0 120 L60 96 L120 108 L180 70 L240 84 L300 44 L360 58 L400 30" fill="none" stroke="#fff" strokeWidth="2" />
                </svg>
                <span className="absolute left-5 top-5 rounded-lg bg-white/15 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-widest text-white backdrop-blur-sm">
                  {pick(locale, leadCat.ja, leadCat.en)}
                </span>
              </div>
              <div className="p-6">
                <h3 className="text-[19px] font-extrabold leading-snug tracking-tight text-ink">
                  {pick(locale, lead.titleJa, lead.titleEn)}
                </h3>
                <p className="mt-2.5 text-[13.5px] leading-relaxed text-muted">{pick(locale, lead.summaryJa, lead.summaryEn)}</p>
                <div className="num mt-4 flex items-center gap-3 text-[11px] text-muted">
                  <span>{timeLabel(lead.publishedAt, locale)}</span>
                  <span className="h-3 w-px bg-line" aria-hidden />
                  <span>{lead.source}</span>
                </div>
              </div>
            </div>
          </Reveal>

          {/* 一覧 */}
          <ul className="card divide-y divide-line overflow-hidden">
            {rest.map((n, i) => {
              const cat = CATEGORY[n.category] ?? CATEGORY.market!;
              return (
                <Reveal key={n.id} as="li" delay={i * 50}>
                  <div className="flex gap-4 p-5 transition-colors hover:bg-bg">
                    <div className={`relative hidden h-[68px] w-[104px] shrink-0 overflow-hidden rounded-xl bg-gradient-to-br sm:block ${cat.grad}`}>
                      <div className="absolute inset-0 bg-grid opacity-50" aria-hidden />
                      <Newspaper size={16} className="absolute bottom-2 right-2 text-white/50" aria-hidden />
                    </div>
                    <div className="min-w-0">
                      <span className="chip">{pick(locale, cat.ja, cat.en)}</span>
                      <h3 className="mt-2 text-[14.5px] font-bold leading-snug text-ink">{pick(locale, n.titleJa, n.titleEn)}</h3>
                      <div className="num mt-1.5 flex items-center gap-2.5 text-[11px] text-muted">
                        <span>{timeLabel(n.publishedAt, locale)}</span>
                        <span className="h-3 w-px bg-line" aria-hidden />
                        <span>{n.source}</span>
                      </div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </ul>
        </div>

        {/* 適時開示レール */}
        <Reveal delay={120}>
          <aside className="card h-full overflow-hidden" aria-label={ja ? "適時開示" : "Disclosures"}>
            <div className="flex items-center gap-2 border-b border-line px-5 py-4">
              <FileText size={15} className="text-gold-600" aria-hidden />
              <h3 className="text-[13.5px] font-extrabold text-ink">{ja ? "注目の適時開示" : "Notable disclosures"}</h3>
            </div>
            <ul className="divide-y divide-line">
              {disclosures.slice(0, 6).map((d, i) => (
                <li key={`${d.code}-${i}`}>
                  <Link href={`/${locale}/stocks/${d.code}`} className="block px-5 py-4 transition-colors hover:bg-bg">
                    <div className="num flex items-center gap-2 text-[10.5px] text-muted">
                      <span className="rounded bg-line/70 px-1.5 py-0.5 font-bold text-ink-2">{d.code}</span>
                      <span>{formatDate(d.publishedAt, locale)}</span>
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-[13px] font-semibold leading-snug text-ink">
                      {pick(locale, d.titleJa, d.titleEn)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="border-t border-line px-5 py-3.5">
              <span className="text-[11px] text-muted">{ja ? "出典: サンプルデータ（TDnet等の一次情報に接続予定）" : "Source: sample data (to be connected to primary filings)"}</span>
            </div>
          </aside>
        </Reveal>
      </div>
    </section>
  );
}
