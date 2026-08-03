import { Play, Youtube } from "lucide-react";
import type { Locale, Video } from "@/types";
import { pick } from "@/lib/i18n";
import { formatDuration } from "@/lib/format";
import { VIDEO_CATEGORY } from "@/lib/videoMeta";

/**
 * 再生領域。
 * - youtubeId がある（＝YouTube Data API 接続済み）場合のみ、youtube-nocookie の埋め込みを描画。
 * - モック段階では実在しないIDを埋め込むと404になるため、明示的なプレースホルダーを出す。
 */
export function VideoPlayer({ video, locale }: { video: Video; locale: Locale }) {
  const ja = locale === "ja";
  const cat = VIDEO_CATEGORY[video.category];
  const title = pick(locale, video.titleJa, video.titleEn);

  if (video.youtubeId) {
    return (
      <div className="overflow-hidden rounded-2xl border border-line bg-navy-900">
        <div className="relative aspect-video w-full">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?rel=0`}
            title={title}
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            className="absolute inset-0 h-full w-full border-0"
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`relative aspect-video w-full overflow-hidden rounded-2xl border border-line bg-gradient-to-br ${cat.grad}`}>
      <div className="absolute inset-0 bg-grid opacity-50" aria-hidden />
      <svg className="absolute inset-x-0 bottom-0 h-1/2 w-full opacity-25" viewBox="0 0 640 120" preserveAspectRatio="none" aria-hidden>
        <path d="M0 96 L80 78 L160 86 L240 54 L320 66 L400 34 L480 46 L560 18 L640 30" fill="none" stroke="#fff" strokeWidth="2" />
      </svg>

      <div className="absolute inset-0 grid place-items-center px-6 text-center">
        <div>
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-white/12 backdrop-blur-sm" aria-hidden>
            <Play size={26} className="ml-1 fill-white/85 text-white/85" />
          </span>
          <p className="mt-5 text-[13px] font-bold text-white/90">
            {ja ? "この動画はサンプル（モック）です" : "This video is a mock sample"}
          </p>
          <p className="mx-auto mt-2 max-w-md text-[11.5px] leading-relaxed text-white/60">
            {ja
              ? "YouTube Data API を接続すると、この領域に実際の動画プレーヤーが表示されます。現在は実在の動画とは紐づいていません。"
              : "Once the YouTube Data API is connected, a real player appears here. This entry is not linked to an actual video."}
          </p>
        </div>
      </div>

      <span className="num absolute bottom-3 right-3 rounded-md bg-navy-900/80 px-2 py-1 text-[11.5px] font-bold text-white">
        {formatDuration(video.durationSec)}
      </span>
      <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-lg bg-white/12 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-widest text-white backdrop-blur-sm">
        <Youtube size={12} /> {ja ? "モック" : "Mock"}
      </span>
    </div>
  );
}
