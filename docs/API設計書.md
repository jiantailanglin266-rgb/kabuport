# API設計書

## Phase 1 の方針

Phase 1 は **API ルートをほぼ持ちません**。サーバーコンポーネントが `src/lib/queries.ts` を直接呼び、SSR/SSG で HTML を出力します（主要本文を JS 実行後にしか表示しない構造を避けるため）。データ取得境界は `src/lib/providers/*` のインターフェースで抽象化。

クライアント側の動的操作（スクリーナー絞り込み）は、サーバーから渡した JSON を **クライアントコンポーネント内で処理**（`StockScreener`）し、追加の API 往復を発生させません。

## 目標 API（Phase 3 以降・REST 表）

| Method | Path | 説明 | 認可 |
|---|---|---|---|
| GET | `/api/stocks` | 銘柄一覧（クエリで絞り込み・ページング） | public |
| GET | `/api/stocks/:code` | 銘柄詳細 | public |
| GET | `/api/search?q=` | 横断検索（企業/コード/記事/優待/証券会社） | public |
| GET | `/api/rankings/:key` | ランキング（集計条件付き） | public |
| GET | `/api/calendar/earnings` | 決算予定 | public |
| POST | `/api/watchlists/:id/items` | ウォッチリスト追加 | 本人のみ |
| GET/POST | `/api/portfolios` | ポートフォリオ取得/更新 | 本人のみ |
| POST | `/api/community/posts` | 投稿作成（要モデレーション） | 会員 |
| GET | `/go/:broker` | アフィリエイト計測リダイレクト（→ 302） | public |
| POST | `/api/admin/:resource` | マスタ CRUD | admin |
| POST | `/api/cron/import` | データ取込バッチ | `CRON_SECRET` |

## 共通仕様

- **レスポンス**: `src/lib/api.ts`（Phase 3 で追加）にヘルパー `ok/apiError/validationError/unauthorized/forbidden/notFound/tooManyRequests` を用意し全ルートで統一。
- **バリデーション**: 入力・外部データは **Zod** で検証（`src/lib/validation.ts`）。
- **認可**: 毎ルートで `getSessionUser()` → 自組織/本人データのみ。admin は `requireAdmin()`。Supabase RLS と二重化。
- **監査**: 重要操作は `src/lib/audit.ts`（失敗しても業務を止めない try-catch）。
- **レート制限**: 検索・AI・計測系に `src/lib/rate-limit.ts`（インメモリ トークンバケット）。
- **Next.js 15 の注意**: `route.ts` は HTTP メソッド以外を export 不可（共有は `lib/` へ）。`params`/`cookies()` は `await` 必須。

## アフィリエイト計測（/go）

`/go/:broker?source=stock-detail&code=7203&campaign=nisa` を内部リダイレクトとして受け、`affiliate_clicks` に記録（ボット除外・重複判定・IP 最小化・Cookie 同意考慮）してから広告 URL へ 302。広告であることをリンク付近に明示。
