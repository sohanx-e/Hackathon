import { useMemo, type ReactNode } from "react";
import { CalendarRange, Database, Layers } from "lucide-react";
import type { Dataset, Txn } from "../types";
import { formatCurrency, formatDate, formatNumber } from "../utils/formatting";
import { uniqueCategories } from "../utils/calculations";

interface HeroProps {
  dataset: Dataset;
  filteredTxns: Txn[];
  totalExpense: number;
}

export default function Hero({ dataset, filteredTxns, totalExpense }: HeroProps) {
  const summary = useMemo(() => {
    if (!filteredTxns.length) return null;
    const categories = uniqueCategories(filteredTxns.filter((t) => t.type === "expense"));
    const times = filteredTxns.map((t) => t.date.getTime());
    return {
      categoryCount: categories.length,
      earliest: new Date(Math.min(...times)),
      latest: new Date(Math.max(...times)),
    };
  }, [filteredTxns]);

  return (
    <section className="animate-rise grid gap-8 pt-10 pb-2 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:items-end lg:gap-12 lg:pt-14">
      <div>
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--hairline)] bg-white/[0.03] px-3 py-1 text-[11px] font-medium text-[var(--ink-secondary)]">
          <Database size={11} />
          {dataset.label}
        </div>

        <h2 className="max-w-2xl text-[32px] font-semibold leading-[1.1] tracking-[-0.02em] text-[var(--ink-primary)] sm:text-[42px]">
          Your financial life
          <br className="hidden sm:block" /> at a glance.
        </h2>

        {summary ? (
          <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-[var(--ink-secondary)]">
            You recorded <Figure>{formatNumber(filteredTxns.length)}</Figure> transactions and spent{" "}
            <Figure>{formatCurrency(totalExpense)}</Figure> across{" "}
            <Figure>{summary.categoryCount}</Figure> categories.
          </p>
        ) : (
          <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-[var(--ink-secondary)]">
            No transactions match the current filters — try widening the date range or clearing filters.
          </p>
        )}
      </div>

      {summary && (
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[var(--hairline)] bg-[var(--hairline)] sm:grid-cols-3 lg:grid-cols-2">
          <MetaCell
            icon={<CalendarRange size={13} />}
            label="First record"
            value={formatDate(summary.earliest)}
          />
          <MetaCell
            icon={<CalendarRange size={13} />}
            label="Last record"
            value={formatDate(summary.latest)}
          />
          <MetaCell
            icon={<Layers size={13} />}
            label="Categories"
            value={formatNumber(summary.categoryCount)}
            className="max-sm:col-span-2 lg:col-span-2"
          />
        </dl>
      )}
    </section>
  );
}

function Figure({ children }: { children: ReactNode }) {
  return <span className="font-semibold text-[var(--ink-primary)]">{children}</span>;
}

function MetaCell({
  icon,
  label,
  value,
  className = "",
}: {
  icon: ReactNode;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`bg-[#0c0d13] px-4 py-3.5 ${className}`}>
      <dt className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-[var(--ink-muted)]">
        {icon}
        {label}
      </dt>
      <dd className="mt-1.5 truncate text-sm font-medium text-[var(--ink-primary)]">{value}</dd>
    </div>
  );
}
