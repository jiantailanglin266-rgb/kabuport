import Link from "next/link";
import { Search, TrendingUp } from "lucide-react";
import type { Locale } from "@/types";
import { getDictionary } from "@/lib/i18n";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeToggle } from "./ThemeToggle";

export function Header({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  const base = `/${locale}`;
  const nav = [
    { label: t.nav.stocks, href: `${base}/stocks` },
    { label: t.nav.rankings, href: `${base}/rankings` },
    { label: locale === "ja" ? "業種" : "Industries", href: `${base}/industries` },
    { label: locale === "ja" ? "テーマ" : "Themes", href: `${base}/themes` },
    { label: t.nav.earnings, href: `${base}/earnings` },
    { label: t.nav.learn, href: `${base}/learn` },
  ];
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-card/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link href={base} className="flex items-center gap-2 font-bold tracking-tight text-ink">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-navy to-brand text-white">
            <TrendingUp size={18} />
          </span>
          <span className="text-lg">{t.brand}</span>
        </Link>

        <nav className="hidden items-center gap-1 text-sm md:flex" aria-label="メインナビゲーション">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="rounded-md px-3 py-1.5 text-muted hover:bg-line/40 hover:text-ink">
              {n.label}
            </Link>
          ))}
        </nav>

        <form action={`${base}/stocks`} className="ml-auto hidden items-center md:flex" role="search">
          <div className="relative">
            <Search size={15} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
            <input
              name="q"
              type="search"
              aria-label={t.common.searchPlaceholder}
              placeholder={t.common.searchPlaceholder}
              className="w-64 rounded-full border border-line bg-bg py-1.5 pl-8 pr-3 text-sm text-ink outline-none focus:border-brand"
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <ThemeToggle />
          <LanguageSwitcher current={locale} />
        </div>
      </div>

      {/* モバイル用ナビ */}
      <nav className="flex gap-1 overflow-x-auto border-t border-line px-3 py-2 text-sm md:hidden" aria-label="モバイルナビゲーション">
        {nav.map((n) => (
          <Link key={n.href} href={n.href} className="whitespace-nowrap rounded-md px-3 py-1 text-muted hover:text-ink">
            {n.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
