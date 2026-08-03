// 軽量なSVGスパークライン。外部ライブラリ不使用・SSR安全・色のみに依存しない(方向をaria-labelで明示)。
export function Sparkline({
  data,
  width = 160,
  height = 44,
  ariaLabel,
}: {
  data: number[];
  width?: number;
  height?: number;
  ariaLabel?: string;
}) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pad = 3;
  const w = width - pad * 2;
  const h = height - pad * 2;
  const points = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * w;
    const y = pad + (1 - (v - min) / range) * h;
    return [x, y] as const;
  });
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const areaPath = `${path} L${(pad + w).toFixed(1)},${(pad + h).toFixed(1)} L${pad.toFixed(1)},${(pad + h).toFixed(1)} Z`;
  const up = data[data.length - 1]! >= data[0]!;
  const color = up ? "#e11d48" : "#059669"; // 上昇=赤(日本慣習) / 下落=緑
  const gid = `spark-${Math.round(points[0]![0])}-${data.length}-${up ? "u" : "d"}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={ariaLabel} className="overflow-visible">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gid})`} />
      <path d={path} fill="none" stroke={color} strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={points[points.length - 1]![0]} cy={points[points.length - 1]![1]} r={2.4} fill={color} />
    </svg>
  );
}
