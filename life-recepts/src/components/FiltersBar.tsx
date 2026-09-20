import { ListFilter, Search, X } from "lucide-react";
import type { Filters } from "../types";
import { toISODate } from "../utils/formatting";

interface FiltersBarProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  categories: string[];
  hasIncome: boolean;
  hasTransfers: boolean;
}

const TYPE_OPTIONS: { value: Filters["type"]; label: string }[] = [
  { value: "all", label: "All" },
  { value: "expense", label: "Expenses" },
  { value: "income", label: "Income" },
  { value: "transfer", label: "Transfers" },
];

const MAX_CATEGORY_CHIPS = 14;

export default function FiltersBar({ filters, onChange, categories, hasIncome, hasTransfers }: FiltersBarProps) {
  const typeOptions = TYPE_OPTIONS.filter((opt) => {
    if (opt.value === "income") return hasIncome;
    if (opt.value === "transfer") return hasTransfers;
    return true;
  });

  const activeCount =
    (filters.type !== "all" ? 1 : 0) +
    filters.categories.length +
    (filters.from ? 1 : 0) +
    (filters.to ? 1 : 0) +
    (filters.search.trim() ? 1 : 0);

  function setDate(field: "from" | "to", value: string) {
    onChange({ ...filters, [field]: value ? new Date(`${value}T00:00:00`) : null });
  }

  function toggleCategory(cat: string) {
    const set = new Set(filters.categories);
    if (set.has(cat)) set.delete(cat);
    else set.add(cat);
    onChange({ ...filters, categories: [...set] });
  }

  return (
    // Sticky only from `md` up: below that the header wraps to two rows and a
    // sticky bar would slide underneath it.
    <div className="animate-rise z-20 rounded-2xl border border-[var(--hairline)] bg-[#0b0c12]/90 p-3 backdrop-blur-xl sm:p-3.5 md:sticky md:top-[67px]">
      <div className="flex flex-col gap-2.5 xl:flex-row xl:items-center">
        <div className="relative flex-1 xl:max-w-xs">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)]"
          />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            placeholder="Search all transactions…"
            aria-label="Search transactions"
            className="w-full rounded-xl border border-[var(--hairline)] bg-white/[0.03] py-2 pl-9 pr-3 text-sm text-white outline-none transition-colors placeholder:text-[var(--ink-muted)] focus:border-[#3987e5]/50"
          />
        </div>

        <div
          className="flex items-center gap-0.5 self-start rounded-xl border border-[var(--hairline)] bg-white/[0.02] p-1"
          role="group"
          aria-label="Filter by transaction type"
        >
          {typeOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ ...filters, type: opt.value })}
              aria-pressed={filters.type === opt.value}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                filters.type === opt.value
                  ? "bg-white text-black"
                  : "text-[var(--ink-secondary)] hover:bg-white/5 hover:text-white"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="filter-from">
            From date
          </label>
          <input
            id="filter-from"
            type="date"
            value={filters.from ? toISODate(filters.from) : ""}
            onChange={(e) => setDate("from", e.target.value)}
            className="rounded-xl border border-[var(--hairline)] bg-white/[0.03] px-2.5 py-[7px] text-xs text-[var(--ink-secondary)] outline-none transition-colors focus:border-[#3987e5]/50 [color-scheme:dark]"
          />
          <span className="text-[var(--ink-muted)]">–</span>
          <label className="sr-only" htmlFor="filter-to">
            To date
          </label>
          <input
            id="filter-to"
            type="date"
            value={filters.to ? toISODate(filters.to) : ""}
            onChange={(e) => setDate("to", e.target.value)}
            className="rounded-xl border border-[var(--hairline)] bg-white/[0.03] px-2.5 py-[7px] text-xs text-[var(--ink-secondary)] outline-none transition-colors focus:border-[#3987e5]/50 [color-scheme:dark]"
          />
        </div>

        {activeCount > 0 && (
          <button
            type="button"
            onClick={() => onChange({ type: "all", categories: [], from: null, to: null, search: "" })}
            className="inline-flex items-center gap-1.5 self-start rounded-xl border border-[var(--hairline)] bg-white/[0.03] px-3 py-2 text-xs font-medium text-[var(--ink-secondary)] transition-colors hover:text-white xl:ml-auto xl:self-auto"
          >
            <X size={12} />
            Clear
            <span className="rounded-full bg-white/10 px-1.5 text-[10px] tabular-nums">{activeCount}</span>
          </button>
        )}
      </div>

      {categories.length > 0 && categories.length <= MAX_CATEGORY_CHIPS && (
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5 border-t border-[var(--hairline)] pt-2.5">
          <ListFilter size={12} className="mr-0.5 text-[var(--ink-muted)]" />
          {categories.map((cat) => {
            const active = filters.categories.includes(cat);
            return (
              <button
                key={cat}
                type="button"
                onClick={() => toggleCategory(cat)}
                aria-pressed={active}
                className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                  active
                    ? "border-white/25 bg-white/12 text-white"
                    : "border-transparent bg-white/[0.03] text-[var(--ink-muted)] hover:text-[var(--ink-secondary)]"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
