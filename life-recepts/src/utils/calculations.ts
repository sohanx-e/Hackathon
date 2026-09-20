import type {
  CategoryTotal,
  Filters,
  Granularity,
  Insight,
  PeriodPoint,
  Txn,
} from "../types";
import { formatCurrency, formatCurrencyCompact, formatPercent, humanize } from "./formatting";

export function applyFilters(txns: Txn[], filters: Filters): Txn[] {
  const search = filters.search.trim().toLowerCase();
  return txns.filter((t) => {
    if (filters.type !== "all" && t.type !== filters.type) return false;
    if (filters.categories.length && !filters.categories.includes(t.category)) return false;
    if (filters.from && t.date < filters.from) return false;
    if (filters.to && t.date > filters.to) return false;
    if (search) {
      const haystack = `${t.description} ${t.category} ${t.subcategory ?? ""}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });
}

export function calculateTotalIncome(txns: Txn[]): number {
  return txns.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
}

export function calculateTotalExpenses(txns: Txn[]): number {
  return txns.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
}

export function calculateNetBalance(txns: Txn[]): number {
  return calculateTotalIncome(txns) - calculateTotalExpenses(txns);
}

export function calculateAverageTransaction(txns: Txn[], type: "expense" | "income" | "all" = "expense"): number {
  const pool = type === "all" ? txns : txns.filter((t) => t.type === type);
  if (!pool.length) return 0;
  return pool.reduce((sum, t) => sum + t.amount, 0) / pool.length;
}

export function calculateCategoryTotals(txns: Txn[], type: "expense" | "income" = "expense"): CategoryTotal[] {
  const pool = txns.filter((t) => t.type === type);
  const total = pool.reduce((sum, t) => sum + t.amount, 0);
  const byCategory = new Map<string, { amount: number; count: number }>();

  for (const t of pool) {
    const bucket = byCategory.get(t.category) ?? { amount: 0, count: 0 };
    bucket.amount += t.amount;
    bucket.count += 1;
    byCategory.set(t.category, bucket);
  }

  return [...byCategory.entries()]
    .map(([category, { amount, count }]) => ({
      category,
      amount,
      count,
      share: total > 0 ? (amount / total) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

/** Picks day/week/month so the x-axis stays readable regardless of span. */
export function pickGranularity(txns: Txn[]): Granularity {
  if (txns.length < 2) return "month";
  const dates = txns.map((t) => t.date.getTime());
  const spanDays = (Math.max(...dates) - Math.min(...dates)) / 86_400_000;
  if (spanDays <= 45) return "day";
  if (spanDays <= 240) return "week";
  return "month";
}

/**
 * Picks the bucket size for the income-vs-expense comparison, so a four-year
 * ledger reads as ~15 quarters rather than 45 hair-thin monthly bars.
 */
export function pickComparisonGranularity(txns: Txn[]): Granularity {
  const months = new Set(txns.map((t) => `${t.date.getFullYear()}-${t.date.getMonth()}`)).size;
  if (months <= 24) return "month";
  if (months <= 72) return "quarter";
  return "year";
}

function periodKey(date: Date, granularity: Granularity): { key: string; bucketDate: Date } {
  if (granularity === "year") {
    const bucket = new Date(date.getFullYear(), 0, 1);
    return { key: `${bucket.getFullYear()}`, bucketDate: bucket };
  }
  if (granularity === "quarter") {
    const firstMonth = Math.floor(date.getMonth() / 3) * 3;
    const bucket = new Date(date.getFullYear(), firstMonth, 1);
    return { key: `${bucket.getFullYear()}-Q${firstMonth / 3 + 1}`, bucketDate: bucket };
  }
  if (granularity === "day") {
    const bucket = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const key = `${bucket.getFullYear()}-${bucket.getMonth() + 1}-${bucket.getDate()}`;
    return { key, bucketDate: bucket };
  }
  if (granularity === "week") {
    const bucket = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const day = (bucket.getDay() + 6) % 7; // Monday-anchored week
    bucket.setDate(bucket.getDate() - day);
    const key = bucket.toISOString().slice(0, 10);
    return { key, bucketDate: bucket };
  }
  const bucket = new Date(date.getFullYear(), date.getMonth(), 1);
  const key = `${bucket.getFullYear()}-${bucket.getMonth() + 1}`;
  return { key, bucketDate: bucket };
}

export function calculateMonthlyTotals(txns: Txn[], granularity?: Granularity): PeriodPoint[] {
  const g = granularity ?? pickGranularity(txns);
  const buckets = new Map<string, PeriodPoint>();

  for (const t of txns) {
    if (t.type === "transfer") continue;
    const { key, bucketDate } = periodKey(t.date, g);
    const point = buckets.get(key) ?? {
      key,
      label: key,
      date: bucketDate,
      income: 0,
      expense: 0,
      net: 0,
      count: 0,
    };
    if (t.type === "income") point.income += t.amount;
    if (t.type === "expense") point.expense += t.amount;
    point.count += 1;
    buckets.set(key, point);
  }

  const points = [...buckets.values()].sort((a, b) => a.date.getTime() - b.date.getTime());
  for (const p of points) p.net = p.income - p.expense;
  return points;
}

export function getTopTransactions(txns: Txn[], limit = 8, type: "expense" | "income" = "expense"): Txn[] {
  return txns
    .filter((t) => t.type === type)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit);
}

function dayName(date: Date): string {
  return date.toLocaleDateString("en-IN", { weekday: "long" });
}

/**
 * Every insight here is derived straight from the filtered dataset - nothing
 * is fabricated, and an insight simply doesn't render when its precondition
 * (enough categories, enough spread, etc.) isn't met.
 */
export function generateInsights(txns: Txn[], dataset: { hasIncome: boolean; hasFlags: boolean }): Insight[] {
  const insights: Insight[] = [];
  const expenses = txns.filter((t) => t.type === "expense");
  const income = txns.filter((t) => t.type === "income");
  if (!expenses.length) return insights;

  const totalExpense = expenses.reduce((s, t) => s + t.amount, 0);
  const categories = calculateCategoryTotals(txns, "expense");

  if (categories.length) {
    const top = categories[0];
    insights.push({
      id: "top-category",
      title: `${top.category} is your largest spending category`,
      detail: `${formatCurrency(top.amount)} across ${top.count} transactions — ${formatPercent(top.share)} of total spend.`,
      tone: "neutral",
      icon: "category",
    });
  }

  const avg = totalExpense / expenses.length;
  insights.push({
    id: "avg-txn",
    title: `Your average transaction is ${formatCurrency(avg)}`,
    detail: `Based on ${expenses.length.toLocaleString("en-IN")} recorded expenses.`,
    tone: "neutral",
    icon: "average",
  });

  if (categories.length >= 2) {
    const [first, second] = categories;
    const combinedShare = first.share + second.share;
    if (combinedShare >= 40) {
      insights.push({
        id: "top-two",
        title: `${first.category} and ${second.category} drive most of your spending`,
        detail: `Together they account for ${formatPercent(combinedShare)} of everything you've spent.`,
        tone: "neutral",
        icon: "category",
      });
    }
  }

  const largest = getTopTransactions(txns, 1, "expense")[0];
  if (largest) {
    insights.push({
      id: "largest-txn",
      title: `Your highest expense was ${formatCurrency(largest.amount)}`,
      detail: `${largest.description} in ${largest.category}, on ${largest.date.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}.`,
      tone: "neutral",
      icon: "largest",
    });
  }

  // Spending by month, to call out a peak - only worth showing with real spread.
  const monthly = calculateMonthlyTotals(expenses, "month");
  if (monthly.length >= 3) {
    const peak = [...monthly].sort((a, b) => b.expense - a.expense)[0];
    insights.push({
      id: "peak-month",
      title: `Spending peaked in ${peak.date.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}`,
      detail: `You spent ${formatCurrency(peak.expense)} that month, across ${peak.count} transactions.`,
      tone: "neutral",
      icon: "peak",
    });
  }

  // Day-of-week rhythm.
  if (expenses.length >= 20) {
    const byDay = new Map<string, number>();
    for (const t of expenses) {
      const key = dayName(t.date);
      byDay.set(key, (byDay.get(key) ?? 0) + t.amount);
    }
    const busiest = [...byDay.entries()].sort((a, b) => b[1] - a[1])[0];
    if (busiest) {
      insights.push({
        id: "busy-day",
        title: `${busiest[0]}s are your biggest spending day`,
        detail: `${formatCurrencyCompact(busiest[1])} spent on ${busiest[0]}s in total.`,
        tone: "neutral",
        icon: "rhythm",
      });
    }
  }

  if (dataset.hasIncome && income.length) {
    const totalIncome = income.reduce((s, t) => s + t.amount, 0);
    if (totalIncome > 0) {
      const savingsRate = ((totalIncome - totalExpense) / totalIncome) * 100;
      insights.push({
        id: "savings-rate",
        title: savingsRate >= 0
          ? `You saved ${formatPercent(savingsRate)} of your income`
          : `You spent ${formatPercent(Math.abs(savingsRate))} more than you earned`,
        detail: `${formatCurrency(totalIncome)} earned vs. ${formatCurrency(totalExpense)} spent.`,
        tone: savingsRate >= 0 ? "positive" : "warning",
        icon: "savings",
      });
    }
  }

  if (dataset.hasFlags) {
    const flagged = expenses.filter((t) => t.flagged);
    if (flagged.length) {
      const flaggedTotal = flagged.reduce((s, t) => s + t.amount, 0);
      insights.push({
        id: "flagged",
        title: `${flagged.length.toLocaleString("en-IN")} transactions are flagged for review`,
        detail: `${formatCurrency(flaggedTotal)} in total, ${formatPercent((flagged.length / expenses.length) * 100)} of all transactions.`,
        tone: "warning",
        icon: "flag",
      });
    }
  }

  // Merchant concentration, when the data actually distinguishes merchants.
  const byMerchant = new Map<string, number>();
  for (const t of expenses) byMerchant.set(t.description, (byMerchant.get(t.description) ?? 0) + t.amount);
  const distinctMerchants = byMerchant.size;
  if (distinctMerchants >= 5) {
    const topMerchant = [...byMerchant.entries()].sort((a, b) => b[1] - a[1])[0];
    const share = (topMerchant[1] / totalExpense) * 100;
    if (share >= 8) {
      insights.push({
        id: "top-merchant",
        title: `${topMerchant[0]} is where you spend the most`,
        detail: `${formatCurrency(topMerchant[1])} across all transactions — ${formatPercent(share)} of total spend.`,
        tone: "neutral",
        icon: "merchant",
      });
    }
  }

  return insights;
}

export function uniqueCategories(txns: Txn[]): string[] {
  return [...new Set(txns.map((t) => t.category))].sort((a, b) => a.localeCompare(b));
}

export { humanize };
