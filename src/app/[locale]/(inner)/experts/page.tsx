import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { UserRound } from "lucide-react";
import type { Locale } from "@/types";
import { getDictionary, isLocale, pick } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbLd } from "@/lib/jsonld";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import expertsRaw from "@/data/experts.json";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const loc: Locale = isLocale(locale) ? locale : "ja";
  return buildMetadata({ locale: loc, path: "experts", title: loc === "ja" ? "著者・監修者" : "Authors & Reviewers", description: loc === "ja" ? "記事の著者・監修者のプロフィール。編集方針と信頼性の担保について。" : "Profiles of our authors and reviewers, and our editorial standards." });
}

export default async function ExpertsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const loc = locale as Locale;
  const t = getDictionary(loc);
  const roleLabel = (r: string) => (r === "reviewer" ? (loc === "ja" ? "監修者" : "Reviewer") : loc === "ja" ? "著者" : "Author");

  return (
    <div className="space-y-6">
      <JsonLd data={breadcrumbLd([{ name: t.brand, path: "" }, { name: loc === "ja" ? "著者・監修者" : "Experts", path: "experts" }], loc)} />
      <Breadcrumbs items={[{ name: t.brand, path: "" }, { name: loc === "ja" ? "著者・監修者" : "Experts", path: "experts" }]} locale={loc} />
      <h1 className="text-2xl font-bold text-ink">{loc === "ja" ? "著者・監修者" : "Authors & reviewers"}</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        {expertsRaw.map((e) => (
          <Link key={e.slug} href={`/${loc}/experts/${e.slug}`} className="flex gap-3 rounded-2xl border border-line bg-card p-4 hover:border-brand">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-line/50 text-muted"><UserRound size={22} /></span>
            <div>
              <div className="font-semibold text-ink">{pick(loc, e.name, e.nameEn)}</div>
              <div className="text-xs text-brand">{roleLabel(e.role)} ・ {pick(loc, e.titleJa, e.titleEn)}</div>
              <p className="mt-1 line-clamp-2 text-xs text-muted">{pick(loc, e.bioJa, e.bioEn)}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
