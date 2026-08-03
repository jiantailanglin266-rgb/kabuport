"use client";
import { useEffect } from "react";
import Link from "next/link";
import { DEFAULT_LOCALE } from "@/types";

// ルートは既定ロケールへ。静的エクスポート(GitHub Pages)でも動くよう
// クライアント側リダイレクト + noscript フォールバックにする。
// basePath/末尾スラッシュに追従するため現在のパスから相対的に遷移する。
export default function RootPage() {
  useEffect(() => {
    const target = window.location.pathname.replace(/\/?$/, "/") + `${DEFAULT_LOCALE}/`;
    window.location.replace(target);
  }, []);
  return (
    <div className="grid min-h-screen place-items-center">
      <Link href={`/${DEFAULT_LOCALE}`} className="text-brand underline">
        KABUPORT →
      </Link>
    </div>
  );
}
