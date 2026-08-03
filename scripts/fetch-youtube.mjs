// YouTube Data API v3 から株式関連動画を取得し src/data/live/youtube.json に書き出す。
// APIキーが無ければ何もせず終了（モックデータのまま。CIは常にgreen）。
//
// 環境変数:
//   YOUTUBE_API_KEY            必須。未設定なら no-op
//   YOUTUBE_CHANNEL_IDS        任意。カンマ区切り。指定時はこのチャンネルの新着を取得
//   YOUTUBE_QUERIES            任意。カンマ区切りの検索語（既定: 日本株関連の汎用語）
//
// 取得ポリシー:
//   - YouTube API 利用規約に従い、動画は必ず公式プレーヤー(埋め込み)で再生する
//   - メタデータのみ保存し、動画本体はダウンロードしない
//   - 取得日時を保持し、UIに出典・基準日時を表示する

import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_DIR = join(ROOT, "src/data/live");
const OUT = join(OUT_DIR, "youtube.json");
const API = "https://www.googleapis.com/youtube/v3";

const KEY = process.env.YOUTUBE_API_KEY;
const CHANNEL_IDS = (process.env.YOUTUBE_CHANNEL_IDS || "").split(",").map((s) => s.trim()).filter(Boolean);
const QUERIES = (process.env.YOUTUBE_QUERIES || "日本株 相場,決算 読み方,新NISA,高配当株,株主優待")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const log = (...a) => console.log("[youtube]", ...a);

/** タイトル/説明からサイト内カテゴリーへ寄せる（決定的なルールベース）。 */
function classify(text) {
  const t = (text || "").toLowerCase();
  const has = (...ks) => ks.some((k) => t.includes(k));
  if (has("ipo", "新規上場")) return "ipo";
  if (has("nisa", "つみたて", "積立")) return "nisa";
  if (has("配当", "優待", "利回り")) return "dividend";
  if (has("決算", "業績", "上方修正", "下方修正")) return "earnings";
  if (has("初心者", "入門", "始め方", "基礎")) return "beginner";
  if (has("分析", "銘柄", "企業")) return "analysis";
  return "market";
}

/** ISO8601 duration (PT1H2M5S) を秒に変換。 */
function durationToSec(iso) {
  const m = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso || "");
  if (!m) return 0;
  return Number(m[1] || 0) * 3600 + Number(m[2] || 0) * 60 + Number(m[3] || 0);
}

async function api(path) {
  const r = await fetch(`${API}${path}&key=${KEY}`);
  if (!r.ok) throw new Error(`${path.split("?")[0]} -> ${r.status}`);
  return r.json();
}

async function searchIds() {
  const ids = new Set();
  const targets = CHANNEL_IDS.length
    ? CHANNEL_IDS.map((c) => `/search?part=id&type=video&order=date&maxResults=10&channelId=${encodeURIComponent(c)}`)
    : QUERIES.map((q) => `/search?part=id&type=video&order=relevance&maxResults=8&regionCode=JP&relevanceLanguage=ja&q=${encodeURIComponent(q)}`);

  for (const path of targets) {
    try {
      const data = await api(path);
      for (const it of data.items || []) if (it.id?.videoId) ids.add(it.id.videoId);
    } catch (e) {
      log("search失敗:", e.message);
    }
  }
  return [...ids];
}

async function main() {
  if (!KEY) {
    log("YOUTUBE_API_KEY が未設定のため取得をスキップ（モックデータのまま）。");
    return;
  }

  const ids = await searchIds();
  if (ids.length === 0) {
    log("該当動画0件。既存データを維持。");
    return;
  }

  const videos = [];
  // videos.list は最大50件/回
  for (let i = 0; i < ids.length; i += 50) {
    const chunk = ids.slice(i, i + 50);
    try {
      const data = await api(`/videos?part=snippet,contentDetails,statistics&id=${chunk.join(",")}`);
      for (const it of data.items || []) {
        const sn = it.snippet || {};
        const title = sn.title || "";
        videos.push({
          id: it.id,
          youtubeId: it.id,
          titleJa: title,
          titleEn: title,
          descriptionJa: (sn.description || "").slice(0, 600),
          descriptionEn: (sn.description || "").slice(0, 600),
          channelJa: sn.channelTitle || "",
          channelEn: sn.channelTitle || "",
          channelId: sn.channelId,
          category: classify(`${title} ${sn.description || ""}`),
          durationSec: durationToSec(it.contentDetails?.duration),
          publishedAt: sn.publishedAt,
          viewCount: Number(it.statistics?.viewCount || 0),
        });
      }
    } catch (e) {
      log("videos.list失敗:", e.message);
    }
  }

  if (videos.length === 0) {
    log("有効データ0件。既存データを維持（上書きしない）。");
    return;
  }

  videos.sort((a, b) => (b.publishedAt || "").localeCompare(a.publishedAt || ""));
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(
    OUT,
    JSON.stringify({ fetchedAt: new Date().toISOString(), source: "YouTube Data API v3", videos }, null, 2) + "\n",
  );
  log(`取得完了: ${videos.length}件 → ${OUT}`);
}

main().catch((e) => {
  console.error("[youtube] 予期せぬエラー:", e);
  process.exit(0);
});
