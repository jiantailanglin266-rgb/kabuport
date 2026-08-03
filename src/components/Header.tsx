import Link from "next/link";
import { Search, TrendingUp } from "lucide-react";
import type { Locale } from "@/types";
import { getDictionary, pick } from "@/lib/i18n";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeToggle } from "./ThemeToggle";
import { MobileNav } from "./MobileNav";
import { MarketTicker } from "./MarketTicker";
import { getIndices } from "@/lib/queries";

export interface NavItem {
  label: string;
  href: string;
}

export function buildNav(locale: Locale): NavItem[] {
  const b = `/${locale}`;
  const ja = locale === "ja";
  return [
    { label: ja ? "日本株" : "Stocks", href: `${b}/stocks` },
    { label: ja ? "ランキング" : "Rankings", href: `${b}/rankings` },
    { label: ja ? "AI・定量分析" : "Quant", href: `${b}/spotlight` },
    { label: ja ? "売買シグナル" : "Signals", href: `${b}/signals` },
    { label: ja ? "スクリーニング" : "Screener", href: `${b}/stocks#screener` },
    { label: ja ? "テーマ株" : "Themes", href: `${b}/themes` },
    { label: ja ? "決算" : "Earnings", href: `${b}/earnings` },
    { label: ja ? "配当・優待" : "Dividends", href: `${b}/dividends` },
    { label: ja ? "動画" : "Videos", href: `${b}/videos` },
    { label: "IPO", href: `${b}#ipo` },
    { label: ja ? "市場ニュース" : "News", href: `${b}#news` },
    { label: ja ? "証券会社" : "Brokers", href: `${b}/brokers` },
  ];
}

export function Header({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  const base = `/${locale}`;
  const ja = locale === "ja";
  const nav = buildNav(locale);
  const primary = nav.slice(0, 7);

  return (
    <header className="sticky top-0 z-50">
      {/* 市場ティッカー（Bloomberg風の細帯） */}
      <MarketTicker indices={getIndices()} locale={locale} />

      {/* メインバー: 高さ80px / 白背景 */}
      <div className="border-b border-line bg-surface/92 shadow-header backdrop-blur-md">
        <div className="shell flex h-[68px] items-center gap-6 lg:h-20">
          {/* ロゴ */}
          <Link href={base} className="group flex shrink-0 items-center gap-2.5" aria-label={`${t.brand} ${ja ? "トップページ" : "home"}`}>
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-navy-600 to-navy text-gold shadow-card transition-transform duration-300 ease-smooth group-hover:-translate-y-0.5">
              <TrendingUp size={20} strokeWidth={2.4} />
            </span>
            <span className="flex flex-col leading-none">
              <span className="font-display text-[19px] font-extrabold tracking-tight text-ink">KABUPORT</span>
              <span className="mt-1 hidden text-[9px] font-semibold uppercase tracking-widest text-muted sm:block">
                Japan Equity Intelligence
              </span>
            </span>
          </Link>

          {/* デスクトップナビ */}
          <nav className="hidden flex-1 items-center gap-0.5 xl:flex" aria-label={ja ? "メインナビゲーション" : "Main navigation"}>
            {primary.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="relative rounded-lg px-3 py-2 text-[13.5px] font-bold text-ink-2 transition-colors duration-200 hover:bg-bg hover:text-navy dark:hover:text-gold"
              >
                {n.label}
              </Link>
            ))}
          </nav>

          {/* 右側アクション */}
          <div className="ml-auto flex items-center gap-2 xl:ml-0">
            <form action={`${base}/stocks`} role="search" className="hidden lg:block">
              <div className="relative">
                <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
                <input
                  type="search"
                  name="q"
                  aria-label={t.common.searchPlaceholder}
                  placeholder={ja ? "銘柄名・証券コード" : "Name or ticker"}
                  className="h-10 w-[190px] rounded-xl border border-line bg-bg pl-9 pr-3 text-[13px] text-ink outline-none transition-all duration-300 ease-smooth placeholder:text-muted focus:w-[240px] focus:border-primary/60 focus:bg-surface"
                />
              </div>
            </form>

            <div className="hidden items-center gap-1.5 sm:flex">
              <ThemeToggle />
              <LanguageSwitcher current={locale} />
            </div>

            <Link
              href={`${base}/account`}
              className="hidden h-10 items-center rounded-xl px-3 text-[13.5px] font-bold text-ink-2 transition-colors hover:text-navy dark:hover:text-gold lg:inline-flex"
            >
              {ja ? "ログイン" : "Log in"}
            </Link>
            <Link href={`${base}/account`} className="btn-gold hidden h-10 px-5 text-[13.5px] sm:inline-flex">
              {ja ? "無料登録" : "Sign up"}
            </Link>

            <MobileNav locale={locale} items={nav} />
          </div>
        </div>
      </div>
    </header>
  );
}

export const headerNavLabel = (locale: Locale) => pick(locale, "メニュー", "Menu");
