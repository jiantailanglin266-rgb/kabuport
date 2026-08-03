"use client";
import { useEffect, useMemo, useRef, useState } from "react";

/**
 * TradingView 公式埋め込みウィジェット。
 *
 * 方針:
 *  - 当サイトは株価データを再配信しない。提供元（TradingView）のプレーヤーを埋め込むだけ。
 *    データのライセンス処理は提供元が行う（動画の埋め込みと同じ構造）。
 *  - 公式の無料ウィジェットのため、既定のTradingViewブランディングを保持する。
 *  - 外部スクリプトは「表示領域に入ってから」読み込む（初期表示速度・通信量への配慮）。
 *
 * 実装上の注意:
 *  - スクリプトを差し込む要素には React の子要素を一切置かない。
 *    （同じ要素に React の子と手動DOMを混在させると、再レンダリングで消される）
 */
export type TvWidgetType =
  | "ticker-tape"
  | "market-overview"
  | "symbol-overview"
  | "advanced-chart"
  | "mini-symbol-overview"
  | "symbol-info";

const SCRIPT_SRC: Record<TvWidgetType, string> = {
  "ticker-tape": "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js",
  "market-overview": "https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js",
  "symbol-overview": "https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js",
  "advanced-chart": "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js",
  "mini-symbol-overview": "https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js",
  "symbol-info": "https://s3.tradingview.com/external-embedding/embed-widget-symbol-info.js",
};

export function TradingViewWidget({
  type,
  config,
  height = 400,
  className,
  label,
}: {
  type: TvWidgetType;
  config: Record<string, unknown>;
  height?: number;
  className?: string;
  label: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [rendered, setRendered] = useState(false);

  // config はレンダーごとに新しい参照になるため、内容で安定化させる
  const configKey = useMemo(() => JSON.stringify(config), [config]);

  // 表示領域に入ってから読み込む
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setVisible(true);
            io.disconnect();
          }
        }
      },
      { rootMargin: "240px" },
    );
    io.observe(el);

    // フォールバック: レイアウト上は表示されているのに IntersectionObserver が
    // 発火しない環境（ビューポート幅が取得できない等）でも確実に描画する。
    // 非表示(display:none)の要素は高さ0になるため、読み込まれない。
    const fallback = setTimeout(() => {
      if (el.getBoundingClientRect().height > 0) setVisible(true);
    }, 2500);

    return () => {
      io.disconnect();
      clearTimeout(fallback);
    };
  }, []);

  useEffect(() => {
    const mount = mountRef.current;
    if (!visible || !mount) return;

    const isDark = document.documentElement.classList.contains("dark");
    mount.innerHTML = "";

    const container = document.createElement("div");
    container.className = "tradingview-widget-container";
    container.style.height = "100%";
    const widget = document.createElement("div");
    widget.className = "tradingview-widget-container__widget";
    widget.style.height = "100%";
    container.appendChild(widget);

    const script = document.createElement("script");
    script.src = SCRIPT_SRC[type];
    script.async = true;
    script.type = "text/javascript";
    script.innerHTML = JSON.stringify({
      colorTheme: isDark ? "dark" : "light",
      locale: "ja",
      isTransparent: true,
      ...JSON.parse(configKey),
    });
    container.appendChild(script);
    mount.appendChild(container);

    // ウィジェット(iframe)が実際に描画されたらスケルトンを外す
    const mo = new MutationObserver(() => {
      if (mount.querySelector("iframe")) {
        setRendered(true);
        mo.disconnect();
      }
    });
    mo.observe(mount, { childList: true, subtree: true });

    return () => {
      mo.disconnect();
      mount.innerHTML = "";
    };
  }, [visible, type, configKey]);

  return (
    <div className={className}>
      <div
        ref={wrapRef}
        style={{ height }}
        role="img"
        aria-label={label}
        className="relative overflow-hidden rounded-2xl border border-line bg-card"
      >
        {/* Reactの子を持たないマウント先（手動DOM専用） */}
        <div ref={mountRef} className="h-full w-full" />

        {!rendered && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center bg-card">
            <div className="w-full max-w-md space-y-3 px-6" aria-hidden>
              <div className="h-3 w-1/3 animate-pulse rounded bg-line" />
              <div className="h-24 w-full animate-pulse rounded-xl bg-line/70" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-line" />
            </div>
            <span className="sr-only">読み込み中</span>
          </div>
        )}
      </div>
    </div>
  );
}
