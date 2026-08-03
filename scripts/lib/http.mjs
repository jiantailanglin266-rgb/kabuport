// 共通HTTPクライアント: タイムアウト / 指数バックオフ / 最大3リトライ。
// APIキーは絶対にログへ出さない。

const DEFAULT_TIMEOUT_MS = 20000;
const MAX_RETRIES = 3;

/** 秘匿値をログから除去する（保険）。 */
export function redact(text, secrets = []) {
  let out = String(text ?? "");
  for (const s of secrets) {
    if (s && s.length > 6) out = out.split(s).join("***REDACTED***");
  }
  return out.replace(/(Bearer\s+)[A-Za-z0-9._-]+/g, "$1***");
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * リトライ付き fetch。
 * - 429 / 5xx / ネットワークエラーは指数バックオフで再試行
 * - 4xx（429以外）は即座に返す（リトライしても無駄なため）
 */
export async function fetchWithRetry(url, options = {}, opts = {}) {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, retries = MAX_RETRIES, label = "request", secrets = [] } = opts;
  let lastError = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timer);

      if (res.status === 429 || res.status >= 500) {
        const retryAfter = Number(res.headers.get("retry-after"));
        const waitMs = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 800 * Math.pow(2, attempt);
        if (attempt < retries) {
          console.warn(`[http] ${label}: HTTP ${res.status} → ${waitMs}ms 後に再試行 (${attempt + 1}/${retries})`);
          await sleep(waitMs);
          continue;
        }
      }
      return res;
    } catch (err) {
      clearTimeout(timer);
      lastError = err;
      if (attempt < retries) {
        const waitMs = 800 * Math.pow(2, attempt);
        console.warn(`[http] ${label}: ${redact(err.message, secrets)} → ${waitMs}ms 後に再試行 (${attempt + 1}/${retries})`);
        await sleep(waitMs);
        continue;
      }
    }
  }
  throw new Error(`[http] ${label}: リトライ上限に到達 ${lastError ? `(${redact(lastError.message, secrets)})` : ""}`);
}

/** JSONを取得。失敗時は null を返し、呼び出し側が処理継続できるようにする。 */
export async function getJson(url, options = {}, opts = {}) {
  const res = await fetchWithRetry(url, options, opts);
  if (!res.ok) {
    console.warn(`[http] ${opts.label ?? "request"}: HTTP ${res.status}`);
    return null;
  }
  try {
    return await res.json();
  } catch (e) {
    console.warn(`[http] ${opts.label ?? "request"}: JSON parse失敗`);
    return null;
  }
}

/** レート制限に配慮した順次処理（同時実行しない）。 */
export async function forEachSequential(items, intervalMs, fn) {
  const out = [];
  for (let i = 0; i < items.length; i++) {
    out.push(await fn(items[i], i));
    if (intervalMs > 0 && i < items.length - 1) await sleep(intervalMs);
  }
  return out;
}
