import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Locale } from "@/types";
import { getDictionary, isLocale, pick } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbLd } from "@/lib/jsonld";
import { getDividendCalendar } from "@/lib/queries";
import { formatDate, formatRatio, formatYen } from "@/lib/format";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const loc: Locale = isLocale(locale) ? locale : "ja";
  return buildMetadata({ locale: loc, path: "dividends", title: loc === "ja" ? "配当カレンダー" : "Dividend Calendar", description: loc === "ja" ? "権利付き最終日・権利落ち日・権利確定日・予想配当・連続増配を月別に確認（サンプルデータ）。" : "Ex-rights, record dates, forecast dividends and streaks by month (sample data)." });
}

export default async function DividendsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const loc = locale as Locale;
  const t = getDictionary(loc);
  const calendar = getDividendCalendar();

  return (
    <div className="space-y-6">
      <JsonLd data={breadcrumbLd([{ name: t.brand, path: "" }, { name: loc === "ja" ? "配当カレンダー" : "Dividends", path: "dividends" }], loc)} />
      <Breadcrumbs items={[{ name: t.brand, path: "" }, { name: loc === "ja" ? "配当カレンダー" : "Dividends", path: "dividends" }]} locale={loc} />
      <div>
        <h1 className="text-2xl font-bold text-ink">{loc === "ja" ? "配当カレンダー" : "Dividend calendar"}</h1>
        <p className="mt-1 text-sm text-muted">
          {loc === "ja" ? "配当は予想値です（確定値と区別）。権利日は変更の可能性があります。" : "Dividends are forecasts (distinct from confirmed). Dates may change."} {t.common.sampleData}
        </p>
      </div>

      {calendar.map(({ month, entries }) => (
        <section key={month} className="space-y-3">
          <h2 className="text-lg font-bold text-ink">{loc === "ja" ? `${month}月 権利確定` : `Record: month ${month}`}</h2>
          <div className="overflow-x-auto rounded-2xl border border-line bg-card">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-line text-xs text-muted">
                  <th scope="col" className="p-3 text-left">{loc === "ja" ? "銘柄" : "Stock"}</th>
                  <th scope="col" className="p-3 text-right">{loc === "ja" ? "予想年間配当" : "Annual (f/c)"}</th>
                  <th scope="col" className="p-3 text-right">{t.common.yield}</th>
                  <th scope="col" className="p-3 text-right">{loc === "ja" ? "連続増配" : "Streak"}</th>
                  <th scope="col" className="p-3 text-right">{loc === "ja" ? "権利落ち日" : "Ex-date"}</th>
                  <th scope="col" className="p-3 text-right">{loc === "ja" ? "権利確定日" : "Record"}</th>
                </tr>
              </thead>
              <tbody className="tabular">
                {entries.map((s) => (
                  <tr key={s.company.code} className="border-b border-line/60 last:border-0">
                    <td className="p-3">
                      <Link href={`/${loc}/stocks/${s.company.code}`} className="font-medium text-ink hover:text-brand">
                        {pick(loc, s.company.nameJa, s.company.nameEn)}
                      </Link>
                      <span className="ml-1 text-xs text-muted">{s.company.code}</span>
                    </td>
                    <td className="p-3 text-right text-ink">{formatYen(s.dividend?.annualDividend, loc)}</td>
                    <td className="p-3 text-right text-ink">{formatRatio(s.dividend?.yieldPct)}</td>
                    <td className="p-3 text-right text-ink">{s.dividend?.consecutiveIncreaseYears ? `${s.dividend.consecutiveIncreaseYears}${loc === "ja" ? "年" : "y"}` : "—"}</td>
                    <td className="p-3 text-right text-muted">{formatDate(s.dividend?.exRightsDate, loc)}</td>
                    <td className="p-3 text-right text-muted">{formatDate(s.dividend?.recordDate, loc)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}
