// Wikimedia Commons から取得した自由ライセンス画像の参照。
// すべて scripts/fetch-commons-images.mjs がライセンス検証済みのものだけを保存している。
import imagesRaw from "@/data/images.json";

export interface CommonsImageMeta {
  key: string;
  /** photo=日本国内で撮影された写真 / logo=自由ライセンスの企業ロゴ */
  kind?: "photo" | "logo";
  /** Commonsが記録している利用制限（商標など） */
  restrictions?: string | null;
  title: string;
  /** Wikimedia 上の元URL（取り込みに失敗した場合のフォールバック） */
  url: string;
  /** 自サイトへ取り込んだ画像のパス。あればこちらを優先する（ホットリンク回避） */
  localUrl?: string;
  width: number;
  height: number;
  artist: string;
  license: string;
  licenseUrl: string | null;
  descriptionUrl: string;
  source: string;
}

/** 実際に読み込むURL。取り込み済みならローカル、無ければ元URL。 */
export function imageSrc(img: CommonsImageMeta): string {
  const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
  return img.localUrl ? `${base}${img.localUrl}` : img.url;
}

const IMAGES: CommonsImageMeta[] = (imagesRaw as { images: CommonsImageMeta[] }).images ?? [];
const BY_KEY = new Map(IMAGES.map((i) => [i.key, i]));

export function getImage(key: string): CommonsImageMeta | undefined {
  return BY_KEY.get(key);
}

/** テーマslug用の画像（無ければ undefined）。 */
export function getThemeImage(slug: string): CommonsImageMeta | undefined {
  return getImage(`theme:${slug}`);
}

/** 業種コード用の画像。 */
export function getSectorImage(code: string): CommonsImageMeta | undefined {
  return getImage(`sector:${code}`);
}

/** 銘柄コードに対応する企業ロゴ（Commonsに自由ライセンス版がある場合のみ）。 */
export function getCompanyLogo(code: string): CommonsImageMeta | undefined {
  return getImage(`logo:${code}`);
}

export function listImages(): CommonsImageMeta[] {
  return IMAGES;
}

export function listPhotos(): CommonsImageMeta[] {
  return IMAGES.filter((i) => i.kind !== "logo");
}

export function listLogos(): CommonsImageMeta[] {
  return IMAGES.filter((i) => i.kind === "logo");
}

/** 帰属表示の文字列（CC BY / BY-SA は作者とライセンスの明示が必須）。 */
export function attributionText(img: CommonsImageMeta): string {
  return `${img.artist} / ${img.license} — ${img.source}`;
}
