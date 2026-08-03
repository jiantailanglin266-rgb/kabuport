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
  return (
    <footer className="mt-16 border-t border-line bg-card">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="text-lg font-bold text-ink">{t.brand}</div>
            <p className="mt-1 max-w-sm text-sm text-muted">Japan Equity Intelligence — {t.home.disclaimerShort}</p>
          </div>
          <nav className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-3" aria-label="フッターナビ">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="text-muted hover:text-ink">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <p className="mt-8 border-t border-line pt-6 text-xs text-muted">
          © {t.brand}. {t.footer.rights} {t.common.notInvestmentAdvice}.
        </p>
      </div>
    </footer>
  );
}
