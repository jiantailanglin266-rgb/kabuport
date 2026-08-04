// Wikimedia Commons から画像を取得する（写真は日本国内限定 / ロゴは自由ライセンス限定）。
//
// 方針（重要）:
//  - 取得対象は Wikimedia Commons のみ。Commons は自由ライセンス/パブリックドメインの
//    ファイルしか受け入れないため、各言語版 Wikipedia のフェアユース画像は混入しない。
//  - ライセンス欄を必ず検証し、許可リストにあるライセンスのみ採用する。
//  - 写真: 日本国内で撮影されたものに限定する（座標が日本の範囲内、または
//    タイトル/説明に日本を示す語があること）。
//  - ロゴ: Commons上で著作権フリー（PD-textlogo 等）と明示されたもののみ。
//    商標であるため、識別目的での使用であり提携・推奨を示さない旨を必ず併記する。
//  - 画像は自サイトへ取り込む（ホットリンク回避）。帰属表示は常に保存する。

import { getJson, forEachSequential, fetchWithRetry } from "./lib/http.mjs";
import { nowIso, writeJsonSafe, ROOT } from "./lib/dataset.mjs";
import { join } from "node:path";
import * as fsMod from "node:fs";

const OUT = join(ROOT, "src", "data", "images.json");
const API = "https://commons.wikimedia.org/w/api.php";
const UA = { "User-Agent": "KABUPORT/1.0 (educational Japanese stock portal)" };

/** 採用する自由ライセンス（前方一致）。これ以外は不採用。 */
const ALLOWED_LICENSE_PREFIXES = [
  "cc0", "cc-by-1.0", "cc-by-2.0", "cc-by-2.5", "cc-by-3.0", "cc-by-4.0",
  "cc-by-sa-1.0", "cc-by-sa-2.0", "cc-by-sa-2.5", "cc-by-sa-3.0", "cc-by-sa-4.0",
  "pd", "public domain",
];

/** 日本の緯度経度の範囲（南西諸島・小笠原を含む）。 */
const JAPAN_BBOX = { latMin: 20.2, latMax: 45.8, lonMin: 122.8, lonMax: 154.0 };

/** 日本を示す語（座標が無い場合の判定に使う）。 */
const JAPAN_HINTS = [
  "japan", "japanese", "日本", "東京", "tokyo", "osaka", "大阪", "kyoto", "京都",
  "nagoya", "名古屋", "yokohama", "横浜", "kobe", "神戸", "fukuoka", "福岡",
  "sapporo", "札幌", "hokkaido", "北海道", "okinawa", "沖縄", "prefecture", "県",
  "shibuya", "shinjuku", "ginza", "銀座", "marunouchi", "丸の内", "akihabara",
];

/** 写真スロット（すべて日本国内で撮影されたものを狙う検索語）。 */
const PHOTO_SLOTS = [
  { key: "theme:semiconductor", search: "semiconductor factory Japan", alt: "clean room Japan electronics" },
  { key: "theme:ai", search: "robot Japan exhibition", alt: "computer room Japan" },
  { key: "theme:datacenter", search: "data center Japan", alt: "server room Japan" },
  { key: "theme:ev", search: "electric vehicle charging Japan", alt: "Nissan Leaf Japan" },
  { key: "theme:renewable", search: "solar power plant Japan", alt: "wind farm Japan" },
  { key: "theme:inbound", search: "tourists Kyoto Japan", alt: "Asakusa Tokyo tourists" },
  { key: "theme:game", search: "game arcade Akihabara Tokyo", alt: "Akihabara electric town" },
  { key: "theme:pharma", search: "pharmacy Japan", alt: "hospital Japan interior" },
  { key: "theme:dx", search: "office Tokyo interior", alt: "coworking space Japan" },
  { key: "theme:defense", search: "Japan Coast Guard vessel", alt: "Japan Maritime Self-Defense Force ship" },
  { key: "theme:high_dividend", search: "Japanese yen banknotes", alt: "Bank of Japan building" },
  { key: "theme:saas", search: "Tokyo office workers", alt: "Japan startup office" },
  { key: "sector:banks", search: "bank building Marunouchi Tokyo", alt: "Bank of Japan headquarters" },
  { key: "sector:transport_equip", search: "Toyota factory Japan", alt: "Japanese car manufacturing plant" },
  { key: "sector:electric_appliances", search: "electronics store Akihabara", alt: "Japan electronics factory" },
  { key: "sector:info_comm", search: "Tokyo Skytree tower", alt: "telecommunications tower Japan" },
  { key: "sector:wholesale", search: "Port of Yokohama container", alt: "Tokyo port container terminal" },
  { key: "sector:retail", search: "Ginza street Tokyo", alt: "shopping street Japan" },
  { key: "sector:machinery", search: "factory machinery Japan", alt: "Japan industrial plant" },
  { key: "sector:pharma", search: "drugstore Japan", alt: "laboratory Japan research" },
  { key: "site:exchange", search: "Tokyo Stock Exchange", alt: "Tokyo Stock Exchange building Nihonbashi" },
  { key: "site:tokyo", search: "Marunouchi Tokyo buildings", alt: "Tokyo skyline Shinjuku" },
  { key: "site:learn", search: "library Japan interior", alt: "Japanese university library" },
  { key: "site:market", search: "Nihonbashi Tokyo", alt: "Otemachi Tokyo business district" },
];

