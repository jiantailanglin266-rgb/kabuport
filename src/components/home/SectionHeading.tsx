import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function SectionHeading({
  eyebrow,
  title,
  description,
  href,
  hrefLabel,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  href?: string;
  hrefLabel?: string;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        <span className="eyebrow">
          <span className="h-px w-6 bg-gold-600" aria-hidden />
          {eyebrow}
        </span>
        <h2 className="section-title mt-2.5">{title}</h2>
        {description && <p className="mt-2 text-[13.5px] leading-relaxed text-muted">{description}</p>}
      </div>
      {href && hrefLabel && (
        <Link
          href={href}
          className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl border border-line bg-card px-4 text-[13px] font-bold text-ink transition-all duration-300 ease-smooth hover:-translate-y-0.5 hover:border-line-strong"
        >
          {hrefLabel} <ArrowRight size={14} />
        </Link>
      )}
    </div>
  );
}
