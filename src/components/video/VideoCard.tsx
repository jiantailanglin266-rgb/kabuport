import Link from "next/link";
import { Play } from "lucide-react";
import type { Locale, Video } from "@/types";
import { pick } from "@/lib/i18n";
import { formatCompactCount, formatDate, formatDuration } from "@/lib/format";
import { VIDEO_CATEGORY } from "@/lib/videoMeta";

/**
 * 動画カード。YouTube連携前はサムネイル画像を持たないため、
 * カテゴリー別のグラデーション面で代替する（外部画像を読み込まない＝高速・CLSなし）。
 */
export function VideoCard({ video, locale, compact = false }: { video: Video; locale: Locale; compact?: boolean }) {
  const ja = locale === "ja";
  const cat = VIDEO_CATEGORY[video.category];
  const title = pick(locale, video.titleJa, video.titleEn);

  return (
    <Link href={`/${locale}/videos/${video.id}`} className="card card-hover group flex h-full flex-col overflow-hidden">
      {/* サムネイル */}
      <div className={`relative aspect-video w-full overflow-hidden bg-gradient-to-br ${cat.grad}`}>
        <div className="absolute inset-0 bg-grid opacity-50" aria-hidden />
        <svg className="absolute inset-x-0 bottom-0 h-2/3 w-full opacity-30" viewBox="0 0 320 90" preserveAspectRatio="none" aria-hidden>
          <path d="M0 70 L40 58 L80 64 L120 40 L160 50 L200 26 L240 34 L280 14 L320 22" fill="none" stroke="#fff" strokeWidth="1.6" />
        </svg>
        <span className="absolute left-3 top-3 rounded-lg bg-white/15 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur-sm">
          {pick(locale, cat.ja, cat.en)}
        </span>
        <span className="num absolute bottom-3 right-3 rounded-md bg-navy-900/80 px-1.5 py-0.5 text-[11px] font-bold text-white">
          {formatDuration(video.durationSec)}
        </span>
        {/* 再生アイコン */}
        <span className="absolute inset-0 grid place-items-center" aria-hidden>
          <span className="grid h-12 w-12 place-items-center rounded-full bg-white/12 backdrop-blur-sm transition-all duration-300 ease-smooth group-hover:scale-110 group-hover:bg-gold">
            <Play size={18} className="ml-0.5 fill-white text-white transition-colors group-hover:fill-navy group-hover:text-navy" />
          </span>
        </span>
      </div>

      {/* 本文 */}
      <div className={`flex flex-1 flex-col ${compact ? "p-4" : "p-5"}`}>
        <h3 className={`line-clamp-2 font-bold leading-snug text-ink group-hover:text-primary ${compact ? "text-[13.5px]" : "text-[15px]"}`}>
          {title}
        </h3>
        <div className="mt-2 truncate text-[12px] font-semibold text-muted">{pick(locale, video.channelJa, video.channelEn)}</div>
        <div className="num mt-auto flex items-center gap-2 pt-3 text-[11px] text-muted">
          <span>
            {formatCompactCount(video.viewCount, locale)}
            {ja ? "回視聴" : " views"}
          </span>
          <span className="h-3 w-px bg-line" aria-hidden />
          <span>{formatDate(video.publishedAt, locale)}</span>
        </div>
      </div>
    </Link>
  );
}
