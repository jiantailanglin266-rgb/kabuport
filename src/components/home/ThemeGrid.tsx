import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Locale, Theme } from "@/types";
import { pick } from "@/lib/i18n";
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
          return (
            <Reveal key={it.theme.slug} delay={i * 45}>
              <Link
                href={`/${locale}/themes/${it.theme.slug}`}
                className="card card-hover group relative flex h-full flex-col justify-between overflow-hidden p-5"
              >
                <span className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gold/8 transition-transform duration-500 ease-smooth group-hover:scale-125" aria-hidden />
                <div className="relative">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-[15px] font-extrabold tracking-tight text-ink">{pick(locale, it.theme.nameJa, it.theme.nameEn)}</h3>
                    <ArrowUpRight size={15} className="shrink-0 text-muted transition-colors group-hover:text-gold-600" aria-hidden />
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-[12px] leading-relaxed text-muted">
                    {pick(locale, it.theme.descriptionJa, it.theme.descriptionEn)}
                  </p>
                </div>
                <div className="relative mt-4 flex items-center justify-between rule-top">
                  <span className="num text-[11.5px] font-bold text-muted">
                    {it.count}
                    {ja ? "銘柄" : " stocks"}
                  </span>
                  <span className={`num text-[12px] font-extrabold ${up ? "text-up" : "text-down"}`}>
                    {up ? "▲" : "▼"} {up ? "+" : ""}
                    {it.avgChangePct.toFixed(2)}%
                  </span>
                </div>
              </Link>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