/** ロゴ対象（サイト掲載中の銘柄）。Commonsに自由ライセンスのロゴがある場合のみ採用。 */
// mustAny: ファイル名にいずれかが含まれること（社名の取り違えを防ぐ）
// deny:    含まれていたら不採用（子会社・別事業・サービスロゴの誤用を防ぐ）
const LOGO_TARGETS = [
  { code: "7203", search: "Toyota logo", mustAny: ["toyota"], deny: ["3d", "gazoo", "racing", "industries", "tsusho", "boshoku", "auto body", "city"] },
  { code: "6758", search: "Sony logo", mustAny: ["sony"], deny: ["ericsson", "music", "pictures", "interactive", "bmg", "computer entertainment", "bank"] },
  { code: "9432", search: "NTT logo", mustAny: ["ntt", "nippon telegraph"], deny: ["docomo", "data", "east", "west", "urban", "comware", "facilities", "advertising"] },
  { code: "8306", search: "Mitsubishi UFJ Financial Group logo", mustAny: ["mitsubishi ufj", "mufg"], deny: ["acom", "morgan", "nicos", "lease", "securities"] },
  { code: "9984", search: "SoftBank Group logo", mustAny: ["softbank"], deny: ["hawks", "telecom", "mobile", "bb", "robotics", "aldebaran", "pepper", "vision fund", "payment"] },
  { code: "6861", search: "Keyence logo", mustAny: ["keyence"], deny: [] },
  { code: "8058", search: "Mitsubishi Corporation logo", mustAny: ["mitsubishi corporation", "mitsubishi shoji"], deny: ["gas", "chemical", "motors", "electric", "heavy", "estate", "materials", "logistics", "fuso"] },
  { code: "4502", search: "Takeda Pharmaceutical logo", mustAny: ["takeda"], deny: ["shingen", "clan", "castle", "riken"] },
  { code: "7974", search: "Nintendo logo", mustAny: ["nintendo"], deny: ["wi-fi", "wifi", "connection", "network", "3ds", "ds ", "switch", "wii", "gamecube", "64", "eshop", "e-shop", "entertainment system", "power", "labo", "amiibo", "music", "neon", "sign", "dsi", "game boy", "virtual boy", "super", "world", "universal", "museum", "store", "tokyo"] },
  { code: "8035", search: "Tokyo Electron logo", mustAny: ["tokyo electron"], deny: ["device", "miyagi", "kyushu"] },
  { code: "9433", search: "KDDI logo", mustAny: ["kddi"], deny: ["au ", "evolva"] },
  { code: "6098", search: "Recruit Holdings logo", mustAny: ["recruit holdings", "recruit co", "recruit group"], deny: ["agent", "staffing", "lifestyle", "jobs", "career"] },
];

function isAllowedLicense(ext) {
  const raw = String(ext?.License?.value ?? ext?.LicenseShortName?.value ?? "").toLowerCase();
  if (!raw) return false;
  if (/fair[ _-]?use|non[- ]?free/i.test(raw)) return false;
  return ALLOWED_LICENSE_PREFIXES.some((p) => raw.startsWith(p));
}

