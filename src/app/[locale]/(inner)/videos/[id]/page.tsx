import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Radio, Youtube } from "lucide-react";
import type { Locale } from "@/types";
import { LOCALES } from "@/types";
import { getDictionary, isLocale, pick } from "@/lib/i18n";
import { buildMetadata, localizedUrl } from "@/lib/seo";
import { breadcrumbLd } from "@/lib/jsonld";
import { getRelatedVideos, getVideo, listVideoIds } from "@/lib/queries";
import { getProviders } from "@/lib/providers";
import { formatCompactCount, formatDate, formatDuration } from "@/lib/format";
import { VIDEO_CATEGORY } from "@/lib/videoMeta";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { VideoPlayer } from "@/components/video/VideoPlayer";
import { VideoCard } from "@/components/video/VideoCard";

export function generateStaticParams() {
  return LOCALES.flatMap((locale) => listVideoIds().map((id) => ({ locale, id })));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; id: string }> }): Promise<Metadata> {
  const { locale, id } = await params;
  const loc: Locale = isLocale(locale) ? locale : "ja";
  const v = getVideo(id);
  if (!v) return buildMetadata({ locale: loc, path: `videos/${id}`, title: id, description: "", noindex: true });
  return buildMetadata({
    locale: loc,
    path: `videos/${id}`,
    title: pick(loc, v.titleJa, v.titleEn),
    description: pick(loc, v.descriptionJa, v.descriptionEn),
  });
}

export default async function VideoDetailPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  const loc = locale as Locale;
  const t = getDictionary(loc);
  const ja = loc === "ja";
  const v = getVideo(id);
  if (!v) notFound();

  const cat = VIDEO_CATEGORY[v.category];
  const title = pick(loc, v.titleJa, v.titleEn);
  const related = getRelatedVideos(id, 4);
  const company = getProviders().company;
  const themes = getProviders().company.listThemes();

  // VideoObject は「画面表示と一致し、かつ実在する動画」に限定する。
  // モック段階（youtubeId 無し）では出力しない（架空の動画を構造化データに出さない）。
  const ld: Record<string, unknown>[] = [
    breadcrumbLd(
      [{ name: t.brand, path: "" }, { name: ja ? "動画" : "Videos", path: "videos" }, { name: title, path: `videos/${id}` }],
      loc,
    ),
  ];
  if (v.youtubeId) {
    ld.push({
      "@context": "https://schema.org",
      "@type": "VideoObject",
      name: title,
      description: pick(loc, v.descriptionJa, v.descriptionEn),
      uploadDate: v.publishedAt,
      duration: `PT${Math.floor(v.durationSec / 60)}M${v.durationSec % 60}S`,
      embedUrl: `https://www.youtube-nocookie.com/embed/${v.youtubeId}`,
      url: localizedUrl(loc, `videos/${id}`),
    });
  }

  return (
    <div className="space-y-8">
      <JsonLd data={ld} />
      <Breadcrumbs
        items={[
          { name: t.brand, path: "" },
          { name: ja ? "動画" : "Videos", path: "videos" },
          { name: title, path: `videos/${id}` },
        ]}
        locale={loc}
      />

      <div className="grid gap-8 lg:grid-cols-[1.7fr_1fr]">
        {/* 本編 */}
        <article>
          <VideoPlayer video={v} locale={loc} />

          <div className="mt-6">
            <div className="flex flex-wrap items-center gap-2">
              <Link href={`/${loc}/videos`} className="chip hover:border-line-strong">
                {pick(loc, cat.ja, cat.en)}
              </Link>
              <span className="chip-gold">
                <Youtube size={11} /> {ja ? "モックデータ" : "Mock data"}
              </span>
            </div>

            <h1 className="mt-4 text-[24px] font-extrabold leading-snug tracking-tight text-ink sm:text-[28px]">{title}</h1>

            <div className="num mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line pb-5 text-[12.5px] text-muted">
              <span className="inline-flex items-center gap-1.5 font-bold text-ink-2">
                <Radio size={13} className="text-gold-600" aria-hidden />
                {pick(loc, v.channelJa, v.channelEn)}
              </span>
              <span>
                {formatCompactCount(v.viewCount, loc)}
                {ja ? "回視聴" : " views"}
              </span>
              <span>{formatDate(v.publishedAt, loc)}</span>
              <span>{formatDuration(v.durationSec)}</span>
            </div>

            <p className="mt-5 whitespace-pre-line text-[14.5px] leading-relaxed text-ink/90">
              {pick(loc, v.descriptionJa, v.descriptionEn)}
            </p>

            {/* 関連銘柄 */}
            {v.relatedCodes && v.relatedCodes.length > 0 && (
              <section className="mt-8">
                <h2 className="text-[15px] font-extrabold text-ink">{ja ? "動画で扱われている銘柄" : "Stocks covered"}</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {v.relatedCodes.map((code) => {
                    const c = company.getCompany(code);
                    return (
                      <Link
                        key={code}
                        href={`/${loc}/stocks/${code}`}
                        className="inline-flex items-center gap-2 rounded-xl border border-line bg-card px-3.5 py-2 text-[13px] font-bold text-ink transition-all duration-300 ease-smooth hover:-translate-y-0.5 hover:border-line-strong"
                      >
                        {c ? pick(loc, c.nameJa, c.nameEn) : code}
                        <span className="num text-[11px] font-semibold text-muted">{code}</span>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

            {/* 関連テーマ */}
            {v.themeSlugs && v.themeSlugs.length > 0 && (
              <section className="mt-6">
                <h2 className="text-[15px] font-extrabold text-ink">{ja ? "関連テーマ" : "Related themes"}</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {v.themeSlugs.map((slug) => {
                    const th = themes.find((x) => x.slug === slug);
                    return (
                      <Link key={slug} href={`/${loc}/themes/${slug}`} className="chip hover:border-line-strong">
                        {th ? pick(loc, th.nameJa, th.nameEn) : slug}
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

            <p className="mt-8 rounded-2xl border border-line bg-card p-4 text-[11.5px] leading-relaxed text-muted">
              {ja
                ? "本動画は第三者が制作した情報という想定のサンプルであり、当サイトの見解を示すものではありません。内容の正確性は保証されず、特定銘柄の売買を推奨するものでもありません。投資判断はご自身の責任で行ってください。"
                : "This entry is a sample representing third-party content and does not reflect our views. Accuracy is not guaranteed and it is not a recommendation to buy or sell any security."}
            </p>
          </div>
        </article>

        {/* 関連動画 */}
        <aside aria-label={ja ? "関連動画" : "Related videos"}>
          <h2 className="mb-4 text-[15px] font-extrabold text-ink">{ja ? "関連動画" : "Related videos"}</h2>
          <div className="grid gap-4">
            {related.map((r) => (
              <VideoCard key={r.id} video={r} locale={loc} compact />
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
