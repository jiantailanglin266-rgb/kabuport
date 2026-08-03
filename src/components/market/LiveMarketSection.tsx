import { ExternalLink, Info } from "lucide-react";
import type { Locale } from "@/types";
import { TradingViewWidget } from "./TradingViewWidget";
import { SectionHeading } from "@/components/home/SectionHeading";

/**
 * マーケット概況（公式ウィジェット埋め込み）。
 * 当サイトは株価データを保持・再配信せず、提供元のプレーヤーを表示するだけ。
 */
const TICKER_SYMBOLS = [
  { proName: "TVC:NI225", title: "日経225" },
  { proName: "FX:USDJPY", title: "ドル円" },
  { proName: "TVC:DJI", title: "NYダウ" },
  { proName: "NASDAQ:IXIC", title: "NASDAQ" },
  { proName: "TVC:GOLD", title: "金" },
  { proName: "BITSTAMP:BTCUSD", title: "ビットコイン" },
];

export function MarketTickerWidget({ locale }: { locale: Locale }) {
  const ja = locale === "ja";
  return (
    <TradingViewWidget
      type="ticker-tape"
      height={46}
      label={ja ? "主要市場のティッカー（提供: TradingView）" : "Market ticker (by TradingView)"}
      config={{
        symbols: TICKER_SYMBOLS,
        showSymbolLogo: true,
        displayMode: "adaptive",
      }}
    />
  );
}

export function LiveMarketSection({ locale }: { locale: Locale }) {
  const ja = locale === "ja";

  return (
    <section className="shell py-16 sm:py-20" aria-labelledby="market-overview">
      <SectionHeading
        eyebrow="Market Overview"
        title={ja ? "マーケット概況" : "Market overview"}
        description={
          ja
            ? "日経平均・TOPIX・為替・海外指数のチャートを、提供元の公式ウィジェットで表示しています。当サイトは株価データを保持・再配信していません。"
            : "Charts are rendered by the provider's official widget. This site does not store or redistribute market data."
        }
      />
      <h2 id="market-overview" className="sr-only">
        {ja ? "マーケット概況" : "Market overview"}
      </h2>

      <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        <TradingViewWidget
          type="advanced-chart"
          height={460}
          label={ja ? "日経225のチャート（提供: TradingView）" : "Nikkei 225 chart (by TradingView)"}
          config={{
            symbol: "TVC:NI225",
            interval: "D",
            timezone: "Asia/Tokyo",
            style: "1",
            hide_side_toolbar: true,
            allow_symbol_change: true,
            withdateranges: true,
            autosize: true,
          }}
        />
        <TradingViewWidget
          type="market-overview"
          height={460}
          label={ja ? "主要市場の概況（提供: TradingView）" : "Market overview (by TradingView)"}
          config={{
            showChart: true,
            showFloatingTooltip: true,
            width: "100%",
            height: "100%",
            tabs: [
              {
                title: ja ? "日本" : "Japan",
                symbols: [
                  { s: "TVC:NI225", d: "日経225" },
                  { s: "FX:USDJPY", d: "ドル円" },
                ],
              },
              {
                title: ja ? "海外" : "Global",
                symbols: [
                  { s: "TVC:DJI", d: "NYダウ" },
                  { s: "NASDAQ:IXIC", d: "NASDAQ" },
                  { s: "TVC:GOLD", d: "金" },
                  { s: "BITSTAMP:BTCUSD", d: "ビットコイン" },
                ],
              },
            ],
          }}
        />
      </div>

      <div className="mt-5 flex items-start gap-2.5 rounded-2xl border border-line bg-card p-4">
        <Info size={15} className="mt-0.5 shrink-0 text-gold-600" aria-hidden />
        <p className="text-[11.5px] leading-relaxed text-muted">
          {ja
            ? "上記チャートは TradingView の公式無料ウィジェットによる表示です。データの提供・ライセンス処理は TradingView によるものであり、当サイトが株価データを保持・再配信するものではありません。価格の正確性・即時性は保証されず、遅延が生じる場合があります。投資判断はご自身の責任で行ってください。"
            : "Charts are provided by TradingView's free official widgets. Data licensing is handled by TradingView; this site does not store or redistribute market data. Accuracy and timeliness are not guaranteed."}{" "}
          <a
            href="https://www.tradingview.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-bold text-primary hover:underline"
          >
            TradingView <ExternalLink size={10} aria-hidden />
          </a>
        </p>
      </div>
    </section>
  );
}
