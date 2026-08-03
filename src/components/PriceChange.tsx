import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { clsx } from "clsx";
import { direction, directionSymbol, type Direction } from "@/lib/metrics";
import { formatNumber, formatPercent } from "@/lib/format";

// 騰落は 色 + 記号(▲▼) + 矢印アイコン + テキスト の4手段を併用 (色のみに依存しない)。
export function PriceChange({
  change,
  changePct,
  size = "md",
}: {
  change: number;
  changePct: number | null;
  size?: "sm" | "md" | "lg";
}) {
  const dir: Direction = direction(change);
  const color = dir === "up" ? "text-up" : dir === "down" ? "text-down" : "text-muted";
  const Icon = dir === "up" ? ArrowUp : dir === "down" ? ArrowDown : Minus;
  const label = dir === "up" ? "上昇" : dir === "down" ? "下落" : "変わらず";
  const sign = change > 0 ? "+" : "";
  const textSize = size === "lg" ? "text-lg" : size === "sm" ? "text-xs" : "text-sm";
  return (
    <span className={clsx("tabular inline-flex items-center gap-1 font-semibold", color, textSize)}>
      <Icon size={size === "lg" ? 18 : 13} aria-hidden />
      <span aria-hidden>{directionSymbol(dir)}</span>
      <span>
        {sign}
        {formatNumber(change)}
      </span>
      {changePct !== null && <span>({formatPercent(changePct)})</span>}
      <span className="sr-only">
        {label} {formatNumber(Math.abs(change))}
      </span>
    </span>
  );
}
