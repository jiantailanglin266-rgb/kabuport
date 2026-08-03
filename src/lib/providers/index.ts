// プロバイダー選択。J-Quantsスナップショットに実データがあれば live、無ければ mock。
// 実データ取得は scripts/fetch-jquants.mjs（CIの日次ジョブ）が担当。
import { mockProviders } from "./mock";
import { hasLiveData, jquantsProviders } from "./jquants";
import type { Providers } from "./types";

let cached: Providers | null = null;

export function getProviders(): Providers {
  if (cached) return cached;
  cached = hasLiveData() ? jquantsProviders : mockProviders;
  return cached;
}

export type { Providers } from "./types";