function plain(html) {
  return String(html ?? "")
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#0?39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/** 日本国内の写真かを判定する。座標があれば座標優先、無ければ語句で判定。 */
function isInJapan(page, ext, title) {
  const coord = page.coordinates?.[0];
  if (coord && typeof coord.lat === "number" && typeof coord.lon === "number") {
    const { latMin, latMax, lonMin, lonMax } = JAPAN_BBOX;
    return coord.lat >= latMin && coord.lat <= latMax && coord.lon >= lonMin && coord.lon <= lonMax;
  }
  const haystack = [
    title,
    plain(ext?.ImageDescription?.value),
    plain(ext?.Categories?.value),
    plain(ext?.ObjectName?.value),
  ]
    .join(" ")
    .toLowerCase();
  return JAPAN_HINTS.some((h) => haystack.includes(h));
}

async function search({ term, label, bitmapOnly }) {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    generator: "search",
    gsrsearch: bitmapOnly ? `${term} filetype:bitmap` : term,
    gsrnamespace: "6",
    gsrlimit: "20",
    prop: "imageinfo|coordinates",
    iiprop: "url|extmetadata|size",
    iiurlwidth: "1280",
    origin: "*",
  });
  const data = await getJson(`${API}?${params}`, { headers: UA }, { label });
  return data?.query?.pages ? Object.values(data.query.pages) : [];
}

function toRecord(key, page, info, ext, kind) {
  const title = String(page.title ?? "").replace(/^File:/, "");
  return {
    key,
    kind,
    title,
    url: info.thumburl ?? info.url,
    width: info.thumbwidth ?? info.width,
    height: info.thumbheight ?? info.height,
    artist: (plain(ext.Artist?.value) || plain(ext.Credit?.value) || "Unknown author").slice(0, 120),
    license: plain(ext.LicenseShortName?.value) || plain(ext.License?.value),
    licenseUrl: plain(ext.LicenseUrl?.value) || null,
    restrictions: plain(ext.Restrictions?.value) || null,
    descriptionUrl: info.descriptionurl,
    source: "Wikimedia Commons",
  };
}

/** 写真: 日本国内・自由ライセンス・十分な解像度。 */
async function findPhoto(slot, term = slot.search) {
  const pages = await search({ term, label: `photo ${slot.key}`, bitmapOnly: true });
  for (const page of pages) {
    const info = page.imageinfo?.[0];
    if (!info) continue;
    const ext = info.extmetadata ?? {};
    const title = String(page.title ?? "");
    if (/logo|wordmark|emblem|trademark|crest|coat[_ ]of[_ ]arms|\.svg$/i.test(title)) continue;
    if (!isAllowedLicense(ext)) continue;
    if ((info.width ?? 0) < 900) continue;
    if (!isInJapan(page, ext, title)) continue;
    return toRecord(slot.key, page, info, ext, "photo");
  }
  return null;
}

/**
 * ロゴ: Commons上で自由ライセンス（PD-textlogo等）のもののみ。
 * 社名の取り違えを防ぐため、ファイル名に社名トークンが含まれることを必須とし、
 * 子会社・別事業・サービスロゴを示す語が含まれるものは除外する。
 */
async function findLogo(target) {
  const pages = await search({ term: target.search, label: `logo ${target.code}`, bitmapOnly: false });
  for (const page of pages) {
    const info = page.imageinfo?.[0];
    if (!info) continue;
    const ext = info.extmetadata ?? {};
    const title = String(page.title ?? "").replace(/^File:/, "");
    const lower = title.toLowerCase();

    if (!/logo|wordmark|logotype/i.test(title)) continue;
    if (/(18|19|20)\d{2}/.test(lower)) continue; // 年号入り＝旧ロゴの可能性があるため不採用
    if (!target.mustAny.some((t) => lower.includes(t))) continue; // 社名不一致は不採用
    if ((target.deny ?? []).some((d) => lower.includes(d))) continue; // 別事業・別会社は不採用
    if (/(18|19|20)\d{2}/.test(lower)) continue; // 年号入り＝旧ロゴの可能性があるため不採用
    if (!isAllowedLicense(ext)) continue; // フェアユース等はここで除外される

    return toRecord(`logo:${target.code}`, page, info, ext, "logo");
  }
  return null;
}

