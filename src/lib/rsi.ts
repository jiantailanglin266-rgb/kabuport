// ============================================================
// RSI（相対力指数 / Wilder方式）と、しきい値によるシグナル判定。
// すべて純関数・決定的。算出式はUIで全公開する。
// ============================================================

/** 判定しきい値（ユーザー指定ルール）: 75超で売りシグナル / 25未満で買いシグナル。 */
export const RSI_UPPER = 75;
export const RSI_LOWER = 25;
export const RSI_PERIOD = 14;

export type RsiSignal = "sell" | "buy" | "neutral";

/**
 * RSI（Wilderの平滑化）を算出する。
 * 1. 最初の period 件の値上がり幅・値下がり幅の単純平均で avgGain/avgLoss を初期化
 * 2. 以降は avg = (avg * (period-1) + 当日値) / period で平滑化
 * 3. RSI = 100 - 100 / (1 + avgGain / avgLoss)
 *
 * @param closes 古い順の終値配列
 * @returns 0-100 の RSI。データ不足（period+1件未満）なら null
 */
export function rsi(closes: number[], period = RSI_PERIOD): number | null {
  if (!Array.isArray(closes) || closes.length < period + 1 || period < 1) return null;

  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i]! - closes[i - 1]!;
    if (diff >= 0) avgGain += diff;
    else avgLoss -= diff;
  }
  avgGain /= period;
  avgLoss /= period;

  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i]! - closes[i - 1]!;
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }

  // 下落が皆無なら100、上昇が皆無なら0（ゼロ除算を避ける）
  if (avgLoss === 0) return avgGain === 0 ? 50 : 100;
  const rs = avgGain / avgLoss;
  return Math.round((100 - 100 / (1 + rs)) * 100) / 100;
}

/** しきい値によるシグナル判定。RSIが算出不能なら neutral。 */
export function rsiSignal(value: number | null, upper = RSI_UPPER, lower = RSI_LOWER): RsiSignal {
  if (value === null) return "neutral";
  if (value > upper) return "sell";
  if (value < lower) return "buy";
  return "neutral";
}

/** 表示用の状態ラベル（テクニカル指標の状態であって、投資判断ではない）。 */
export function rsiStateLabel(value: number | null): { ja: string; en: string } {
  if (value === null) return { ja: "算出不可", en: "N/A" };
  if (value > RSI_UPPER) return { ja: "買われ過ぎ", en: "Overbought" };
  if (value >= 60) return { ja: "やや買われ過ぎ", en: "Mildly overbought" };
  if (value < RSI_LOWER) return { ja: "売られ過ぎ", en: "Oversold" };
  if (value <= 40) return { ja: "やや売られ過ぎ", en: "Mildly oversold" };
  return { ja: "中立圏", en: "Neutral" };
}
