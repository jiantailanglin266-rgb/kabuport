import { ShieldAlert } from "lucide-react";
import type { Locale } from "@/types";
import { getDictionary } from "@/lib/i18n";

export function RiskDisclosure({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  return (
    <section
      aria-label={t.home.riskTitle}
      className="rounded-2xl border border-amber-300/60 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-100"
    >
      <h2 className="mb-1 flex items-center gap-2 font-semibold">
        <ShieldAlert size={16} /> {t.home.riskTitle}
      </h2>
      <p className="leading-relaxed">{t.home.riskBody}</p>
    </section>
  );
}
