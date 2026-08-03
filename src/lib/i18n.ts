// 軽量 i18n。辞書は下記に集約。将来 next-intl へ移行しやすいよう
// getDictionary(locale) の1関数に集約している。
import { DEFAULT_LOCALE, LOCALES, type Locale } from "@/types";

export function isLocale(v: string): v is Locale {
  return (LOCALES as string[]).includes(v);
}

export function normalizeLocale(v: string | undefined): Locale {
  return v && isLocale(v) ? v : DEFAULT_LOCALE;
}

/** ロケール依存の企業名等を選ぶヘルパー。 */
export function pick<T>(locale: Locale, ja: T, en: T): T {
  return locale === "ja" ? ja : en;
}

const ja = {
  brand: "KABUPORT",
  tagline: "日本株を、もっと深く、わかりやすく。",
  subtagline: "企業情報、業績、配当、株主優待、決算スケジュールを一つの場所で比較・分析。",
  nav: {
    stocks: "銘柄検索",
    rankings: "ランキング",
    screener: "スクリーナー",
    dividends: "配当・優待",
    earnings: "決算カレンダー",
    learn: "投資を学ぶ",
    brokers: "証券会社比較",
  },
  cta: { findStocks: "銘柄を探す", highYield: "高配当株を見る", earnings: "決算カレンダーを見る" },
  common: {
    searchPlaceholder: "企業名・証券コードで検索 (例: トヨタ / 7203)",
    viewDetail: "詳細を見る",
    dataUpdated: "データ取得",
    source: "出典",
    delayed: "遅延",
    realtimeNotGuaranteed: "リアルタイム性は保証されません",
    lastVerified: "最終確認",
    sampleData: "サンプルデータ",
    notInvestmentAdvice: "本情報は投資助言ではありません",
    all: "すべて",
    marketCap: "時価総額",
    price: "株価",
    change: "前日比",
    yield: "配当利回り",
    per: "PER",
    pbr: "PBR",
    roe: "ROE",
    minInvestment: "最低投資金額",
    volume: "出来高",
    industry: "業種",
    segment: "市場区分",
    noResults: "該当する銘柄がありません",
  },
  segments: { prime: "プライム", standard: "スタンダード", growth: "グロース", other: "その他" } as Record<string, string>,
  home: {
    indices: "主要指数",
    gainers: "本日の値上がり",
    losers: "本日の値下がり",
    highYield: "高配当株ランキング",
    benefits: "株主優待銘柄",
    earnings: "決算発表予定",
    disclosures: "注目の適時開示",
    articles: "新着 企業分析・学習記事",
    riskTitle: "投資に関するご注意",
    riskBody:
      "株式投資には元本損失の可能性があります。過去の株価・業績は将来を保証しません。予想値は変更される場合があり、株価データには遅延が生じることがあります。掲載情報の正確性・完全性・即時性を保証するものではなく、投資判断はご自身の責任で行ってください。当サイトは広告・アフィリエイト報酬を受け取る場合があります。",
    disclaimerShort: "一般的な情報提供であり、特定銘柄の売買を推奨するものではありません。",
  },
  screener: {
    title: "銘柄スクリーナー",
    results: "件 該当",
    reset: "条件をリセット",
    filters: "絞り込み条件",
  },
  footer: {
    about: "運営会社",
    editorial: "編集方針",
    sources: "情報源",
    disclosure: "広告・アフィリエイト開示",
    risk: "リスク開示",
    terms: "利用規約",
    privacy: "プライバシーポリシー",
    disclaimer: "免責事項",
    rights: "本サイトはサンプルデータを含むデモ環境です。",
  },
};

const en: typeof ja = {
  brand: "KABUPORT",
  tagline: "Japanese equities, deeper and clearer.",
  subtagline:
    "Compare and analyze company profiles, earnings, dividends, shareholder benefits and results schedules in one place.",
  nav: {
    stocks: "Stocks",
    rankings: "Rankings",
    screener: "Screener",
    dividends: "Dividends & Benefits",
    earnings: "Earnings Calendar",
    learn: "Learn",
    brokers: "Brokers",
  },
  cta: { findStocks: "Find stocks", highYield: "High-yield stocks", earnings: "Earnings calendar" },
  common: {
    searchPlaceholder: "Search by company or ticker (e.g. Toyota / 7203)",
    viewDetail: "View details",
    dataUpdated: "Updated",
    source: "Source",
    delayed: "Delayed",
    realtimeNotGuaranteed: "Real-time data is not guaranteed",
    lastVerified: "Last verified",
    sampleData: "Sample Data",
    notInvestmentAdvice: "This is not investment advice",
    all: "All",
    marketCap: "Market cap",
    price: "Price",
    change: "Change",
    yield: "Div. yield",
    per: "P/E",
    pbr: "P/B",
    roe: "ROE",
    minInvestment: "Min. investment",
    volume: "Volume",
    industry: "Industry",
    segment: "Segment",
    noResults: "No matching stocks",
  },
  segments: { prime: "Prime", standard: "Standard", growth: "Growth", other: "Other" },
  home: {
    indices: "Key indices",
    gainers: "Today's gainers",
    losers: "Today's losers",
    highYield: "High dividend yield",
    benefits: "Shareholder benefits",
    earnings: "Upcoming earnings",
    disclosures: "Notable disclosures",
    articles: "Latest analysis & learning",
    riskTitle: "Investment risk notice",
    riskBody:
      "Investing in equities carries the risk of loss of principal. Past prices and results do not guarantee future outcomes. Forecasts may change and price data may be delayed. We do not guarantee the accuracy, completeness or timeliness of the information; make investment decisions at your own responsibility. This site may receive advertising or affiliate compensation.",
    disclaimerShort: "General information only; not a recommendation to buy or sell any security.",
  },
  screener: {
    title: "Stock screener",
    results: "matches",
    reset: "Reset filters",
    filters: "Filters",
  },
  footer: {
    about: "Company",
    editorial: "Editorial policy",
    sources: "Data sources",
    disclosure: "Ad & affiliate disclosure",
    risk: "Risk disclosure",
    terms: "Terms",
    privacy: "Privacy",
    disclaimer: "Disclaimer",
    rights: "This is a demo environment containing sample data.",
  },
};

export type Dictionary = typeof ja;

export function getDictionary(locale: Locale): Dictionary {
  return locale === "ja" ? ja : en;
}
