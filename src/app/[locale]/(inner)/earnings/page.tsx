import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { EarningsPeriod, Locale } from "@/types";
import { getDictionary, isLocale, pick } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbLd } from "@/lib/jsonld";
import { getUpcomingEarnings } from "@/lib/queries";
import { getProviders } from "@/lib/providers";
import { formatDate } from "@/lib/format";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const loc: Locale = isLocale(locale) ? locale : "ja";
  const t = getDictionary(loc);
  return buildMetadata({ locale: loc, path: "earnings", title: t.nav.earnings, description: loc === "ja" ? "日本株の決算発表予定カレンダー（サンプルデータ・発表予定は変更の可能性）。" : "Japanese earnings calendar (sample data; schedules may change)." });
}

const periodLabel = (p: EarningsPeriod, loc: Locale) =>
  loc === "ja"
    ? { full_year: "本決算", q1: "第1四半期", q2: "第2四半期", q3: "第3四半期" }[p]
    : { full_year: "Full year", q1: "Q1", q2: "Q2", q3: "Q3" }[p];

export default async function EarningsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const loc = locale as Locale;
  const t = getDictionary(loc);
  const events = getUpcomingEarnings(50);
  const company = getProviders().company;

  // 日付ごとにグルーピング
  const byDate = new Map<string, typeof events>();
  for (const e of events) {
    const arr = byDate.get(e.scheduledDate) ?? [];
    arr.push(e);
    byDate.set(e.scheduledDate, arr);
  }

  return (
    <div className="space-y-6">
      <JsonLd data={breadcrumbLd([{ name: t.brand, path: "" }, { name: t.nav.earnings, path: "earnings" }], loc)} />
      <Breadcrumbs items={[{ name: t.brand, path: "" }, { name: t.nav.earnings, path: "earnings" }]} locale={loc} />
      <div>
        <h1 className="text-2xl font-bold text-ink">{t.nav.earnings}</h1>
        <p className="mt-1 text-sm text-muted">{loc === "ja" ? "発表予定は変更される可能性があります（出典: サンプルデータ）。" : "Schedules may change (source: sample data)."}</p>
      </div>
      <div className="space-y-4">
        {[...byDate.entries()].map(([date, evs]) => (
          <section key={date} className="rounded-2xl border border-line bg-card p-4">
            <h2 className="tabular mb-2 font-semibold text-ink">{formatDate(date, loc)}</h2>
            <ul className="divide-y divide-line">
              {evs.map((e, i) => {
                const c = company.getCompany(e.code);
                return (
                  <li key={`${e.code}-${i}`} className="flex items-center gap-3 py-2 text-sm">
                    <Link href={`/${loc}/stocks/${e.code}`} className="min-w-0 flex-1 truncate font-medium text-ink hover:text-brand">
                      {c ? pick(loc, c.nameJa, c.nameEn) : e.code} <span className="text-xs text-muted">{e.code}</span>
                    </Link>
                    <span className="rounded bg-line/50 px-2 py-0.5 text-[11px] text-muted">{periodLabel(e.period, loc)}</span>
                    {e.announced && <span className="rounded bg-emerald-100 px-2 py-0.5 text-[11px] text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">{loc === "ja" ? "発表済" : "Done"}</span>}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
