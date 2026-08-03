# KABUPORT — 日本株情報プラットフォーム

**Japan Equity Intelligence.** 日本の上場企業の企業情報・株価・業績・配当・株主優待・決算スケジュールを、初心者から中上級者まで分かりやすく比較・分析できる、多言語（日本語 / 英語）・SEO / LLMO 最適化の日本株情報プラットフォームです。

> 本リポジトリは **Phase 1（土台）** の実装です。すべての株価・財務・配当・優待・開示は **サンプルデータ**であり、実データではありません。投資助言サービスではなく、特定銘柄の売買を推奨するものでもありません。

---

## 主要機能（Phase 1 実装済み）

| 機能 | 内容 |
|---|---|
| 多言語ルーティング | `/ja/` `/en/` サブディレクトリ。self-canonical + hreflang(ja/en/x-default)。強制リダイレクトなし |
| トップページ | 主要指数・値上がり/値下がり・高配当・優待・決算予定・適時開示・学習記事・FAQ・リスク開示 |
| 銘柄スクリーナー | 企業名/コード/業種/市場区分/配当利回り/PER/最低投資金額で絞り込み・並び替え・件数即時表示 |
| 銘柄詳細（12銘柄×2言語） | 株価・主要指標・業績推移(実績/会社予想区別)・配当・株主優待・適時開示・同業他社・企業情報 |
| ランキング | 値上がり/値下がり/高配当/時価総額/出来高。集計条件を明示 |
| 決算カレンダー | 日付別グルーピング表示 |
| 学習コンテンツ | 記事一覧・記事詳細（Article 構造化データ・関連銘柄・出典） |
| 各種方針ページ | 編集方針/情報源/広告開示/リスク/免責/利用規約/プライバシー |
| データ状態の明示 | 全データに `DataSourceBadge`（サンプル）/`DataDelayBadge`（遅延）/`DataUpdatedAt`（取得時刻・出典）|
| SEO 基盤 | metadata / canonical / hreflang / OGP / JSON-LD / sitemap.xml / robots.txt |
| アクセシビリティ | 騰落は 色+記号(▲▼)+矢印+ラベル の併用、`prefers-reduced-motion`、テーブル見出し、sr-only |

## 技術構成

- **Next.js 15**（App Router / React Server Components）+ **React 19** + **TypeScript strict**
- **Tailwind CSS v3**（ライト/ダークテーマ、CSS 変数トークン）
- **Vitest**（純関数のユニットテスト）
- 追加ランタイム依存は最小（`lucide-react` / `clsx` / `zod`）。チャートは軽量な自前 SVG 想定

### 設計方針 3 箇条
1. **モックファースト** — 外部データ（株価/企業/開示/ニュース）は Provider インターフェース越し。環境変数未設定でも `src/data/*.json` のサンプルで完全動作。
2. **決定的ロジックとUIの分離** — 指標計算（利回り・PER・最低投資金額 等）は純関数 `src/lib/metrics.ts`（テスト可能・説明可能）。UI から外部 API を直接呼ばない。
3. **実データ誤認の防止** — 全レコードに来歴（`source / fetchedAt / dataStatus`）を保持し、UI に常時明示。欠損はゼロ扱いせず「—」。実績/予想・連結/単体・年次/四半期を区別。

## アーキテクチャ（テキスト図）

```
[ app/[locale]/*  (RSC/表示) ]
        │  直接呼び出し（API を経由しない SSR）
        ▼
[ lib/queries.ts  (ビューモデル合成) ]
        ▼
[ lib/providers/*  (取得境界: interface) ] ──env──▶ mock（既定） / live（未実装, 契約後に差替え）
        ▼
[ src/data/*.json  (単一の真実 = サンプル seed) ]

[ lib/metrics.ts / format.ts / seo.ts / jsonld.ts / i18n.ts ] ← 共通の純関数群（テスト対象）
```

## クイックスタート

```bash
npm install
npm run dev      # http://localhost:3240 （/ja へリダイレクト）
```

外部 API・DB の設定は不要です（未設定時はサンプルデータで全機能が動作）。

