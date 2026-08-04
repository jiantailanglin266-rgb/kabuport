import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExternalLink, ImageIcon } from "lucide-react";
import type { Locale } from "@/types";
import { getDictionary, isLocale } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo";
import { listLogos, listPhotos } from "@/lib/images";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CommonsImage } from "@/components/media/CommonsImage";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const loc: Locale = isLocale(locale) ? locale : "ja";
  const ja = loc === "ja";
  return buildMetadata({
    locale: loc,
    path: "credits",
    title: ja ? "画像クレジット" : "Image credits",
    description: ja
      ? "当サイトで使用している画像の作者・ライセンス・出典の一覧。すべて Wikimedia Commons の自由ライセンス画像です。"
      : "Authors, licenses and sources for images used on this site — all freely licensed via Wikimedia Commons.",
  });
}

export default async function CreditsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const loc = locale as Locale;
  const t = getDictionary(loc);
  const ja = loc === "ja";
  const photos = listPhotos();
  const logos = listLogos();

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <Breadcrumbs items={[{ name: t.brand, path: "" }, { name: ja ? "画像クレジット" : "Image credits", path: "credits" }]} locale={loc} />

      <header>
        <span className="eyebrow">
          <span className="h-px w-6 bg-gold-600" aria-hidden />
          Image Credits
        </span>
        <h1 className="mt-2.5 text-[28px] font-extrabold tracking-tight text-ink sm:text-[32px]">
          {ja ? "画像クレジット" : "Image credits"}
        </h1>
        <p className="mt-3 text-[14px] leading-relaxed text-muted">
          {ja
            ? "当サイトの写真は、すべて Wikimedia Commons の自由ライセンス（CC BY / CC BY-SA / CC0 / パブリックドメイン）画像です。各画像の作者・ライセンス・原典は以下のとおりです。"
            : "All photos on this site are freely licensed images from Wikimedia Commons (CC BY / CC BY-SA / CC0 / public domain). Author, license and source for each are listed below."}
        </p>
      </header>

      <section className="card card-pad">
        <h2 className="flex items-center gap-2 text-[15px] font-extrabold text-ink">
          <ImageIcon size={16} className="text-gold-600" aria-hidden />
          {ja ? "画像の取り扱い方針" : "Image policy"}
        </h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[12.5px] leading-relaxed text-muted">
          <li>
            {ja
              ? "Wikimedia Commons は自由ライセンス／パブリックドメインのファイルのみを扱うため、各言語版Wikipediaのフェアユース画像は使用していません。"
              : "Wikimedia Commons hosts only freely licensed or public-domain files, so no fair-use images from language Wikipedias are used."}
          </li>
          <li>
            {ja
              ? "取り込み時にライセンス欄を検証し、許可リストにあるライセンスのみ採用しています。"
              : "Licenses are verified at fetch time; only allow-listed licenses are accepted."}
          </li>
          <li>
            <b className="text-ink">{ja ? "写真は日本国内で撮影されたものに限定しています。" : "Photos are limited to those taken in Japan."}</b>{" "}
            {ja
              ? "取り込み時に撮影地の座標（日本の緯度経度の範囲内か）で機械的に判定し、座標が無い場合は説明・カテゴリーの記載で確認しています。"
              : "Verified mechanically by capture coordinates within Japan's bounding box, or by description/category when coordinates are absent."}
          </li>
          <li>
            <b className="text-ink">
              {ja ? "企業ロゴは、著作権フリーと明示されたもののみ使用しています。" : "Company logos are used only where explicitly free of copyright."}
            </b>{" "}
            {ja
              ? "各言語版Wikipediaにあるフェアユース（再利用不可）のロゴは使用していません。Commons上で PD-textlogo 等と明示されたロゴのみを採用し、見つからない企業は頭文字で表示しています。"
              : "Fair-use logos hosted on language Wikipedias are never used. Only logos marked free on Commons (e.g. PD-textlogo) are shown; companies without one fall back to initials."}
          </li>
          <li>
            <b className="text-ink">{ja ? "ロゴは商標です。" : "Logos are trademarks."}</b>{" "}
            {ja
              ? "当サイトでの表示は、該当企業を識別する目的によるものであり、当サイトと各企業との提携・後援・推奨関係を示すものではありません。各商標はそれぞれの権利者に帰属します。"
              : "They are shown to identify the company concerned and do not indicate any affiliation, sponsorship or endorsement. All trademarks belong to their respective owners."}
          </li>
          <li>
            {ja
              ? "写真は各テーマ・業種のイメージであり、特定の企業・銘柄を表すものではありません。"
              : "Photos are illustrative of a theme or sector and do not depict any specific company or security."}
          </li>
        </ul>
      </section>

      {/* 企業ロゴ */}
      {logos.length > 0 && (
        <section>
          <h2 className="section-title mb-2">{ja ? `企業ロゴ（${logos.length}点）` : `Company logos (${logos.length})`}</h2>
          <p className="mb-5 text-[12px] text-muted">
            {ja
              ? "いずれも Wikimedia Commons 上で著作権フリーと明示されたものです。商標は各権利者に帰属します。"
              : "All marked free of copyright on Wikimedia Commons. Trademarks belong to their respective owners."}
          </p>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {logos.map((img) => (
              <li key={img.key} className="card flex items-center gap-3 p-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg border border-line bg-white p-1">
                  <CommonsImage image={img} alt={img.title} className="h-full w-full" overlay="none" credit="corner" imgClassName="object-contain" />
                </span>
                <div className="min-w-0">
                  <a
                    href={img.descriptionUrl}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="block truncate text-[12.5px] font-bold text-ink hover:text-primary"
                  >
                    {img.title}
                  </a>
                  <div className="num text-[11px] text-muted">
                    {img.key.replace("logo:", "")} ・ {img.license}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="section-title mb-5">
          {ja ? `写真（日本国内・${photos.length}点）` : `Photos taken in Japan (${photos.length})`}
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2">
          {photos.map((img) => (
            <li key={img.key} className="card overflow-hidden">
              <CommonsImage image={img} alt={img.title} className="h-32 w-full" overlay="none" credit="corner" />
              <div className="p-4">
                <div className="num text-[10.5px] font-bold uppercase tracking-widest text-muted">{img.key}</div>
                <a
                  href={img.descriptionUrl}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="mt-1 inline-flex items-start gap-1 text-[13px] font-bold leading-snug text-ink hover:text-primary"
                >
                  {img.title}
                  <ExternalLink size={11} className="mt-0.5 shrink-0" aria-hidden />
                </a>
                <dl className="mt-2 space-y-0.5 text-[11.5px] text-muted">
                  <div className="flex gap-1.5">
                    <dt className="shrink-0">{ja ? "作者:" : "Author:"}</dt>
                    <dd className="truncate text-ink-2">{img.artist}</dd>
                  </div>
                  <div className="flex gap-1.5">
                    <dt className="shrink-0">{ja ? "ライセンス:" : "License:"}</dt>
                    <dd className="text-ink-2">
                      {img.licenseUrl ? (
                        <a href={img.licenseUrl} target="_blank" rel="noopener noreferrer nofollow" className="hover:underline">
                          {img.license}
                        </a>
                      ) : (
                        img.license
                      )}
                    </dd>
                  </div>
                </dl>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
