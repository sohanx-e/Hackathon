import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import Card, { Chip } from "./ui/Card";
import { EmptyState } from "./LoadingState";
import type { Granularity, PeriodPoint, Txn } from "../types";
import { calculateMonthlyTotals, pickComparisonGranularity } from "../utils/calculations";
import { formatCurrency, formatCurrencyCompact, formatPeriodFull, formatPeriodTick } from "../utils/formatting";
import { EXPENSE_COLOR, INCOME_COLOR, INK } from "../utils/palette";

interface IncomeExpenseChartProps {
  txns: Txn[];
  hasIncome: boolean;
  delay?: number;
}

const GRANULARITY_LABEL: Record<Granularity, string> = {
  day: "Daily",
  week: "Weekly",
  month: "Monthly",
  quarter: "Quarterly",
  year: "Yearly",
};

export default function IncomeExpenseChart({ txns, hasIncome, delay }: IncomeExpenseChartProps) {
  const { data, granularity } = useMemo(() => {
    const g = pickComparisonGranularity(txns);
    const points = calculateMonthlyTotals(txns, g).map((p) => ({
      ...p,
      tickLabel: formatPeriodTick(p.date, g),
    }));
    return { data: points, granularity: g };
  }, [txns]);

  if (data.length < 2) {
    return (
      <Card title="Income vs. expenses" subtitle="How your financial activity changes over time" delay={delay}>
        <EmptyState title="Not enough data" detail="More transactions across different periods are needed for a comparison." />
      </Card>
    );
  }

  return (
    <Card
      title={hasIncome ? "Income vs. expenses" : "Expenses over time"}
      subtitle={hasIncome ? "Money in against money out, side by side" : "Total spend per period"}
      delay={delay}
      action={<Chip>{GRANULARITY_LABEL[granularity]}</Chip>}
    >
      {hasIncome && (
        <div className="mb-4 flex items-center gap-4">
          <LegendKey color={INCOME_COLOR} label="Income" />
          <LegendKey color={EXPENSE_COLOR} label="Expense" />
        </div>
      )}
      <div className="min-h-[300px] w-full flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barGap={3}>
            <CartesianGrid strokeDasharray="2 4" stroke={INK.grid} vertical={false} />
            <XAxis
              dataKey="tickLabel"
              tickLine={false}
              axisLine={{ stroke: INK.baseline }}
              tick={{ fill: INK.muted, fontSize: 11.5 }}
              interval="preserveStartEnd"
              minTickGap={16}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: INK.muted, fontSize: 11.5 }}
              tickFormatter={(v: number) => formatCurrencyCompact(v)}
              width={62}
            />
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.035)" }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const point = payload[0].payload as PeriodPoint;
                return (
                  <div className="min-w-[180px] rounded-xl border border-white/10 bg-[var(--surface-raised)] px-3.5 py-2.5 text-xs shadow-2xl">
                    <p className="font-medium text-white">{formatPeriodFull(point.date, granularity)}</p>
                    {hasIncome && (
                      <Row color={INCOME_COLOR} label="Income" value={formatCurrency(point.income)} />
                    )}
                    <Row color={EXPENSE_COLOR} label="Expense" value={formatCurrency(point.expense)} />
                    {hasIncome && (
                      <p className="mt-2 flex items-center justify-between border-t border-white/10 pt-2 text-zinc-500">
                        Net
                        <span className={`tabular-nums ${point.net >= 0 ? "text-[#5cd48a]" : "text-[#f0908f]"}`}>
                          {formatCurrency(point.net)}
                        </span>
                      </p>
                    )}
                    <p className="mt-1 text-zinc-600">{point.count} transactions</p>
                  </div>
                );
              }}
            />
            {hasIncome && (
              <Bar dataKey="income" name="Income" fill={INCOME_COLOR} radius={[3, 3, 0, 0]} maxBarSize={26} />
            )}
            <Bar dataKey="expense" name="Expense" fill={EXPENSE_COLOR} radius={[3, 3, 0, 0]} maxBarSize={26} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function LegendKey({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-[var(--ink-secondary)]">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

function Row({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <p className="mt-1.5 flex items-center justify-between gap-6 text-zinc-400">
      <span className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full" style={{ background: color }} />
        {label}
      </span>
      <span className="tabular-nums text-white">{value}</span>
    </p>
  );
}
