import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BellRing, BriefcaseBusiness, Check, Star } from "lucide-react";
import type { Locale } from "@/types";
import { getDictionary, isLocale } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const loc: Locale = isLocale(locale) ? locale : "ja";
  const ja = loc === "ja";
  return buildMetadata({
    locale: loc,
    path: "account",
    title: ja ? "会員機能について" : "Member features",
    description: ja
      ? "ウォッチリスト・ポートフォリオ管理・通知など、KABUPORTの会員機能の提供予定と現在の状況について。"
      : "About KABUPORT member features: watchlists, portfolio tracking and alerts.",
  });
}

export default async function AccountPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const loc = locale as Locale;
  const t = getDictionary(loc);
  const ja = loc === "ja";

  const features = [
    {
      icon: Star,
      title: ja ? "ウォッチリスト" : "Watchlists",
      body: ja ? "気になる銘柄を複数リストで管理し、メモや注目理由を残せます。" : "Track stocks across multiple lists with notes.",
    },
    {
      icon: BriefcaseBusiness,
      title: ja ? "ポートフォリオ管理" : "Portfolio tracking",
      body: ja ? "保有株数・取得単価から評価損益、年間配当予想、セクター配分を可視化。" : "Positions, P/L, dividend forecasts and sector allocation.",
    },
    {
      icon: BellRing,
      title: ja ? "決算・配当の通知" : "Earnings & dividend alerts",
      body: ja ? "決算発表予定日や権利付き最終日を事前にお知らせします。" : "Alerts before earnings dates and ex-rights days.",
    },
  ];

  return (
    <div className="mx-auto max-w-3xl">
      <Breadcrumbs
        items={[
          { name: t.brand, path: "" },
          { name: ja ? "会員機能" : "Account", path: "account" },
        ]}
        locale={loc}
      />

      <div className="mt-6 card card-pad">
        <span className="chip-gold">{ja ? "準備中" : "Coming soon"}</span>
        <h1 className="mt-4 text-[26px] font-extrabold tracking-tight text-ink sm:text-[32px]">
          {ja ? "会員機能は現在準備中です" : "Member features are in preparation"}
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-muted">
          {ja
            ? "KABUPORTは現在、閲覧・分析機能を無料で公開しています。ログイン・無料登録を伴うウォッチリスト、ポートフォリオ管理、通知機能は、データベース基盤の整備後に提供予定です。準備が整うまでは、登録なしで以下の機能をすべてご利用いただけます。"
            : "KABUPORT currently offers its research features free and without an account. Login-based watchlists, portfolio tracking and alerts will arrive once the database backend is in place. Until then, everything below is available without signing up."}
        </p>

        <ul className="mt-8 grid gap-4 sm:grid-cols-3">
          {features.map((f) => (
            <li key={f.title} className="rounded-2xl border border-line bg-bg p-5">
              <f.icon size={18} className="text-gold-600" aria-hidden />
              <h2 className="mt-3 text-[15px] font-bold text-ink">{f.title}</h2>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{f.body}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6 card card-pad">
        <h2 className="section-title">{ja ? "いま無料で使える機能" : "Available now, free"}</h2>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {[
            { label: ja ? "銘柄検索・スクリーニング" : "Search & screening", href: `/${loc}/stocks` },
            { label: ja ? "AI・定量分析（注目銘柄）" : "Quant analysis", href: `/${loc}/spotlight` },
            { label: ja ? "銘柄比較（最大4銘柄）" : "Compare up to 4 stocks", href: `/${loc}/compare` },
            { label: ja ? "ランキング" : "Rankings", href: `/${loc}/rankings` },
            { label: ja ? "決算・配当カレンダー" : "Earnings & dividend calendars", href: `/${loc}/earnings` },
            { label: ja ? "株主優待データベース" : "Shareholder benefits", href: `/${loc}/benefits` },
          ].map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="flex items-center gap-2.5 rounded-xl border border-line bg-bg px-4 py-3 text-[14px] font-semibold text-ink transition-colors hover:border-line-strong"
              >
                <Check size={15} className="text-success" aria-hidden />
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-[12px] text-muted">
          {ja
            ? "※ 提供時期は変更される場合があります。ポートフォリオ等の個人データは、提供開始時に本人のみがアクセスできる形で厳格に保護します。"
            : "Timing may change. Personal data such as portfolios will be strictly access-controlled to the owner only."}
        </p>
      </div>
    </div>
  );
}
