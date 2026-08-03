import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { siteName } from "@/lib/seo";

// 英数字は Inter（self-host・latinのみ＝軽量）。和文は端末内蔵フォントを優先し
// ネットワーク転送ゼロで高速表示（Core Web Vitals対策）。
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3240"),
  title: {
    default: `${siteName()} | 日本株情報プラットフォーム`,
    template: `%s | ${siteName()}`,
  },
  description:
    "日本株の企業情報・株価・業績・配当・株主優待・決算スケジュールを、比較・分析できる国内向け株式情報プラットフォーム。",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f7fa" },
    { media: "(prefers-color-scheme: dark)", color: "#081826" },
  ],
};

// FOUC防止 + JS有効判定（.no-js で reveal のフォールバック）
const bootScript = `(function(){try{document.documentElement.classList.remove('no-js');var t=localStorage.getItem('kabuport-theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={`no-js ${inter.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
        <style
          dangerouslySetInnerHTML={{
            __html: `:root{--font-noto:"Noto Sans JP","Hiragino Sans","Hiragino Kaku Gothic ProN","Yu Gothic",YuGothic,Meiryo,sans-serif}`,
          }}
        />
      </head>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-navy focus:px-4 focus:py-2 focus:text-white"
        >
          本文へスキップ
        </a>
        {children}
      </body>
    </html>
  );
}
