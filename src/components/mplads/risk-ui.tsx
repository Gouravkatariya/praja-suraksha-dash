import { cn } from "@/lib/utils";
import { tierClass, type RiskTier } from "@/lib/mplads/data";

export function RiskBadge({ tier, className }: { tier: RiskTier; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-sm border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        tierClass[tier],
        className,
      )}
    >
      {tier}
    </span>
  );
}

export function RiskGauge({ score, size = 180 }: { score: number; size?: number }) {
  const r = size / 2 - 14;
  const c = Math.PI * r; // semicircle length
  const pct = Math.max(0, Math.min(100, score)) / 100;
  const color =
    score >= 80
      ? "var(--risk-critical)"
      : score >= 65
        ? "var(--risk-high)"
        : score >= 45
          ? "var(--risk-medium)"
          : "var(--risk-low)";

  return (
    <div className="flex flex-col items-center" style={{ width: size }}>
      <svg width={size} height={size / 2 + 12} viewBox={`0 0 ${size} ${size / 2 + 12}`}>
        <path
          d={`M 14 ${size / 2} A ${r} ${r} 0 0 1 ${size - 14} ${size / 2}`}
          fill="none"
          stroke="var(--muted)"
          strokeWidth="14"
          strokeLinecap="round"
        />
        <path
          d={`M 14 ${size / 2} A ${r} ${r} 0 0 1 ${size - 14} ${size / 2}`}
          fill="none"
          stroke={color}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={`${c * pct} ${c}`}
        />
        <text
          x={size / 2}
          y={size / 2 - 6}
          textAnchor="middle"
          className="fill-foreground font-display"
          style={{ fontSize: size * 0.26, fontWeight: 700 }}
        >
          {score}
        </text>
      </svg>
      <p className="-mt-1 text-xs uppercase tracking-widest text-muted-foreground">Risk score / 100</p>
    </div>
  );
}

export function MetricBar({
  label,
  value,
  suffix = "%",
  color = "var(--navy)",
}: {
  label: string;
  value: number;
  suffix?: string;
  color?: string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono font-semibold">
          {value}
          {suffix}
        </span>
      </div>
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${Math.min(100, value)}%`, background: color }}
        />
      </div>
    </div>
  );
}

export function Disclaimer({ text }: { text: string }) {
  return (
    <p className="rounded-sm border border-[var(--risk-medium)]/40 bg-[var(--risk-medium)]/10 px-3 py-2 text-xs text-foreground">
      <strong className="uppercase tracking-wide">Advisory:</strong> {text}
    </p>
  );
}