## スクリプト

```bash
npm run dev        # 開発サーバー (:3240)
npm run build      # 本番ビルド（静的生成）
npm run start      # 本番起動 (:3240)
npm run typecheck  # tsc --noEmit
npm run lint       # next lint
npm run test       # vitest（純関数の単体テスト）
```

## 環境変数

`.env.example` を参照（すべて「未設定時の挙動」をコメント記載）。Phase 1 では **すべて任意**です。主要なもの:

| 変数 | 用途 | 未設定時 |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | canonical/hreflang/sitemap の基点 | `http://localhost:3240` |
| `MARKET_DATA_PROVIDER` 等 | 各データプロバイダー選択 | `mock`（サンプル） |
| `DATABASE_URL` / `SUPABASE_*` | 認証・保存系（Phase 5 以降） | デモ動作 |

## ディレクトリ構成（抜粋）

```
src/
  app/
    layout.tsx            # ルート（html/body・テーマFOUC防止）
    page.tsx              # / → /ja リダイレクト
    sitemap.ts robots.ts
    [locale]/
      layout.tsx          # Header/Footer + ロケール検証
      page.tsx            # トップ
      stocks/(一覧+詳細)  rankings/  earnings/  learn/(一覧+詳細)  about/
  components/             # Header/Footer/StockCard/PriceChange/badges/StockScreener ...
  lib/
    metrics.ts format.ts seo.ts jsonld.ts i18n.ts
    providers/            # types.ts / mock.ts / index.ts（取得境界）
    queries.ts            # ページ用ビューモデル合成
  data/*.json             # サンプルデータ（単一の真実）
  types/index.ts          # ドメイン型
tests/                    # metrics / format / seo
docs/                     # 設計書一式
```

詳細は `docs/ディレクトリ構成.md` を参照。

## デモデータと実データの切り替え

- 既定は **mock**。`src/data/*.json` の seed から `src/lib/providers/mock.ts` が typed な各ビューを決定的に導出します。
- 実データ接続時は `src/lib/providers/index.ts` で `MARKET_DATA_PROVIDER` に応じた live 実装を生成し、`Providers` インターフェースを満たすよう実装します（ページ側は変更不要）。取得失敗時は mock にフォールバックし、画面を壊しません。

## 実データ接続（J-Quants・日次自動更新）

現在の公開サイトはサンプルデータですが、**J-Quants API**（JPX公式・無料プランあり）を接続すると、GitHub Actions の日次ジョブで **企業名・株価・52週高安を実データ**に更新できます（指標は実株価で再計算）。GitHub Pages（静的）のまま運用できます。

