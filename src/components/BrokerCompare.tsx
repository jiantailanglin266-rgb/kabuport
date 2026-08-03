"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, Minus, X } from "lucide-react";
import { clsx } from "clsx";
import type { Locale } from "@/types";
import { getDictionary, pick } from "@/lib/i18n";
import { AdLink } from "./AffiliateDisclosure";

export interface BrokerView {
  slug: string;
  nameJa: string;
  nameEn: string;
  registrationNumber: string;
  spotFeeNote: string;
  nisa: boolean;
  usStocks: boolean;
  ipo: boolean;
  singleShares: boolean;
  pointInvest: boolean;
  creditCardTsumitate: boolean;
  officialUrl: string;
  isAffiliate: boolean;
  surveyedAt: string;
}

const MAX = 4;

type UseCase = { key: string; ja: string; en: string; match: (b: BrokerView) => boolean };
const USE_CASES: UseCase[] = [
  { key: "beginner", ja: "初心者向け", en: "Beginners", match: (b) => b.nisa && b.singleShares },
  { key: "nisa", ja: "新NISA向け", en: "New NISA", match: (b) => b.nisa },
  { key: "us", ja: "米国株向け", en: "US stocks", match: (b) => b.usStocks },
  { key: "ipo", ja: "IPO向け", en: "IPO", match: (b) => b.ipo },
  { key: "single", ja: "単元未満株向け", en: "Odd-lot", match: (b) => b.singleShares },
];

const BOOL_ROWS: { key: keyof BrokerView; ja: string; en: string }[] = [
  { key: "nisa", ja: "新NISA", en: "New NISA" },
  { key: "usStocks", ja: "米国株", en: "US stocks" },
  { key: "ipo", ja: "IPO", en: "IPO" },
  { key: "singleShares", ja: "単元未満株", en: "Odd-lot shares" },
  { key: "pointInvest", ja: "ポイント投資", en: "Point investing" },
  { key: "creditCardTsumitate", ja: "クレカ積立", en: "Card accumulation" },
];

function Bool({ v, locale }: { v: boolean; locale: Locale }) {
  return v ? (
    <span className="inline-flex items-center gap-0.5 text-up"><Check size={14} /> <span className="sr-only">{locale === "ja" ? "対応" : "yes"}</span>{locale === "ja" ? "○" : "Yes"}</span>
  ) : (
    <span className="inline-flex items-center gap-0.5 text-muted"><Minus size={14} /> <span className="sr-only">{locale === "ja" ? "非対応" : "no"}</span>{locale === "ja" ? "×" : "No"}</span>
  );
}

