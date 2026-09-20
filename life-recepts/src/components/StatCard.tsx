import type { ReactNode } from "react";

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  support?: string;
  tone?: "neutral" | "positive" | "negative";
  /** Renders the card at hero scale — used for the single headline metric. */
  featured?: boolean;
  delay?: number;
}

const TONE_VALUE: Record<NonNullable<StatCardProps["tone"]>, string> = {
  neutral: "text-[var(--ink-primary)]",
  positive: "text-[#5cd48a]",
  negative: "text-[#f0908f]",
};

const TONE_ICON: Record<NonNullable<StatCardProps["tone"]>, string> = {
  neutral: "bg-white/[0.06] text-zinc-300 ring-white/10",
  positive: "bg-[#0ca30c]/12 text-[#5cd48a] ring-[#0ca30c]/20",
  negative: "bg-[#d03b3b]/12 text-[#f0908f] ring-[#d03b3b]/20",
};

export default function StatCard({
  icon,
  label,
  value,
  support,
  tone = "neutral",
  featured = false,
  delay = 0,
}: StatCardProps) {
  return (
    <div
      className="animate-rise group relative overflow-hidden rounded-2xl border border-[var(--hairline)] bg-[var(--surface)] p-4 transition-all duration-200 hover:border-[var(--hairline-strong)] hover:bg-[var(--surface-hover)] sm:p-5"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium leading-tight text-[var(--ink-secondary)]">{label}</p>
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset transition-transform duration-200 group-hover:scale-105 ${TONE_ICON[tone]}`}
        >
          {icon}
        </span>
      </div>

      <p
        className={`mt-3 truncate font-semibold tracking-tight tabular-nums ${TONE_VALUE[tone]} ${
          featured ? "text-3xl sm:text-4xl" : "text-[22px] sm:text-2xl"
        }`}
        title={value}
      >
        {value}
      </p>

      {support && <p className="mt-1.5 truncate text-xs text-[var(--ink-muted)]">{support}</p>}
    </div>
  );
}
