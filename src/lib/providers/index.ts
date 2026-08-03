// プロバイダー選択。env が未設定 or "mock" ならモック。
// live 実装は未提供のため、現状は常にモックへフォールバック (画面は壊れない)。
import { mockProviders } from "./mock";
import type { Providers } from "./types";

let cached: Providers | null = null;

export function getProviders(): Providers {
  if (cached) return cached;
  const mode = (process.env.MARKET_DATA_PROVIDER || "mock").toLowerCase();
  // live プロバイダー未実装。契約後にここで生成し、失敗時は mock にフォールバックする。
  if (mode !== "mock") {
    console.warn(`[providers] "${mode}" は未実装のため mock を使用します。`);
  }
  cached = mockProviders;
  return cached;
}

export type { Providers } from "./types";
