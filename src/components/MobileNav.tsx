"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import type { Locale } from "@/types";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeToggle } from "./ThemeToggle";

/** モバイル用ドロワー。フォーカストラップ・Escクローズ・背景スクロール抑止。 */
export function MobileNav({ locale, items }: { locale: Locale; items: { label: string; href: string }[] }) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const ja = locale === "ja";

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key !== "Tab") return;
      const nodes = panelRef.current?.querySelectorAll<HTMLElement>('a,button,[tabindex]:not([tabindex="-1"])');
      if (!nodes || nodes.length === 0) return;
      const first = nodes[0]!;
      const last = nodes[nodes.length - 1]!;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLElement>("a,button")?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label={ja ? "メニューを開く" : "Open menu"}
        aria-expanded={open}
        className="grid h-10 w-10 place-items-center rounded-xl border border-line bg-card text-ink transition-colors hover:border-line-strong xl:hidden"
      >
        <Menu size={18} />
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] xl:hidden">
          <button
            aria-label={ja ? "メニューを閉じる" : "Close menu"}
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-navy/50 backdrop-blur-sm"
          />
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={ja ? "メニュー" : "Menu"}
            className="absolute right-0 top-0 flex h-full w-[86%] max-w-sm flex-col bg-surface shadow-lift"
          >
            <div className="flex h-[68px] shrink-0 items-center justify-between border-b border-line px-5">
              <span className="font-display text-lg font-extrabold tracking-tight text-ink">KABUPORT</span>
              <button
                onClick={() => setOpen(false)}
                aria-label={ja ? "閉じる" : "Close"}
                className="grid h-10 w-10 place-items-center rounded-xl border border-line text-ink"
              >
                <X size={18} />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-4" aria-label={ja ? "モバイルナビゲーション" : "Mobile navigation"}>
              <ul className="grid gap-1">
                {items.map((n) => (
                  <li key={n.href}>
                    <Link
                      href={n.href}
                      onClick={() => setOpen(false)}
                      className="flex items-center justify-between rounded-xl px-4 py-3.5 text-[15px] font-bold text-ink transition-colors hover:bg-bg"
                    >
                      {n.label}
                      <span className="text-muted" aria-hidden>›</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="shrink-0 space-y-3 border-t border-line p-4">
              <div className="flex items-center justify-between">
                <LanguageSwitcher current={locale} />
                <ThemeToggle />
              </div>
              <Link href={`/${locale}/account`} onClick={() => setOpen(false)} className="btn-outline w-full">
                {ja ? "ログイン" : "Log in"}
              </Link>
              <Link href={`/${locale}/account`} onClick={() => setOpen(false)} className="btn-gold w-full">
                {ja ? "無料登録" : "Sign up"}
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
