// チャート表示用のサンプル株価系列を決定的に生成する。
// Date.now()/Math.random() を使わず、コードをシードにするため SSR でも安定 (ハイドレーション不一致なし)。
// これは表示用のサンプルであり、実際の値動きではない。

function hashSeed(code: string): number {
  let h = 2166136261;
  for (let i = 0; i < code.length; i++) {
    h ^= code.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// 決定的な擬似乱数 (0..1)。
function rand(seed: number, i: number): number {
  let x = (seed + i * 2654435761) >>> 0;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  return ((x >>> 0) % 100000) / 100000;
}

/**
 * RSI算出などに使う「日足終値」のサンプル系列を決定的に生成する。
 *
 * 実データではない。各銘柄の 52週レンジ内の位置（＝中期トレンドの向き）と
 * 直近の前日比（＝短期の勢い）から、整合するサンプル日足を組み立てる。
 * 末尾は必ず現在値に一致する（増分は平行移動しても変わらないためRSIに影響しない）。
 */
export function dailyCloses(args: {
  code: string;
  low: number;
  high: number;
  price: number;
  previousClose: number;
  days?: number;
}): number[] {
  const { code, low, high, price, previousClose } = args;
  const days = args.days ?? 120;
  if (!(high > low) || price <= 0 || days < 20) return [price, price];

  const seed = hashSeed(`${code}-daily`);
  const width = high - low;
  const rangePos = Math.max(0, Math.min(1, (price - low) / width));
  const momentum = previousClose > 0 ? (price - previousClose) / previousClose : 0;

  // 1) 増分を生成（中期ドリフト + 直近ブースト + 決定的ノイズ）
  const incs: number[] = [];
  const midDrift = (rangePos - 0.5) * width * 0.004; // 中期: レンジ内の位置に応じた緩やかな傾き
  for (let i = 1; i < days; i++) {
    const recent = i > days - 12 ? momentum * price * 0.35 : 0; // 短期: 直近12日に前日比の勢いを反映
    const noise = (rand(seed, i) - 0.5) * width * 0.06; // 日々のばらつき
    incs.push(midDrift + recent + noise);
  }

  // 2) 経路を作り、末尾が現在値になるよう平行移動（増分は不変）
  const path: number[] = [0];
  for (const inc of incs) path.push(path[path.length - 1]! + inc);
  const shift = price - path[path.length - 1]!;
  return path.map((v) => Math.round((v + shift) * 100) / 100);
}

/**
 * 52週安値〜高値の範囲で、末尾を現在値に一致させた points 点の系列を生成。
 */
export function priceSeries(code: string, low: number, high: number, last: number, points = 32): number[] {
  if (!(high > low) || points < 2) return [last, last];
  const seed = hashSeed(code);
  const start = low + (high - low) * (0.25 + rand(seed, 0) * 0.3);
  const out: number[] = [];
  for (let i = 0; i < points; i++) {
    const tRatio = i / (points - 1);
    const base = start + (last - start) * tRatio;
    const noise = (rand(seed, i + 1) - 0.5) * (high - low) * 0.09;
    const v = Math.max(low, Math.min(high, base + noise));
    out.push(Math.round(v));
  }
  out[points - 1] = Math.round(last);
  return out;
}
