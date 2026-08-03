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
