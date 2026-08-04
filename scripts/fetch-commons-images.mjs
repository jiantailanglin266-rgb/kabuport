// Wikimedia Commons から自由ライセンスの画像メタデータを取得する。
//
// 方針（重要）:
//  - 取得対象は Wikimedia Commons のみ。Commons は自由ライセンス/パブリックドメインの
//    ファイルしか受け入れないため、各言語版 Wikipedia にあるフェアユース画像は混入しない。
//  - それでもライセンス欄を必ず検証し、許可リストにあるライセンスのみ採用する。
//  - 企業ロゴは対象外（商標であり、掲載が提携・推奨の誤認を招くため）。
//  - 画像バイナリは保存せず、URL・作者・ライセンス・出典ページを保存して帰属表示に使う。

import { getJson, forEachSequential, fetchWithRetry } from "./lib/http.mjs";
import { nowIso, writeJsonSafe, ROOT } from "./lib/dataset.mjs";
import { join } from "node:path";
import * as fsMod from "node:fs";

const OUT = join(ROOT, "src", "data", "images.json");
const API = "https://commons.wikimedia.org/w/api.php";

/** 採用する自由ライセンス（前方一致）。これ以外は不採用。 */
const ALLOWED_LICENSE_PREFIXES = [
  "cc0",
  "cc-by-1.0",
  "cc-by-2.0",
  "cc-by-2.5",
  "cc-by-3.0",
  "cc-by-4.0",
  "cc-by-sa-1.0",
  "cc-by-sa-2.0",
  "cc-by-sa-2.5",
  "cc-by-sa-3.0",
  "cc-by-sa-4.0",
  "pd",
  "public domain",
];

/** ロゴ・商標・紋章の疑いがあるものは除外する。 */
const EXCLUDE_TITLE_PATTERNS = [
  /logo/i, /wordmark/i, /emblem/i, /trademark/i, /brandmark/i,
  /crest/i, /coat[_ ]of[_ ]arms/i, /icon/i, /\.svg$/i,
];

/** 取得したい画像のスロット定義（テーマ・業種・汎用）。 */
const SLOTS = [
  { key: "theme:semiconductor", search: "silicon wafer semiconductor", alt: "integrated circuit chip macro" },
  { key: "theme:ai", search: "artificial intelligence server computing" },
  { key: "theme:datacenter", search: "data center server room" },
  { key: "theme:ev", search: "electric vehicle charging station" },
  { key: "theme:renewable", search: "solar power plant japan" },
  { key: "theme:inbound", search: "tourists kyoto japan street" },
  { key: "theme:game", search: "video game arcade tokyo" },
  { key: "theme:pharma", search: "pharmaceutical laboratory research" },
  { key: "theme:dx", search: "office computer work digital" },
  { key: "theme:defense", search: "japan coast guard patrol vessel" },
  { key: "theme:high_dividend", search: "japanese yen banknotes coins" },
  { key: "theme:saas", search: "software developer screen code" },
  { key: "sector:banks", search: "bank building tokyo marunouchi" },
  { key: "sector:transport_equip", search: "automobile factory assembly line" },
  { key: "sector:electric_appliances", search: "electronics manufacturing circuit board" },
  { key: "sector:info_comm", search: "telecommunications tower japan" },
  { key: "sector:wholesale", search: "container port yokohama" },
  { key: "sector:retail", search: "shopping street ginza tokyo" },
  { key: "sector:machinery", search: "industrial machinery factory" },
  { key: "sector:pharma", search: "medicine pills laboratory" },
  { key: "site:exchange", search: "Tokyo Stock Exchange building" },
  { key: "site:tokyo", search: "Marunouchi Tokyo buildings", alt: "Tokyo cityscape skyscrapers" },
  { key: "site:learn", search: "library books study desk" },
  { key: "site:market", search: "stock exchange trading floor", alt: "financial newspaper stock prices" },
];

function isAllowedLicense(ext) {
  const raw = String(ext?.License?.value ?? ext?.LicenseShortName?.value ?? "").toLowerCase();
  if (!raw) return false;
  if (/fair[ _-]?use|non[- ]?free|copyright/i.test(raw)) return false;
  return ALLOWED_LICENSE_PREFIXES.some((p) => raw.startsWith(p));
}

