import Papa from "papaparse";
import type {
  DataQuality,
  Dataset,
  SpotifyData,
  SpotifyField,
  SpotifyPlay,
  Txn,
  TxnType,
} from "../types";
import { humanize } from "./formatting";

type Row = Record<string, string | undefined>;

type DatasetCore = Omit<Dataset, "id" | "label" | "shortLabel" | "file" | "description">;

export class CsvLoadError extends Error {
  file: string;

  constructor(file: string, message: string) {
    super(message);
    this.name = "CsvLoadError";
    this.file = file;
  }
}

/** Papa.parse with download, wrapped so callers can await it and catch failures. */
export function loadCsv(url: string): Promise<{ rows: Row[]; parseErrors: number }> {
  return new Promise((resolve, reject) => {
    Papa.parse<Row>(url, {
      download: true,
      header: true,
      skipEmptyLines: "greedy",
      transformHeader: (header) => header.replace(/^\uFEFF/, "").trim(),
      complete: (result) => {
        resolve({
          rows: Array.isArray(result.data) ? result.data : [],
          parseErrors: result.errors?.length ?? 0,
        });
      },
      error: (error: Error) => {
        reject(new CsvLoadError(url, error?.message ?? "Unable to read file"));
      },
    });
  });
}

function text(value: string | undefined): string {
  return (value ?? "").replace(/\uFEFF/g, "").trim();
}

/** Tolerates thousands separators, currency symbols and stray spaces. */
export function parseAmount(value: string | undefined): number | null {
  const raw = text(value).replace(/[₹$,\s]/g, "");
  if (!raw) return null;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return null;
  return Math.abs(parsed);
}

export interface ParsedDate {
  date: Date;
  time: string | null;
}

/**
 * Handles the two slash formats present in the data (day-first ledger exports,
 * month-first card exports) plus ISO, with an optional trailing clock time.
 */
export function parseDate(value: string | undefined, order: "dmy" | "mdy"): ParsedDate | null {
  const raw = text(value);
  if (!raw) return null;

  const [datePart, ...rest] = raw.split(/[\sT]+/);
  const timePart = rest.join(" ");

  let year: number;
  let month: number;
  let day: number;

  const iso = datePart.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  const slash = datePart.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);

  if (iso) {
    year = Number(iso[1]);
    month = Number(iso[2]);
    day = Number(iso[3]);
  } else if (slash) {
    const first = Number(slash[1]);
    const second = Number(slash[2]);
    year = Number(slash[3]);
    if (year < 100) year += year > 70 ? 1900 : 2000;
    const dayFirst = order === "dmy";
    day = dayFirst ? first : second;
    month = dayFirst ? second : first;
    // A value above 12 in the month slot can only be a day: recover instead of dropping.
    if (month > 12 && day <= 12) {
      const swap = day;
      day = month;
      month = swap;
    }
  } else {
    return null;
  }

  if (!Number.isFinite(year) || year < 1900 || year > 2100) return null;
  if (!Number.isFinite(month) || month < 1 || month > 12) return null;
  if (!Number.isFinite(day) || day < 1 || day > 31) return null;

  const date = new Date(year, month - 1, day);
  // Rejects impossible calendar dates such as 31/02.
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }

  let time: string | null = null;
  const clock = timePart.match(/^(\d{1,2}):(\d{2})/);
  if (clock) {
    const hours = Number(clock[1]);
    const minutes = Number(clock[2]);
    if (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
      date.setHours(hours, minutes, 0, 0);
      time = `${`${hours}`.padStart(2, "0")}:${`${minutes}`.padStart(2, "0")}`;
    }
  }

  return { date, time };
}

function emptyQuality(totalRows: number, parseErrors: number): DataQuality {
  return {
    totalRows,
    usable: 0,
    duplicatesRemoved: 0,
    skippedMissingAmount: 0,
    skippedInvalidDate: 0,
    parseErrors,
  };
}

const HOUSEHOLD_TYPES: Record<string, TxnType> = {
  expense: "expense",
  income: "income",
  "transfer-out": "transfer",
  "transfer-in": "transfer",
  transfer: "transfer",
};

/**
 * household.csv - a personal ledger with an explicit Income/Expense column.
 * Repeated identical rows are kept on purpose: two 10-rupee teas on the same
 * day are ordinary ledger entries, not an export artefact.
 */
export function normalizeHousehold(rows: Row[], parseErrors: number): DatasetCore {
  const quality = emptyQuality(rows.length, parseErrors);
  const txns: Txn[] = [];
  const currencies = new Set<string>();

  rows.forEach((row, index) => {
    const parsedDate = parseDate(row["Date"], "dmy");
    if (!parsedDate) {
      quality.skippedInvalidDate += 1;
      return;
    }
    const amount = parseAmount(row["Amount"]);
    if (amount === null) {
      quality.skippedMissingAmount += 1;
      return;
    }

    const rawType = text(row["Income/Expense"]).toLowerCase();
    const type = HOUSEHOLD_TYPES[rawType];
    if (!type) {
      // A row whose type column is blank or shifted cannot be classified.
      quality.skippedMissingAmount += 1;
      return;
    }

    const currency = text(row["Currency"]) || "INR";
    currencies.add(currency);

    const category = humanize(text(row["Category"])) || "Uncategorised";
    const subcategory = humanize(text(row["Subcategory"])) || null;
    const note = text(row["Note"]);

    txns.push({
      id: `h-${index}`,
      date: parsedDate.date,
      time: parsedDate.time,
      description: note || subcategory || category,
      category,
      subcategory,
      amount,
      type,
      mode: text(row["Mode"]) || null,
      place: null,
      flagged: null,
    });
  });

  quality.usable = txns.length;

  return {
    txns,
    quality,
    currency: currencies.size === 1 ? [...currencies][0] : "INR",
    hasIncome: txns.some((t) => t.type === "income"),
    hasTransfers: txns.some((t) => t.type === "transfer"),
    hasFlags: false,
    hasModes: txns.some((t) => t.mode !== null),
    hasPlaces: false,
    hasTimes: txns.some((t) => t.time !== null),
  };
}

