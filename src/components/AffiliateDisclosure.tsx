import { Info } from "lucide-react";
import type { Locale } from "@/types";

// アフィリエイト・広告であることの開示。ランキング/比較ページの目立つ位置に必ず表示。
export function AffiliateDisclosure({ locale }: { locale: Locale }) {
  const ja = locale === "ja";
  return (
    <div className="flex gap-2 rounded-2xl border border-line bg-card p-4 text-sm text-muted">
      <Info size={16} className="mt-0.5 shrink-0 text-brand" />
      <p>
        {ja
          ? "本ページには広告（アフィリエイトリンク）を含みます。当サイトは提携先から報酬を受け取る場合がありますが、比較・評価は独自の基準・調査日・情報源に基づき、広告報酬額のみで順位を決定することはありません。手数料・登録情報等はサンプルであり、最新・正確性は保証しません。必ず各社の公式情報をご確認ください。"
          : "This page contains advertising (affiliate links). We may receive compensation from partners, but comparisons follow our own criteria, survey dates and sources and are never ranked by ad revenue alone. Fees and registration details are sample data; verify with each broker's official site."}
      </p>
    </div>
  );
}

// 広告リンク: rel に sponsored/nofollow を付け、リンク付近に「広告」を明示。
export function AdLink({ href, isAffiliate, locale, children }: { href: string; isAffiliate: boolean; locale: Locale; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1">
      <a href={href} target="_blank" rel={isAffiliate ? "sponsored nofollow noopener noreferrer" : "nofollow noopener noreferrer"} className="text-brand hover:underline">
        {children} ↗
      </a>
      {isAffiliate && (
        <span className="rounded bg-line/60 px-1 text-[10px] text-muted">{locale === "ja" ? "広告" : "Ad"}</span>
      )}
    </span>
  );
}
