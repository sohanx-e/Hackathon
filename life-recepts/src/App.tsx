import { useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Receipt as ReceiptIcon,
  Scale,
  ShieldAlert,
  Store,
  Tag,
  Wallet,
} from "lucide-react";

import Header from "./components/Header";
import Hero from "./components/Hero";
import StatCard from "./components/StatCard";
import FiltersBar from "./components/FiltersBar";
import SpendingByCategory from "./components/SpendingByCategory";
import IncomeExpenseChart from "./components/IncomeExpenseChart";
import SpendingTimeline from "./components/SpendingTimeline";
import TopTransactions from "./components/TopTransactions";
import Insights from "./components/Insights";
import SpotifyAnalytics from "./components/SpotifyAnalytics";
import DataExplorer from "./components/DataExplorer";
import { LoadingState, ErrorState } from "./components/LoadingState";
import { SectionLabel } from "./components/ui/Card";

import { useCSVData } from "./hooks/useCSVData";
import type { DatasetId, Filters } from "./types";
import {
  applyFilters,
  calculateAverageTransaction,
  calculateCategoryTotals,
  calculateNetBalance,
  calculateTotalExpenses,
  calculateTotalIncome,
  generateInsights,
  uniqueCategories,
} from "./utils/calculations";
import { formatCurrency, formatNumber, formatPercent } from "./utils/formatting";
import { buildCategoryColors } from "./utils/palette";

const EMPTY_FILTERS: Filters = { type: "all", categories: [], from: null, to: null, search: "" };

