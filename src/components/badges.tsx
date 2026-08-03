import { AlertTriangle, Clock, Database } from "lucide-react";
import type { Locale, Provenance } from "@/types";
import { formatDateTimeJst } from "@/lib/format";
import { getDictionary } from "@/lib/i18n";

// データが実データでないこと・遅延・取得時刻を常に明示する一連のバッジ。

export function DataSourceBadge({ provenance, locale }: { provenance: Provenance; locale: Locale }) {
  const t = getDictionary(locale);
  const isSample = provenance.dataStatus === "sample";
  return (
    <span
      className={
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium " +
        (isSample ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200" : "bg-emerald-100 text-emerald-800")
      }
      title={`${t.common.source}: ${provenance.source}`}
    >
      {isSample ? <AlertTriangle size={11} /> : <Database size={11} />}
      {isSample ? t.common.sampleData : provenance.source}
    </span>
  );
}

export function DataDelayBadge({ provenance, locale }: { provenance: Provenance; locale: Locale }) {
  const t = getDictionary(locale);
  if (provenance.delayMinutes === undefined) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600 dark:bg-slate-800 dark:text-slate-300">
      <Clock size={11} />
      {provenance.delayMinutes > 0 ? `${provenance.delayMinutes}${locale === "ja" ? "分" : "m"} ${t.common.delayed}` : "≈RT"}
    </span>
  );
}

export function DataUpdatedAt({ provenance, locale }: { provenance: Provenance; locale: Locale }) {
  const t = getDictionary(locale);
  return (
    <span className="text-[11px] text-muted">
      {t.common.dataUpdated}: {formatDateTimeJst(provenance.fetchedAt, locale)} ・ {t.common.source}: {provenance.source}
    </span>
  );
}
