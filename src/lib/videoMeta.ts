import type { VideoCategory } from "@/types";

/** 動画カテゴリーの表示メタ（サムネイル代替のグラデーションを含む）。 */
export const VIDEO_CATEGORY: Record<VideoCategory, { ja: string; en: string; grad: string }> = {
  market: { ja: "相場解説", en: "Markets", grad: "from-navy-700 via-navy-600 to-primary/70" },
  beginner: { ja: "初心者向け", en: "Beginner", grad: "from-navy-600 via-navy-500 to-primary/50" },
  earnings: { ja: "決算", en: "Earnings", grad: "from-navy-800 via-navy-700 to-navy-400" },
  dividend: { ja: "配当・優待", en: "Dividends", grad: "from-navy-700 via-navy-600 to-gold-600/60" },
  analysis: { ja: "銘柄分析", en: "Analysis", grad: "from-navy-800 via-navy-600 to-primary/55" },
  nisa: { ja: "新NISA・制度", en: "NISA & policy", grad: "from-navy-600 via-navy-700 to-gold/40" },
  ipo: { ja: "IPO", en: "IPO", grad: "from-navy-700 via-primary/40 to-navy-500" },
};

export const VIDEO_CATEGORY_ORDER: VideoCategory[] = [
  "market",
  "beginner",
  "analysis",
  "earnings",
  "dividend",
  "nisa",
  "ipo",
];
