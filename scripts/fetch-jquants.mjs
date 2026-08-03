// J-Quants API から日次の実データを取得し src/data/live/jquants.json に書き出す。
// 認証情報が無ければ何もせず終了 (サンプルデータのまま。CIは常にgreen)。
//
// 認証(いずれか):
//   JQUANTS_REFRESH_TOKEN                （推奨。CIに登録）
//   JQUANTS_MAILADDRESS + JQUANTS_PASSWORD
//
// 取得対象は src/data/companies.json の証券コード。J-Quantsの5桁コード = 4桁 + "0"。
// 無料プランはデータ配信に遅延があります（本サイトは非リアルタイムを明示）。

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const API = "https://api.jquants.com/v1";
const OUT = join(ROOT, "src/data/live/jquants.json");
const DELAY_MINUTES = Number(process.env.JQUANTS_DELAY_MINUTES || "0") || null;

function log(...a) { console.log("[jquants]", ...a); }

async function getIdToken() {
  const refresh = process.env.JQUANTS_REFRESH_TOKEN;
  const mail = process.env.JQUANTS_MAILADDRESS;
  const pass = process.env.JQUANTS_PASSWORD;
  let refreshToken = refresh;
  if (!refreshToken && mail && pass) {
    const r = await fetch(`${API}/token/auth_user`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mailaddress: mail, password: pass }),
    });
    if (!r.ok) throw new Error(`auth_user failed: ${r.status}`);
    refreshToken = (await r.json()).refreshToken;
  }
  if (!refreshToken) return null;
  const r = await fetch(`${API}/token/auth_refresh?refreshtoken=${encodeURIComponent(refreshToken)}`, { method: "POST" });
  if (!r.ok) throw new Error(`auth_refresh failed: ${r.status}`);
  return (await r.json()).idToken;
}

async function api(path, idToken) {
  const r = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${idToken}` } });
  if (r.status === 403 || r.status === 400) return null; // プラン外/未提供はスキップ
  if (!r.ok) throw new Error(`${path} -> ${r.status}`);
  return r.json();
}

function jq(code) { return `${code}0`; } // 4桁 -> 5桁

async function main() {
  let idToken;
  try {
    idToken = await getIdToken();
  } catch (e) {
    log("認証エラー。サンプルのまま継続:", e.message);
    return;
  }
  if (!idToken) {
    log("認証情報なし。実データ取得をスキップ（サンプルのまま）。");
    return;
  }
  log("認証OK。取得開始。");

  const companies = JSON.parse(readFileSync(join(ROOT, "src/data/companies.json"), "utf8"));
  const codes = companies.map((c) => c.code);

  const snapshot = {
    fetchedAt: new Date().toISOString(),
    source: "J-Quants API",
    delayMinutes: DELAY_MINUTES,
    companies: {},
    quotes: {},
    financials: {},
  };

  const today = new Date();
  const from = new Date(today.getTime() - 400 * 86400000).toISOString().slice(0, 10);
  const to = today.toISOString().slice(0, 10);

  for (const code of codes) {
    const c5 = jq(code);
    // 企業情報
    try {
      const info = await api(`/listed/info?code=${c5}`, idToken);
      const it = info?.info?.[0];
      if (it) {
        snapshot.companies[code] = {
          nameJa: it.CompanyName,
          nameEn: it.CompanyNameEnglish,
          sector33Name: it.Sector33CodeName,
          marketName: it.MarketCodeName,
        };
      }
    } catch (e) { log(`listed/info ${code}:`, e.message); }

    // 日次株価（範囲取得 → 最新行・前日・52週高安を算出）
    try {
      const dq = await api(`/prices/daily_quotes?code=${c5}&from=${from}&to=${to}`, idToken);
      const rows = (dq?.daily_quotes || []).filter((r) => r.Close != null);
      if (rows.length) {
        const last = rows[rows.length - 1];
        const prev = rows[rows.length - 2] || last;
        const highs = rows.map((r) => r.High).filter((v) => v != null);
        const lows = rows.map((r) => r.Low).filter((v) => v != null);
        snapshot.quotes[code] = {
          date: last.Date,
          price: last.Close,
          previousClose: prev.Close,
          open: last.Open ?? last.Close,
          high: last.High ?? last.Close,
          low: last.Low ?? last.Close,
          volume: last.Volume ?? 0,
          week52High: highs.length ? Math.max(...highs) : null,
          week52Low: lows.length ? Math.min(...lows) : null,
        };
      }
    } catch (e) { log(`daily_quotes ${code}:`, e.message); }

    // 財務（最新の通期を1件・ベストエフォート）
    try {
      const fs = await api(`/fins/statements?code=${c5}`, idToken);
      const st = (fs?.statements || []).filter((s) => s.TypeOfCurrentPeriod === "FY");
      const latest = st[st.length - 1];
      if (latest) {
        const num = (v) => (v === "" || v == null ? null : Number(v));
        snapshot.financials[code] = [{
          fiscalYear: latest.CurrentFiscalYearEndDate || latest.DisclosedDate,
          revenue: num(latest.NetSales),
          operatingIncome: num(latest.OperatingProfit),
          netIncome: num(latest.Profit),
          eps: num(latest.EarningsPerShare),
        }];
      }
    } catch (e) { log(`fins/statements ${code}:`, e.message); }
  }

  const nC = Object.keys(snapshot.companies).length;
  const nQ = Object.keys(snapshot.quotes).length;
  log(`取得完了: companies=${nC} quotes=${nQ}`);
  if (nC === 0 && nQ === 0) {
    log("有効データ0件。既存スナップショットを維持（上書きしない）。");
    return;
  }
  writeFileSync(OUT, JSON.stringify(snapshot, null, 2) + "\n");
  log(`書き出し: ${OUT}`);
}

main().catch((e) => { console.error("[jquants] 予期せぬエラー:", e); process.exit(0); });