async function download(picked) {
  const imgDir = join(ROOT, "public", "images", "commons");
  fsMod.mkdirSync(imgDir, { recursive: true });

  /** 実体の内容から正しい拡張子を決める（拡張子と Content-Type の不一致を防ぐ）。 */
  const extFor = (contentType, buf) => {
    if (/png/i.test(contentType) || (buf[0] === 0x89 && buf[1] === 0x50)) return "png";
    if (/gif/i.test(contentType) || (buf[0] === 0x47 && buf[1] === 0x49)) return "gif";
    if (/webp/i.test(contentType)) return "webp";
    return "jpg";
  };

  await forEachSequential(picked, 1200, async (img) => {
    const base = img.key.replace(/[:]/g, "-");
    // すでに取り込み済み（拡張子は問わない）ならスキップ
    const existingFile = ["png", "jpg", "gif", "webp"]
      .map((e) => ({ e, p: join(imgDir, `${base}.${e}`) }))
      .find((c) => fsMod.existsSync(c.p));
    if (existingFile) {
      img.localUrl = `/images/commons/${base}.${existingFile.e}`;
      return;
    }
    try {
      const res = await fetchWithRetry(img.url, { headers: UA }, { label: `download ${img.key}`, retries: 4, timeoutMs: 30000 });
      if (!res.ok) {
        console.log(`[commons] ダウンロード失敗(${res.status}): ${img.key}`);
        return;
      }
      const buf = Buffer.from(await res.arrayBuffer());
      const ext = extFor(res.headers.get("content-type") ?? "", buf);
      const fileName = `${base}.${ext}`;
      fsMod.writeFileSync(join(imgDir, fileName), buf);
      img.localUrl = `/images/commons/${fileName}`;
      console.log(`[commons] ↓ ${img.key} (${Math.round(buf.length / 1024)}KB, ${ext})`);
    } catch (e) {
      console.log(`[commons] ダウンロード例外: ${img.key} ${e.message}`);
    }
  });
}

async function main() {
  const onlyLogos = process.argv.includes("--logos");
  const onlyPhotos = process.argv.includes("--photos");

  const existing = (() => {
    try {
      return JSON.parse(fsMod.readFileSync(OUT, "utf8")).images ?? [];
    } catch {
      return [];
    }
  })();
  const picked = [...existing];
  const have = new Set(picked.map((i) => i.key));

  // --- 写真（日本国内限定） ---
  if (!onlyLogos) {
    const todo = PHOTO_SLOTS.filter((s) => !have.has(s.key));
    console.log(`[commons] 写真: 未取得 ${todo.length}/${PHOTO_SLOTS.length}件を検索（日本国内のみ採用）`);
    await forEachSequential(todo, 900, async (slot) => {
      try {
        let img = await findPhoto(slot);
        if (!img && slot.alt) img = await findPhoto(slot, slot.alt);
        if (img) {
          picked.push(img);
          console.log(`[commons] ✓ 写真 ${slot.key}: ${img.license} / ${img.title.slice(0, 46)}`);
        } else {
          console.log(`[commons] − 写真 ${slot.key}: 日本国内の自由ライセンス画像が見つかりません`);
        }
      } catch (e) {
        console.log(`[commons] ! 写真 ${slot.key}: ${e.message}`);
      }
    });
  }

  // --- ロゴ（自由ライセンスのみ） ---
  if (!onlyPhotos) {
    const todo = LOGO_TARGETS.filter((t) => !have.has(`logo:${t.code}`));
    console.log(`[commons] ロゴ: 未取得 ${todo.length}/${LOGO_TARGETS.length}件を検索（自由ライセンスのみ採用）`);
    await forEachSequential(todo, 900, async (target) => {
      try {
        const img = await findLogo(target);
        if (img) {
          picked.push(img);
          console.log(`[commons] ✓ ロゴ ${target.code}: ${img.license} / ${img.title.slice(0, 46)}`);
        } else {
          console.log(`[commons] − ロゴ ${target.code}: 自由ライセンスのロゴが見つかりません（フェアユースのみ）`);
        }
      } catch (e) {
        console.log(`[commons] ! ロゴ ${target.code}: ${e.message}`);
      }
    });
  }

  if (picked.length === 0) {
    console.log("[commons] 採用0件。既存データを維持します。");
    return;
  }

  await download(picked);

  const photos = picked.filter((i) => i.kind !== "logo").length;
  const logos = picked.filter((i) => i.kind === "logo").length;
  console.log(`[commons] 採用: 写真 ${photos}件 / ロゴ ${logos}件`);
  writeJsonSafe(OUT, { fetchedAt: nowIso(), source: "Wikimedia Commons", count: picked.length, images: picked }, {
    label: "images.json",
  });
}

main().catch((e) => {
  console.error("[commons] 予期せぬエラー:", e.message);
  process.exit(0);
});
