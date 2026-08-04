import Link from "next/link";
import { Mail, Rss, ShieldCheck, TrendingUp } from "lucide-react";
import type { Locale } from "@/types";
import { getDictionary } from "@/lib/i18n";

export function Footer({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  const b = `/${locale}`;
  const ja = locale === "ja";
  const about = `${b}/about`;

  const groups: { title: string; links: { label: string; href: string }[] }[] = [
    {
      title: ja ? "マーケット" : "Markets",
      links: [
        { label: ja ? "日本株を探す" : "Find stocks", href: `${b}/stocks` },
        { label: ja ? "ランキング" : "Rankings", href: `${b}/rankings` },
        { label: ja ? "AI・定量分析" : "Quant analysis", href: `${b}/spotlight` },
        { label: ja ? "RSI売買シグナル" : "RSI signals", href: `${b}/signals` },
        { label: ja ? "銘柄比較" : "Compare", href: `${b}/compare` },
        { label: ja ? "業種別" : "Industries", href: `${b}/industries` },
        { label: ja ? "テーマ株" : "Themes", href: `${b}/themes` },
      ],
    },
    {
      title: ja ? "投資データ" : "Data",
      links: [
        { label: ja ? "株式投資ニュース" : "Investing news", href: `${b}/news` },
        { label: ja ? "決算カレンダー" : "Earnings calendar", href: `${b}/earnings` },
        { label: ja ? "配当カレンダー" : "Dividend calendar", href: `${b}/dividends` },
        { label: ja ? "株主優待" : "Shareholder benefits", href: `${b}/benefits` },
        { label: ja ? "証券会社比較" : "Broker comparison", href: `${b}/brokers` },
      ],
    },
    {
      title: ja ? "学ぶ" : "Learn",
      links: [
        { label: ja ? "投資を学ぶ" : "Learn", href: `${b}/learn` },
        { label: ja ? "動画ライブラリ" : "Video library", href: `${b}/videos` },
        { label: ja ? "学習ロードマップ" : "Learning paths", href: `${b}/paths` },
        { label: ja ? "投資用語集" : "Glossary", href: `${b}/glossary` },
        { label: ja ? "著者・監修者" : "Authors & reviewers", href: `${b}/experts` },
      ],
    },
    {
      title: ja ? "運営・方針" : "Company",
      links: [
        { label: ja ? "会社概要" : "About us", href: `${about}#company` },
        { label: ja ? "編集方針" : "Editorial policy", href: `${about}#editorial` },
        { label: ja ? "データの取り扱い" : "Data policy", href: `${b}/data` },
        { label: ja ? "画像クレジット" : "Image credits", href: `${b}/credits` },
        { label: ja ? "情報源" : "Data sources", href: `${about}#sources` },
        { label: ja ? "広告・アフィリエイト開示" : "Ad disclosure", href: `${about}#disclosure` },
        { label: ja ? "訂正ポリシー" : "Corrections", href: `${about}#correction` },
        { label: ja ? "お問い合わせ" : "Contact", href: `${about}#company` },
      ],
    },
  ];

  const legal = [
    { label: ja ? "利用規約" : "Terms", href: `${about}#terms` },
    { label: ja ? "プライバシーポリシー" : "Privacy", href: `${about}#privacy` },
    { label: ja ? "免責事項" : "Disclaimer", href: `${about}#disclaimer` },
    { label: ja ? "リスク開示" : "Risk disclosure", href: `${about}#risk` },
  ];

  return (
    <footer className="mt-24 bg-navy text-white/70">
      {/* リスク開示帯 */}
      <div className="border-b border-white/10 bg-navy-900">
        <div className="shell flex items-start gap-3 py-6">
          <ShieldCheck size={18} className="mt-0.5 shrink-0 text-gold" aria-hidden />
          <p className="text-[12.5px] leading-relaxed text-white/60">
            {ja
              ? "本サイトは一般的な情報提供を目的とした情報プラットフォームであり、投資助言・特定銘柄の売買推奨を行うものではありません。株式投資には元本損失の可能性があり、過去の株価・業績は将来の結果を保証しません。掲載中の株価・財務・配当・優待等はサンプルデータを含み、正確性・完全性・即時性を保証しません。投資判断はご自身の責任で行ってください。"
              : "This site provides general information only and is not investment advice or a recommendation to buy or sell any security. Equity investing carries the risk of losing principal, and past prices or results do not guarantee future outcomes. Data shown includes sample data; accuracy, completeness and timeliness are not guaranteed. Make investment decisions at your own responsibility."}
          </p>
        </div>
      </div>

      <div className="shell py-14">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_2.4fr]">
          {/* ブランド */}
          <div>
            <Link href={b} className="flex items-center gap-2.5">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/8 text-gold">
                <TrendingUp size={22} strokeWidth={2.4} />
              </span>
              <span className="flex flex-col leading-none">
                <span className="font-display text-xl font-extrabold tracking-tight text-white">KABUPORT</span>
                <span className="mt-1.5 text-[9px] font-semibold uppercase tracking-widest text-gold/80">
                  Japan Equity Intelligence
                </span>
              </span>
            </Link>
            <p className="mt-5 max-w-sm text-[13px] leading-relaxed text-white/55">
              {ja
                ? "日本株の企業情報・株価・業績・配当・株主優待・決算スケジュールを、一つの場所で比較・分析できる株式情報プラットフォーム。"
                : "A Japanese equity information platform to compare and analyze company profiles, prices, results, dividends, benefits and earnings schedules in one place."}
            </p>
            <div className="mt-6 flex items-center gap-2">
              <Link
                href={`${about}#company`}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/15 px-4 text-[13px] font-bold text-white/80 transition-colors hover:border-gold/50 hover:text-white"
              >
                <Mail size={14} /> {ja ? "お問い合わせ" : "Contact"}
              </Link>
              <Link
                href={`${b}/spotlight`}
                aria-label={ja ? "マーケット分析を見る" : "Market analysis"}
                className="grid h-10 w-10 place-items-center rounded-xl border border-white/15 text-white/70 transition-colors hover:border-gold/50 hover:text-white"
              >
                <Rss size={14} />
              </Link>
            </div>
          </div>

          {/* リンク群 */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {groups.map((g) => (
              <nav key={g.title} aria-label={g.title}>
                <h2 className="text-[11px] font-bold uppercase tracking-widest text-gold">{g.title}</h2>
                <ul className="mt-4 space-y-2.5">
                  {g.links.map((l) => (
                    <li key={l.href + l.label}>
                      <Link href={l.href} className="text-[13px] text-white/60 transition-colors hover:text-white">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-white/10 pt-7 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[12px] text-white/45">
            © {t.brand}. {ja ? "本サイトはサンプルデータを含むデモ環境です。" : "Demo environment containing sample data."}
          </p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {legal.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-[12px] text-white/55 transition-colors hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
