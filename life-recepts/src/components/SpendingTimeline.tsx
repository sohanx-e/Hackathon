import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import Card, { Chip } from "./ui/Card";
import { EmptyState } from "./LoadingState";
import type { Granularity, PeriodPoint, Txn } from "../types";
import { calculateMonthlyTotals, pickGranularity } from "../utils/calculations";
import {
  formatCurrency,
  formatCurrencyCompact,
  formatPeriodFull,
  formatPeriodTick,
} from "../utils/formatting";
import { INK, NET_COLOR } from "../utils/palette";

interface SpendingTimelineProps {
  txns: Txn[];
  delay?: number;
}

const GRANULARITY_LABEL: Record<Granularity, string> = {
  day: "Daily",
  week: "Weekly",
  month: "Monthly",
  quarter: "Quarterly",
  year: "Yearly",
};

export default function SpendingTimeline({ txns, delay }: SpendingTimelineProps) {
  const { data, granularity, peak } = useMemo(() => {
    const expenses = txns.filter((t) => t.type === "expense");
    const g = pickGranularity(expenses);
    const points = calculateMonthlyTotals(expenses, g).map((p) => ({
      ...p,
      tickLabel: formatPeriodTick(p.date, g),
    }));
    const highest = points.length ? points.reduce((a, b) => (b.expense > a.expense ? b : a)) : null;
    return { data: points, granularity: g, peak: highest };
  }, [txns]);

  if (data.length < 2) {
    return (
      <Card title="Spending timeline" subtitle="Transaction activity over time" delay={delay}>
        <EmptyState
          title="Not enough data"
          detail="More transactions across different dates are needed to plot a timeline."
        />
      </Card>
    );
  }

  // Keep the x-axis legible: show at most ~10 ticks regardless of point count.
  const tickInterval = Math.max(0, Math.ceil(data.length / 10) - 1);

  return (
    <Card
      title="Spending timeline"
      subtitle={`${GRANULARITY_LABEL[granularity]} expense activity`}
      delay={delay}
      action={
        peak ? (
          <Chip tone="accent">Peak {formatCurrencyCompact(peak.expense)} · {formatPeriodTick(peak.date, granularity)}</Chip>
        ) : undefined
      }
    >
      <div className="min-h-[300px] w-full flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="timelineFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={NET_COLOR} stopOpacity={0.32} />
                <stop offset="100%" stopColor={NET_COLOR} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="2 4" stroke={INK.grid} vertical={false} />
            <XAxis
              dataKey="tickLabel"
              tickLine={false}
              axisLine={{ stroke: INK.baseline }}
              tick={{ fill: INK.muted, fontSize: 11.5 }}
              interval={tickInterval}
              minTickGap={20}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: INK.muted, fontSize: 11.5 }}
              tickFormatter={(v: number) => formatCurrencyCompact(v)}
              width={62}
            />
            <Tooltip
              cursor={{ stroke: INK.baseline, strokeWidth: 1 }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const point = payload[0].payload as PeriodPoint;
                return (
                  <div className="rounded-xl border border-white/10 bg-[var(--surface-raised)] px-3.5 py-2.5 text-xs shadow-2xl">
                    <p className="font-medium text-white">{formatPeriodFull(point.date, granularity)}</p>
                    <p className="mt-1.5 text-base font-semibold tabular-nums text-white">
                      {formatCurrency(point.expense)}
                    </p>
                    <p className="text-zinc-500">{point.count} transactions</p>
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="expense"
              stroke={NET_COLOR}
              strokeWidth={2}
              fill="url(#timelineFill)"
              activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--page-bg)" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
