"use client";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { clsx } from "clsx";
import type { Locale, Video, VideoCategory } from "@/types";
import { getDictionary, pick } from "@/lib/i18n";
import { VIDEO_CATEGORY, VIDEO_CATEGORY_ORDER } from "@/lib/videoMeta";
import { VideoCard } from "./VideoCard";

type Sort = "newest" | "views" | "duration";

/** カテゴリー絞り込み + キーワード検索 + 並び替え。件数は即時反映。 */
export function VideoLibrary({ videos, locale }: { videos: Video[]; locale: Locale }) {
  const t = getDictionary(locale);
  const ja = locale === "ja";
  const [cat, setCat] = useState<VideoCategory | "all">("all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>("newest");

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const v of videos) m.set(v.category, (m.get(v.category) ?? 0) + 1);
    return m;
  }, [videos]);

  const results = useMemo(() => {
    const kw = q.trim().toLowerCase();
    const list = videos.filter((v) => {
      if (cat !== "all" && v.category !== cat) return false;
      if (!kw) return true;
      const hay = [v.titleJa, v.titleEn, v.channelJa, v.channelEn, v.descriptionJa, v.descriptionEn].join(" ").toLowerCase();
      return hay.includes(kw);
    });
    return [...list].sort((a, b) => {
      if (sort === "views") return b.viewCount - a.viewCount;
      if (sort === "duration") return a.durationSec - b.durationSec;
      return b.publishedAt.localeCompare(a.publishedAt);
    });
  }, [videos, cat, q, sort]);

  const chip = (active: boolean) =>
    clsx(
      "shrink-0 rounded-xl px-3.5 py-2 text-[12.5px] font-bold transition-all duration-200",
      active ? "bg-navy text-white shadow-card" : "border border-line bg-card text-ink-2 hover:border-line-strong hover:text-ink",
    );

  return (
    <div className="space-y-6">
      {/* コントロール */}
      <div className="card p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              type="search"
              aria-label={ja ? "動画を検索" : "Search videos"}
              placeholder={ja ? "キーワード・チャンネル名で検索" : "Search by keyword or channel"}
              className="h-11 w-full rounded-xl border border-line bg-bg pl-10 pr-3 text-[13.5px] text-ink outline-none transition-colors placeholder:text-muted focus:border-primary/60"
            />
          </div>
          <label className="flex shrink-0 items-center gap-2 text-[12px] font-bold text-muted">
            {ja ? "並び替え" : "Sort"}
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="h-11 rounded-xl border border-line bg-bg px-3 text-[13px] font-semibold text-ink outline-none focus:border-primary/60"
            >
              <option value="newest">{ja ? "新着順" : "Newest"}</option>
              <option value="views">{ja ? "再生回数順" : "Most viewed"}</option>
              <option value="duration">{ja ? "短い順" : "Shortest"}</option>
            </select>
          </label>
        </div>

        <div className="scroll-x mt-4 flex gap-2 overflow-x-auto pb-1">
          <button onClick={() => setCat("all")} className={chip(cat === "all")}>
            {t.common.all} <span className="num ml-1 opacity-60">{videos.length}</span>
          </button>
          {VIDEO_CATEGORY_ORDER.filter((c) => counts.get(c)).map((c) => (
            <button key={c} onClick={() => setCat(c)} className={chip(cat === c)}>
              {pick(locale, VIDEO_CATEGORY[c].ja, VIDEO_CATEGORY[c].en)}
              <span className="num ml-1 opacity-60">{counts.get(c)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="text-[13px] text-muted" aria-live="polite">
        <span className="num font-extrabold text-ink">{results.length}</span> {ja ? "件の動画" : "videos"}
      </div>

      {results.length === 0 ? (
        <div className="card p-12 text-center text-muted">{ja ? "該当する動画がありません" : "No videos found"}</div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((v) => (
            <VideoCard key={v.id} video={v} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}
