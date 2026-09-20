import type { Granularity } from "../types";

const currencyFull = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const currencyPrecise = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const currencyCompact = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  notation: "compact",
  maximumFractionDigits: 1,
});

const numberFull = new Intl.NumberFormat("en-IN");

const dateLong = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const dateShort = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
});

const monthShort = new Intl.DateTimeFormat("en-IN", {
  month: "short",
  year: "2-digit",
});

const monthLong = new Intl.DateTimeFormat("en-IN", {
  month: "long",
  year: "numeric",
});

export function formatCurrency(value: number, precise = false): string {
  if (!Number.isFinite(value)) return "—";
  const formatter = precise ? currencyPrecise : currencyFull;
  return formatter.format(value);
}

/** ₹12.5L / ₹1.3Cr — the Indian short scale, used on axes and dense chips. */
export function formatCurrencyCompact(value: number): string {
  if (!Number.isFinite(value)) return "—";
  if (Math.abs(value) < 1000) return currencyFull.format(value);
  return currencyCompact.format(value);
}

export function formatSignedCurrency(value: number): string {
  if (!Number.isFinite(value)) return "—";
  const formatted = formatCurrency(Math.abs(value));
  if (value === 0) return formatted;
  return `${value > 0 ? "+" : "−"}${formatted}`;
}

export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return numberFull.format(Math.round(value));
}

export function formatPercent(value: number, digits = 1): string {
  if (!Number.isFinite(value)) return "—";
  return `${value.toFixed(digits)}%`;
}

export function formatDate(date: Date): string {
  return dateLong.format(date);
}

export function formatDateShort(date: Date): string {
  return dateShort.format(date);
}

export function formatMonth(date: Date): string {
  return monthShort.format(date);
}

export function formatMonthLong(date: Date): string {
  return monthLong.format(date);
}

/** Compact axis tick for a time bucket. */
export function formatPeriodTick(date: Date, granularity: Granularity): string {
  switch (granularity) {
    case "year":
      return `${date.getFullYear()}`;
    case "quarter":
      return `Q${Math.floor(date.getMonth() / 3) + 1} '${`${date.getFullYear()}`.slice(2)}`;
    case "month":
      return monthShort.format(date);
    default:
      return dateShort.format(date);
  }
}

/** Spelled-out label for the same bucket, used in tooltips. */
export function formatPeriodFull(date: Date, granularity: Granularity): string {
  switch (granularity) {
    case "year":
      return `${date.getFullYear()}`;
    case "quarter": {
      const q = Math.floor(date.getMonth() / 3);
      const spans = ["Jan–Mar", "Apr–Jun", "Jul–Sep", "Oct–Dec"];
      return `Q${q + 1} ${date.getFullYear()} · ${spans[q]}`;
    }
    case "month":
      return monthLong.format(date);
    case "week":
      return `Week of ${dateLong.format(date)}`;
    default:
      return dateLong.format(date);
  }
}

export function formatDuration(ms: number): string {
  const hours = ms / 3_600_000;
  if (hours >= 1) return `${numberFull.format(Math.round(hours))} hrs`;
  const minutes = Math.round(ms / 60_000);
  return `${minutes} min`;
}

/** "online_shopping" → "Online Shopping"; leaves already-clean labels alone. */
export function humanize(raw: string): string {
  const cleaned = raw.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  if (!cleaned) return "";
  if (cleaned !== cleaned.toLowerCase()) return cleaned;
  return cleaned
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}

export function toISODate(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : plural ?? `${singular}s`;
}
