"use client";
import { useEffect } from "react";
import type { Locale } from "@/types";

// ルートlayoutは lang="ja" 既定。/en 配下では html lang を補正する。
// (本番では middleware ベースのロケール別ルートlayoutへ移行予定)
export function LangSync({ locale }: { locale: Locale }) {
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return null;
}