/**
 * transactions.csv - a card-spend export. Every row is money leaving the card,
 * so everything normalises to "expense". The file ships each record several
 * times over, so whole-row duplicates are collapsed before anything is counted.
 */
export function normalizeCard(rows: Row[], parseErrors: number): DatasetCore {
  const quality = emptyQuality(rows.length, parseErrors);
  const seen = new Set<string>();
  const txns: Txn[] = [];

  rows.forEach((row, index) => {
    const signature = [
      text(row["trans_id"]),
      text(row["trans_date_trans_time"]),
      text(row["cc_num"]),
      text(row["merchant"]),
      text(row["amt"]),
      text(row["category"]),
    ].join("|");

    if (signature.replace(/\|/g, "") && seen.has(signature)) {
      quality.duplicatesRemoved += 1;
      return;
    }
    seen.add(signature);

    const parsedDate = parseDate(row["trans_date_trans_time"], "mdy");
    if (!parsedDate) {
      quality.skippedInvalidDate += 1;
      return;
    }
    const amount = parseAmount(row["amt"]);
    if (amount === null) {
      quality.skippedMissingAmount += 1;
      return;
    }

    const merchant = text(row["merchant"]).replace(/^fraud_/i, "").trim();
    const city = text(row["city"]);
    const state = text(row["state"]);
    const place = [city, state].filter(Boolean).join(", ") || null;
    const flaggedRaw = text(row["is_fraud"]);
    const flagged = flaggedRaw ? Number(flaggedRaw) === 1 : null;

    txns.push({
      id: text(row["trans_id"]) || `c-${index}`,
      date: parsedDate.date,
      time: parsedDate.time,
      description: merchant || "Unknown merchant",
      category: humanize(text(row["category"])) || "Uncategorised",
      subcategory: null,
      amount,
      type: "expense",
      mode: null,
      place,
      flagged,
    });
  });

  quality.usable = txns.length;

  return {
    txns,
    quality,
    currency: "INR",
    hasIncome: false,
    hasTransfers: false,
    hasFlags: txns.some((t) => t.flagged !== null),
    hasModes: false,
    hasPlaces: txns.some((t) => t.place !== null),
    hasTimes: txns.some((t) => t.time !== null),
  };
}

const PLAY_COLUMNS = ["ts", "ms_played", "track_name", "artist_name"];

/**
 * Accepts either a real streaming-history export or the field dictionary that
 * Spotify ships with it, and reports which of the two it actually found.
 */
export function normalizeSpotify(rows: Row[]): SpotifyData {
  if (!rows.length) return { kind: "empty" };

  const headers = Object.keys(rows[0] ?? {});
  const looksLikePlays = PLAY_COLUMNS.every((column) => headers.includes(column));

  if (looksLikePlays) {
    const plays: SpotifyPlay[] = [];
    let skippedRows = 0;

    for (const row of rows) {
      const stamp = text(row["ts"]);
      const ms = Number(text(row["ms_played"]));
      const track = text(row["track_name"]);
      const artist = text(row["artist_name"]);
      const date = stamp ? new Date(stamp) : null;

      if (!track || !artist || !date || Number.isNaN(date.getTime()) || !Number.isFinite(ms)) {
        skippedRows += 1;
        continue;
      }

      plays.push({
        ts: date,
        msPlayed: Math.max(0, ms),
        track,
        artist,
        album: text(row["album_name"]) || null,
        platform: text(row["platform"]) || null,
        skipped: boolish(row["skipped"]),
        shuffle: boolish(row["shuffle"]),
      });
    }

    if (!plays.length) return { kind: "empty" };
    return { kind: "plays", plays, rows: rows.length, skippedRows };
  }

  const fieldKey = headers.find((h) => /field|column|name/i.test(h));
  const descriptionKey = headers.find((h) => /description|meaning/i.test(h));

  if (fieldKey && descriptionKey) {
    const fields: SpotifyField[] = rows
      .map((row) => ({
        field: text(row[fieldKey]),
        description: text(row[descriptionKey]),
      }))
      .filter((entry) => entry.field.length > 0);
    if (fields.length) return { kind: "schema", fields };
  }

  return { kind: "empty" };
}

function boolish(value: string | undefined): boolean | null {
  const raw = text(value).toLowerCase();
  if (!raw) return null;
  if (["true", "1", "yes"].includes(raw)) return true;
  if (["false", "0", "no"].includes(raw)) return false;
  return null;
}