function App() {
  const { status, error, datasets, spotify } = useCSVData();
  const [activeId, setActiveId] = useState<DatasetId>("household");
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);

  const dataset = useMemo(() => datasets.find((d) => d.id === activeId) ?? datasets[0], [datasets, activeId]);

  // Filters don't carry across datasets — different schemas, different category sets.
  function handleDatasetChange(id: DatasetId) {
    setActiveId(id);
    setFilters(EMPTY_FILTERS);
  }

  const filteredTxns = useMemo(() => (dataset ? applyFilters(dataset.txns, filters) : []), [dataset, filters]);

  const totalIncome = useMemo(() => calculateTotalIncome(filteredTxns), [filteredTxns]);
  const totalExpense = useMemo(() => calculateTotalExpenses(filteredTxns), [filteredTxns]);
  const netBalance = useMemo(() => calculateNetBalance(filteredTxns), [filteredTxns]);
  const avgTxn = useMemo(() => calculateAverageTransaction(filteredTxns, "expense"), [filteredTxns]);
  const categoryTotals = useMemo(() => calculateCategoryTotals(filteredTxns, "expense"), [filteredTxns]);
  const categories = useMemo(() => (dataset ? uniqueCategories(dataset.txns) : []), [dataset]);

  // Colour is keyed off the *unfiltered* dataset so filtering never repaints
  // the categories that survive.
  const categoryColors = useMemo(() => {
    if (!dataset) return new Map<string, string>();
    const ranked = calculateCategoryTotals(dataset.txns, "expense").map((c) => c.category);
    return buildCategoryColors(ranked);
  }, [dataset]);

  const insights = useMemo(
    () => (dataset ? generateInsights(filteredTxns, dataset) : []),
    [filteredTxns, dataset]
  );

  const expenses = useMemo(() => filteredTxns.filter((t) => t.type === "expense"), [filteredTxns]);
  const incomeCount = useMemo(() => filteredTxns.filter((t) => t.type === "income").length, [filteredTxns]);
  const flaggedCount = useMemo(
    () => (dataset?.hasFlags ? expenses.filter((t) => t.flagged).length : 0),
    [expenses, dataset]
  );
  const merchantCount = useMemo(
    () => new Set(expenses.map((t) => t.description)).size,
    [expenses]
  );

  if (status === "loading" || status === "idle") return <LoadingState />;
  if (status === "error" || !dataset) {
    return <ErrorState message="Couldn't load your data" detail={error} />;
  }

  const topCategory = categoryTotals[0];
  const { quality } = dataset;

  return (
    <div className="min-h-screen">
      <Header
        datasets={datasets}
        activeId={dataset.id}
        onChange={handleDatasetChange}
        onRefresh={() => window.location.reload()}
        recordCount={dataset.txns.length}
      />

      <main className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <Hero dataset={dataset} filteredTxns={filteredTxns} totalExpense={totalExpense} />

        {error && (
          <p className="mt-4 rounded-xl border border-[#fab219]/20 bg-[#fab219]/[0.08] px-4 py-2.5 text-xs text-[#fab219]">
            Some data couldn't be loaded: {error}
          </p>
        )}

        <section className="mt-10" aria-label="Key statistics">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            {dataset.hasIncome && (
              <StatCard
                icon={<ArrowUpRight size={15} />}
                label="Total income"
                value={formatCurrency(totalIncome)}
                support={`${formatNumber(incomeCount)} income records`}
                tone="positive"
                delay={0}
              />
            )}
            <StatCard
              icon={<ArrowDownRight size={15} />}
              label="Total expenses"
              value={formatCurrency(totalExpense)}
              support={`${formatNumber(expenses.length)} expense records`}
              tone="negative"
              delay={40}
            />
            {dataset.hasIncome && (
              <StatCard
                icon={<Scale size={15} />}
                label="Net balance"
                value={formatCurrency(netBalance)}
                support={netBalance >= 0 ? "Income exceeds expenses" : "Expenses exceed income"}
                tone={netBalance >= 0 ? "positive" : "negative"}
                delay={80}
              />
            )}
            <StatCard
              icon={<ReceiptIcon size={15} />}
              label="Transactions"
              value={formatNumber(filteredTxns.length)}
              support={
                quality.duplicatesRemoved > 0
                  ? `${formatNumber(quality.duplicatesRemoved)} duplicates removed`
                  : "All records validated"
              }
              delay={120}
            />
            <StatCard
              icon={<Tag size={15} />}
              label="Top category"
              value={topCategory ? topCategory.category : "—"}
              support={
                topCategory
                  ? `${formatCurrency(topCategory.amount)} · ${formatPercent(topCategory.share)} of spend`
                  : undefined
              }
              delay={160}
            />
            <StatCard
              icon={<Wallet size={15} />}
              label="Average transaction"
              value={formatCurrency(avgTxn)}
              support="Mean expense value"
              delay={200}
            />
            {dataset.hasFlags && (
              <StatCard
                icon={<ShieldAlert size={15} />}
                label="Flagged transactions"
                value={formatNumber(flaggedCount)}
                support={
                  expenses.length ? `${formatPercent((flaggedCount / expenses.length) * 100)} of transactions` : undefined
                }
                tone={flaggedCount > 0 ? "negative" : "neutral"}
                delay={240}
              />
            )}
            {!dataset.hasIncome && (
              <StatCard
                icon={<Store size={15} />}
                label="Merchants"
                value={formatNumber(merchantCount)}
                support="Distinct places you spent"
                delay={280}
              />
            )}
          </div>
        </section>

        {/* One containing block for the filter bar and everything it filters, so
            the sticky bar stays pinned for the whole scroll of the dashboard. */}
        <div className="mt-4">
          <FiltersBar
            filters={filters}
            onChange={setFilters}
            categories={categories}
            hasIncome={dataset.hasIncome}
            hasTransfers={dataset.hasTransfers}
          />

          <section className="mt-10">
            <SectionLabel>Where the money goes</SectionLabel>
            <div className="grid gap-4 lg:grid-cols-2">
              <SpendingByCategory categories={categoryTotals} categoryColors={categoryColors} delay={0} />
              <IncomeExpenseChart txns={filteredTxns} hasIncome={dataset.hasIncome} delay={60} />
            </div>
          </section>

          <section className="mt-10">
            <SectionLabel>How it changes over time</SectionLabel>
            <div className="grid gap-4 lg:grid-cols-2">
              <SpendingTimeline txns={filteredTxns} delay={0} />
              <TopTransactions
                txns={filteredTxns}
                hasFlags={dataset.hasFlags}
                categoryColors={categoryColors}
                delay={60}
              />
            </div>
          </section>

          <section className="mt-10">
            <SectionLabel>What the data says</SectionLabel>
            <div className="grid gap-4">
              <Insights insights={insights} delay={0} />
              <SpotifyAnalytics data={spotify} delay={60} />
            </div>
          </section>

          <section className="mt-10">
            <SectionLabel>Explore the raw data</SectionLabel>
            <DataExplorer
              txns={filteredTxns}
              categories={categories}
              hasFlags={dataset.hasFlags}
              hasPlaces={dataset.hasPlaces}
              categoryColors={categoryColors}
            />
          </section>
        </div>

        <footer className="mt-10 border-t border-[var(--hairline)] pt-6">
          <div className="flex flex-col gap-3 text-xs text-[var(--ink-muted)] sm:flex-row sm:items-center sm:justify-between">
            <p>
              Built from{" "}
              <code className="rounded bg-white/[0.05] px-1.5 py-0.5 text-[11px] text-zinc-400">
                {dataset.file.replace("/data/", "")}
              </code>{" "}
              — {formatNumber(quality.totalRows)} rows read, {formatNumber(quality.usable)} usable
              {quality.duplicatesRemoved > 0 && `, ${formatNumber(quality.duplicatesRemoved)} duplicates removed`}
              {quality.skippedInvalidDate + quality.skippedMissingAmount > 0 &&
                `, ${formatNumber(quality.skippedInvalidDate + quality.skippedMissingAmount)} incomplete rows skipped`}
              .
            </p>
            <p className="shrink-0">Every figure is computed live from the CSV files.</p>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default App;