export function BrokerCompare({ brokers, locale }: { brokers: BrokerView[]; locale: Locale }) {
  const t = getDictionary(locale);
  const [slugs, setSlugs] = useState<string[]>([]);
  const [useCase, setUseCase] = useState<string>("all");

  useEffect(() => {
    const url = (new URLSearchParams(window.location.search).get("brokers") || "").split(",").map((s) => s.trim()).filter(Boolean);
    const valid = url.filter((s) => brokers.some((b) => b.slug === s)).slice(0, MAX);
    setSlugs(valid.length ? valid : brokers.slice(0, 3).map((b) => b.slug));
  }, [brokers]);

  const filtered = useMemo(() => {
    const uc = USE_CASES.find((u) => u.key === useCase);
    return uc ? brokers.filter(uc.match) : brokers;
  }, [brokers, useCase]);

  const selected = useMemo(() => slugs.map((s) => brokers.find((b) => b.slug === s)).filter((b): b is BrokerView => !!b), [slugs, brokers]);

  function toggle(slug: string) {
    if (slugs.includes(slug)) setSlugs(slugs.filter((s) => s !== slug));
    else if (slugs.length < MAX) setSlugs([...slugs, slug]);
  }

  return (
    <div className="space-y-4">
      {/* 利用目的フィルター */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted">{locale === "ja" ? "目的別:" : "By use:"}</span>
        <button onClick={() => setUseCase("all")} className={clsx("rounded-full px-3 py-1 text-xs", useCase === "all" ? "bg-brand text-white" : "border border-line text-muted hover:text-ink")}>{t.common.all}</button>
        {USE_CASES.map((u) => (
          <button key={u.key} onClick={() => setUseCase(u.key)} className={clsx("rounded-full px-3 py-1 text-xs", useCase === u.key ? "bg-brand text-white" : "border border-line text-muted hover:text-ink")}>
            {pick(locale, u.ja, u.en)}
          </button>
        ))}
      </div>

      {/* 選択チップ */}
      <div className="flex flex-wrap gap-2">
        {filtered.map((b) => {
          const on = slugs.includes(b.slug);
          const disabled = !on && slugs.length >= MAX;
          return (
            <button key={b.slug} onClick={() => toggle(b.slug)} disabled={disabled}
              className={clsx("rounded-full border px-3 py-1 text-sm", on ? "border-brand bg-brand/10 text-brand" : disabled ? "border-line text-muted/40" : "border-line text-ink hover:border-brand")}>
              {pick(locale, b.nameJa, b.nameEn)}
            </button>
          );
        })}
        <span className="self-center text-xs text-muted">{selected.length}/{MAX}</span>
      </div>

      {/* 比較表 */}
      {selected.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-card p-10 text-center text-muted">{locale === "ja" ? "比較する証券会社を選択してください" : "Select brokers to compare"}</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-card">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="border-b border-line">
                <th scope="col" className="p-3 text-left text-xs text-muted">{locale === "ja" ? "項目" : "Item"}</th>
                {selected.map((b) => (
                  <th key={b.slug} scope="col" className="p-3 text-left align-top">
                    <div className="flex items-center justify-between gap-1">
                      <Link href={`/${locale}/brokers/${b.slug}`} className="font-semibold text-ink hover:text-brand">{pick(locale, b.nameJa, b.nameEn)}</Link>
                      <button onClick={() => toggle(b.slug)} aria-label="remove" className="text-muted hover:text-ink"><X size={13} /></button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-line/60">
                <th scope="row" className="p-3 text-left font-medium text-muted">{locale === "ja" ? "現物手数料" : "Spot fees"}</th>
                {selected.map((b) => <td key={b.slug} className="p-3 text-ink">{b.spotFeeNote}</td>)}
              </tr>
              {BOOL_ROWS.map((row) => (
                <tr key={row.key as string} className="border-b border-line/60">
                  <th scope="row" className="p-3 text-left font-medium text-muted">{pick(locale, row.ja, row.en)}</th>
                  {selected.map((b) => <td key={b.slug} className="p-3"><Bool v={b[row.key] as boolean} locale={locale} /></td>)}
                </tr>
              ))}
              <tr className="border-b border-line/60">
                <th scope="row" className="p-3 text-left font-medium text-muted">{locale === "ja" ? "登録番号" : "Registration"}</th>
                {selected.map((b) => <td key={b.slug} className="p-3 text-xs text-muted">{b.registrationNumber}</td>)}
              </tr>
              <tr className="border-b border-line/60">
                <th scope="row" className="p-3 text-left font-medium text-muted">{locale === "ja" ? "調査日" : "Surveyed"}</th>
                {selected.map((b) => <td key={b.slug} className="p-3 text-muted">{b.surveyedAt}</td>)}
              </tr>
              <tr>
                <th scope="row" className="p-3 text-left font-medium text-muted">{locale === "ja" ? "公式サイト" : "Official"}</th>
                {selected.map((b) => <td key={b.slug} className="p-3"><AdLink href={b.officialUrl} isAffiliate={b.isAffiliate} locale={locale}>{locale === "ja" ? "公式" : "Site"}</AdLink></td>)}
              </tr>
            </tbody>
          </table>
        </div>
      )}
      <p className="text-[11px] text-muted">{locale === "ja" ? "○×・手数料はサンプルです。最新の手数料・取扱・登録情報は各社公式でご確認ください。" : "Yes/No and fees are sample data; verify with official sources."}</p>
    </div>
  );
}
