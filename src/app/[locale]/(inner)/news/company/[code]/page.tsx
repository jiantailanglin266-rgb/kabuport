import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Locale } from "@/types";
import { LOCALES } from "@/types";
import { getDictionary, isLocale, pick } from "@/lib/i18n";
import { buildMetadata, localizedUrl } from "@/lib/seo";
import { breadcrumbLd, itemListLd } from "@/lib/jsonld";
import { listArticles, listNewsCompanies } from "@/lib/news";
import { getProviders } from "@/lib/providers";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { NewsTaxonomyList } from "@/components/news/NewsTaxonomyList";

export function generateStaticParams() {
  return LOCALES.flatMap((locale) => listNewsCompanies().map((c) => ({ locale, code: c.code })));
}

function companyName(code: string, loc: Locale): string {
  const master = getProviders().company.getCompany(code);
  if (master) return pick(loc, master.nameJa, master.nameEn);
  return listNewsCompanies().find((c) => c.code === code)?.name ?? code;
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; code: string }> }): Promise<Metadata> {
  const { locale, code } = await params;
  const loc: Locale = isLocale(locale) ? locale : "ja";
  const ja = loc === "ja";
  const name = companyName(code, loc);
  return buildMetadata({
    locale: loc,
    path: `news/company/${code}`,
    title: ja ? `${name}（${code}）関連ニュース` : `${name} (${code}) news`,
    description: ja
      ? `${name}（${code}）に関連する株式投資ニュースの一覧です。決算・配当・開示などの話題を最新順に掲載しています。`
      : `News related to ${name} (${code}), including earnings, dividends and disclosures.`,
  });
}

export default async function NewsCompanyPage({ params }: { params: Promise<{ locale: string; code: string }> }) {
  const { locale, code } = await params;
  if (!isLocale(locale)) notFound();
  const loc = locale as Locale;
  const t = getDictionary(loc);
  const ja = loc === "ja";

  const articles = listArticles({ company: code });
  if (articles.length === 0) notFound();

  const name = companyName(code, loc);
  const master = getProviders().company.getCompany(code);

  return (
    <>
      <JsonLd
        data={[
          breadcrumbLd(
            [
              { name: t.brand, path: "" },
              { name: ja ? "ニュース" : "News", path: "news" },
              { name: `${name}（${code}）`, path: `news/company/${code}` },
            ],
            loc,
          ),
          itemListLd(name, articles.slice(0, 20).map((a) => ({ name: a.title, url: localizedUrl(loc, `news/${a.slug}`) }))),
        ]}
      />
      <div className="mb-6">
        <Breadcrumbs
          items={[
            { name: t.brand, path: "" },
            { name: ja ? "ニュース" : "News", path: "news" },
            { name: `${name}（${code}）`, path: `news/company/${code}` },
          ]}
          locale={loc}
        />
      </div>
      <NewsTaxonomyList
        locale={loc}
        eyebrow="Company News"
        title={ja ? `${name}（${code}）関連ニュース` : `${name} (${code}) news`}
        description={
          ja
            ? "タイトル・概要から自動判定した関連ニュースです。関連が薄い記事が含まれる場合があります。"
            : "Automatically matched from titles and summaries; some articles may be loosely related."
        }
        articles={articles}
        extra={
          master ? (
            <div className="flex flex-wrap gap-2">
              <Link href={`/${loc}/stocks/${code}`} className="btn-outline h-10 px-5 text-[13px]">
                {ja ? "銘柄ページを見る" : "View stock page"}
              </Link>
            </div>
          ) : undefined
        }
      />
    </>
  );
}
