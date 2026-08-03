import { notFound } from "next/navigation";
import { LOCALES } from "@/types";
import { isLocale } from "@/lib/i18n";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { LangSync } from "@/components/LangSync";
import { DataStatusBanner } from "@/components/data/DataStatus";
import { getDataset, hasRealMarketData } from "@/lib/dataset";

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <div className="flex min-h-screen flex-col">
      <LangSync locale={locale} />
      <Header locale={locale} />
      <DataStatusBanner meta={getDataset().meta} locale={locale} usingSampleContent={!hasRealMarketData()} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer locale={locale} />
    </div>
  );
}
