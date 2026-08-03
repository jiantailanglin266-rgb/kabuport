import { notFound } from "next/navigation";
import { LOCALES } from "@/types";
import { isLocale } from "@/lib/i18n";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { LangSync } from "@/components/LangSync";

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
    <>
      <LangSync locale={locale} />
      <Header locale={locale} />
      <main className="mx-auto min-h-[60vh] max-w-6xl px-4 py-6">{children}</main>
      <Footer locale={locale} />
    </>
  );
}
