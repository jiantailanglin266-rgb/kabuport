import { CalendarDays, Sparkles } from "lucide-react";
import type { Locale } from "@/types";
import { pick } from "@/lib/i18n";
import { formatDate, formatNumber } from "@/lib/format";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "./SectionHeading";

export interface IpoItem {
  code: string;
  nameJa: string;
  nameEn: string;
  status: "subscribing" | "lottery" | "upcoming";
  market: string;
  businessJa: string;
  businessEn: string;
  priceRangeLow: number;
  priceRangeHigh: number;
  listingDate: string;
  bookOpen: string;
  bookClose: string;
  sharesOffered: number;
}

const STATUS: Record<IpoItem["status"], { ja: string; en: string; cls: string }> = {
  subscribing: { ja: "現在募集中", en: "Subscribing", cls: "border-success/30 bg-success/10 text-success" },
  lottery: { ja: "抽選中", en: "In lottery", cls: "border-gold/40 bg-gold/12 text-gold-600" },
  upcoming: { ja: "上場予定", en: "Upcoming", cls: "border-primary/30 bg-primary/10 text-primary" },
};

const MARKET: Record<string, { ja: string; en: string }> = {
  prime: { ja: "プライム", en: "Prime" },
  standard: { ja: "スタンダード", en: "Standard" },
  growth: { ja: "グロース", en: "Growth" },
};

export function IpoSection({ items, locale }: { items: IpoItem[]; locale: Locale }) {
  const ja = locale === "ja";
  const order: IpoItem["status"][] = ["subscribing", "lottery", "upcoming"];
  const counts = order.map((s) => ({ s, n: items.filter((i) => i.status === s).length }));

  return (
    <section id="ipo" className="scroll-mt-28 bg-surface py-16 sm:py-20">
      <div className="shell">
        <SectionHeading
          eyebrow="IPO Calendar"
          title={ja ? "IPO（新規上場）スケジュール" : "IPO calendar"}
          description={
            ja
              ? "募集中・抽選中・上場予定の銘柄を一覧で確認できます。掲載企業はすべて架空のサンプルです。"
              : "Subscribing, in-lottery and upcoming listings at a glance. All companies shown are fictional samples."
          }
        />

        <div className="mb-5 flex flex-wrap gap-2">
          {counts.map(({ s, n }) => (
            <span key={s} className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-bold ${STATUS[s].cls}`}>
              {pick(locale, STATUS[s].ja, STATUS[s].en)}
              <span className="num">{n}</span>
            </span>
          ))}
        </div>

        <Reveal>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px]">
                <caption className="sr-only">{ja ? "IPOスケジュール" : "IPO schedule"}</caption>
                <thead>
                  <tr className="border-b border-line text-[11px] uppercase tracking-wide text-muted">
                    <th scope="col" className="py-3.5 pl-5 text-left font-bold">{ja ? "状況" : "Status"}</th>
                    <th scope="col" className="py-3.5 text-left font-bold">{ja ? "銘柄・事業内容" : "Company"}</th>
                    <th scope="col" className="py-3.5 text-left font-bold">{ja ? "市場" : "Market"}</th>
                    <th scope="col" className="py-3.5 text-right font-bold">{ja ? "想定価格帯" : "Price range"}</th>
                    <th scope="col" className="py-3.5 text-right font-bold">{ja ? "公開株数" : "Shares"}</th>
                    <th scope="col" className="py-3.5 pr-5 text-right font-bold">{ja ? "上場日" : "Listing"}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => (
                    <tr key={it.code} className="border-b border-line/60 transition-colors last:border-0 hover:bg-bg">
                      <td className="py-4 pl-5">
                        <span className={`inline-flex rounded-lg border px-2.5 py-1 text-[11px] font-bold ${STATUS[it.status].cls}`}>
                          {pick(locale, STATUS[it.status].ja, STATUS[it.status].en)}
                        </span>
                      </td>
                      <td className="py-4">
                        <div className="text-[14px] font-bold text-ink">{pick(locale, it.nameJa, it.nameEn)}</div>
                        <div className="num mt-0.5 text-[11.5px] text-muted">
                          {it.code} ・ {pick(locale, it.businessJa, it.businessEn)}
                        </div>
                      </td>
                      <td className="py-4">
                        <span className="chip">{pick(locale, MARKET[it.market]?.ja ?? it.market, MARKET[it.market]?.en ?? it.market)}</span>
                      </td>
                      <td className="num py-4 text-right text-[13px] font-bold text-ink">
                        {formatNumber(it.priceRangeLow)}–{formatNumber(it.priceRangeHigh)}
                        <span className="ml-0.5 text-[11px] font-normal text-muted">{ja ? "円" : "JPY"}</span>
                      </td>
                      <td className="num py-4 text-right text-[13px] text-ink-2">{formatNumber(it.sharesOffered)}</td>
                      <td className="num py-4 pr-5 text-right">
                        <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-ink">
                          <CalendarDays size={13} className="text-muted" aria-hidden />
                          {formatDate(it.listingDate, locale)}
                        </span>
                        <div className="mt-0.5 text-[10.5px] text-muted">
                          {ja ? "申込" : "Book"} {formatDate(it.bookOpen, locale)} – {formatDate(it.bookClose, locale)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center gap-2 border-t border-line px-5 py-3.5">
              <Sparkles size={13} className="shrink-0 text-gold-600" aria-hidden />
              <p className="text-[11.5px] text-muted">
                {ja
                  ? "上記は架空企業によるサンプルです。実際のIPOは目論見書・証券会社の公式情報をご確認ください。当社は申込の仲介・推奨を行いません。"
                  : "Fictional sample data. For real IPOs, consult the prospectus and your broker. We do not broker or recommend subscriptions."}
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