**セットアップ（お客様の作業）:**
1. [J-Quants](https://jpx-jquants.com/) に無料登録し、リフレッシュトークンを取得。
2. GitHub リポジトリの **Settings → Secrets and variables → Actions** で以下を登録:
   - `JQUANTS_REFRESH_TOKEN`（推奨）、または `JQUANTS_MAILADDRESS` + `JQUANTS_PASSWORD`
   - （任意）変数 `JQUANTS_DELAY_MINUTES`（無料プランの遅延分数。遅延バッジ表示用）
3. **Actions → "Refresh data (J-Quants) and deploy" → Run workflow** で即時実行（以後は毎日 06:00 JST に自動更新）。

**仕組み:**
- `scripts/fetch-jquants.mjs` が取得し `src/data/live/jquants.json` に書き出す（**認証情報が無ければ何もせずサンプル維持**）。
- `src/lib/providers/jquants.ts` が実データを mock の上にマージ。実データがある銘柄は `dataStatus: verified`（`DataSourceBadge` が出典=J-Quantsを表示）、無い項目（配当・優待等）はサンプルのまま明示。
- 無料プランは配信遅延があります（本サイトは非リアルタイムを明示済み）。リアルタイム株価は有料ライセンスが必要です。
- ローカル確認: `JQUANTS_REFRESH_TOKEN=... npm run fetch:data` → `npm run dev`

## 動画ライブラリ（YouTube・現在はモック）

`/[locale]/videos` に動画ライブラリを実装しています。現在は **`src/data/videos.json` のモックデータ**で動作し、動画・チャンネル名・再生回数はすべて架空のサンプルです（実在の動画とは紐づきません）。

**実データへの切り替え:**
1. Google Cloud で YouTube Data API v3 を有効化し、APIキーを取得。
2. `YOUTUBE_API_KEY`（任意で `YOUTUBE_CHANNEL_IDS` / `YOUTUBE_QUERIES`）を設定。
3. `npm run fetch:videos` → `src/data/live/youtube.json` が生成される。

**仕組み:**
- 取得は `scripts/fetch-youtube.mjs`（**APIキーが無ければ no-op**＝モック維持）。
- `Video.youtubeId` が入ると `VideoPlayer` が **youtube-nocookie の埋め込みプレーヤー**に切り替わります（規約に従い公式プレーヤーで再生。動画本体は保存しません）。
- 構造化データ `VideoObject` は **実在する動画（youtubeId あり）のときのみ出力**します（架空の動画を出さないため）。
- カテゴリー分類はタイトル/説明からのルールベース（決定的）。

## 外部 API 接続方法（将来）

`src/lib/providers/types.ts` の各インターフェース（`MarketDataProvider` / `CompanyDataProvider` / `DisclosureProvider` …）を実装したファイルを追加し、`index.ts` の分岐で返すだけ。**UI/ページの実装変更は不要**です。JPX 上場会社情報・EDINET・TDnet・適法な株価 API 等、利用規約・ライセンスを尊重して接続してください（スクレイピング前提にしないこと）。

## データライセンス上の注意

- 本 Phase の企業名・証券コードは公開されている識別情報を用いていますが、**株価・業績・配当・優待・役員等の数値はすべてサンプル（架空）**であり、最新・確定情報ではありません。
- 実運用では一次情報の出典・取得日時・遅延を明示し、リアルタイム性を保証しないこと。

## テスト方法

```bash
npm run test
```

`tests/` に純関数（`metrics` / `format` / `seo`）の単体テスト（19 ケース）。株価騰落率・配当利回り・最低投資金額・PER 等の算出、欠損の非ゼロ扱い、canonical/hreflang 生成を検証。

## セキュリティ上の注意

- 秘密鍵はコードに直書きせず環境変数へ。`NEXT_PUBLIC_*` 以外はサーバー側のみで参照。
- `next.config.mjs` にセキュリティヘッダ（`X-Content-Type-Options` 等）を設定済み。
- 会員/管理/API 系は `robots.ts` で `disallow` 済み（Phase 5/8 実装時に認証・認可でアクセス制御）。

## 未実装項目（今後のロードマップ）

Phase 1 の範囲外。仕様の Phase に沿って拡張予定:

- Phase 2: 業種/テーマページ、銘柄チャート、四半期業績
- Phase 3: 高度なスクリーナー保存/CSV、銘柄比較、配当カレンダー、株主優待DB
- Phase 4: 用語集、Learning Path、監修者、構造化データ拡充
- Phase 5: 会員登録/ログイン、ウォッチリスト、ポートフォリオ、通知、ダッシュボード（Supabase）
- Phase 6: 証券会社一覧/詳細/比較、`/go` アフィリエイトリダイレクト+クリック計測
- Phase 7: コミュニティ（投稿/コメント/通報/モデレーション）
- Phase 8: 管理画面、権限管理、翻訳管理、監査ログ
- Phase 9: E2E（Playwright）、パフォーマンス/セキュリティ強化、デプロイ（Docker/Vercel+Supabase）

## デプロイ

`docs/デプロイ手順.md` を参照。Phase 1 は静的生成（`npm run build`）で Vercel 等にそのままデプロイ可能。認証/保存系（Phase 5 以降）を本番公開する際は `DATABASE_URL`（Supabase）が必須です。

---

免責: 本サイトは一般的な情報提供を目的とし、投資助言ではありません。株式投資には元本損失の可能性があり、過去の実績は将来を保証しません。投資判断はご自身の責任で行ってください。
