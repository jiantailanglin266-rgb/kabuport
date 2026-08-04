import { clsx } from "clsx";
import { getCompanyLogo, imageSrc } from "@/lib/images";

/**
 * 企業ロゴ。
 * Commons上で著作権フリー（PD-textlogo等）と明示されたロゴがある銘柄のみ画像を表示し、
 * 無い銘柄は従来どおり頭文字タイルにフォールバックする。
 *
 * ロゴは商標であり、ここでの表示は当該企業を識別するためのものです。
 * 提携・後援・推奨を示すものではありません（/credits に明記）。
 */
export function CompanyLogo({
  code,
  fallbackText,
  name,
  size = 40,
  className,
}: {
  code: string;
  fallbackText: string;
  name: string;
  size?: number;
  className?: string;
}) {
  const logo = getCompanyLogo(code);

  if (!logo) {
    return (
      <span
        className={clsx(
          "grid shrink-0 place-items-center rounded-lg bg-line/60 font-bold text-muted",
          className,
        )}
        style={{ width: size, height: size, fontSize: Math.round(size * 0.32) }}
        aria-hidden
      >
        {fallbackText}
      </span>
    );
  }

  return (
    <span
      className={clsx(
        "grid shrink-0 place-items-center overflow-hidden rounded-lg border border-line bg-white p-1",
        className,
      )}
      style={{ width: size, height: size }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageSrc(logo)}
        alt={`${name}のロゴ`}
        title={`${name} — ${logo.license} / Wikimedia Commons（商標。識別目的での表示です）`}
        loading="lazy"
        decoding="async"
        className="h-full w-full object-contain"
      />
    </span>
  );
}
