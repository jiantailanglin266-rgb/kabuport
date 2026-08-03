"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { Bot, CornerDownLeft, ShieldAlert, User } from "lucide-react";
import type { Locale } from "@/types";

export interface AssistantRow {
  code: string;
  name: string;
  per: number | null;
  yieldPct: number | null;
  changePct: number;
  hasBenefit: boolean;
}

interface Msg {
  role: "user" | "bot";
  text: string;
  items?: { code: string; label: string }[];
  refusal?: boolean;
}

/**
 * データ検索アシスタント（デモ）。
 * サイト内の客観データを検索して回答するUIであり、投資判断（買い/売り）には回答しない。
 * 応答はすべてクライアント内の決定的ロジック（外部送信なし）。
 */
export function AssistantDemo({ rows, locale }: { rows: AssistantRow[]; locale: Locale }) {
  const ja = locale === "ja";
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      role: "bot",
      text: ja
        ? "こんにちは。KABUPORTのデータ検索アシスタントです。掲載中の株価・指標・配当・優待データから客観的な情報をお調べします。個別銘柄の売買判断にはお答えできません。"
        : "Hi — I'm the KABUPORT data assistant. I look up objective figures from the site's data. I can't answer buy/sell questions.",
    },
  ]);
  const listRef = useRef<HTMLDivElement>(null);

  const suggestions = ja
    ? ["配当利回りが高い銘柄は？", "PERが低い銘柄は？", "今日の値上がり上位は？", "株主優待がある銘柄は？", "この銘柄、買い？"]
    : ["Highest dividend yields?", "Lowest P/E?", "Today's top gainers?", "Which stocks have benefits?", "Is this a buy?"];

  function answer(qRaw: string): Msg {
    const q = qRaw.toLowerCase();
    const has = (...ks: string[]) => ks.some((k) => q.includes(k));

    // 投資助言に該当する質問は明確に断り、客観データへ誘導する
    if (has("買い", "売り", "儲か", "おすすめ", "推奨", "どう？", "どう?", "上がる", "下がる", "buy", "sell", "should i", "recommend", "worth")) {
      return {
        role: "bot",
        refusal: true,
        text: ja
          ? "申し訳ありません。特定銘柄の売買判断や将来の値動きについてはお答えできません（当サイトは投資助言を行いません）。代わりに、PER・配当利回り・業績推移などの客観データをご案内できます。「配当利回りが高い銘柄は？」のようにお尋ねください。"
          : "Sorry — I can't advise on buying, selling or future prices (this site does not provide investment advice). I can share objective figures such as P/E, dividend yield and results instead.",
      };
    }

    if (has("配当", "利回り", "yield", "dividend")) {
      const top = [...rows].filter((r) => r.yieldPct !== null).sort((a, b) => (b.yieldPct ?? 0) - (a.yieldPct ?? 0)).slice(0, 3);
      return {
        role: "bot",
        text: ja ? "掲載データで配当利回りが高い順に3銘柄です（予想ベース・サンプルデータ）。" : "Top 3 by dividend yield (forecast basis, sample data).",
        items: top.map((r) => ({ code: r.code, label: `${r.name} ・ ${(r.yieldPct ?? 0).toFixed(2)}%` })),
      };
    }

    if (has("per", "割安", "低per", "cheap", "p/e")) {
      const top = [...rows].filter((r) => r.per !== null).sort((a, b) => (a.per ?? 0) - (b.per ?? 0)).slice(0, 3);
      return {
        role: "bot",
        text: ja
          ? "PERが低い順に3銘柄です。PERは業種や成長性で適正水準が異なるため、単独では割安と判断できません。"
          : "Three lowest P/E names. Fair P/E levels differ by sector and growth, so it alone doesn't mean cheap.",
        items: top.map((r) => ({ code: r.code, label: `${r.name} ・ PER ${(r.per ?? 0).toFixed(1)}${ja ? "倍" : "x"}` })),
      };
    }

    if (has("値上がり", "上昇", "gainer", "上位", "ランキング", "ranking")) {
      const top = [...rows].sort((a, b) => b.changePct - a.changePct).slice(0, 3);
      return {
        role: "bot",
        text: ja ? "前日比の上昇率が高い順に3銘柄です（サンプルデータ）。" : "Top 3 by daily change (sample data).",
        items: top.map((r) => ({ code: r.code, label: `${r.name} ・ ▲ +${r.changePct.toFixed(2)}%` })),
      };
    }

    if (has("優待", "benefit", "株主優待")) {
      const top = rows.filter((r) => r.hasBenefit).slice(0, 4);
      return {
        role: "bot",
        text: ja
          ? "株主優待の登録がある銘柄です。優待内容は変更・廃止の可能性があるため公式情報をご確認ください。"
          : "Stocks with a registered shareholder benefit. Benefits may change; check official sources.",
        items: top.map((r) => ({ code: r.code, label: r.name })),
      };
    }

    return {
      role: "bot",
      text: ja
        ? "この質問にはお答えできませんでした。例：「配当利回りが高い銘柄は？」「PERが低い銘柄は？」「今日の値上がり上位は？」「株主優待がある銘柄は？」"
        : "I couldn't answer that. Try: highest dividend yields, lowest P/E, today's gainers, or stocks with benefits.",
    };
  }

  function send(text: string) {
    const t = text.trim();
    if (!t) return;
    setMsgs((m) => [...m, { role: "user", text: t }, answer(t)]);
    setInput("");
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    });
  }

  return (
    <div className="card overflow-hidden">
      {/* ヘッダー */}
      <div className="flex items-center gap-3 border-b border-line bg-navy px-5 py-4">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-gold">
          <Bot size={18} />
        </span>
        <div className="min-w-0">
          <h3 className="text-[14px] font-extrabold text-white">{ja ? "データ検索アシスタント" : "Data assistant"}</h3>
          <p className="text-[10.5px] text-white/50">{ja ? "客観データの検索専用・投資助言は行いません" : "Objective data lookup only — no investment advice"}</p>
        </div>
        <span className="ml-auto hidden rounded-md border border-white/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-white/50 sm:block">
          Demo
        </span>
      </div>

      {/* 会話 */}
      <div ref={listRef} className="max-h-[340px] space-y-4 overflow-y-auto bg-bg p-5">
        {msgs.map((m, i) => (
          <div key={i} className={`flex gap-2.5 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
            <span
              className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
                m.role === "user" ? "bg-line text-ink-2" : m.refusal ? "bg-gold/15 text-gold-600" : "bg-navy text-gold"
              }`}
              aria-hidden
            >
              {m.role === "user" ? <User size={15} /> : m.refusal ? <ShieldAlert size={15} /> : <Bot size={15} />}
            </span>
            <div className={`max-w-[82%] ${m.role === "user" ? "text-right" : ""}`}>
              <p
                className={`inline-block rounded-2xl px-4 py-2.5 text-left text-[13px] leading-relaxed ${
                  m.role === "user" ? "bg-navy text-white" : m.refusal ? "border border-gold/30 bg-gold/8 text-ink" : "border border-line bg-card text-ink"
                }`}
              >
                {m.text}
              </p>
              {m.items && m.items.length > 0 && (
                <ul className="mt-2 space-y-1.5">
                  {m.items.map((it) => (
                    <li key={it.code}>
                      <Link
                        href={`/${locale}/stocks/${it.code}`}
                        className="flex items-center justify-between gap-3 rounded-xl border border-line bg-card px-3.5 py-2.5 text-[12.5px] font-bold text-ink transition-colors hover:border-line-strong"
                      >
                        <span className="truncate">{it.label}</span>
                        <span className="num shrink-0 text-[11px] text-muted">{it.code}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 例示チップ + 入力 */}
      <div className="border-t border-line bg-card p-4">
        <div className="scroll-x mb-3 flex gap-2 overflow-x-auto">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="shrink-0 rounded-lg border border-line bg-bg px-3 py-1.5 text-[12px] font-semibold text-ink-2 transition-colors hover:border-line-strong hover:text-ink"
            >
              {s}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            aria-label={ja ? "アシスタントへの質問" : "Ask the assistant"}
            placeholder={ja ? "例：配当利回りが高い銘柄は？" : "e.g. highest dividend yields?"}
            className="h-12 flex-1 rounded-xl border border-line bg-bg px-4 text-[13.5px] text-ink outline-none transition-colors placeholder:text-muted focus:border-primary/60"
          />
          <button type="submit" className="btn-navy h-12 px-5" aria-label={ja ? "送信" : "Send"}>
            <CornerDownLeft size={16} />
          </button>
        </form>
        <p className="mt-3 text-[10.5px] leading-relaxed text-muted">
          {ja
            ? "※ デモ機能です。入力内容は外部に送信されず、サイト内のサンプルデータのみを検索します。投資判断はご自身の責任で行ってください。"
            : "Demo feature. Input is never sent externally; it only searches sample data on this site. Invest at your own responsibility."}
        </p>
      </div>
    </div>
  );
}
