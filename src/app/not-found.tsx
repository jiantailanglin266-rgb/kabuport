import Link from "next/link";

// root layout の <html><body> 内でレンダリングされるためコンテンツのみ返す。
export default function NotFound() {
  return (
    <div className="grid min-h-[70vh] place-items-center px-6 text-center">
      <div>
        <h1 className="text-4xl font-bold text-ink">404</h1>
        <p className="mt-2 text-muted">ページが見つかりませんでした / Page not found</p>
        <Link href="/ja" className="mt-4 inline-block rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white">
          KABUPORT トップへ
        </Link>
      </div>
    </div>
  );
}
