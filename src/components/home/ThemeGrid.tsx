import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Locale, Theme } from "@/types";
import { pick } from "@/lib/i18n";
import { getThemeImage } from "@/lib/images";
import { CommonsImage } from "@/components/media/CommonsImage";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "./SectionHeading";

export interface ThemeCardData {
  theme: Theme;
  count: number;
  avgChangePct: number;
}

/** テーマ株グリッド。半導体/AI/防衛/EV/インバウンド等。 */
export function ThemeGrid({ items, locale }: { items: ThemeCardData[]; locale: Locale }) {
  const ja = locale === "ja";

  return (
    <section className="shell py-16 sm:py-20">
      <SectionHeading
        eyebrow="Investment Themes"
        title={ja ? "テーマ株から探す" : "Browse by theme"}
        description={
          ja
            ? "半導体・AI・データセンター・防衛・EV・インバウンドなど、注目テーマごとに関連銘柄を整理しています。"
            : "Semiconductors, AI, data centers, defense, EVs, inbound tourism and more — organized by theme."
        }
        href={`/${locale}/themes`}
        hrefLabel={ja ? "テーマ一覧へ" : "All themes"}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        {items.map((it, i) => {
          const up = it.avgChangePct >= 0;
          const img = getThemeImage(it.theme.slug);
          const name = pick(locale, it.theme.nameJa, it.theme.nameEn);
          return (
            <Reveal key={it.theme.slug} delay={i * 45}>
              <Link
                href={`/${locale}/themes/${it.theme.slug}`}
                className="card card-hover group flex h-full flex-col overflow-hidden"
              >
                {/* 画像（自由ライセンス・帰属表示つき） */}
                <div className="relative h-28 shrink-0 overflow-hidden">
                  {img ? (
                    <CommonsImage
                      image={img}
                      alt={`${name}${ja ? "のイメージ写真" : " illustrative photo"}`}
                      className="h-full w-full"
                      imgClassName="transition-transform duration-700 ease-smooth group-hover:scale-105"
                      overlay="strong"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-navy-700 to-navy-500" aria-hidden />
                  )}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between p-3.5">
                    <h3 className="text-[15px] font-extrabold tracking-tight text-white drop-shadow">{name}</h3>
                    <ArrowUpRight size={15} className="mb-0.5 shrink-0 text-white/70 transition-colors group-hover:text-gold" aria-hidden />
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-5 pt-4">
                  <p className="line-clamp-2 text-[12px] leading-relaxed text-muted">
                    {pick(locale, it.theme.descriptionJa, it.theme.descriptionEn)}
                  </p>
                  <div className="mt-auto flex items-center justify-between pt-4 rule-top">
                    <span className="num text-[11.5px] font-bold text-muted">
                      {it.count}
                      {ja ? "銘柄" : " stocks"}
                    </span>
                    <span className={`num text-[12px] font-extrabold ${up ? "text-up" : "text-down"}`}>
                      {up ? "▲" : "▼"} {up ? "+" : ""}
                      {it.avgChangePct.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </Link>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
