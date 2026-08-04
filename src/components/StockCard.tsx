import Link from "next/link";
import type { Locale } from "@/types";
import type { StockSummary } from "@/lib/queries";
import { getDictionary, pick } from "@/lib/i18n";
import { formatNumber, formatRatio, formatYenCompact, formatYen } from "@/lib/format";
import { PriceChange } from "./PriceChange";
import { CompanyLogo } from "./media/CompanyLogo";

export function StockCard({ s, locale }: { s: StockSummary; locale: Locale }) {
  const t = getDictionary(locale);
  const seg = t.segments[s.company.segment] ?? s.company.segment;
  return (
    <Link
      href={`/${locale}/stocks/${s.company.code}`}
      className="group flex flex-col gap-2 rounded-2xl border border-line bg-card p-4 transition hover:border-brand hover:shadow-sm"
    >
      <div className="flex items-start gap-2.5">
        <CompanyLogo
          code={s.company.code}
          fallbackText={s.company.logoText}
          name={pick(locale, s.company.nameJa, s.company.nameEn)}
          size={36}
        />
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold text-ink group-hover:text-brand">
            {pick(locale, s.company.nameJa, s.company.nameEn)}
          </div>
          <div className="tabular text-xs text-muted">
            {s.company.code} ・ {seg}
          </div>
        </div>
      </div>
      <div className="flex items-end justify-between">
        <div className="tabular text-xl font-bold text-ink">{formatYen(s.quote.price, locale)}</div>
        <PriceChange change={s.change} changePct={s.changePct} size="sm" />
      </div>
      <dl className="mt-1 grid grid-cols-3 gap-1 text-[11px] text-muted">
        <div>
          <dt>{t.common.yield}</dt>
          <dd className="tabular font-medium text-ink">{formatRatio(s.valuation?.dividendYield)}</dd>
        </div>
        <div>
          <dt>{t.common.per}</dt>
          <dd className="tabular font-medium text-ink">{s.valuation?.per ? `${formatNumber(s.valuation.per, 1)}倍` : "—"}</dd>
        </div>
        <div>
          <dt>{t.common.minInvestment}</dt>
          <dd className="tabular font-medium text-ink">{formatYenCompact(s.minInvestment, locale)}</dd>
        </div>
      </dl>
    </Link>
  );
}
