// J-Quants API クライアント。
// 認証: リフレッシュトークン → IDトークン。メール/パスワードからの取得にも対応。
// ベースURLは環境変数で差し替え可能（将来のバージョン移行に備える）。

import { getJson, fetchWithRetry, redact } from "./http.mjs";

const BASE = (process.env.JQUANTS_API_BASE || "https://api.jquants.com/v1").replace(/\/$/, "");

export function jquantsConfigured() {
  return Boolean(process.env.JQUANTS_REFRESH_TOKEN || (process.env.JQUANTS_MAILADDRESS && process.env.JQUANTS_PASSWORD));
}

export async function getIdToken() {
  const secrets = [process.env.JQUANTS_REFRESH_TOKEN, process.env.JQUANTS_PASSWORD].filter(Boolean);
  let refreshToken = process.env.JQUANTS_REFRESH_TOKEN;

  if (!refreshToken && process.env.JQUANTS_MAILADDRESS && process.env.JQUANTS_PASSWORD) {
    const res = await fetchWithRetry(
      `${BASE}/token/auth_user`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mailaddress: process.env.JQUANTS_MAILADDRESS,
          password: process.env.JQUANTS_PASSWORD,
        }),
      },
      { label: "auth_user", secrets },
    );
    if (!res.ok) throw new Error(`auth_user failed: HTTP ${res.status}`);
    refreshToken = (await res.json()).refreshToken;
  }

  if (!refreshToken) return null;

  const res = await fetchWithRetry(
    `${BASE}/token/auth_refresh?refreshtoken=${encodeURIComponent(refreshToken)}`,
    { method: "POST" },
    { label: "auth_refresh", secrets },
  );
  if (!res.ok) throw new Error(`auth_refresh failed: HTTP ${res.status}`);
  return (await res.json()).idToken;
}

/**
 * ページネーション対応のGET。
 * J-Quants は pagination_key を返すため、全件取得するまで追跡する。
 */
export async function jqGet(path, idToken, { key, label = path, maxPages = 50 } = {}) {
  const rows = [];
  let paginationKey = null;
  const secrets = [idToken];

  for (let page = 0; page < maxPages; page++) {
    const sep = path.includes("?") ? "&" : "?";
    const url = `${BASE}${path}${paginationKey ? `${sep}pagination_key=${encodeURIComponent(paginationKey)}` : ""}`;
    const data = await getJson(url, { headers: { Authorization: `Bearer ${idToken}` } }, { label, secrets });
    if (!data) break;

    const listKey = key ?? Object.keys(data).find((k) => Array.isArray(data[k]));
    if (listKey && Array.isArray(data[listKey])) rows.push(...data[listKey]);

    paginationKey = data.pagination_key ?? null;
    if (!paginationKey) break;
  }
  return rows;
}

/** 4桁コード → J-Quantsの5桁コード（末尾0）。5桁ならそのまま。 */
export function toJqCode(code) {
  const c = String(code).trim();
  return c.length === 4 ? `${c}0` : c;
}

/** J-Quantsの5桁コード → サイト内で使う4桁コード。 */
export function toSiteCode(code) {
  const c = String(code ?? "").trim();
  return c.length === 5 && c.endsWith("0") ? c.slice(0, 4) : c;
}

export function logSafe(...args) {
  const secrets = [process.env.JQUANTS_REFRESH_TOKEN, process.env.JQUANTS_PASSWORD, process.env.EDINET_API_KEY].filter(Boolean);
  console.log("[jquants]", ...args.map((a) => redact(typeof a === "string" ? a : JSON.stringify(a), secrets)));
}

export const JQUANTS_BASE = BASE;
