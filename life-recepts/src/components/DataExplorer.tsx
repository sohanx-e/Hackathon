import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Search, ShieldAlert, X } from "lucide-react";
import Card, { Chip } from "./ui/Card";
import { EmptyState } from "./LoadingState";
import type { Txn } from "../types";
import { formatCurrency, formatDate, formatNumber, truncate } from "../utils/formatting";
import { MUTED_SERIES } from "../utils/palette";

interface DataExplorerProps {
  txns: Txn[];
  categories: string[];
  hasFlags: boolean;
  hasPlaces: boolean;
  categoryColors: Map<string, string>;
  delay?: number;
}

type SortKey = "date" | "amount";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 12;

export default function DataExplorer({
  txns,
  categories,
  hasFlags,
  hasPlaces,
  categoryColors,
  delay,
}: DataExplorerProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [visible, setVisible] = useState(PAGE_SIZE);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = txns;
    if (category !== "all") rows = rows.filter((t) => t.category === category);
    if (q) {
      rows = rows.filter((t) =>
        `${t.description} ${t.category} ${t.subcategory ?? ""}`.toLowerCase().includes(q)
      );
    }
    return [...rows].sort((a, b) => {
      const cmp = sortKey === "date" ? a.date.getTime() - b.date.getTime() : a.amount - b.amount;
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [txns, search, category, sortKey, sortDir]);

  const shown = filtered.slice(0, visible);
  const hasFilters = search.trim() !== "" || category !== "all";

  function clearFilters() {
    setSearch("");
    setCategory("all");
    setVisible(PAGE_SIZE);
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
    setVisible(PAGE_SIZE);
  }

  return (
    <Card
      title="Data explorer"
      subtitle="Search, filter and sort every transaction in view"
      delay={delay}
      action={<Chip>{formatNumber(filtered.length)} rows</Chip>}
    >
      <div className="mb-4 flex flex-col gap-2.5 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setVisible(PAGE_SIZE);
            }}
            placeholder="Search description or category…"
            aria-label="Search transactions"
            className="w-full rounded-xl border border-[var(--hairline)] bg-white/[0.03] py-2 pl-9 pr-3 text-sm text-white outline-none transition-colors placeholder:text-[var(--ink-muted)] focus:border-[#3987e5]/50"
          />
        </div>
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setVisible(PAGE_SIZE);
          }}
          aria-label="Filter by category"
          className="rounded-xl border border-[var(--hairline)] bg-white/[0.03] px-3 py-2 text-sm text-white outline-none transition-colors focus:border-[#3987e5]/50 lg:w-52"
        >
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <SortButton active={sortKey === "date"} dir={sortDir} onClick={() => toggleSort("date")} label="Date" />
          <SortButton active={sortKey === "amount"} dir={sortDir} onClick={() => toggleSort("amount")} label="Amount" />
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1 rounded-xl border border-[var(--hairline)] bg-white/[0.03] px-2.5 py-2 text-xs font-medium text-[var(--ink-secondary)] transition-colors hover:text-white"
            >
              <X size={13} />
              Clear
            </button>
          )}
        </div>
      </div>

      {shown.length === 0 ? (
        <EmptyState title="No matching transactions" detail="Try a different search term or category." />
      ) : (
        <>
          <div className="-mx-1 min-w-0 overflow-x-auto">
            <table className="w-full min-w-[580px] border-separate border-spacing-0 text-left text-sm">
              <thead>
                <tr>
                  {["Description", "Category", "Date"].map((heading) => (
                    <th
                      key={heading}
                      scope="col"
                      className="border-b border-[var(--hairline)] px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-muted)]"
                    >
                      {heading}
                    </th>
                  ))}
                  <th
                    scope="col"
                    className="border-b border-[var(--hairline)] px-3 pb-2 text-right text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-muted)]"
                  >
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {shown.map((t) => (
                  <tr key={t.id} className="group">
                    <td className="border-b border-white/[0.04] px-3 py-2.5 transition-colors group-hover:bg-white/[0.025]">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-[13.5px] text-[var(--ink-primary)]">
                          {truncate(t.description, 34)}
                        </span>
                        {hasFlags && t.flagged && (
                          <ShieldAlert size={12} className="shrink-0 text-[#f0908f]" aria-label="Flagged" />
                        )}
                      </div>
                      {hasPlaces && t.place && (
                        <div className="mt-0.5 truncate text-[11.5px] text-[var(--ink-muted)]">{t.place}</div>
                      )}
                    </td>
                    <td className="border-b border-white/[0.04] px-3 py-2.5 transition-colors group-hover:bg-white/[0.025]">
                      <span className="inline-flex items-center gap-1.5 text-[13px] text-[var(--ink-secondary)]">
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ background: categoryColors.get(t.category) ?? MUTED_SERIES }}
                        />
                        {truncate(t.category, 22)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap border-b border-white/[0.04] px-3 py-2.5 text-[13px] text-[var(--ink-secondary)] transition-colors group-hover:bg-white/[0.025]">
                      {formatDate(t.date)}
                    </td>
                    <td
                      className={`whitespace-nowrap border-b border-white/[0.04] px-3 py-2.5 text-right text-[13.5px] font-medium tabular-nums transition-colors group-hover:bg-white/[0.025] ${
                        t.type === "income" ? "text-[#5cd48a]" : "text-[var(--ink-primary)]"
                      }`}
                    >
                      {t.type === "income" ? "+" : ""}
                      {formatCurrency(t.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between gap-4">
            <p className="text-xs text-[var(--ink-muted)]">
              Showing {formatNumber(shown.length)} of {formatNumber(filtered.length)}
            </p>
            {filtered.length > shown.length && (
              <button
                type="button"
                onClick={() => setVisible((v) => v + PAGE_SIZE)}
                className="rounded-lg border border-[var(--hairline)] bg-white/[0.03] px-3.5 py-1.5 text-xs font-medium text-[var(--ink-secondary)] transition-colors hover:bg-white/[0.08] hover:text-white"
              >
                Load more
              </button>
            )}
          </div>
        </>
      )}
    </Card>
  );
}

function SortButton({
  active,
  dir,
  onClick,
  label,
}: {
  active: boolean;
  dir: SortDir;
  onClick: () => void;
  label: string;
}) {
  const Arrow = dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-colors ${
        active
          ? "border-[var(--hairline-strong)] bg-white/[0.08] text-white"
          : "border-[var(--hairline)] bg-white/[0.03] text-[var(--ink-secondary)] hover:text-white"
      }`}
    >
      {label}
      {active && <Arrow size={12} />}
    </button>
  );
}
