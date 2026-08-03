# ER図（目標データモデル）

Phase 1 はサンプル JSON で動作しますが、実運用（Supabase/PostgreSQL）では以下の ER を目標とします。中核部分のみ抜粋。

```mermaid
erDiagram
  companies ||--o{ company_translations : has
  companies ||--o{ securities : issues
  companies ||--o{ company_industries : classified
  industries ||--o{ company_industries : groups
  companies ||--o{ company_themes : tagged
  themes ||--o{ company_themes : groups

  securities ||--o{ price_daily : has
  securities ||--o{ valuations : has
  companies ||--o{ financial_statements : reports
  companies ||--o{ earnings_events : schedules
  companies ||--o{ disclosures : files
  companies ||--o{ dividends : pays
  companies ||--o{ shareholder_benefits : offers

  users ||--o{ watchlists : owns
  watchlists ||--o{ watchlist_items : contains
  users ||--o{ portfolios : owns
  portfolios ||--o{ portfolio_positions : holds
  users ||--o{ community_posts : writes
  community_posts ||--o{ community_comments : has

  brokers ||--o{ affiliate_links : exposes
  affiliate_links ||--o{ affiliate_clicks : tracks

  companies {
    string code PK
    string market_segment
    string industry_code FK
    int fiscal_year_end_month
    string accounting_standard
    timestamptz fetched_at
    string data_status
  }
  financial_statements {
    string code FK
    string fiscal_year
    string consolidation "consolidated/nonconsolidated"
    string forecast_type "actual/company_forecast/analyst_forecast"
    bigint revenue
    bigint operating_income
    bigint net_income
    int revision_number
    timestamptz effective_at
  }
  dividends {
    string code FK
    string fiscal_year
    numeric annual_dividend
    boolean forecast
    int consecutive_increase_years
  }
  shareholder_benefits {
    string code FK
    string category
    int required_shares
    int[] record_months
    date verified_at
  }
  affiliate_clicks {
    uuid id PK
    string broker_slug FK
    string source
    string code
    string campaign
    timestamptz clicked_at
  }
```

## 全データ共通の来歴カラム

重要データ（企業・株価・財務・配当・優待・開示）は次を保持し、実データ誤認・古い値の混入・訂正履歴喪失を防ぐ:

`source_id` / `source_url` / `fetched_at` / `verified_at` / `effective_at` / `published_at` / `data_status`(sample/verified/unverified/stale) / `revision_number`

コーポレートアクション（証券コード変更・上場廃止・商号変更・合併・分割・併合・決算期変更・会計基準変更・訂正開示）は `corporate_actions` で履歴管理し、時系列の再計算を可能にする。
