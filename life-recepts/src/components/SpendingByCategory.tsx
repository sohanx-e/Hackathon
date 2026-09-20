import { useMemo } from "react";
import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import Card, { Chip } from "./ui/Card";
import { EmptyState } from "./LoadingState";
import type { CategoryTotal } from "../types";
import { formatCurrency, formatCurrencyCompact, formatPercent, truncate } from "../utils/formatting";
import { INK, MUTED_SERIES } from "../utils/palette";

interface SpendingByCategoryProps {
  categories: CategoryTotal[];
  categoryColors: Map<string, string>;
  delay?: number;
}

const MAX_BARS = 8;

interface ChartRow {
  category: string;
  fullCategory: string;
  amount: number;
  share: number;
  count: number;
  color: string;
}

interface AxisTickProps {
  x?: number;
  y?: number;
  payload?: { value?: string | number };
}

/**
 * Recharts' default tick wraps long labels onto a second line, which breaks the
 * row rhythm. This renders each label on exactly one line.
 */
function AxisTick({ x = 0, y = 0, payload }: AxisTickProps) {
  return (
    <text x={x} y={y} dy={4} textAnchor="end" fill={INK.secondary} fontSize={12.5}>
      {payload?.value ?? ""}
    </text>
  );
}

export default function SpendingByCategory({ categories, categoryColors, delay }: SpendingByCategoryProps) {
  const rows: ChartRow[] = useMemo(() => {
    if (!categories.length) return [];
    const top = categories.slice(0, MAX_BARS);
    const rest = categories.slice(MAX_BARS);

    const built: ChartRow[] = top.map((c) => ({
      category: truncate(c.category, 16),
      fullCategory: c.category,
      amount: c.amount,
      share: c.share,
      count: c.count,
      color: categoryColors.get(c.category) ?? MUTED_SERIES,
    }));

    if (rest.length) {
      // Named distinctly from any real "Other" category in the source data,
      // and re-sorted into rank order below rather than always pinned last.
      built.push({
        category: "Everything else",
        fullCategory: `Everything else (${rest.length} smaller categories)`,
        amount: rest.reduce((s, c) => s + c.amount, 0),
        share: rest.reduce((s, c) => s + c.share, 0),
        count: rest.reduce((s, c) => s + c.count, 0),
        color: MUTED_SERIES,
      });
    }

    return built.sort((a, b) => b.amount - a.amount);
  }, [categories, categoryColors]);

  if (!rows.length) {
    return (
      <Card title="Spending by category" subtitle="Where your money is going" delay={delay}>
        <EmptyState title="No expense data" detail="There are no expense transactions in the current filters." />
      </Card>
    );
  }

  const leader = rows[0];

  return (
    <Card
      title="Spending by category"
      subtitle={`${categories.length} categories, ranked by amount spent`}
      delay={delay}
      action={<Chip tone="accent">{formatPercent(leader.share, 0)} in {truncate(leader.fullCategory, 14)}</Chip>}
    >
      <div style={{ height: Math.max(260, rows.length * 46) }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 66, left: 0, bottom: 0 }} barCategoryGap={9}>
            <XAxis type="number" hide domain={[0, "dataMax"]} />
            <YAxis
              type="category"
              dataKey="category"
              width={128}
              tickLine={false}
              axisLine={false}
              tick={<AxisTick />}
            />
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.035)" }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const row = payload[0].payload as ChartRow;
                return (
                  <div className="rounded-xl border border-white/10 bg-[var(--surface-raised)] px-3.5 py-2.5 text-xs shadow-2xl">
                    <p className="flex items-center gap-2 font-medium text-white">
                      <span className="h-2 w-2 rounded-full" style={{ background: row.color }} />
                      {row.fullCategory}
                    </p>
                    <p className="mt-1.5 tabular-nums text-zinc-300">
                      {formatCurrency(row.amount)} · {formatPercent(row.share)}
                    </p>
                    <p className="text-zinc-500">{row.count} transactions</p>
                  </div>
                );
              }}
            />
            <Bar dataKey="amount" radius={[4, 4, 4, 4]} maxBarSize={20} isAnimationActive={false}>
              {rows.map((row) => (
                <Cell key={row.fullCategory} fill={row.color} />
              ))}
              <LabelList
                dataKey="amount"
                position="right"
                fill={INK.secondary}
                fontSize={11.5}
                offset={10}
                formatter={(value) => formatCurrencyCompact(Number(value))}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
