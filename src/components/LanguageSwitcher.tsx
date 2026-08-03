"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { LOCALES, type Locale } from "@/types";

/** 現在URLのロケール接頭辞だけを差し替える（IP/ブラウザ言語による強制リダイレクトはしない）。 */
export function LanguageSwitcher({ current }: { current: Locale }) {
  const pathname = usePathname() || `/${current}`;
  const rest = pathname.replace(/^\/(ja|en)/, "") || "";

  return (
    <div
      className="flex items-center rounded-xl border border-line bg-card p-0.5"
      role="group"
      aria-label="言語切り替え / Language"
    >
      {LOCALES.map((l) => (
        <Link
          key={l}
          href={`/${l}${rest}`}
          hrefLang={l}
          aria-current={l === current ? "true" : undefined}
          className={clsx(
            "rounded-lg px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wide transition-colors duration-200",
            l === current ? "bg-navy text-white" : "text-muted hover:text-ink",
          )}
        >
          {l}
        </Link>
      ))}
    </div>
  );
}
