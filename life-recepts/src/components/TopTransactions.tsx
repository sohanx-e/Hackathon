import { useState } from "react";
import { ShieldAlert } from "lucide-react";
import Card from "./ui/Card";
import { EmptyState } from "./LoadingState";
import type { Txn } from "../types";
import { getTopTransactions } from "../utils/calculations";
import { formatCurrency, formatDate, truncate } from "../utils/formatting";
import { MUTED_SERIES } from "../utils/palette";

interface TopTransactionsProps {
  txns: Txn[];
  hasFlags: boolean;
  categoryColors: Map<string, string>;
  delay?: number;
}

const INITIAL_COUNT = 6;
const EXPANDED_COUNT = 15;

export default function TopTransactions({ txns, hasFlags, categoryColors, delay }: TopTransactionsProps) {
  const [expanded, setExpanded] = useState(false);
  const rows = getTopTransactions(txns, expanded ? EXPANDED_COUNT : INITIAL_COUNT, "expense");
  const totalAvailable = txns.filter((t) => t.type === "expense").length;

  if (!rows.length) {
    return (
      <Card title="Top transactions" subtitle="Your largest expenses" delay={delay}>
        <EmptyState title="No expenses to rank" detail="There are no expense transactions in the current filters." />
      </Card>
    );
  }

  const largest = rows[0].amount;

  return (
    <Card title="Top transactions" subtitle="Your largest expenses, ranked by amount" delay={delay}>
      <ol className="flex-1 space-y-0.5">
        {rows.map((t, index) => (
          <li key={t.id}>
            <div className="group relative flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-white/[0.035]">
              {/* Proportional rail: this expense's weight against the largest one. */}
              <span
                aria-hidden
                className="absolute bottom-1 left-0 h-[2px] rounded-full opacity-60 transition-opacity group-hover:opacity-90"
                style={{
                  width: `${Math.max(2, (t.amount / largest) * 100)}%`,
                  background: categoryColors.get(t.category) ?? MUTED_SERIES,
                }}
              />
              <span className="relative z-10 w-4 shrink-0 text-right text-[11px] font-medium tabular-nums text-[var(--ink-muted)]">
                {index + 1}
              </span>
              <div className="relative z-10 min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-[13.5px] font-medium text-[var(--ink-primary)]">
                    {truncate(t.description, 32)}
                  </p>
                  {hasFlags && t.flagged && (
                    <span
                      title="Flagged for review in the source data"
                      className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#d03b3b]/15 px-1.5 py-0.5 text-[10px] font-medium text-[#f0908f]"
                    >
                      <ShieldAlert size={9} />
                      Flagged
                    </span>
                  )}
                </div>
                <p className="mt-0.5 flex items-center gap-1.5 truncate text-[11.5px] text-[var(--ink-muted)]">
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: categoryColors.get(t.category) ?? MUTED_SERIES }}
                  />
                  {t.category} · {formatDate(t.date)}
                  {t.place ? ` · ${truncate(t.place, 22)}` : ""}
                </p>
              </div>
              <p className="relative z-10 shrink-0 text-[13.5px] font-semibold tabular-nums text-[var(--ink-primary)]">
                {formatCurrency(t.amount)}
              </p>
            </div>
          </li>
        ))}
      </ol>

      {totalAvailable > INITIAL_COUNT && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-4 w-full rounded-xl border border-[var(--hairline)] bg-white/[0.02] py-2 text-xs font-medium text-[var(--ink-secondary)] transition-colors hover:bg-white/[0.06] hover:text-white"
        >
          {expanded ? "Show less" : `View all — ${totalAvailable.toLocaleString("en-IN")} expenses`}
        </button>
      )}
    </Card>
  );
}
