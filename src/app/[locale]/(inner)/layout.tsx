/**
 * 下層ページ共通シェル。
 * トップページ（[locale]/page.tsx）はフルブリードのため、このレイアウトの外に置いている。
 */
export default function InnerLayout({ children }: { children: React.ReactNode }) {
  return <div className="shell py-8 sm:py-12">{children}</div>;
}
