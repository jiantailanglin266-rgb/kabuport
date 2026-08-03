import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Info, Youtube } from "lucide-react";
import type { Locale } from "@/types";
import { getDictionary, isLocale, pick } from "@/lib/i18n";
import { buildMetadata, localizedUrl } from "@/lib/seo";
import { breadcrumbLd, itemListLd } from "@/lib/jsonld";
import { listVideos } from "@/lib/queries";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { VideoLibrary } from "@/components/video/VideoLibrary";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const loc: Locale = isLocale(locale) ? locale : "ja";
  const ja = loc === "ja";
  return buildMetadata({
    locale: loc,
    path: "videos",
    title: ja ? "株式投資 動画ライブラリ" : "Investing video library",
    description: ja
      ? "相場解説・決算・配当・新NISA・銘柄分析など、日本株に関する動画をカテゴリー別に探せるライブラリ（サンプルデータ）。"
      : "Browse Japanese equity videos by category: markets, earnings, dividends, NISA and analysis (sample data).",
  });
}

export default async function VideosPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const loc = locale as Locale;
  const t = getDictionary(loc);
  const ja = loc === "ja";
  const videos = listVideos();

  return (
    <div className="space-y-8">
      <JsonLd
        data={[
          breadcrumbLd([{ name: t.brand, path: "" }, { name: ja ? "動画" : "Videos", path: "videos" }], loc),
          itemListLd(
            ja ? "株式投資 動画ライブラリ" : "Investing video library",
            videos.map((v) => ({ name: pick(loc, v.titleJa, v.titleEn), url: localizedUrl(loc, `videos/${v.id}`) })),
          ),
        ]}
      />
      <Breadcrumbs items={[{ name: t.brand, path: "" }, { name: ja ? "動画" : "Videos", path: "videos" }]} locale={loc} />

      <header>
        <span className="eyebrow">
          <span className="h-px w-6 bg-gold-600" aria-hidden />
          Video Library
        </span>
        <h1 className="mt-2.5 text-[28px] font-extrabold tracking-tight text-ink sm:text-[34px]">
          {ja ? "株式投資 動画ライブラリ" : "Investing video library"}
        </h1>
        <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-muted">
          {ja
            ? "相場解説・決算の読み方・配当や株主優待・新NISA・銘柄分析など、日本株に関する動画をカテゴリー別に整理しています。"
            : "Japanese equity videos organized by category: market commentary, reading earnings, dividends and benefits, New NISA and company analysis."}
        </p>
      </header>

      {/* モック仕様であることの明示 */}
      <div className="flex items-start gap-3 rounded-2xl border border-gold/30 bg-gold/8 p-4">
        <Youtube size={17} className="mt-0.5 shrink-0 text-gold-600" aria-hidden />
        <div className="text-[12.5px] leading-relaxed text-ink-2">
          <b className="text-ink">{ja ? "モック（サンプル）データです。" : "This library uses mock data."}</b>{" "}
          {ja
            ? "掲載中の動画・チャンネル名・再生回数はすべて架空のサンプルであり、実在の動画とは紐づいていません。YouTube Data API を接続すると、実際の動画情報と埋め込みプレーヤーに切り替わります。"
            : "Titles, channels and view counts are fictional samples and are not linked to real videos. Connecting the YouTube Data API switches this to real listings with embedded players."}
        </div>
      </div>

      <VideoLibrary videos={videos} locale={loc} />

      <div className="flex items-start gap-2.5 rounded-2xl border border-line bg-card p-4">
        <Info size={15} className="mt-0.5 shrink-0 text-muted" aria-hidden />
        <p className="text-[11.5px] leading-relaxed text-muted">
          {ja
            ? "動画は第三者が制作した情報であり、当サイトの見解を示すものではありません。内容の正確性は保証されず、投資助言でもありません。投資判断はご自身の責任で行ってください。"
            : "Videos are third-party content and do not represent our views. Accuracy is not guaranteed and nothing here is investment advice."}
        </p>
      </div>
    </div>
  );
}
