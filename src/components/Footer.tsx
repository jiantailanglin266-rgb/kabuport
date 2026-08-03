import Link from "next/link";
import type { Locale } from "@/types";
import { getDictionary } from "@/lib/i18n";

export function Footer({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  const about = `/${locale}/about`;
  const links = [
    { label: t.footer.about, href: `${about}#company` },
    { label: t.footer.editorial, href: `${about}#editorial` },
    { label: t.footer.sources, href: `${about}#sources` },
    { label: t.footer.disclosure, href: `${about}#disclosure` },
    { label: t.footer.risk, href: `${about}#risk` },
    { label: t.footer.terms, href: `${about}#terms` },
    { label: t.footer.privacy, href: `${about}#privacy` },
    { label: t.footer.disclaimer, href: `${about}#disclaimer` },
  ];
  const explore = [
    { label: t.nav.stocks, href: `/${locale}/stocks` },
    { label: locale === "ja" ? "チャート注目銘柄" : "Chart Spotlight", href: `/${locale}/spotlight` },
    { label: locale === "ja" ? "銘柄比較" : "Compare", href: `/${locale}/compare` },
    { label: t.nav.rankings, href: `/${locale}/rankings` },
    { label: locale === "ja" ? "業種" : "Industries", href: `/${locale}/industries` },
    { label: locale === "ja" ? "テーマ" : "Themes", href: `/${locale}/themes` },
    { label: locale === "ja" ? "配当カレンダー" : "Dividend calendar", href: `/${locale}/dividends` },
    { label: locale === "ja" ? "株主優待" : "Benefits", href: `/${locale}/benefits` },
    { label: t.nav.earnings, href: `/${locale}/earnings` },
    { label: locale === "ja" ? "証券会社比較" : "Brokers", href: `/${locale}/brokers` },
    { label: t.nav.learn, href: `/${locale}/learn` },
    { label: locale === "ja" ? "学習ロードマップ" : "Learning paths", href: `/${locale}/paths` },
    { label: locale === "ja" ? "用語集" : "Glossary", href: `/${locale}/glossary` },
    { label: locale === "ja" ? "著者・監修者" : "Authors & reviewers", href: `/${locale}/experts` },
  ];
  return (
    <footer className="mt-16 border-t border-line bg-card">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="text-lg font-bold text-ink">{t.brand}</div>
            <p className="mt-1 max-w-sm text-sm text-muted">Japan Equity Intelligence — {t.home.disclaimerShort}</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <nav className="grid gap-2 text-sm" aria-label={locale === "ja" ? "探す" : "Explore"}>
              <div className="text-xs font-semibold uppercase text-ink">{locale === "ja" ? "探す" : "Explore"}</div>
              {explore.map((l) => (
                <Link key={l.href} href={l.href} className="text-muted hover:text-ink">{l.label}</Link>
              ))}
            </nav>
            <nav className="grid gap-2 text-sm" aria-label={locale === "ja" ? "方針・法的情報" : "Policies"}>
              <div className="text-xs font-semibold uppercase text-ink">{locale === "ja" ? "方針・法的情報" : "Policies"}</div>
              {links.map((l) => (
                <Link key={l.href} href={l.href} className="text-muted hover:text-ink">{l.label}</Link>
              ))}
            </nav>
          </div>
        </div>
        <p className="mt-8 border-t border-line pt-6 text-xs text-muted">
          © {t.brand}. {t.footer.rights} {t.common.notInvestmentAdvice}.
        </p>
      </div>
    </footer>
  );
}
