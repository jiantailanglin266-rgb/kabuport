import type { Metadata } from "next";
import "./globals.css";
import { siteName } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3240"),
  title: { default: `${siteName()} — 日本株情報プラットフォーム`, template: `%s | ${siteName()}` },
  description:
    "日本株の企業情報・業績・配当・株主優待・決算スケジュールを比較・分析できる情報プラットフォーム（デモ）。",
};

// FOUC防止: localStorage と prefers-color-scheme からダーク判定を先に適用。
const themeScript = `(function(){try{var t=localStorage.getItem('kabuport-theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
