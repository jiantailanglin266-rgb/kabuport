/** @type {import('next').NextConfig} */

// STATIC_EXPORT=true のとき GitHub Pages 向けの静的エクスポート構成に切り替える。
// 通常の dev / build（将来のサーバー機能）ではセキュリティヘッダを付与する。
const isExport = process.env.STATIC_EXPORT === "true";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const base = {
  reactStrictMode: true,
  poweredByHeader: false,
};

const nextConfig = isExport
  ? {
      ...base,
      output: "export",
      trailingSlash: true,
      images: { unoptimized: true },
      basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
    }
  : {
      ...base,
      async headers() {
        return [{ source: "/(.*)", headers: securityHeaders }];
      },
    };

export default nextConfig;
