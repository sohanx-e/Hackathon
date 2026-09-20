import { Receipt, RefreshCw } from "lucide-react";
import type { Dataset, DatasetId } from "../types";
import { formatNumber } from "../utils/formatting";

interface HeaderProps {
  datasets: Dataset[];
  activeId: DatasetId;
  onChange: (id: DatasetId) => void;
  onRefresh: () => void;
  recordCount: number;
}

export default function Header({ datasets, activeId, onChange, onRefresh, recordCount }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--hairline)] bg-[var(--page-bg)]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-5 gap-y-3 px-4 py-3.5 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-black">
            <Receipt size={18} strokeWidth={2.2} />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-[15px] font-semibold leading-tight tracking-tight text-[var(--ink-primary)]">
              Your Life, In Receipts
            </h1>
            <p className="hidden truncate text-xs text-[var(--ink-muted)] sm:block">
              Turn everyday transactions into a story about your life.
            </p>
          </div>
        </div>

        {datasets.length > 1 && (
          <nav
            className="order-3 flex w-full items-center gap-1 rounded-xl border border-[var(--hairline)] bg-white/[0.03] p-1 sm:order-none sm:ml-auto sm:w-auto"
            aria-label="Select dataset"
          >
            {datasets.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => onChange(d.id)}
                aria-pressed={activeId === d.id}
                title={d.description}
                className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors sm:flex-none ${
                  activeId === d.id
                    ? "bg-white text-black"
                    : "text-[var(--ink-secondary)] hover:bg-white/5 hover:text-white"
                }`}
              >
                {d.shortLabel}
              </button>
            ))}
          </nav>
        )}

        <div className="ml-auto flex items-center gap-2 sm:ml-0">
          <span className="hidden items-center gap-2 rounded-lg border border-[#199e70]/20 bg-[#199e70]/[0.08] px-2.5 py-1.5 text-xs font-medium text-[#5cd48a] lg:inline-flex">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#5cd48a] opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#5cd48a]" />
            </span>
            {formatNumber(recordCount)} records
          </span>
          <button
            type="button"
            onClick={onRefresh}
            title="Reload data from the CSV files"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--hairline)] bg-white/[0.03] px-2.5 py-1.5 text-xs font-medium text-[var(--ink-secondary)] transition-colors hover:bg-white/[0.08] hover:text-white"
          >
            <RefreshCw size={13} />
            <span className="hidden sm:inline">Reload</span>
          </button>
        </div>
      </div>
    </header>
  );
}
