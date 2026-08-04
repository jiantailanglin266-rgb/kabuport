import { clsx } from "clsx";
import { imageSrc, type CommonsImageMeta } from "@/lib/images";

/**
 * Wikimedia Commons の自由ライセンス画像を、必要な帰属表示つきで描画する。
 *
 * CC BY / CC BY-SA では「作者名・ライセンス・原典へのリンク」の明示が条件のため、
 * 帰属表示は常時可視（装飾で隠さない）。ロゴ・商標は取り扱わない。
 */
export function CommonsImage({
  image,
  alt,
  className,
  imgClassName,
  overlay = "gradient",
  priority = false,
  credit = "corner",
}: {
  image: CommonsImageMeta;
  alt: string;
  className?: string;
  imgClassName?: string;
  /** 文字を載せる場合の可読性確保 */
  overlay?: "none" | "gradient" | "strong";
  priority?: boolean;
  /** 帰属表示の出し方。corner=画像内の隅、below=画像下 */
  credit?: "corner" | "below";
}) {
  const overlayCls =
    overlay === "strong"
      ? "bg-gradient-to-t from-navy-900/92 via-navy-900/55 to-navy-900/25"
      : overlay === "gradient"
        ? "bg-gradient-to-t from-navy-900/85 via-navy-900/30 to-transparent"
        : "";

  return (
    <figure className={clsx("relative overflow-hidden", className)}>
      {/* 外部画像・静的エクスポートのため素の img を使用（最適化は行わない） */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageSrc(image)}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        width={image.width}
        height={image.height}
        className={clsx("h-full w-full object-cover", imgClassName)}
      />
      {overlay !== "none" && <span className={clsx("pointer-events-none absolute inset-0", overlayCls)} aria-hidden />}

      {credit === "corner" ? (
        <figcaption className="pointer-events-none absolute bottom-1.5 right-2 z-10 max-w-[92%] truncate text-[9px] leading-none text-white/55">
          <a
            href={image.descriptionUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="pointer-events-auto hover:text-white/90 hover:underline"
          >
            {image.artist} / {image.license}
          </a>
        </figcaption>
      ) : (
        <figcaption className="mt-1.5 text-[10.5px] text-muted">
          {"写真: "}
          <a
            href={image.descriptionUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="hover:text-ink hover:underline"
          >
            {image.artist}
          </a>
          {" / "}
          {image.licenseUrl ? (
            <a href={image.licenseUrl} target="_blank" rel="noopener noreferrer nofollow" className="hover:text-ink hover:underline">
              {image.license}
            </a>
          ) : (
            image.license
          )}
          {" — Wikimedia Commons"}
        </figcaption>
      )}
    </figure>
  );
}
