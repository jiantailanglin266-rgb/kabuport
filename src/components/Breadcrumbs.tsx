import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Locale } from "@/types";

export function Breadcrumbs({ items, locale }: { items: { name: string; path: string }[]; locale: Locale }) {
  return (
    <nav aria-label="パンくず" className="flex flex-wrap items-center gap-1 text-xs text-muted">
      {items.map((it, i) => {
        const last = i === items.length - 1;
        return (
          <span key={it.path} className="flex items-center gap-1">
            {i > 0 && <ChevronRight size={12} aria-hidden />}
            {last ? (
              <span aria-current="page" className="text-ink">
                {it.name}
              </span>
            ) : (
              <Link href={`/${locale}${it.path ? `/${it.path}` : ""}`} className="hover:text-ink">
                {it.name}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
