# DB設計書

Phase 1 は `src/data/*.json` を単一の真実（seed）とし、`src/lib/providers/mock.ts` が typed な各ビューを決定的に導出します。実運用では以下の PostgreSQL（Supabase）設計へ移行します。

## テーブル一覧（グループ別・目標）

- **ユーザー/権限**: users, profiles, roles, permissions, user_roles, user_settings, notifications, notification_preferences
- **企業/銘柄**: companies, company_translations, securities, security_listings, exchanges, market_segments, industries, company_industries, themes, company_themes, company_brands, company_subsidiaries, company_officers, company_shareholders, corporate_actions
- **株価/市場**: price_daily, price_intraday, trading_statistics, market_indices, index_constituents, sector_statistics, market_data_sources, data_import_jobs, data_import_errors
- **財務**: fiscal_periods, financial_statements, income_statements, balance_sheets, cash_flow_statements, financial_metrics, earnings_forecasts, analyst_consensus, segment_information, accounting_standards
- **決算/開示**: earnings_events, disclosures, disclosure_documents, disclosure_categories, ir_documents, filing_sources
- **配当/優待**: dividends, dividend_forecasts, dividend_policies, shareholder_benefits, shareholder_benefit_conditions, shareholder_benefit_history
- **コンテンツ**: content_items, content_translations, categories, tags, content_tags, authors, reviewers, sources, content_sources, faqs, glossary_terms, learning_paths, learning_path_items, learning_progress
- **証券会社/広告**: securities_brokers, broker_translations, broker_fees, broker_services, broker_features, affiliate_links, affiliate_clicks, affiliate_conversions, campaigns
- **ユーザー機能**: watchlists, watchlist_items, portfolios, portfolio_positions, portfolio_transactions, saved_screens, saved_articles, comparison_history, browsing_history
- **コミュニティ**: community_posts, community_comments, community_reactions, community_reports, user_follows, user_blocks, moderation_actions
- **システム**: legal_documents, seo_metadata, redirects, audit_logs, data_sources, data_update_logs, site_settings, newsletter_subscribers

## 主要カラム仕様（抜粋）

### companies
`code`(PK, 証券コード) / `market_segment`(prime|standard|growth|other) / `industry_code`(FK) / `fiscal_year_end_month` / `accounting_standard`(jgaap|ifrs|usgaap) / `shares_outstanding` / 来歴カラム一式。多言語名は `company_translations(code, locale, name, description, translation_status)`。

### financial_statements
`code`,`fiscal_year`,`consolidation`,`forecast_type` を複合キーの識別軸に。**実績と予想・連結と単体・年次と四半期を必ず区別**。訂正は `revision_number` と `effective_at` で履歴保持。

### dividends / shareholder_benefits
予想値/確定値を `forecast` フラグで区別。優待は `record_months int[]`・`verified_at`・変更/廃止履歴（`shareholder_benefit_history`）を保持。

### affiliate_clicks
`broker_slug`,`source`,`code`,`campaign`,`utm_*`,`sub_id`,`clicked_at`,`referrer`。IP は保存最小化（ハッシュ/集計）・ボット除外・重複判定。

## インデックス方針

- `companies(industry_code)`, `companies(market_segment)` — スクリーナー絞り込み
- `price_daily(code, date desc)` — 時系列取得
- `financial_statements(code, fiscal_year, consolidation, forecast_type)` — 一意制約 + 取得高速化
- `earnings_events(scheduled_date)`, `disclosures(published_at desc)` — カレンダー/新着
- `affiliate_clicks(broker_slug, clicked_at)` — 計測集計
- 全文検索: 企業名/カナ/英名/コード に対し `pg_trgm` or `tsvector`

## 翻訳状態

`translation_status`: Draft / Machine Translated / Human Reviewed / Published / Needs Update。原文更新時に翻訳へ `Needs Update` を自動付与。

## セキュリティ

Supabase **Row Level Security** とアプリ側の権限確認を併用。ポートフォリオ等の機微データは本人のみ。管理系は role ベース（管理者/編集者/データ編集者/翻訳者/監修者/モデレーター/サポート/閲覧専用）。

## マイグレーション運用

`prisma/schema.prisma`（or Supabase migrations）でスキーマ管理。マスタ（業種・市場区分・テーマ）は `src/data/*.json` を seed として起動時同期。破壊的変更は `redirects` と併せて 301 管理。
