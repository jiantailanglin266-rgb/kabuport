"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LOCALES, type Locale } from "@/types";
import { clsx } from "clsx";

// 現在URLのロケール接頭辞だけを差し替える (強制リダイレクトはしない)。
export function LanguageSwitcher({ current }: { current: Locale }) {
  const pathname = usePathname() || `/${current}`;
  const rest = pathname.replace(/^\/(ja|en)/, "") || "";
  return (
    <div className="flex items-center gap-1 text-sm" role="group" aria-label="言語切り替え / Language">
      {LOCALES.map((l) => (
        <Link
          key={l}
          href={`/${l}${rest}`}
          hrefLang={l}
          className={clsx(
            "rounded-md px-2 py-1 font-medium uppercase",
            l === current ? "bg-brand text-white" : "text-muted hover:text-ink",
          )}
          aria-current={l === current ? "true" : undefined}
        >
          {l}
        </Link>
      ))}
    </div>
  );
}
