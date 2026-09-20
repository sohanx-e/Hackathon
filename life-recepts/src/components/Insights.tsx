import type { ComponentType } from "react";
import {
  Banknote,
  Calendar,
  Flame,
  PiggyBank,
  ShieldAlert,
  Sparkles,
  Store,
  Tag,
  TrendingUp,
} from "lucide-react";
import Card from "./ui/Card";
import { EmptyState } from "./LoadingState";
import type { Insight, InsightIcon, InsightTone } from "../types";

interface InsightsProps {
  insights: Insight[];
  delay?: number;
}

const ICONS: Record<InsightIcon, ComponentType<{ size?: number }>> = {
  category: Tag,
  average: Banknote,
  peak: TrendingUp,
  largest: Sparkles,
  rhythm: Calendar,
  savings: PiggyBank,
  flag: ShieldAlert,
  merchant: Store,
  cadence: Flame,
};

const TONE_STYLES: Record<InsightTone, string> = {
  neutral: "bg-white/[0.06] text-zinc-300 ring-white/10",
  positive: "bg-[#0ca30c]/12 text-[#5cd48a] ring-[#0ca30c]/20",
  warning: "bg-[#d03b3b]/12 text-[#f0908f] ring-[#d03b3b]/20",
};

export default function Insights({ insights, delay }: InsightsProps) {
  if (!insights.length) {
    return (
      <Card title="Insights" subtitle="Patterns detected in your data" delay={delay}>
        <EmptyState
          title="Not enough data yet"
          detail="Insights appear automatically once there's enough transaction history to analyze."
        />
      </Card>
    );
  }

  return (
    <Card
      title="Insights"
      subtitle="Generated from the data currently in view — nothing is precomputed"
      delay={delay}
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {insights.map((insight, i) => {
          const Icon = ICONS[insight.icon];
          return (
            <div
              key={insight.id}
              className="animate-rise flex gap-3 rounded-xl border border-[var(--hairline)] bg-white/[0.02] p-3.5 transition-colors hover:border-[var(--hairline-strong)] hover:bg-white/[0.04]"
              style={{ animationDelay: `${i * 35}ms` }}
            >
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset ${TONE_STYLES[insight.tone]}`}
              >
                <Icon size={14} />
              </div>
              <div className="min-w-0">
                <p className="text-[13.5px] font-medium leading-snug text-[var(--ink-primary)]">{insight.title}</p>
                <p className="mt-1 text-[12px] leading-relaxed text-[var(--ink-muted)]">{insight.detail}</p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