/** HTMLタグを落として素のテキストにする（作者欄にリンクが入るため）。 */
function plain(html) {
  return String(html ?? "")
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

async function searchSlot(slot, term = slot.search) {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    generator: "search",
    gsrsearch: `${term} filetype:bitmap`,
    gsrnamespace: "6", // File名前空間
    gsrlimit: "12",
    prop: "imageinfo",
    iiprop: "url|extmetadata|size",
    iiurlwidth: "1280",
    origin: "*",
  });

  const data = await getJson(`${API}?${params}`, { headers: { "User-Agent": "KABUPORT/1.0 (educational stock portal)" } }, {
    label: `commons ${slot.key}`,
  });
  const pages = data?.query?.pages ? Object.values(data.query.pages) : [];

  for (const page of pages) {
    const info = page.imageinfo?.[0];
    if (!info) continue;
    const ext = info.extmetadata ?? {};
    const title = String(page.title ?? "");

    if (EXCLUDE_TITLE_PATTERNS.some((re) => re.test(title))) continue;
    if (!isAllowedLicense(ext)) continue;
    if ((info.width ?? 0) < 900) continue; // 小さすぎる画像は不採用

    const artist = plain(ext.Artist?.value) || plain(ext.Credit?.value) || "Unknown author";
    const licenseName = plain(ext.LicenseShortName?.value) || plain(ext.License?.value);

    return {
      key: slot.key,
      title: title.replace(/^File:/, ""),
      url: info.thumburl ?? info.url,
      width: info.thumbwidth ?? info.width,
      height: info.thumbheight ?? info.height,
      artist: artist.slice(0, 120),
      license: licenseName,
      licenseUrl: plain(ext.LicenseUrl?.value) || null,
      descriptionUrl: info.descriptionurl,
      source: "Wikimedia Commons",
    };
  }
  return null;
}

async function main() {
  console.log(`[commons] ${SLOTS.length}スロット分の画像を検索します（自由ライセンスのみ採用）`);

  // 既存の採用結果を維持し、欠けているスロットだけを埋める
  const existing = (() => {
    try {
      const { readFileSync } = fsMod;
      return JSON.parse(readFileSync(OUT, "utf8")).images ?? [];
    } catch {
      return [];
    }
  })();
  const picked = [...existing];
  const have = new Set(picked.map((i) => i.key));
  const todo = SLOTS.filter((s) => !have.has(s.key));

  if (todo.length === 0) {
    console.log("[commons] すべてのスロットが充足済みです（検索はスキップし、取り込みのみ実行）。");
  } else {
    console.log(`[commons] 未充足 ${todo.length}件を検索します`);
  }

  await forEachSequential(todo, 800, async (slot) => {
    try {
      let img = await searchSlot(slot);
      if (!img && slot.alt) img = await searchSlot(slot, slot.alt);
      if (img) {
        picked.push(img);
        console.log(`[commons] ✓ ${slot.key}: ${img.license} / ${img.title.slice(0, 50)}`);
      } else {
        console.log(`[commons] − ${slot.key}: 条件を満たす画像が見つかりませんでした`);
      }
    } catch (e) {
      console.log(`[commons] ! ${slot.key}: ${e.message}`);
    }
  });

  if (picked.length === 0) {
    console.log("[commons] 採用0件。既存データを維持します。");
    return;
  }

  // 画像を自サイトへ取り込む（Wikimediaへのホットリンクを避け、表示を安定させる）。
  // 自由ライセンスのため複製は可能。帰属表示は引き続き必須なので必ず一緒に保存する。
  const imgDir = join(ROOT, "public", "images", "commons");
  fsMod.mkdirSync(imgDir, { recursive: true });

  await forEachSequential(picked, 1500, async (img) => {
    const fileName = `${img.key.replace(/[:]/g, "-")}.jpg`;
    const dest = join(imgDir, fileName);
    const localUrl = `/images/commons/${fileName}`;
    if (fsMod.existsSync(dest)) {
      img.localUrl = localUrl;
      return;
    }
    try {
      const res = await fetchWithRetry(
        img.url,
        { headers: { "User-Agent": "KABUPORT/1.0 (educational stock portal)" } },
        { label: `download ${img.key}`, retries: 4, timeoutMs: 30000 },
      );
      if (!res.ok) {
        console.log(`[commons] ダウンロード失敗(${res.status}): ${img.key}`);
        return;
      }
      const buf = Buffer.from(await res.arrayBuffer());
      fsMod.writeFileSync(dest, buf);
      img.localUrl = localUrl;
      console.log(`[commons] ↓ ${img.key} (${Math.round(buf.length / 1024)}KB)`);
    } catch (e) {
      console.log(`[commons] ダウンロード例外: ${img.key} ${e.message}`);
    }
  });

  console.log(`[commons] 採用 ${picked.length}/${SLOTS.length}件`);
  writeJsonSafe(OUT, { fetchedAt: nowIso(), source: "Wikimedia Commons", count: picked.length, images: picked }, {
    label: "images.json",
  });
}

main().catch((e) => {
  console.error("[commons] 予期せぬエラー:", e.message);
  process.exit(0);
});
